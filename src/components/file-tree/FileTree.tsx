import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  useTheme,
} from '@mui/material';
import FileTreeItem from './FileTreeItem';
import { useStore } from '@nanostores/react';
import { fileTreeStore, loadInitialTree, clearFileTree } from '@/stores/fileTreeStore';
import { aiEditorStore } from '@/stores/aiEditorStore';
import { FileEntry } from '@/types/fileTree';
import { ContextMenuItem } from '@/types';
import { showFileTreeContextMenu, hideFileTreeContextMenu } from '@/stores/contextMenuStore';
import {
  ContentCopy as ContentCopyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  NoteAdd as NoteAddIcon,
  CreateNewFolder as CreateNewFolderIcon,
  Terminal as TerminalIcon,
  OpenInNew as OpenInNewIcon,
  Refresh as RefreshIcon,
  FolderOpenOutlined as FolderOpenIcon,
  DriveFileMove as DriveFileMoveIcon,
  FileCopy as FileCopyIcon,
} from '@mui/icons-material';
import { FileTreeContextMenuRenderer } from './FileTreeContextMenuRenderer';
import CustomSnackbar from '@/components/Snackbar'; // Import custom Snackbar
import { setSelectedFile } from '@/stores/fileTreeStore';

interface FileTreeProps {
  projectRoot: string;
}

const FileTree: React.FC<FileTreeProps> = ({ projectRoot }) => {
  const { files: treeFiles, isFetchingTree, fetchTreeError } = useStore(fileTreeStore);
  const { scanPathsInput } = useStore(aiEditorStore);
  const theme = useTheme();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('info');

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  useEffect(() => {
    if (projectRoot) {
      loadInitialTree(projectRoot);
    }
    return () => {
      clearFileTree();
    };
  }, [projectRoot]);

  const handleRefreshTree = () => {
    if (projectRoot) {
      loadInitialTree(projectRoot);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const renderContextMenuItems = useCallback(
    (node: FileEntry): ContextMenuItem[] => {
      const isFile = node.type === 'file';
      const parentPath = node.isDirectory
        ? node.path
        : node.path.split('/').slice(0, -1).join('/') || '/';

      const items: ContextMenuItem[] = [
        // Open File / Open Folder
        {
          label: isFile ? 'Open File' : 'Open Folder',
          icon: <OpenInNewIcon fontSize="small" />,
          action: (file) => {
            if (file.type === 'file') {
              setSelectedFile(file.path);
              showSnackbar(`Opening file: ${file.name}`, 'info');
            } else {
              showSnackbar(`Opening folder: ${file.name}`, 'info');
            }
          },
        },
        { type: 'divider' },
        {
          // New File
          label: 'New File...',
          icon: <NoteAddIcon fontSize="small" />,
          action: () =>
            showSnackbar(
              `New File in ${node.type === 'folder' ? node.path : parentPath} feature coming soon.`,
              'info',
            ),
          disabled: true,
        },
        {
          // New Folder
          label: 'New Folder...',
          icon: <CreateNewFolderIcon fontSize="small" />,
          action: () =>
            showSnackbar(
              `New Folder in ${node.type === 'folder' ? node.path : parentPath} feature coming soon.`,
              'info',
            ),
          disabled: true,
        },
        { type: 'divider' },
        {
          // Rename
          label: 'Rename...',
          icon: <EditIcon fontSize="small" />,
          action: () => showSnackbar('Rename feature coming soon. Requires backend API.', 'info'),
          disabled: true,
        },
        {
          // Copy
          label: 'Copy...',
          icon: <FileCopyIcon fontSize="small" />,
          action: () => showSnackbar('Copy feature coming soon. Requires backend API.', 'info'),
          disabled: true,
        },
        {
          // Move
          label: 'Move...',
          icon: <DriveFileMoveIcon fontSize="small" />,
          action: () => showSnackbar('Move feature coming soon. Requires backend API.', 'info'),
          disabled: true,
        },
        { type: 'divider' },
        {
          // Copy Path
          label: 'Copy Path',
          icon: <ContentCopyIcon fontSize="small" />,
          action: (file) => {
            navigator.clipboard.writeText(file.path);
            showSnackbar('Path copied to clipboard!', 'success');
          },
        },
        {
          // Open Terminal Here (for folders only)
          label: 'Open Terminal Here',
          icon: <TerminalIcon fontSize="small" />,
          action: (file) =>
            showSnackbar(`Open Terminal in ${file.path} feature coming soon.`, 'info'),
          disabled: true,
        },
        { type: 'divider' },
        {
          // Delete
          label: `Delete ${isFile ? 'File' : 'Folder'}...`,
          icon: <DeleteIcon fontSize="small" />,
          action: () => showSnackbar('Delete feature coming soon. Requires backend API.', 'info'),
          disabled: true,
          className: '!text-red-500 hover:!bg-red-900/50', // Tailwind class for red text
        },
      ];

      return items;
    },
    [showSnackbar],
  );

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: FileEntry) => {
      event.preventDefault();
      event.stopPropagation();

      showFileTreeContextMenu(
        true,
        event.clientX,
        event.clientY,
        renderContextMenuItems(node),
        node,
      );
    },
    [renderContextMenuItems],
  );

  return (
    <Paper
      elevation={3}
      sx={{
        height: '100%',
        overflowY: 'auto',
        p: 2,
        bgcolor: theme.palette.background.paper,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid',
        borderColor: theme.palette.divider,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            color: theme.palette.text.primary,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <FolderOpenIcon sx={{ mr: 1 }} /> Project Files
        </Typography>
        <IconButton
          onClick={handleRefreshTree}
          disabled={isFetchingTree || !projectRoot}
          size="small"
          sx={{ color: theme.palette.text.secondary }}
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>

      {isFetchingTree ? (
        <Box className="flex justify-center items-center flex-grow">
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ ml: 2, color: theme.palette.text.secondary }}>
            Loading files...
          </Typography>
        </Box>
      ) : fetchTreeError ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {fetchTreeError}
        </Alert>
      ) : treeFiles.length === 0 && projectRoot ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No files found for project root: {projectRoot}. Check path.
        </Alert>
      ) : (
        <Box className="flex-grow h-full">
          {treeFiles.map((entry) => (
            <FileTreeItem
              key={entry.path}
              fileEntry={entry}
              projectRoot={projectRoot}
              onContextMenu={handleNodeContextMenu}
            />
          ))}
        </Box>
      )}

      <FileTreeContextMenuRenderer
        setSnackbarMessage={setSnackbarMessage}
        setSnackbarSeverity={setSnackbarSeverity}
        setSnackbarOpen={setSnackbarOpen}
      />
      <CustomSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={handleSnackbarClose}
      />
    </Paper>
  );
};

export default FileTree;
