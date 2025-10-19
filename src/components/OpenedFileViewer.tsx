import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
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
} from '@/stores/fileStore';
import { readFileContent } from '@/api/file';
import { Box, Typography, CircularProgress, Alert, Paper } from '@mui/material';

import CodeMirrorEditor from './codemirror/CodeMirrorEditor'; // Import the shared CodeMirrorEditor
import { keymap, EditorView } from '@codemirror/view'; // Keep keymap and EditorView for extensions
import { Extension } from '@codemirror/state'; // Import Extension type for type safety
import InitialEditorViewer from './InitialEditorViewer';
import MarkdownEditor from '@/components/MarkdownEditor';
import { projectStore } from '@/stores/projectStore'; // <-- NEW IMPORT

interface OpenedFileViewerProps {}

const OpenedFileViewer: React.FC<OpenedFileViewerProps> = () => {
  const {
    initialFileContentSnapshot,
    isFetchingFileContent,
    fetchFileContentError,
    isOpenedFileDirty,
    isSavingFileContent,
  } = useStore(fileStore);
  const $openedFileContent = useStore(openedFileContent);
  const $openedFile = useStore(openedFile);
  const muiTheme = useTheme();
  const $projectStore = useStore(projectStore); // <-- Use projectStore

  // Define the save keymap extension
  const saveKeymapExtension: Extension = React.useMemo(() => {
    return keymap.of([
      {
        key: 'Mod-s',
        run: () => {
          saveActiveFile();
          return true;
        },
      },
    ]);
  }, []);

  useEffect(() => {
    const fetchContent = async () => {
      if (!$openedFile) {
        setOpenedFileContent(null);
        setInitialFileContentSnapshot(null);
        setFetchFileContentError(null);
        setIsOpenedFileDirty(false);
        return;
      }

      const projectId = $projectStore.currentProject?.id; // <-- Get projectId from store

      if (!projectId) {
        setFetchFileContentError('No project selected. Cannot fetch file content.');
        setIsFetchingFileContent(false);
        setOpenedFileContent(null);
        setInitialFileContentSnapshot(null);
        return;
      }

      setIsFetchingFileContent(true);
      setFetchFileContentError(null);

      try {
        const content = await readFileContent($openedFile, projectId); // <-- Pass projectId
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
  }, [$openedFile, $projectStore.currentProject?.id]); // <-- Add projectId to dependencies

  useEffect(() => {
    if (
      $openedFile &&
      !isFetchingFileContent &&
      initialFileContentSnapshot !== null
    ) {
      const isDirty = $openedFileContent !== initialFileContentSnapshot;
      if (isDirty !== isOpenedFileDirty) {
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
    isOpenedFileDirty,
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
    <Box
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: muiTheme.palette.background.default,
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
        <>
          {isMarkdownFile ? (
            <MarkdownEditor
              value={$openedFileContent || ''}
              onChange={handleContentChange}
              disabled={isDisabled}
              onSave={() => saveActiveFile()}
            />
          ) : (
            <CodeMirrorEditor // Use the new CodeMirrorEditor component
              value={$openedFileContent || ''}
              onChange={handleContentChange}
              filePath={$openedFile || undefined} // Pass filePath for language detection
              isDisabled={isDisabled}
              height="100%" // Ensure it fills its container
              additionalExtensions={[saveKeymapExtension]} // Pass the custom keymap
            />
          )}
        </>
      )}
    </Box>
  );
};

export default OpenedFileViewer;
