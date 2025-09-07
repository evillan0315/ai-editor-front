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
  InputAdornment,
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
import ClearAllIcon from '@mui/icons-material/ClearAll';
import AddRoadIcon from '@mui/icons-material/AddRoad';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EditNoteIcon from '@mui/icons-material/Edit';
import TuneIcon from '@mui/icons-material/Tune';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { RequestType, RequestTypeValues } from '@/types';
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
  setUploadedFile,
  setAutoApplyChanges,
  applyAllProposedChanges,
} from '@/stores/aiEditorStore';
import { authStore } from '@/stores/authStore';
import { fileTreeStore, loadInitialTree } from '@/stores/fileTreeStore';
import { INSTRUCTION, ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT } from '@/constants';
import { generateCode, LlmGeneratePayload } from '@/api/llm';
import { ModelResponse } from '@/types';
import FilePickerDialog from '@/components/FilePickerDialog';
import FileUploaderDialog from '@/components/dialogs/FileUploaderDialog';
import InstructionEditorDialog from '@/components/dialogs/InstructionEditorDialog';

// Helper function to truncate long paths for display in chips
const truncatePath = (path: string, maxLength: number = 30): string => {
  if (path.length <= maxLength) {
    return path;
  }
  const parts = path.split('/');
  // Try to truncate directory path and keep filename if possible
  if (parts.length > 1) {
    const fileName = parts[parts.length - 1];
    const dirPath = parts.slice(0, -1).join('/');
    const availableLengthForDir = maxLength - fileName.length - 3; // -3 for '.../'
    if (availableLengthForDir > 0) {
      const truncatedDirPath = dirPath.substring(0, availableLengthForDir);
      // Ensure truncatedDirPath doesn't end with a partial path segment
      const lastSlashIndex = truncatedDirPath.lastIndexOf('/');
      const finalDirPath =
        lastSlashIndex !== -1 ? truncatedDirPath.substring(0, lastSlashIndex) : truncatedDirPath;
      return `${finalDirPath ? finalDirPath + '/' : ''}.../${fileName}`;
    }
  }
  // Fallback to simple truncation if path is very long or no directory structure
  return `${path.substring(0, maxLength - 3)}...`;
};

