import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '@nanostores/react';
import {
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  InputAdornment, // Added InputAdornment import
  IconButton,
  useTheme,
  Autocomplete,
  Chip,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  Switch,
  FormControlLabel,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import FolderOpenIcon from '@mui/icons-material/FolderOpen'; // New: For folder browser button
import ClearAllIcon from '@mui/icons-material/ClearAll';
import AddRoadIcon from '@mui/icons-material/AddRoad';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EditNoteIcon from '@mui/icons-material/Edit';
import TuneIcon from '@mui/icons-material/Tune';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import {
  RequestType,
  RequestTypeValues,
  ApiFileScanResult,
  LlmOutputFormat,
  LlmOutputFormatValues,
  LlmGeneratePayload, // New: Import LlmGeneratePayload
} from '@/types'; // Import ApiFileScanResult and new LLM output types
import {
  aiEditorStore,
  setLoading,
  setError,
  setInstruction,
  setScanPathsInput,
  clearState,
  setLastLlmResponse,
  setCurrentDiff,
  setAppliedMessages,
  setOpenedFile,
  setAiInstruction,
  setExpectedOutputInstruction,
  setRequestType,
  setLlmOutputFormat, // New: Import setLlmOutputFormat
  setUploadedFile,
  setAutoApplyChanges,
  applyAllProposedChanges,
  setIsBuilding, // New: Import setIsBuilding
  setBuildOutput, // New: Import setBuildOutput
  setLastLlmGeneratePayload, // New: Import setLastLlmGeneratePayload
  showGlobalSnackbar, // Import global snackbar
} from '@/stores/aiEditorStore';
import { authStore } from '@/stores/authStore';
import { fileTreeStore, loadInitialTree } from '@/stores/fileTreeStore';
import {
  INSTRUCTION,
  ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT, // JSON default
  MARKDOWN_ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
  YAML_ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
  TEXT_ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
} from '@/constants';
import { generateCode } from '@/api/llm';
import { ModelResponse } from '@/types';
import FilePickerDialog from '@/components/FilePickerDialog';
import DirectoryPickerDialog from '@/components/dialogs/DirectoryPickerDialog'; // New: Import DirectoryPickerDialog
import FileUploaderDialog from '@/components/dialogs/FileUploaderDialog';
import InstructionEditorDialog from '@/components/dialogs/InstructionEditorDialog';

// Helper function to truncate long paths for display in chips
const truncatePath = (path: string, maxLength: number = 30): string => {
  if (path.length <= maxLength) {
    return path;
  }
  // Try to find the last segment of the path and keep it if possible
  const lastSlashIndex = path.lastIndexOf('/');
  if (
    lastSlashIndex !== -1 &&
    path.length - (lastSlashIndex + 1) < maxLength - 5
  ) {
    // -5 for '.../' + ellipsis
    const fileName = path.substring(lastSlashIndex + 1);
    const prefix = path.substring(0, lastSlashIndex);
    const truncatedPrefix =
      prefix.length > maxLength - fileName.length - 3 // -3 for '.../'
        ? '...' +
          prefix.substring(prefix.length - (maxLength - fileName.length - 3))
        : prefix;
    return `${truncatedPrefix}/${fileName}`;
  } else {
    // Fallback to simple truncation if path is very long or no clear segments
    return `${path.substring(0, maxLength - 3)}...`;
  }
};

const PromptGenerator: React.FC = () => {
  const {
    instruction,
    aiInstruction,
    expectedOutputInstruction,
    requestType,
    llmOutputFormat, // New: Get llmOutputFormat from store
    uploadedFileData,
    uploadedFileMimeType,
    uploadedFileName,
    loading,
    error,
    currentProjectPath,
    scanPathsInput,
    applyingChanges,
    isFetchingFileContent,
    isSavingFileContent, // New: Get new state
    isOpenedFileDirty, // New: Get new state
    autoApplyChanges,
    isBuilding, // New: Get isBuilding state
  } = useStore(aiEditorStore);
  const { isLoggedIn } = useStore(authStore);
  const { flatFileList } = useStore(fileTreeStore);
  const theme = useTheme();

  const [projectInput, setProjectInput] = useState<string>(
    currentProjectPath || import.meta.env.VITE_BASE_DIR || '',
  );
  const [isPickerDialogOpen, setIsPickerDialogOpen] = useState(false);
  const [isProjectRootPickerDialogOpen, setIsProjectRootPickerDialogOpen] =
    useState(false); // New state
  const [showAddScanPathInput, setShowAddScanPathInput] = useState(false);
  const [newScanPathValue, setNewScanPathValue] = useState<string>('');

  const [isFileUploaderDialogOpen, setIsFileUploaderDialogOpen] =
    useState(false);
  const [isInstructionEditorDialogOpen, setIsInstructionEditorDialogOpen] =
    useState(false);
  const [editingInstructionType, setEditingInstructionType] = useState<
    'ai' | 'expected' | null
  >(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    // 1. Sync local projectInput state with the global store's currentProjectPath if they differ.
    // This handles cases where currentProjectPath is updated from other places (e.g., user interaction).
    if (currentProjectPath && projectInput !== currentProjectPath) {
      setProjectInput(currentProjectPath);
    }

    // 2. On initial component mount or when VITE_BASE_DIR becomes available,
    // if the global store's currentProjectPath is not yet set, set it from VITE_BASE_DIR.
    // This ensures the FileTree and other parts of the app that rely on currentProjectPath
    // from the store are initialized correctly.
    if (import.meta.env.VITE_BASE_DIR && !currentProjectPath) {
      aiEditorStore.setKey('currentProjectPath', import.meta.env.VITE_BASE_DIR);
      // Also update local projectInput state to reflect the value pushed to the store
      setProjectInput(import.meta.env.VITE_BASE_DIR);
      // Immediately load the tree if VITE_BASE_DIR is set and no project is loaded
      loadInitialTree(import.meta.env.VITE_BASE_DIR);
    }
  }, [currentProjectPath, projectInput]); // Dependencies ensure this runs when relevant values changes

  // New: Update expectedOutputInstruction based on selected llmOutputFormat
  useEffect(() => {
    let newExpectedOutput = '';
    switch (llmOutputFormat) {
      case LlmOutputFormat.JSON:
        newExpectedOutput = ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT;
        break;
      case LlmOutputFormat.YAML:
        newExpectedOutput = YAML_ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT;
        break;
      case LlmOutputFormat.MARKDOWN:
        newExpectedOutput = MARKDOWN_ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT;
        break;
      case LlmOutputFormat.TEXT:
        newExpectedOutput = TEXT_ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT;
        break;
      default:
        newExpectedOutput = ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT; // Fallback to JSON
    }
    // Only update if it's actually different to avoid unnecessary store updates
    if (aiEditorStore.get().expectedOutputInstruction !== newExpectedOutput) {
      setExpectedOutputInstruction(newExpectedOutput);
    }
  }, [llmOutputFormat]);

  const handleInstructionChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setInstruction(event.target.value);
  };

  const handleProjectInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setProjectInput(event.target.value);
  };

  const currentScanPathsArray = useMemo(
    () =>
      scanPathsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [scanPathsInput],
  );

  const updateScanPaths = (paths: string[]) => {
    const uniquePaths = Array.from(new Set(paths)).sort();
    setScanPathsInput(uniquePaths.join(','));
  };

  const handleAddScanPath = (path: string) => {
    const trimmedPath = path.trim();
    if (trimmedPath && !currentScanPathsArray.includes(trimmedPath)) {
      updateScanPaths([...currentScanPathsArray, trimmedPath]);
    }
    setNewScanPathValue(''); // Clear input after adding
    // Keep showAddScanPathInput true if you want to add multiple paths quickly,
    // or set to false if you prefer it to disappear after one add.
    // For now, let's keep it visible until manually closed or blurred without content.
  };

  const handleRemoveScanPath = (pathToRemove: string) => {
    updateScanPaths(
      currentScanPathsArray.filter((path) => path !== pathToRemove),
    );
  };

  const handleLoadProject = () => {
    if (!projectInput) return;
    aiEditorStore.setKey('currentProjectPath', projectInput);
    setError(null);
    setLastLlmResponse(null);
    setAppliedMessages([]);
    setCurrentDiff(null, null);
    setOpenedFile(null);
    setIsBuilding(false); // Clear build state on project change
    setBuildOutput(null); // Clear build output on project change
    loadInitialTree(projectInput);
    showGlobalSnackbar(`Project "${projectInput}" loaded.`, 'success');
  };

  const handleGenerateCode = async () => {
    if (!instruction) {
      setError('Please provide instructions for the AI.');
      showGlobalSnackbar('Please provide instructions for the AI.', 'error');
      return;
    }
    if (!isLoggedIn) {
      setError('You must be logged in to use the AI Editor.');
      showGlobalSnackbar(
        'You must be logged in to use the AI Editor.',
        'error',
      );
      return;
    }
    if (!currentProjectPath) {
      setError('Please load a project first by entering a path above.');
      showGlobalSnackbar(
        'Please load a project first by entering a path above.',
        'error',
      );
      return;
    }

    setLoading(true);
    setError(null);
    setLastLlmResponse(null);
    setCurrentDiff(null, null);
    setAppliedMessages([]);
    setOpenedFile(null);
    setBuildOutput(null); // Clear previous build output
    setIsBuilding(false); // Ensure building state is reset

    try {
      const payload: LlmGeneratePayload = {
        userPrompt: instruction,
        projectRoot: currentProjectPath,
        projectStructure: '',
        relevantFiles: [],
        additionalInstructions: aiInstruction,
        expectedOutputFormat: expectedOutputInstruction,
        scanPaths: currentScanPathsArray, // Pass as is, backend handles resolution
        requestType: requestType, // Use requestType from store
        output: llmOutputFormat, // New: Pass selected output format
        ...(uploadedFileData && { fileData: uploadedFileData }),
        ...(uploadedFileMimeType && {
          fileMimeType: uploadedFileMimeType, // Corrected from fileMowedFileMimeType
        }),
      };

      setLastLlmGeneratePayload(payload); // New: Store the payload before sending

      const aiResponse: ModelResponse = await generateCode(payload);
      console.log(aiResponse, 'aiResponse');
      setLastLlmResponse(aiResponse);
      showGlobalSnackbar('AI response generated!', 'success');

      if (
        autoApplyChanges &&
        aiResponse.changes &&
        aiResponse.changes.length > 0
      ) {
        if (currentProjectPath) {
          await applyAllProposedChanges(aiResponse.changes, currentProjectPath);
        }
        // Moved else block to applyAllProposedChanges for consistent error handling
      }
    } catch (err) {
      const errorMessage = `Failed to generate code: ${err instanceof Error ? err.message : String(err)}`;
      setError(errorMessage);
      showGlobalSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const scanPathAutocompleteOptions = useMemo(() => {
    // Offer all absolute file paths from the flat file list
    const options = flatFileList
      .filter(
        (entry): entry is ApiFileScanResult =>
          entry != null &&
          typeof entry === 'object' &&
          typeof entry.filePath === 'string',
      )
      .map((entry) => entry.filePath);

    // Add some common default paths, but ensure they are not duplicated if already present
    const defaultPaths = ['src', 'public', 'package.json', 'README.md', '.env'];
    defaultPaths.forEach((dp) => {
      if (!options.includes(dp)) {
        options.push(dp);
      }
    });
    return Array.from(new Set(options)).sort();
  }, [flatFileList]);

  const handleFilePickerDialogSelect = (selectedPathsFromDialog: string[]) => {
    // FilePickerDialog returns absolute paths (FileEntry.path), which is what we want to store.
    const currentPathsSet = new Set(currentScanPathsArray);
    selectedPathsFromDialog.forEach((p) => currentPathsSet.add(p));
    updateScanPaths(Array.from(currentPathsSet));
    showGlobalSnackbar('Scan paths updated.', 'info');
  };

  const handleProjectRootSelected = (selectedPath: string) => {
    setProjectInput(selectedPath);
    // Immediately update the store and load the tree
    aiEditorStore.setKey('currentProjectPath', selectedPath);
    setError(null);
    setLastLlmResponse(null);
    setAppliedMessages([]);
    setCurrentDiff(null, null);
    setOpenedFile(null);
    setIsBuilding(false); // Clear build state on project change
    setBuildOutput(null); // Clear build output on project change
    loadInitialTree(selectedPath);
    setIsProjectRootPickerDialogOpen(false);
    showGlobalSnackbar(`Project "${selectedPath}" loaded.`, 'success');
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditInstruction = (type: 'ai' | 'expected') => {
    setEditingInstructionType(type);
    setIsInstructionEditorDialogOpen(true);
    handleMenuClose();
  };

  const handleSaveInstruction = (type: 'ai' | 'expected', content: string) => {
    if (type === 'ai') {
      setAiInstruction(content);
      showGlobalSnackbar('AI instruction updated.', 'success');
    } else if (type === 'expected') {
      setExpectedOutputInstruction(content);
      showGlobalSnackbar('Expected output format updated.', 'success');
    } else {
      console.warn('Unknown instruction type for saving:', type);
    }

    setIsInstructionEditorDialogOpen(false);
  };

  const commonDisabled =
    !isLoggedIn ||
    applyingChanges ||
    isFetchingFileContent ||
    isBuilding ||
    isSavingFileContent || // New: Get new state
    isOpenedFileDirty; // New: Get new state

  const getInstructionPlaceholder = useMemo(() => {
    switch (requestType) {
      case RequestType.TEXT_WITH_IMAGE:
        return 'Describe the image or ask to extract text (e.g., "Extract all text from this image").';
      case RequestType.TEXT_WITH_FILE:
        return 'Provide instructions for the uploaded file (e.g., "Summarize this document" or "Refactor the code in this file").';
      case RequestType.TEXT_ONLY:
        return 'Engage in a text-only conversation with the AI. No file context provided.';
      case RequestType.LLM_GENERATION:
      default:
        return 'e.g., Implement a new user authentication module with JWT. Include login and register endpoints.';
    }
  }, [requestType]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width: '100%',
      }}
    >
      {/* Project Root Path Section and Clear All */}
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}
      >
        <TextField
          label="Project Root Path"
          value={projectInput}
          onChange={handleProjectInputChange}
          placeholder="e.g., /home/user/my-project or C:\Users\user\my-project"
          disabled={commonDisabled}
          fullWidth
          size="small"
          InputLabelProps={{ style: { color: theme.palette.text.secondary } }}
          InputProps={{
            style: { color: theme.palette.text.primary },
            endAdornment: (
              <InputAdornment position="end" sx={{ gap: 0.5 }}>
                <Tooltip title="Browse for Project Root">
                  <span>
                    <IconButton
                      onClick={() => setIsProjectRootPickerDialogOpen(true)}
                      disabled={commonDisabled}
                      color="primary"
                      size="small"
                    >
                      <FolderOpenIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Load Project">
                  <span>
                    <IconButton
                      onClick={handleLoadProject}
                      disabled={commonDisabled || !projectInput}
                      color="primary"
                      size="small"
                    >
                      <DriveFolderUploadIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1 }}
        />
        <Tooltip title="Clear All Editor State">
          <span>
            <IconButton
              onClick={clearState}
              disabled={commonDisabled}
              color="secondary"
              size="small"
            >
              <ClearAllIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <DirectoryPickerDialog
          open={isProjectRootPickerDialogOpen}
          onClose={() => setIsProjectRootPickerDialogOpen(false)}
          onSelect={handleProjectRootSelected}
          initialPath={projectInput || currentProjectPath || '/'}
        />
      </Box>

      {/* Scan Paths Section */}
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}
      >
        {currentScanPathsArray.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.5,
              flexGrow: 1,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              p: 0.5,
              minHeight: 40,
              alignItems: 'center',
              bgcolor: theme.palette.background.default,
              overflowX: 'auto',
            }}
          >
            {currentScanPathsArray.map((path) => (
              <Tooltip key={path} title={path} placement="top">
                <Chip
                  label={truncatePath(path)}
                  onDelete={() => handleRemoveScanPath(path)}
                  disabled={commonDisabled}
                  deleteIcon={<CloseIcon fontSize="small" />}
                  sx={{
                    maxWidth: 180,
                    height: 24, // Smaller chip height
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '0.75rem', // Smaller font size
                    },
                  }}
                  size="small"
                />
              </Tooltip>
            ))}
            {showAddScanPathInput && (
              <Autocomplete
                freeSolo
                options={scanPathAutocompleteOptions}
                value={newScanPathValue}
                onInputChange={(_event, newInputValue) =>
                  setNewScanPathValue(newInputValue)
                }
                // The onChange prop should typically be for selecting an option or committing after blur/enter.
                // For freeSolo text input, handling 'Enter' and 'Blur' for committing the typed text is more explicit.
                // Removed the add logic from Autocomplete's onChange to avoid double-triggering or inconsistent behavior.
                onBlur={() => {
                  if (
                    newScanPathValue.trim() &&
                    !currentScanPathsArray.includes(newScanPathValue.trim())
                  ) {
                    handleAddScanPath(newScanPathValue);
                  } else if (newScanPathValue === '') {
                    setShowAddScanPathInput(false);
                  }
                }}
                disabled={commonDisabled}
                sx={{ minWidth: 150, flexGrow: 1, my: 0.5 }} // Added vertical margin
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Add path (e.g., src/utils or /home/user/project/src)"
                    autoFocus
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': { py: 0, pr: 0 }, // Adjust padding
                      '& .MuiInputBase-input': { p: '8px 10px' }, // Adjust input padding
                    }}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      ...params.InputProps,
                      onKeyDown: (e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newScanPathValue.trim()) {
                            handleAddScanPath(newScanPathValue);
                          }
                        }
                      },
                      endAdornment: (
                        <InputAdornment position="end">
                          {newScanPathValue && (
                            <IconButton
                              onClick={() => setNewScanPathValue('')}
                              edge="end"
                              disabled={commonDisabled}
                              size="small"
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          )}
                          {params.InputProps.endAdornment}
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            )}
          </Box>
        )}
        {currentScanPathsArray.length === 0 && !showAddScanPathInput && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ ml: 1, flexGrow: 1 }}
          >
            No scan paths. Add some.
          </Typography>
        )}

        <Tooltip title="Add New Scan Path Manually">
          <span>
            <IconButton
              onClick={() => setShowAddScanPathInput(true)}
              edge="end"
              disabled={commonDisabled}
              sx={{ color: theme.palette.text.secondary }}
              size="small"
            >
              <AddRoadIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Select Paths from File Tree">
          <span>
            <IconButton
              onClick={() => setIsPickerDialogOpen(true)}
              edge="end"
              disabled={commonDisabled}
              sx={{ color: theme.palette.text.secondary }}
              size="small"
            >
              <CloudUploadIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <FilePickerDialog
          open={isPickerDialogOpen}
          onClose={() => setIsPickerDialogOpen(false)}
          onSelect={handleFilePickerDialogSelect}
          currentScanPaths={currentScanPathsArray}
        />

        <FileUploaderDialog
          open={isFileUploaderDialogOpen}
          onClose={() => setIsFileUploaderDialogOpen(false)}
          onUpload={(data, mimeType, fileName) =>
            setUploadedFile(data, mimeType, fileName)
          } // Pass fileName
          currentUploadedFile={uploadedFileData}
          currentUploadedMimeType={uploadedFileMimeType}
        />

        {editingInstructionType && (
          <InstructionEditorDialog
            open={isInstructionEditorDialogOpen}
            onClose={() => setIsInstructionEditorDialogOpen(false)}
            onSave={handleSaveInstruction}
            instructionType={editingInstructionType}
            initialContent={
              editingInstructionType === 'ai'
                ? aiInstruction
                : expectedOutputInstruction
            }
          />
        )}
      </Box>

      {/* AI Instructions Input */}
      <TextField
        label="AI Instructions (User Prompt)"
        multiline
        rows={2}
        value={instruction}
        onChange={handleInstructionChange}
        placeholder={getInstructionPlaceholder}
        disabled={commonDisabled || loading || isOpenedFileDirty}
        fullWidth
        size="small"
        InputLabelProps={{
          shrink: true,
          style: { color: theme.palette.text.secondary },
        }}
        InputProps={{ style: { color: theme.palette.text.primary } }}
      />

      {/* Controls and Generate button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          width: '100%',
        }}
      >
        {/* Left group of buttons/elements */}
        <Box className="flex items-center gap-1">
          {/* File Upload/Paste Button */}
          <Tooltip title="Upload File or Paste Base64">
            <span>
              <IconButton
                onClick={() => setIsFileUploaderDialogOpen(true)}
                disabled={commonDisabled}
                color="primary"
                size="small"
              >
                <CloudUploadIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          {/* Display Request Type */}
          <Tooltip title={`Current AI Request Type: ${requestType}`}>
            <Chip
              label={requestType.replace(/_/g, ' ')}
              size="small"
              color="primary"
              sx={{
                height: 24,
                '& .MuiChip-label': { px: 0.8, fontSize: '0.75rem' },
                fontWeight: 'bold',
              }}
            />
          </Tooltip>

          {/* New: Output Format Dropdown */}
          <FormControl
            sx={{ minWidth: 120 }}
            size="small"
            disabled={commonDisabled}
          >
            <InputLabel
              id="output-format-label"
              sx={{ color: theme.palette.text.secondary }}
            >
              Output
            </InputLabel>
            <Select
              labelId="output-format-label"
              id="output-format-select"
              value={llmOutputFormat}
              label="Output"
              onChange={(e) =>
                setLlmOutputFormat(e.target.value as LlmOutputFormat)
              }
              sx={{ color: theme.palette.text.primary }}
              inputProps={{ sx: { color: theme.palette.text.primary } }}
            >
              {LlmOutputFormatValues.map((format) => (
                <MenuItem key={format} value={format}>
                  {format.toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Context Menu for Instructions */}
          <Tooltip title="Edit AI Instructions & Expected Output">
            <span>
              <IconButton
                onClick={handleMenuClick}
                disabled={commonDisabled}
                color="primary"
                size="small"
              >
                <EditNoteIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            MenuListProps={{ sx: { bgcolor: theme.palette.background.paper } }}
          >
            <MenuItem
              onClick={() => handleEditInstruction('ai')}
              disabled={commonDisabled}
            >
              <TuneIcon sx={{ mr: 1 }} fontSize="small" /> Edit AI Instruction
            </MenuItem>
            <MenuItem
              onClick={() => handleEditInstruction('expected')}
              disabled={commonDisabled}
            >
              <EditNoteIcon sx={{ mr: 1 }} fontSize="small" /> Edit Expected
              Output Format
            </MenuItem>
          </Menu>

          <FormControlLabel
            control={
              <Switch
                checked={autoApplyChanges}
                onChange={(e) => setAutoApplyChanges(e.target.checked)}
                disabled={commonDisabled || loading}
                color="primary"
                size="small"
              />
            }
            label={
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.primary,
                  fontWeight: 'medium',
                  whiteSpace: 'nowrap',
                }}
              >
                Auto-apply
              </Typography>
            }
            sx={{ m: 0, '& .MuiFormControlLabel-label': { ml: 0.5 } }}
          />
          <Tooltip title="If enabled, AI proposed changes will be automatically applied to your file system.">
            <IconButton
              size="small"
              sx={{ color: theme.palette.text.secondary }}
            >
              <AutoFixHighIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Right group: Generate/Modify Code Button */}
        <Button
          variant="contained"
          color="success"
          onClick={handleGenerateCode}
          disabled={
            loading ||
            !instruction ||
            !isLoggedIn ||
            !currentProjectPath ||
            applyingChanges ||
            isFetchingFileContent ||
            isBuilding ||
            isSavingFileContent || // New: Disable if saving file content
            isOpenedFileDirty // New: Disable if opened file has unsaved changes
          }
          size="small"
          sx={{ py: 1, px: 2, fontSize: '0.9rem', whiteSpace: 'nowrap' }}
        >
          {loading || isBuilding ? (
            <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
          ) : null}
          Generate/Modify Code
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default PromptGenerator;
