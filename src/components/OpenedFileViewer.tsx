import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { themeStore } from '@/stores/themeStore';
import { useTheme } from '@mui/material';
import {
  fileStore,
  setOpenedFileContent,
  setIsFetchingFileContent,
  setFetchFileContentError,
  setIsOpenedFileDirty,
  setInitialFileContentSnapshot,
  saveActiveFile,
  openedFileContent,
  openedFile,
  isOpenedFileDirty // Directly import the atom
} from '@/stores/fileStore';
import { readFileContent } from '@/api/file';
import { Box, Typography, CircularProgress, Alert, Paper } from '@mui/material';

import CodeMirrorEditor from '@/components/codemirror/CodeMirrorEditor'; // Import CodeMirrorEditor
import InitialEditorViewer from './InitialEditorViewer';
import MarkdownEditor from '@/components/MarkdownEditor';

interface OpenedFileViewerProps {}

const OpenedFileViewer: React.FC<OpenedFileViewerProps> = () => {
  const {
    initialFileContentSnapshot,
    isFetchingFileContent,
    fetchFileContentError,
    isSavingFileContent,
  } = useStore(fileStore);
  const $openedFileContent = useStore(openedFileContent);
  const $openedFile = useStore(openedFile);
  const $isOpenedFileDirty = useStore(isOpenedFileDirty); // Subscribe directly to the atom
  const muiTheme = useTheme();
  const { mode } = useStore(themeStore);

  useEffect(() => {
    const fetchContent = async () => {
      if (!$openedFile) {
        setOpenedFileContent(null);
        setInitialFileContentSnapshot(null);
        setFetchFileContentError(null);
        setIsOpenedFileDirty(false);
        return;
      }

      setIsFetchingFileContent(true);
      setFetchFileContentError(null);

      try {
        const content = await readFileContent($openedFile);
        setOpenedFileContent(content);
        setInitialFileContentSnapshot(content);
        setIsOpenedFileDirty(false);
      } catch (err) {
        console.error(`Error reading file ${$openedFile}:`, err);
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
  }, [$openedFile]);

  useEffect(() => {
    if (
      $openedFile &&
      !isFetchingFileContent &&
      initialFileContentSnapshot !== null
    ) {
      const isDirty = $openedFileContent !== initialFileContentSnapshot;
      if (isDirty !== $isOpenedFileDirty) { // Compare with the atom's value
        setIsOpenedFileDirty(isDirty);
      }
    } else if (!$openedFile) {
      setIsOpenedFileDirty(false);
    }
  }, [
    $openedFile,
    $openedFileContent,
    initialFileContentSnapshot,
    isFetchingFileContent,
    $isOpenedFileDirty, // Add the atom to dependencies
  ]);

  const handleContentChange = (value: string) => {
    setOpenedFileContent(value);
  };

  if (!$openedFile) return <InitialEditorViewer />;

  const isLoadingContent = isFetchingFileContent;
  const isDisabled = isLoadingContent || isSavingFileContent;

  // Detect markdown files by extension
  const isMarkdownFile = $openedFile?.toLowerCase().endsWith('.md');

  return (
    <Paper
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: muiTheme.palette.background.paper,
        height: '100%',
        maxHeight: '100%',
        overflowY: 'hidden',
        position: 'relative',
      }}
    >
      {fetchFileContentError && (
        <Alert severity="error" sx={{ m: 2 }}>
          {fetchFileContentError}
        </Alert>
      )}

      {isFetchingFileContent && !$openedFileContent ? (
        <Box
          className="flex justify-center items-center flex-grow"
          sx={{ bgcolor: muiTheme.palette.background.paper }}
        >
          <CircularProgress size={24} />
          <Typography
            variant="body2"
            sx={{ ml: 2, color: muiTheme.palette.text.secondary }}
          >
            Loading file content...
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            flexGrow: 1,
            height: '100%',
            width: '100%',
            overflow: 'auto',
            bgcolor: muiTheme.palette.background.default,
          }}
        >
          {isMarkdownFile ? (
            // Use MarkdownEditor for .md files
            <MarkdownEditor
              value={$openedFileContent || ''}
              onChange={handleContentChange}
              disabled={isDisabled}
              onSave={() => saveActiveFile()}
              filePath={$openedFile}
            />
          ) : (
            // Use CodeMirrorEditor for other files
            <CodeMirrorEditor
              value={$openedFileContent || ''}
              onChange={handleContentChange}
              filePath={$openedFile} // Pass filePath for language detection and status
              isDisabled={isDisabled}
              onSave={() => saveActiveFile()} // Pass save handler
            />
          )}
        </Box>
      )}
    </Paper>
  );
};

export default OpenedFileViewer;
