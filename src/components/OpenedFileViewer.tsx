import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  aiEditorStore,
  setOpenedFile,
  setOpenedFileContent,
  setIsFetchingFileContent,
  setFetchFileContentError,
  setIsSavingFileContent, // New: Import new action
  setSaveFileContentError, // New: Import new action
  setIsOpenedFileDirty, // New: Import new action
  removeOpenedTab, // New: Import removeOpenedTab for closing
} from '@/stores/aiEditorStore';
import { readFileContent, writeFileContent } from '@/api/file'; // New: Import writeFileContent
import CodeMirror from '@uiw/react-codemirror';
import CustomSnackbar from '@/components/Snackbar'; // New: Import custom Snackbar
// Language extensions are now handled by getCodeMirrorLanguage from utils
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  useTheme,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close'; // New: Import CloseIcon
import SaveIcon from '@mui/icons-material/Save'; // New: Import SaveIcon
import UndoIcon from '@mui/icons-material/Undo'; // New: Import UndoIcon (for discard)
import { themeStore } from '@/stores/themeStore';
import { getCodeMirrorLanguage, createCodeMirrorTheme } from '@/utils/index'; // Import createCodeMirrorTheme
import { getFileTypeIcon } from '@/constants/fileIcons'; // New: Import getFileTypeIcon

interface OpenedFileViewerProps {
  // No specific props needed, all state comes from aiEditorStore
}

