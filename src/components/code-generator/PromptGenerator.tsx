import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Box, TextField, Typography, IconButton, CircularProgress, Tooltip, Accordion, AccordionSummary, AccordionDetails, useTheme } from '@mui/material';
import { DriveFolderUpload as DriveFolderUploadIcon, FolderOpen as FolderOpenIcon, AddRoad as AddRoadIcon, CloudUpload as CloudUploadIcon, Send as SendIcon, FormatClear as ClearIcon, Settings as SettingsIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { setError } from '@/stores/errorStore';
import { aiEditorStore, showGlobalSnackbar } from '@/stores/aiEditorStore';
import { llmStore, setInstruction, setAiInstruction, setExpectedOutputInstruction, setLastLlmGeneratePayload, setScanPathsInput, setLastLlmResponse, setCurrentDiff, setIsBuilding, setLoading } from '@/stores/llmStore';
import { authStore } from '@/stores/authStore';
import { fileTreeStore, loadInitialTree, projectRootDirectoryStore, setCurrentProjectPath } from '@/stores/fileTreeStore';
import { fileStore, setOpenedFileContent } from '@/stores/fileStore';
import { addLog } from '@/stores/logStore';
import { INSTRUCTION, ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT } from '@/constants/instruction';
import { generateCode, applyProposedChanges } from '@/api/llm';
import FilePickerDialog from '@/components/dialogs/FilePickerDialog';
import DirectoryPickerDialog from '@/components/dialogs/DirectoryPickerDialog';
import ScanPathsDialog from '@/components/dialogs/ScanPathsDialog';
import PromptGeneratorSettingsDialog from '@/components/dialogs/PromptGeneratorSettingsDialog';
import { ImportJsonDialog } from './ImportJsonDialog';
import { CodeRepair } from '@/components/code-generator/utils/CodeRepair';
import { LlmOutputFormat, LlmGeneratePayload, ModelResponse } from '@/types';
import { CodeGeneratorData } from './CodeGeneratorMain';
import CustomDrawer from '@/components/Drawer/CustomDrawer';
import ImportData from './ImportData';


interface PromptGeneratorProps {
}

const PromptGenerator: React.FC<PromptGeneratorProps> = () => {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const theme = useTheme();

  const currentProjectPath = useStore(projectRootDirectoryStore);
  const { instruction, aiInstruction, expectedOutputInstruction, requestType, llmOutputFormat, scanPathsInput, loading, isBuilding, lastLlmResponse } = useStore(llmStore);
  const { isLoggedIn } = useStore(authStore);
  const { flatFileList } = useStore(fileTreeStore);


  const { uploadedFileData, uploadedFileMimeType } = useStore(llmStore);
  // ---- local state ----
  const [projectInput, setProjectInput] = useState(
    currentProjectPath || import.meta.env.VITE_BASE_DIR || ''
  );
  const [editorContent, setEditorContent] = useState('');
  const [isPickerDialogOpen, setIsPickerDialogOpen] = useState(false);
  const [isProjectRootPickerDialogOpen, setIsProjectRootPickerDialogOpen] = useState(false);
  const [isScanPathsDialogOpen, setIsScanPathsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [importedData, setImportedData] = useState<CodeGeneratorData | null>(null);

  const commonDisabled =
    !isLoggedIn || loading || isBuilding;

  // ---- memoized values ----
  const currentScanPathsArray = useMemo(
    () =>
      scanPathsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [scanPathsInput],
  );

  const scanPathAutocompleteOptions = useMemo(() => {
    const options = flatFileList.map((e) => e.filePath).filter(Boolean);
    return Array.from(
      new Set([
        ...options,
        'src',
        'public',
        'package.json',
        'README.md',
        '.env',
      ]),
    ).sort();
  }, [flatFileList]);

  // ---- effects ----
  useEffect(() => {
    if (lastLlmResponse?.rawResponse)
      setEditorContent(lastLlmResponse.rawResponse);
  }, [lastLlmResponse]);

  useEffect(() => {
    // keep local project input in sync with store
    if (currentProjectPath && projectInput !== currentProjectPath) {
      setProjectInput(currentProjectPath);
    } else if (!currentProjectPath && import.meta.env.VITE_BASE_DIR) {
      const base = import.meta.env.VITE_BASE_DIR;
      setProjectInput(base);
      loadInitialTree(base);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProjectPath]);

  useEffect(() => {
    const defaultAI = INSTRUCTION;
    const defaultExpected = ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT;
    if (llmOutputFormat === LlmOutputFormat.JSON) {
      if (aiInstruction !== defaultAI) setAiInstruction(defaultAI);
      if (expectedOutputInstruction !== defaultExpected)
        setExpectedOutputInstruction(defaultExpected);
    }
  }, [llmOutputFormat, aiInstruction, expectedOutputInstruction]);

  // ---- handlers ----
  const updateScanPaths = useCallback(
    (paths: string[]) =>
      setScanPathsInput([...new Set(paths)].sort().join(', ')),
    [],
  );

  const handleLoadProject = useCallback(() => {
    if (!projectInput) return setError('Please provide a project root path.');
    setCurrentProjectPath(projectInput);
    setError('');
    setLastLlmResponse(null);
    setCurrentDiff(null, null);
    setIsBuilding(false);
    loadInitialTree(projectInput);
    addLog('Prompt Generator', `Project loaded: ${projectInput}`, 'success');
  }, [projectInput]);

  const handleGenerateCode = useCallback(async () => {
    if (!instruction) {
      showGlobalSnackbar('Please provide instructions for the AI.', 'error');
      return;
    }
    if (!isLoggedIn) {
      showGlobalSnackbar(
        'You must be logged in to use the AI Editor',
        'error',
      );
      return;
    }
    if (!currentProjectPath) {
      showGlobalSnackbar('Please load a project first.', 'error');
      return;
    }

    setLoading(true);
    setError('');
    setLastLlmResponse(null);
    setCurrentDiff(null, null);
    setIsBuilding(false);

    try {
      const payload: LlmGeneratePayload = {
        userPrompt: instruction,
        projectRoot: currentProjectPath,
        projectStructure: '',
        relevantFiles: [],
        additionalInstructions: aiInstruction,
        expectedOutputFormat: expectedOutputInstruction,
        scanPaths: currentScanPathsArray,
        requestType,
        output: 'json',
        ...(uploadedFileData && { fileData: uploadedFileData }),
        ...(uploadedFileMimeType && { fileMimeType: uploadedFileMimeType }),
      };

      setLastLlmGeneratePayload(payload);

      const aiResponse: ModelResponse = await generateCode(payload);
      console.log(aiResponse, 'aiResponse');

      // Normalize errors to strings
      let errorMessage: string | null = null;
      if (aiResponse.error) {
        errorMessage =
          aiResponse.error instanceof Error
            ? aiResponse.error.message
            : typeof aiResponse.error === 'string'
              ? aiResponse.error
              : JSON.stringify(aiResponse.error);
      }

      // If rawResponse is available, set it in the editor safely
      if (aiResponse.rawResponse) {
        try {
          setEditorContent(JSON.parse(aiResponse.rawResponse));
        } catch {
          setEditorContent(String(aiResponse.rawResponse));
        }
      }

      // Only update store if there’s no error to avoid rendering [object Error]
      if (!errorMessage) {
        setLastLlmResponse(aiResponse);
        // Auto-apply changes if enabled
        if (
          aiEditorStore.get().autoApplyChanges &&
          aiResponse.changes?.length
        ) {
          try {
            await applyProposedChanges(aiResponse.changes, currentProjectPath);
            addLog(
              'Prompt Generator',
              'Proposed changes auto-applied.',
              'success',
            );
          } catch (err) {
            const applyErr =
              err instanceof Error
                ? err.message
                : typeof err === 'string'
                  ? err
                  : JSON.stringify(err);
            setError(applyErr);
            addLog('Prompt Generator', applyErr, 'error');
          }
        }
      } else {
        setError(errorMessage);
        addLog('Prompt Generator', errorMessage, 'error');
        showGlobalSnackbar(errorMessage, 'error');
      }
    } catch (err) {
      const msg = `Failed to generate code: ${err instanceof Error ? err.message : String(err)}`;
      setError(msg);
      addLog('Prompt Generator', msg, 'error');
      showGlobalSnackbar(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [
    instruction,
    isLoggedIn,
    currentProjectPath,
    aiInstruction,
    expectedOutputInstruction,
    currentScanPathsArray,
    requestType,
    uploadedFileData,
    uploadedFileMimeType,
  ]);

  const handleClear = useCallback(() => {
    setEditorContent('');
    setLastLlmResponse(null);
  }, []);

  // ---- render ----
  return (
    <Box className='flex flex-col gap-2 w-full relative'>
      {editorContent && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Code Editor</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box className='rounded-5 h-full'>
              <CodeRepair
                value={editorContent}
                onChange={setEditorContent}
                filePath='temp.json'
                height='200px'
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      <Box
        position='relative'
        className='mt-2 px-2 pr-12 overflow-auto max-h-[100px] items-end h-full'
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleGenerateCode();
          }
        }}
      >
        <Box className='mb-2'>
          <TextField
            multiline
            fullWidth
            placeholder='Type your instruction...'
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            variant='standard'
            InputProps={{ disableUnderline: true }}
            className='mb-2'
          />
        </Box>
      </Box>
      <Box
        className='absolute top-2 right-0 flex items-center'
        sx={{ paddingRight: theme.spacing(1) }}
      >
        <Tooltip title='Generate/Modify Code'>
          <IconButton
            color='success'
            onClick={handleGenerateCode}
            disabled={commonDisabled || loading || !instruction}
          >
            {loading ? <CircularProgress size={16} /> : <SendIcon />}
          </IconButton>
        </Tooltip>
      </Box>
                {loading && (
            <Box className='mt-2 flex items-center'>
              <CircularProgress size={20} className='mr-1' />
              <Typography variant='body2'>Generating...</Typography>
            </Box>
          )}
      {/* Bottom Toolbar */}
      <Box className='flex flex-wrap gap-2 mb-2'>
        <Tooltip title='Load the selected project'>
          <IconButton
            color='primary'
            disabled={commonDisabled}
            onClick={handleLoadProject}
          >
            <DriveFolderUploadIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title='Pick project root directory'>
          <IconButton
            color='primary'
            onClick={() => setIsProjectRootPickerDialogOpen(true)}
          >
            <FolderOpenIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title='Manage scan paths for the AI search'>
          <IconButton
            color='primary'
            onClick={() => setIsScanPathsDialogOpen(true)}
          >
            <AddRoadIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title='Import prompt data from JSON file'>
          <IconButton
            color='primary'
            onClick={() => setIsImportDialogOpen(true)}
          >
            <CloudUploadIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title='Prompt generator settings'>
          <IconButton color='primary' onClick={() => setIsSettingsOpen(true)}>
            <SettingsIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title='Clear editor and AI response'>
          <IconButton
            color='error'
            onClick={handleClear}
            disabled={commonDisabled}
          >
            <ClearIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Dialogs */}
      <ScanPathsDialog
        open={isScanPathsDialogOpen}
        onClose={() => setIsScanPathsDialogOpen(false)}
        currentScanPaths={currentScanPathsArray}
        availablePaths={scanPathAutocompleteOptions}
        allowExternalPaths
        onUpdatePaths={updateScanPaths}
      />
      <FilePickerDialog
        open={isPickerDialogOpen}
        onClose={() => setIsPickerDialogOpen(false)}
        onSelect={(paths) =>
          updateScanPaths([...currentScanPathsArray, ...paths])
        }
        currentScanPaths={currentScanPathsArray}
      />
      <DirectoryPickerDialog
        open={isProjectRootPickerDialogOpen}
        onClose={() => setIsProjectRootPickerDialogOpen(false)}
        onSelect={(path) => {
          setCurrentProjectPath(path);
          handleLoadProject();
        }}
        initialPath={projectInput || currentProjectPath || '/'}
        allowExternalPaths
      />
      <PromptGeneratorSettingsDialog
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      {/*       <ImportJsonDialog
        open={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={(data) => {
          setImportedData(data);
          setIsImportDialogOpen(false);
        }}
      /> */}
              <CustomDrawer
        open={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        position='left'
        size='normal'
        title='Import JSON Data'
      >
         <ImportData onDataLoaded={setOpenedFileContent} onClose={() => setIsImportDialogOpen(false)} />
      </CustomDrawer>
    </Box>
  );
};

export default PromptGenerator;
