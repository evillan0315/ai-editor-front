import React, { useEffect, useState, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  useTheme,
  Chip, // New: Import Chip for dirty file indicator
} from '@mui/material';
import FileTreeItem from './FileTreeItem';
import {
  fileTreeStore,
  loadInitialTree,
  clearFileTree,
  loadChildrenForDirectory, // New: Import for refreshing a directory
  setSelectedFile,
} from '@/stores/fileTreeStore';
import { aiEditorStore, showGlobalSnackbar } from '@/stores/aiEditorStore';
import { FileEntry } from '@/types/refactored/fileTree'; // Fixed import
import { ContextMenuItem } from '@/types';
import {
  showFileTreeContextMenu,
  hideFileTreeContextMenu,
} from '@/stores/contextMenuStore';
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
import {
  CreateFileOrFolderDialog,
  RenameDialog, // New: Import RenameDialog
  OperationPathDialog, // New: Import OperationPathDialog
} from '@/components/dialogs'; // New: Import dialogs
import { deleteFile as apiDeleteFile } from '@/api/file'; // New: Import deleteFile API
import * as path from 'path-browserify'; // Import path-browserify

interface FileTreeProps {
  projectRoot: string;
}

const FileTree: React.FC<FileTreeProps> = ({ projectRoot }) => {
  const {
    files: treeFiles,
    isFetchingTree,
    fetchTreeError,
  } = useStore(fileTreeStore);
  const { scanPathsInput } = useStore(aiEditorStore);
  const theme = useTheme();

  // State for create file/folder dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false); // True for folder, false for file
  const [pathForNewItem, setPathForNewItem] = useState(''); // The parent path for the new item

  // States for rename dialog
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<FileEntry | null>(null);

  // States for copy/move dialog
  const [isOperationPathDialogOpen, setIsOperationPathDialogOpen] =
    useState(false);
  const [itemForOperation, setItemForOperation] = useState<FileEntry | null>(
    null,
  );
  const [operationMode, setOperationMode] = useState<'copy' | 'move'>('copy');

  useEffect(() => {
    if (projectRoot) {
      loadInitialTree(projectRoot);
    }
    return () => {
      clearFileTree();
    };
  }, [projectRoot]);

  // Helper to refresh a directory based on its path
  const refreshPath = useCallback(
    async (targetPath: string) => {
      // Determine if the targetPath is a file or a folder.
      // For operations on files (delete, rename), refresh its parent.
      // For operations on folders, refresh the folder itself (to show new children if any)
      // or its parent.
      const parentDir = path.dirname(targetPath);
      const isRoot = parentDir === targetPath; // If dirname returns same path, it's likely a root or drive letter
      const pathToRefresh = isRoot ? targetPath : parentDir;

      if (pathToRefresh) {
        await loadChildrenForDirectory(pathToRefresh);
      } else if (projectRoot) {
        // Fallback to refresh project root if no specific parent
        await loadInitialTree(projectRoot);
      }
    },
    [projectRoot],
  );

  const handleRefreshTree = () => {
    if (projectRoot) {
      loadInitialTree(projectRoot);
      showGlobalSnackbar('File tree refreshed.', 'info'); // Use global snackbar
    }
  };

  const handleCreateSuccess = useCallback(
    (newPath: string) => {
      const parentDir = path.dirname(newPath);
      refreshPath(parentDir); // Refresh the parent directory of the new item
      showGlobalSnackbar(
        `${isCreatingFolder ? 'Folder' : 'File'} created successfully at ${newPath}`,
        'success',
      ); // Use global snackbar
    },
    [isCreatingFolder, refreshPath],
  );

  const handleDeleteItem = useCallback(
    async (node: FileEntry) => {
      if (
        window.confirm(
          `Are you sure you want to delete ${node.name}? This action cannot be undone.`,
        )
      ) {
        try {
          const result = await apiDeleteFile(node.path);
          if (result.success) {
            showGlobalSnackbar(result.message, 'success'); // Use global snackbar
            // After deletion, refresh the parent directory
            refreshPath(node.path);
          } else {
            showGlobalSnackbar(result.message || 'Failed to delete.', 'error'); // Use global snackbar
          }
        } catch (err: any) {
          showGlobalSnackbar(
            `Error deleting: ${err.message || String(err)}`,
            'error',
          ); // Use global snackbar
        }
      }
    },
    [refreshPath],
  );

  const handleRenameSuccess = useCallback(
    (oldPath: string, newPath: string) => {
      // Refresh old parent directory (in case path changes significantly, e.g. move-rename)
      refreshPath(oldPath);
      // Refresh new parent directory
      refreshPath(newPath);
      showGlobalSnackbar('Item renamed successfully!', 'success');
    },
    [refreshPath],
  );

  const handleOperationSuccess = useCallback(
    (sourcePath: string, destinationPath: string) => {
      // For move, refresh both source's parent and destination's parent
      if (operationMode === 'move') {
        refreshPath(sourcePath); // Refresh old parent
      }
      refreshPath(destinationPath); // Refresh new parent/destination folder
      showGlobalSnackbar(
        `${operationMode === 'copy' ? 'Copied' : 'Moved'} successfully!`,
        'success',
      );
    },
    [operationMode, refreshPath],
  );

  const renderContextMenuItems = useCallback(
    (node: FileEntry): ContextMenuItem[] => {
      const isFile = node.type === 'file';
      const parentPath = path.dirname(node.path); // Always get the immediate parent

      const items: ContextMenuItem[] = [
        // Open File / Open Folder
        {
          label: isFile ? 'Open File' : 'Open Folder',
          icon: <OpenInNewIcon fontSize="small" />,
          action: (file) => {
            if (file.type === 'file') {
              setSelectedFile(file.path);
              showGlobalSnackbar(`Opening file: ${file.name}`, 'info'); // Use global snackbar
            } else {
              // For folders, just expand/collapse in tree and show info
              showGlobalSnackbar(`Folder selected: ${file.name}`, 'info'); // Use global snackbar
            }
          },
        },
        { type: 'divider' },
        {
          // New File
          label: 'New File...',
          icon: <NoteAddIcon fontSize="small" />,
          action: (file) => {
            const targetPath = file.type === 'folder' ? file.path : parentPath;
            setPathForNewItem(targetPath);
            setIsCreatingFolder(false);
            setIsCreateDialogOpen(true);
          },
        },
        {
          // New Folder
          label: 'New Folder...',
          icon: <CreateNewFolderIcon fontSize="small" />,
          action: (file) => {
            const targetPath = file.type === 'folder' ? file.path : parentPath;
            setPathForNewItem(targetPath);
            setIsCreatingFolder(true);
            setIsCreateDialogOpen(true);
          },
        },
        { type: 'divider' },
        {
          // Rename
          label: 'Rename...',
          icon: <EditIcon fontSize="small" />,
          action: (file) => {
            setItemToRename(file);
            setIsRenameDialogOpen(true);
          },
        },
        {
          // Copy
          label: 'Copy...',
          icon: <FileCopyIcon fontSize="small" />,
          action: (file) => {
            setItemForOperation(file);
            setOperationMode('copy');
            setIsOperationPathDialogOpen(true);
          },
        },
        {
          // Move
          label: 'Move...',
          icon: <DriveFileMoveIcon fontSize="small" />,
          action: (file) => {
            setItemForOperation(file);
            setOperationMode('move');
            setIsOperationPathDialogOpen(true);
          },
        },
        { type: 'divider' },
        {
          // Copy Path
          label: 'Copy Path',
          icon: <ContentCopyIcon fontSize="small" />,
          action: (file) => {
            navigator.clipboard.writeText(file.path);
            showGlobalSnackbar('Path copied to clipboard!', 'success'); // Use global snackbar
          },
        },
        {
          // Open Terminal Here (for folders only)
          label: 'Open Terminal Here',
          icon: <TerminalIcon fontSize="small" />,
          action: (file) =>
            showGlobalSnackbar(
              `Open Terminal in ${file.path} feature coming soon.`,
              'info',
            ), // Use global snackbar
          disabled: true,
        },
        { type: 'divider' },
        {
          // Delete
          label: `Delete ${isFile ? 'File' : 'Folder'}...`,
          icon: <DeleteIcon fontSize="small" />,
          action: handleDeleteItem,
          className: '!text-red-500 hover:!bg-red-900/50', // Tailwind class for red text
        },
      ];

      return items;
    },
    [handleDeleteItem],
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
          <Typography
            variant="body2"
            sx={{ ml: 2, color: theme.palette.text.secondary }}
          >
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

      <FileTreeContextMenuRenderer />

      <CreateFileOrFolderDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        parentPath={pathForNewItem}
        isFolder={isCreatingFolder}
        onCreateSuccess={handleCreateSuccess}
      />

      {/* New: Rename Dialog */}
      <RenameDialog
        open={isRenameDialogOpen}
        onClose={() => setIsRenameDialogOpen(false)}
        item={itemToRename}
        onRenameSuccess={handleRenameSuccess}
        snackbar={{ show: showGlobalSnackbar }} // Pass global snackbar
      />

      {/* New: Copy/Move Operation Path Dialog */}
      <OperationPathDialog
        open={isOperationPathDialogOpen}
        onClose={() => setIsOperationPathDialogOpen(false)}
        item={itemForOperation}
        mode={operationMode}
        onOperationSuccess={handleOperationSuccess}
        snackbar={{ show: showGlobalSnackbar }} // Pass global snackbar
        projectRoot={projectRoot}
      />
    </Paper>
  );
};

export default FileTree;