const OpenedFileViewer: React.FC<OpenedFileViewerProps> = () => {
  const {
    openedFile,
    openedFileContent,
    isFetchingFileContent,
    fetchFileContentError,
    isSavingFileContent, // New: Get new state
    saveFileContentError, // New: Get new state
    isOpenedFileDirty, // New: Get new state
  } = useStore(aiEditorStore);
  const muiTheme = useTheme(); // Get MUI theme
  const { mode } = useStore(themeStore);

  const [initialContentSnapshot, setInitialContentSnapshot] = useState<
    string | null
  >(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'info'
  >('info');

  // Effect to fetch file content when `openedFile` changes
  useEffect(() => {
    const fetchContent = async () => {
      if (!openedFile) {
        // Reset all relevant states when file is closed
        setOpenedFileContent(null);
        setFetchFileContentError(null);
        setInitialContentSnapshot(null); // Clear snapshot
        setIsOpenedFileDirty(false); // No longer dirty
        setSaveFileContentError(null); // Clear any save error
        return;
      }

      setIsFetchingFileContent(true);
      setFetchFileContentError(null);
      setSaveFileContentError(null); // Clear previous save errors when opening a new file

      try {
        const content = await readFileContent(openedFile);
        setOpenedFileContent(content); // This also sets isOpenedFileDirty to true temporarily
        setInitialContentSnapshot(content); // Store original content
        setIsOpenedFileDirty(false); // Reset dirty flag after initial load
      } catch (err) {
        console.error(`Error reading file ${openedFile}:`, err);
        setFetchFileContentError(
          `Failed to read file: ${err instanceof Error ? err.message : String(err)}`,
        );
        setOpenedFileContent(null);
        setInitialContentSnapshot(null);
      } finally {
        setIsFetchingFileContent(false);
      }
    };

    fetchContent();
  }, [openedFile]);

  // Effect to update `isOpenedFileDirty` based on `openedFileContent` vs `initialContentSnapshot`
  useEffect(() => {
    // Only compare if a file is actually opened and not in the process of fetching
    if (
      openedFile &&
      !isFetchingFileContent &&
      initialContentSnapshot !== null
    ) {
      const isDirty = openedFileContent !== initialContentSnapshot;
      if (isDirty !== isOpenedFileDirty) {
        setIsOpenedFileDirty(isDirty);
      }
    } else if (!openedFile) {
      setIsOpenedFileDirty(false); // Not dirty if no file is opened
    }
  }, [
    openedFile,
    openedFileContent,
    initialContentSnapshot,
    isFetchingFileContent,
    isOpenedFileDirty,
  ]);

  const handleSave = async () => {
    if (!openedFile || openedFileContent === null) {
      setSaveFileContentError('No file or content to save.');
      return;
    }

    setIsSavingFileContent(true);
    setSaveFileContentError(null);
    setSnackbarOpen(false); // Close any existing snackbar

    try {
      const result = await writeFileContent(openedFile, openedFileContent);
      if (result.success) {
        setInitialContentSnapshot(openedFileContent); // Update snapshot to new saved content
        setIsOpenedFileDirty(false); // Mark as clean after saving
        setSnackbarMessage(`File saved: ${openedFile}`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        setSaveFileContentError(result.message || 'Failed to save file.');
        setSnackbarMessage(`Failed to save: ${result.message || openedFile}`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setSaveFileContentError(`Failed to save file: ${errorMessage}`);
      setSnackbarMessage(`Error saving: ${errorMessage}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsSavingFileContent(false);
    }
  };

  const handleDiscardChanges = () => {
    if (
      window.confirm(
        'Are you sure you want to discard unsaved changes? This action cannot be undone.',
      )
    ) {
      setOpenedFileContent(initialContentSnapshot); // Revert to snapshot
      setIsOpenedFileDirty(false); // Mark as clean
      setSaveFileContentError(null); // Clear any save errors
      setSnackbarMessage('Changes discarded.');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
    }
  };

  const handleContentChange = (value: string) => {
    setOpenedFileContent(value); // This action handles setting `isOpenedFileDirty`
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleCloseViewer = () => {
    if (openedFile) {
      removeOpenedTab(openedFile); // Use removeOpenedTab to manage closing and active tab switching
    }
  };

  if (!openedFile) return null; // Only render if a file is opened

  const isLoadingContent = isFetchingFileContent || isSavingFileContent;
  const isDisabled = isLoadingContent;
  const fileName = openedFile.split('/').pop() || ''; // Get file name for icon

  return (
    <Paper
      elevation={2}
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: muiTheme.palette.background.paper,
        height: '100%', // Explicitly set height to ensure it fills the parent
        maxHeight: '100%', // Ensure it doesn't overflow parent
        overflowY: 'hidden', // Hide vertical scroll of paper itself, CodeMirror scrolls
        position: 'relative', // For absolute positioning of snackbar
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
          minHeight: '40px', // Explicitly set to match file tabs height
          borderBottom: `1px solid ${muiTheme.palette.divider}`,
          bgcolor: muiTheme.palette.action.hover,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}> {/* Reduced gap to 0.5 */}
          <Box sx={{ color: 'inherit' }}>{getFileTypeIcon(fileName, 'file', false)}</Box> {/* Added file type icon */}
          <Typography
            variant="subtitle1" // Changed typography variant from h6 to subtitle1
            className="!font-semibold"
            sx={{ color: muiTheme.palette.text.primary, mr: 1 }}
          >
            {fileName}
          </Typography>
          {isOpenedFileDirty && (
            <Chip
              label="Unsaved changes"
              size="small"
              color="warning"
              sx={{ height: 20, '& .MuiChip-label': { px: 0.8 } }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}> {/* Reduced gap to 0.5 */}
          {isOpenedFileDirty && (
            <Tooltip title="Discard unsaved changes">
              <span>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleDiscardChanges}
                  disabled={isDisabled}
                  startIcon={<UndoIcon />}
                  sx={{
                    color: muiTheme.palette.error.main,
                    borderColor: muiTheme.palette.error.light,
                    '&:hover': {
                      borderColor: muiTheme.palette.error.dark,
                      bgcolor: muiTheme.palette.error.light + '10',
                    },
                  }}
                >
                  Discard
                </Button>
              </span>
            </Tooltip>
          )}

          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={handleSave}
            disabled={isDisabled || !isOpenedFileDirty}
            startIcon={
              isSavingFileContent ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <SaveIcon />
              )
            }
          >
            {isSavingFileContent ? 'Saving...' : 'Save'}
          </Button>

          <Tooltip title="Close File">
            <IconButton
              size="small"
              onClick={handleCloseViewer}
              sx={{ color: muiTheme.palette.text.secondary }}
              disabled={isDisabled}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {fetchFileContentError && (
        <Alert severity="error" sx={{ m: 2 }}>
          {fetchFileContentError}
        </Alert>
      )}
      {saveFileContentError && (
        <Alert severity="error" sx={{ m: 2 }}>
          {saveFileContentError}
        </Alert>
      )}

      {isFetchingFileContent && !openedFileContent ? (
        <Box className="flex justify-center items-center flex-grow">
          <CircularProgress size={24} />
          <Typography
            variant="body2"
            sx={{ ml: 2, color: muiTheme.palette.text.secondary }}
          >
            Loading file content...
          </Typography>
        </Box>
      ) : (
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <CodeMirror
            value={openedFileContent || ''}
            onChange={handleContentChange}
            extensions={[
              getCodeMirrorLanguage(openedFile),
              createCodeMirrorTheme(muiTheme), // Add custom theme here
            ]}
            theme={mode}
            editable={!isDisabled} // Allow editing unless loading
            minHeight="100%" // Take all available height in this container
            maxHeight="100%"
          />
        </Box>
      )}
      <CustomSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={handleSnackbarClose}
        autoHideDuration={3000}
      />
    </Paper>
  );
};

export default OpenedFileViewer;
