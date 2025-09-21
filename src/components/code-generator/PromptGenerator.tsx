import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  TextField,
  Typography,
  IconButton,
  CircularProgress,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
} from '@mui/material';
import {
  DriveFolderUpload as DriveFolderUploadIcon,
  FolderOpen as FolderOpenIcon,
  AddRoad as AddRoadIcon,
  CloudUpload as CloudUploadIcon,
  Send as SendIcon,
  FormatClear as ClearIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { errorStore, setError } from '@/stores/errorStore';
import {
  aiEditorStore,
  setLoading,
  setIsBuilding,
} from '@/stores/aiEditorStore';
import {
  llmStore,
  setInstruction,
  setAiInstruction,
  setExpectedOutputInstruction,
  setLastLlmGeneratePayload,
  setScanPathsInput,
  setLastLlmResponse,
  setCurrentDiff,
} from '@/stores/llmStore';
import { authStore } from '@/stores/authStore';
import {
  fileTreeStore,
  loadInitialTree,
  projectRootDirectoryStore,
  setCurrentProjectPath
} from '@/stores/fileTreeStore';
import { addLog } from '@/stores/logStore';
import {
  INSTRUCTION,
  ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
} from '@/constants/instruction';
import { generateCode, applyProposedChanges } from '@/api/llm';
import FilePickerDialog from '@/components/dialogs/FilePickerDialog';
import DirectoryPickerDialog from '@/components/dialogs/DirectoryPickerDialog';
import ScanPathsDialog from '@/components/dialogs/ScanPathsDialog';
import PromptGeneratorSettingsDialog from '@/components/dialogs/PromptGeneratorSettingsDialog';
import { ImportJsonDialog } from './ImportJsonDialog';
import { CodeRepair } from '@/components/code-generator/utils/CodeRepair';
import { LlmOutputFormat, LlmGeneratePayload, ModelResponse } from '@/types';
import { CodeGeneratorData } from './CodeGeneratorMain';

const PromptGenerator: React.FC = () => {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const theme = useTheme();

  // ---- stores ----
  const { loading, isBuilding } = useStore(aiEditorStore);
  const currentProjectPath = useStore(projectRootDirectoryStore);
  const {
    instruction,
    aiInstruction,
    expectedOutputInstruction,
    requestType,
    llmOutputFormat,
    uploadedFileData,
    uploadedFileMimeType,
    scanPathsInput,
    lastLlmResponse,
    applyingChanges,
  } = useStore(llmStore);
  const { isLoggedIn } = useStore(authStore);
  const { flatFileList } = useStore(fileTreeStore);

  // ---- local state ----
  const [projectInput, setProjectInput] = useState(
    currentProjectPath || import.meta.env.VITE_BASE_DIR || ''
  );
  const [editorContent, setEditorContent] = useState('');
  const [isPickerDialogOpen, setIsPickerDialogOpen] = useState(false);
  const [isProjectRootPickerDialogOpen, setIsProjectRootPickerDialogOpen] =
    useState(false);
  const [isScanPathsDialogOpen, setIsScanPathsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [importedData, setImportedData] = useState<CodeGeneratorData | null>(
    null
  );

  const commonDisabled =
    !isLoggedIn || loading || applyingChanges || isBuilding;

  // ---- memoized values ----
  const currentScanPathsArray = useMemo(
    () => scanPathsInput.split(',').map(s => s.trim()).filter(Boolean),
    [scanPathsInput]
  );

  const scanPathAutocompleteOptions = useMemo(() => {
    const options = flatFileList.map(e => e.filePath).filter(Boolean);
    return Array.from(
      new Set([
        ...options,
        'src',
        'public',
        'package.json',
        'README.md',
        '.env',
      ])
    ).sort();
  }, [flatFileList]);

  // ---- effects ----
  useEffect(() => {
    if (lastLlmResponse?.rawContent) setEditorContent(lastLlmResponse.rawContent);
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
    []
  );

  const handleLoadProject = useCallback(() => {
    if (!projectInput) return setError('Please provide a project root path.');
    setCurrentProjectPath(projectInput);
    setError(null);
    setLastLlmResponse(null);
    setCurrentDiff(null, null);
    setIsBuilding(false);
    loadInitialTree(projectInput);
    addLog('Prompt Generator', `Project loaded: ${projectInput}`, 'success');
  }, [projectInput]);

  const handleGenerateCode = useCallback(async () => {
    if (!instruction)
      return setError('Please provide instructions for the AI.');
    if (!isLoggedIn)
      return setError('You must be logged in to use the AI Editor.');
    if (!currentProjectPath)
      return setError('Please load a project first.');

    setLoading(true);
    setError(null);
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

      if (aiResponse.rawContent && !aiResponse.error) {
        setEditorContent(aiResponse.rawContent);
        setLastLlmResponse(aiResponse);
      } else {
        if (aiResponse.summary) setLastLlmResponse(aiResponse);
        if (aiEditorStore.get().autoApplyChanges && aiResponse.changes?.length) {
          await applyProposedChanges(aiResponse.changes, currentProjectPath);
        }
      }
    } catch (err) {
      const msg = `Failed to generate code: ${
        err instanceof Error ? err.message : String(err)
      }`;
      setError(msg);
      addLog('Prompt Generator', msg, 'error');
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
    <Box className="flex flex-col gap-2 w-full">
      {editorContent && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Code Editor</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box className="rounded-5 h-full">
              <CodeRepair
                value={editorContent}
                onChange={setEditorContent}
                filePath="temp.json"
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      <Box
        position="relative"
        className="mt-2 px-2 pr-12 overflow-auto max-h-[100px] items-end h-full"
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleGenerateCode();
          }
        }}
      >
        <Box className="mb-2">
          <TextField
            multiline
            fullWidth
            placeholder="Type your instruction..."
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            variant="standard"
            InputProps={{ disableUnderline: true }}
            className="mb-2"
          />
          {loading && (
            <Box className="mt-2 flex items-center">
              <CircularProgress size={20} className="mr-1" />
              <Typography variant="body2">Generating...</Typography>
            </Box>
          )}
        </Box>
        <Box
          className="absolute top-0 right-0 h-full flex items-center"
          sx={{ paddingRight: theme.spacing(1) }}
        >
          <Tooltip title="Generate/Modify Code">
            <IconButton
              color="success"
              onClick={handleGenerateCode}
              disabled={commonDisabled || loading || !instruction}
            >
              {loading ? <CircularProgress size={16} /> : <SendIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Bottom Toolbar */}
      <Box className="flex flex-wrap gap-2 mb-2">
        <Tooltip title="Load the selected project">
          <IconButton
            color="primary"
            disabled={commonDisabled}
            onClick={handleLoadProject}
          >
            <DriveFolderUploadIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Pick project root directory">
          <IconButton
            color="primary"
            onClick={() => setIsProjectRootPickerDialogOpen(true)}
          >
            <FolderOpenIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Manage scan paths for the AI search">
          <IconButton
            color="primary"
            onClick={() => setIsScanPathsDialogOpen(true)}
          >
            <AddRoadIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Import prompt data from JSON file">
          <IconButton
            color="primary"
            onClick={() => setIsImportDialogOpen(true)}
          >
            <CloudUploadIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Prompt generator settings">
          <IconButton color="primary" onClick={() => setIsSettingsOpen(true)}>
            <SettingsIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Clear editor and AI response">
          <IconButton color="error" onClick={handleClear} disabled={commonDisabled}>
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
        onSelect={paths =>
          updateScanPaths([...currentScanPathsArray, ...paths])
        }
        currentScanPaths={currentScanPathsArray}
      />
      <DirectoryPickerDialog
        open={isProjectRootPickerDialogOpen}
        onClose={() => setIsProjectRootPickerDialogOpen(false)}
        onSelect={path => {
          setProjectInput(path);
          handleLoadProject();
        }}
        initialPath={projectInput || currentProjectPath || '/'}
        allowExternalPaths
      />
      <PromptGeneratorSettingsDialog
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <ImportJsonDialog
        open={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={data => {
          setImportedData(data);
          setIsImportDialogOpen(false);
        }}
      />
    </Box>
  );
};

export default PromptGenerator;

