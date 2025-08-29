import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  aiEditorStore,
  setOpenedFile,
  setOpenedFileContent,
  setIsFetchingFileContent,
  setFetchFileContentError,
} from '@/stores/aiEditorStore';
import { readFileContent } from '@/api/file';
import CodeMirror from '@uiw/react-codemirror';
// Language extensions are now handled by getCodeMirrorLanguage from utils
import { Box, Typography, Button, CircularProgress, Alert, Paper, useTheme } from '@mui/material';
import { themeStore } from '@/stores/themeStore';
import { getCodeMirrorLanguage } from '@/utils/index'; // Import from utils

interface OpenedFileViewerProps {
  // No specific props needed, all state comes from aiEditorStore
}

const OpenedFileViewer: React.FC<OpenedFileViewerProps> = () => {
  const { openedFile, openedFileContent, isFetchingFileContent, fetchFileContentError } =
    useStore(aiEditorStore);
  const theme = useTheme();
  const { mode } = useStore(themeStore);
  useEffect(() => {
    const fetchContent = async () => {
      if (!openedFile) {
        setOpenedFileContent(null);
        setFetchFileContentError(null);
        return;
      }

      setIsFetchingFileContent(true);
      setFetchFileContentError(null);

      try {
        const content = await readFileContent(openedFile);
        setOpenedFileContent(content);
      } catch (err) {
        console.error(`Error reading file ${openedFile}:`, err);
        setFetchFileContentError(
          `Failed to read file: ${err instanceof Error ? err.message : String(err)}`,
        );
        setOpenedFileContent(null);
      } finally {
        setIsFetchingFileContent(false);
      }
    };

    fetchContent();
  }, [openedFile]);

  if (!openedFile) return null; // Only render if a file is opened

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.background.paper,
        maxHeight: '100%', // Ensure it doesn't overflow parent
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
        }}
      >
        <Typography
          variant="h6"
          className="!font-semibold"
          sx={{ color: theme.palette.text.primary }}
        >
          Viewing File: {openedFile}
        </Typography>
        <Button
          size="small"
          onClick={() => setOpenedFile(null)}
          sx={{ color: theme.palette.text.secondary }}
        >
          Close File
        </Button>
      </Box>
      {isFetchingFileContent ? (
        <Box className="flex justify-center items-center flex-grow">
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ ml: 2, color: theme.palette.text.secondary }}>
            Loading file content...
          </Typography>
        </Box>
      ) : fetchFileContentError ? (
        <Alert severity="error" sx={{ mt: 2, flexGrow: 1 }}>
          {fetchFileContentError}
        </Alert>
      ) : (
        <CodeMirror
          value={openedFileContent || ''}
          onChange={() => {}}
          extensions={getCodeMirrorLanguage(openedFile)}
          theme={mode || 'dark'}
          editable={false} // Read-only for viewed files
          height="100%" // Explicitly set height to ensure it fills the parent
        />
      )}
    </Paper>
  );
};

export default OpenedFileViewer;