const PromptGenerator: React.FC = () => {
  const {
    instruction,
    aiInstruction,
    expectedOutputInstruction,
    requestType,
    uploadedFileData,
    uploadedFileMimeType,
    loading,
    error,
    currentProjectPath,
    scanPathsInput,
    applyingChanges,
    isFetchingFileContent,
    autoApplyChanges,
  } = useStore(aiEditorStore);
  const { isLoggedIn } = useStore(authStore);
  const { flatFileList } = useStore(fileTreeStore);
  const theme = useTheme();

  const [projectInput, setProjectInput] = useState<string>(
    currentProjectPath || import.meta.env.VITE_BASE_DIR || '',
  );
  const [isPickerDialogOpen, setIsPickerDialogOpen] = useState(false);
  const [showAddScanPathInput, setShowAddScanPathInput] = useState(false);
  const [newScanPathValue, setNewScanPathValue] = useState<string>('');

  const [isFileUploaderDialogOpen, setIsFileUploaderDialogOpen] = useState(false);
  const [isInstructionEditorDialogOpen, setIsInstructionEditorDialogOpen] = useState(false);
  const [editingInstructionType, setEditingInstructionType] = useState<'ai' | 'expected' | null>(
    null,
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (currentProjectPath && projectInput !== currentProjectPath) {
      setProjectInput(currentProjectPath);
    }
    if (!projectInput && import.meta.env.VITE_BASE_DIR) {
      setProjectInput(import.meta.env.VITE_BASE_DIR);
      aiEditorStore.setKey('currentProjectPath', import.meta.env.VITE_BASE_DIR);
    }
  }, [currentProjectPath, projectInput]);

  const handleInstructionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInstruction(event.target.value);
  };

  const handleProjectInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    setNewScanPathValue('');
    setShowAddScanPathInput(false);
  };

  const handleRemoveScanPath = (pathToRemove: string) => {
    updateScanPaths(currentScanPathsArray.filter((path) => path !== pathToRemove));
  };

  const handleLoadProject = () => {
    if (!projectInput) return;
    aiEditorStore.setKey('currentProjectPath', projectInput);
    setError(null);
    setLastLlmResponse(null);
    setAppliedMessages([]);
    setCurrentDiff(null, null);
    setOpenedFile(null);
    loadInitialTree(projectInput);
  };

  const handleGenerateCode = async () => {
    if (!instruction) {
      setError('Please provide instructions for the AI.');
      return;
    }
    if (!isLoggedIn) {
      setError('You must be logged in to use the AI Editor.');
      return;
    }
    if (!currentProjectPath) {
      setError('Please load a project first by entering a path above.');
      return;
    }

    setLoading(true);
    setError(null);
    setLastLlmResponse(null);
    setCurrentDiff(null, null);
    setAppliedMessages([]);
    setOpenedFile(null);

    try {
      const payload: LlmGeneratePayload = {
        userPrompt: instruction,
        projectRoot: currentProjectPath,
        projectStructure: '',
        relevantFiles: [],
        additionalInstructions: aiInstruction,
        expectedOutputFormat: expectedOutputInstruction,
        scanPaths: currentScanPathsArray,
        requestType: requestType,
        ...(uploadedFileData && { fileData: uploadedFileData }),
        ...(uploadedFileMimeType && { fileMimeType: uploadedFileMimeType }),
      };

      const aiResponse: ModelResponse = await generateCode(payload);
      console.log(aiResponse, 'aiResponse');
      setLastLlmResponse(aiResponse);

      if (autoApplyChanges && aiResponse.changes && aiResponse.changes.length > 0) {
        if (currentProjectPath) {
          await applyAllProposedChanges(aiResponse.changes, currentProjectPath);
        } else {
          setError('Cannot auto-apply: Project root not defined.');
        }
      }
    } catch (err) {
      setError(`Failed to generate code: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const scanPathAutocompleteOptions = useMemo(() => {
    if (!currentProjectPath) return [];
    const normalizedProjectRoot = currentProjectPath.replace(/\\/g, '/');
    const options = flatFileList
      .map((entry) => {
        const fullPath = entry.filePath.replace(/\\/g, '/');
        return fullPath.startsWith(normalizedProjectRoot + '/')
          ? fullPath.substring(normalizedProjectRoot.length + 1)
          : fullPath === normalizedProjectRoot
            ? '.'
            : null;
      })
      .filter((p): p is string => p !== null && p !== '');

    const defaultPaths = ['src', 'package.json', 'README.md'];
    defaultPaths.forEach((dp) => {
      if (!options.includes(dp)) {
        options.push(dp);
      }
    });
    return Array.from(new Set(options)).sort();
  }, [flatFileList, currentProjectPath]);

  const handleFilePickerDialogSelect = (selectedRelativePaths: string[]) => {
    const currentPathsSet = new Set(currentScanPathsArray);
    selectedRelativePaths.forEach((p) => currentPathsSet.add(p));
    updateScanPaths(Array.from(currentPathsSet));
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
    } else if (type === 'expected') {
      setExpectedOutputInstruction(content);
    } else {
      console.warn('Unknown instruction type for saving:', type);
    }

    setIsInstructionEditorDialogOpen(false);
  };

  const commonDisabled = !isLoggedIn || applyingChanges || isFetchingFileContent;

  return (
    <Box // Replaced Paper with Box and removed layout-specific styling
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2, // Internal spacing between elements
      }}
    >
      {/* Combined Top Row for Project Config and AI Options */}
      <Box
        className="mb-6 flex flex-wrap items-stretch justify-start gap-2"
        sx={{ alignItems: 'flex-start' }}
      >
        {/* Scan Paths Section (Left) - Autocomplete & Add/Picker Buttons */}
        <Box
          className="flex flex-wrap items-center gap-1 p-1 border rounded-md"
          sx={{
            borderColor: theme.palette.divider,
            bgcolor: theme.palette.background.default,
            minWidth: { xs: '100%', sm: '300px' },
            flexGrow: 1,
          }}
        >
          {currentScanPathsArray.length === 0 && !showAddScanPathInput ? (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1, my: 0.5 }}>
              No scan paths. Add some.
            </Typography>
          ) : (
            currentScanPathsArray.map((path) => (
              <Tooltip key={path} title={path} placement="top">
                <Chip
                  label={truncatePath(path)}
                  onDelete={() => handleRemoveScanPath(path)}
                  disabled={commonDisabled}
                  deleteIcon={<CloseIcon />}
                  sx={{
                    maxWidth: 180,
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    },
                  }}
                  size="small"
                />
              </Tooltip>
            ))
          )}

          {showAddScanPathInput ? (
            <Autocomplete
              freeSolo
              options={scanPathAutocompleteOptions}
              value={newScanPathValue}
              onInputChange={(_event, newInputValue) => setNewScanPathValue(newInputValue)}
              onChange={(_event, newValue) => {
                if (typeof newValue === 'string') {
                  handleAddScanPath(newValue);
                } else if (newValue && (newValue as any).inputValue) {
                  handleAddScanPath((newValue as any).inputValue);
                }
              }}
              onBlur={() => {
                if (newScanPathValue === '') {
                  setShowAddScanPathInput(false);
                }
              }}
              disabled={commonDisabled}
              sx={{ minWidth: 150, flexGrow: 1 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Add new path (e.g., src/utils)"
                  autoFocus
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && newScanPathValue) {
                      handleAddScanPath(newScanPathValue);
                      event.preventDefault();
                    }
                    if (event.key === 'Escape') {
                      setShowAddScanPathInput(false);
                      setNewScanPathValue('');
                    }
                  }}
                  size="small"
                  InputLabelProps={{
                    style: { color: theme.palette.text.secondary },
                  }}
                  InputProps={{
                    ...params.InputProps,
                    style: { color: theme.palette.text.primary },
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
          ) : (
            <Tooltip title="Add New Scan Path Manually">
              <span>
                <IconButton
                  onClick={() => setShowAddScanPathInput(true)}
                  edge="end"
                  disabled={commonDisabled}
                  sx={{ color: theme.palette.text.secondary }}
                  size="small"
                >
                  <AddRoadIcon />
                </IconButton>
              </span>
            </Tooltip>
          )}

          <Tooltip title="Select Paths from File Tree">
            <span>
              <IconButton
                onClick={() => setIsPickerDialogOpen(true)}
                edge="end"
                disabled={commonDisabled}
                sx={{ color: theme.palette.text.secondary }}
                size="small"
              >
                <CloudUploadIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Project Root Path Section (Middle) */}
        <TextField
          label="Project Root Path"
          value={projectInput}
          onChange={handleProjectInputChange}
          placeholder="e.g., /home/user/my-project"
          disabled={commonDisabled}
          sx={{ flexShrink: 0, minWidth: { xs: '100%', sm: '300px' } }}
          size="small"
          InputLabelProps={{ style: { color: theme.palette.text.secondary } }}
          InputProps={{
            style: { color: theme.palette.text.primary },
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Load Project">
                  <span>
                    <IconButton
                      onClick={handleLoadProject}
                      disabled={commonDisabled || !projectInput}
                      color="primary"
                    >
                      <DriveFolderUploadIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Clear All State">
                  <span>
                    <IconButton onClick={clearState} disabled={commonDisabled} color="secondary">
                      <ClearAllIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />

        {/* New Buttons/Dropdowns (Right) */}
        <Box className="flex gap-2 items-center flex-shrink-0">
          {/* File Upload/Paste Button */}
          <Tooltip title="Upload File or Paste Base64">
            <span>
              <IconButton
                onClick={() => setIsFileUploaderDialogOpen(true)}
                disabled={commonDisabled}
                color="primary"
              >
                <CloudUploadIcon />
              </IconButton>
            </span>
          </Tooltip>

          {/* RequestType Dropdown */}
          <FormControl sx={{ minWidth: 160 }} size="small" disabled={commonDisabled}>
            <InputLabel id="request-type-label" sx={{ color: theme.palette.text.secondary }}>
              Request Type
            </InputLabel>
            <Select
              labelId="request-type-label"
              id="request-type-select"
              value={requestType}
              label="Request Type"
              onChange={(e) => setRequestType(e.target.value as RequestType)}
              sx={{ color: theme.palette.text.primary }}
              inputProps={{ sx: { color: theme.palette.text.primary } }}
            >
              {RequestTypeValues.map((type) => (
                <MenuItem key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Context Menu for Instructions */}
          <Tooltip title="Edit AI Instructions & Expected Output">
            <span>
              <IconButton onClick={handleMenuClick} disabled={commonDisabled} color="primary">
                <EditNoteIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            MenuListProps={{ sx: { bgcolor: theme.palette.background.paper } }}
          >
            <MenuItem onClick={() => handleEditInstruction('ai')}>
              <TuneIcon sx={{ mr: 1 }} /> Edit AI Instruction
            </MenuItem>
            <MenuItem onClick={() => handleEditInstruction('expected')}>
              <EditNoteIcon sx={{ mr: 1 }} /> Edit Expected Output Format
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={autoApplyChanges}
              onChange={(e) => setAutoApplyChanges(e.target.checked)}
              disabled={commonDisabled || loading}
              color="primary"
            />
          }
          label={
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.primary, fontWeight: 'medium' }}
            >
              Auto-apply changes
            </Typography>
          }
          sx={{ m: 0, '& .MuiFormControlLabel-label': { ml: 0.5 } }}
        />
        <Tooltip title="If enabled, AI proposed changes will be automatically applied to your file system.">
          <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
            <AutoFixHighIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <FilePickerDialog
        open={isPickerDialogOpen}
        onClose={() => setIsPickerDialogOpen(false)}
        onSelect={handleFilePickerDialogSelect}
        currentScanPaths={currentScanPathsArray}
      />

      <FileUploaderDialog
        open={isFileUploaderDialogOpen}
        onClose={() => setIsFileUploaderDialogOpen(false)}
        onUpload={(data, mimeType, fileName) => setUploadedFile(data, mimeType)}
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
            editingInstructionType === 'ai' ? aiInstruction : expectedOutputInstruction
          }
        />
      )}

      {/* Main AI Prompt Text Area */}
      <TextField
        label="AI Instructions (User Prompt)"
        multiline
        rows={6}
        value={instruction}
        onChange={handleInstructionChange}
        placeholder="e.g., Implement a new user authentication module with JWT. Include login and register endpoints."
        disabled={commonDisabled || loading}
        fullWidth
        margin="normal"
        InputLabelProps={{ style: { color: theme.palette.text.secondary } }}
        InputProps={{ style: { color: theme.palette.text.primary } }}
      />

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
          isFetchingFileContent
        }
        sx={{ mt: 3, py: 1.5, px: 4, fontSize: '1.05rem' }}
      >
        {loading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : null}
        Generate/Modify Code
      </Button>
      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default PromptGenerator;
