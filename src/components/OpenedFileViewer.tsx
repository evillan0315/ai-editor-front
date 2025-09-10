import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  aiEditorStore,
  setOpenedFileContent,
  setIsFetchingFileContent,
  setFetchFileContentError,
  setIsOpenedFileDirty, // Existing, but now set based on store's snapshot
  setInitialFileContentSnapshot, // New: To set initial content in store
  saveActiveFile, // Import the new save action
} from '@/stores/aiEditorStore';
import { readFileContent } from '@/api/file';
import CodeMirror from '@uiw/react-codemirror';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  useTheme,
} from '@mui/material';
import { themeStore } from '@/stores/themeStore';
import { getCodeMirrorLanguage, createCodeMirrorTheme } from '@/utils/index'; // Import createCodeMirrorTheme
import { keymap } from '@codemirror/view'; // Import keymap

interface OpenedFileViewerProps {
  // No specific props needed, all state comes from aiEditorStore
}

const OpenedFileViewer: React.FC<OpenedFileViewerProps> = () => {
  const {
    openedFile,
    openedFileContent,
    initialFileContentSnapshot, // New: Get from store
    isFetchingFileContent,
    fetchFileContentError,
    isOpenedFileDirty, // Get from store
    isSavingFileContent, // New: Get saving status from store
  } = useStore(aiEditorStore);
  const muiTheme = useTheme(); // Get MUI theme
  const { mode } = useStore(themeStore);

  // Effect to fetch file content when `openedFile` changes
  useEffect(() => {
    const fetchContent = async () => {
      if (!openedFile) {
        // Reset all relevant states when file is closed
        setOpenedFileContent(null);
        setInitialFileContentSnapshot(null); // Clear snapshot in store
        setFetchFileContentError(null);
        setIsOpenedFileDirty(false); // No longer dirty
        return;
      }

      setIsFetchingFileContent(true);
      setFetchFileContentError(null);

      try {
        const content = await readFileContent(openedFile);
        setOpenedFileContent(content);
        setInitialFileContentSnapshot(content); // Store original content in store
        setIsOpenedFileDirty(false); // Reset dirty flag after initial load
      } catch (err) {
        console.error(`Error reading file ${openedFile}:`, err);
        setFetchFileContentError(
          `Failed to read file: ${err instanceof Error ? err.message : String(err)}`,
        );
        setOpenedFileContent(null);
        setInitialFileContentSnapshot(null);
      } finally {
        setIsFetchingFileContent(false);
      }
    };

    fetchContent();
  }, [openedFile]);

  // Effect to update `isOpenedFileDirty` based on `openedFileContent` vs `initialFileContentSnapshot`
  useEffect(() => {
    // Only compare if a file is actually opened and not in the process of fetching
    if (
      openedFile &&
      !isFetchingFileContent &&
      initialFileContentSnapshot !== null
    ) {
      const isDirty = openedFileContent !== initialFileContentSnapshot;
      if (isDirty !== isOpenedFileDirty) {
        setIsOpenedFileDirty(isDirty);
      }
    } else if (!openedFile) {
      setIsOpenedFileDirty(false); // Not dirty if no file is opened
    }
  }, [
    openedFile,
    openedFileContent,
    initialFileContentSnapshot,
    isFetchingFileContent,
    isOpenedFileDirty,
  ]);

  const handleContentChange = (value: string) => {
    setOpenedFileContent(value); // This action handles setting `isOpenedFileDirty` implicitly or through the effect above
  };

  if (!openedFile) return null; // Only render if a file is opened

  const isLoadingContent = isFetchingFileContent;
  const isDisabled = isLoadingContent || isSavingFileContent; // Disable editing if saving or fetching

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
      {fetchFileContentError && (
        <Alert severity="error" sx={{ m: 2 }}>
          {fetchFileContentError}
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
              keymap.of([
                {
                  key: 'Mod-s',
                  run: () => {
                    saveActiveFile(); // Trigger save action
                    return true; // Mark event as handled
                  },
                },
              ]),
            ]}
            theme={mode}
            editable={!isDisabled} // Allow editing unless loading or saving
            minHeight="100%" // Take all available height in this container
            maxHeight="100%"
          />
        </Box>
      )}
    </Paper>
  );
};

export default OpenedFileViewer;
