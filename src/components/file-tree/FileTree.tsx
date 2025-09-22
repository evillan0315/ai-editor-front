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
  TextField, // Import TextField for the search component
} from '@mui/material';
import FileTreeItem from './FileTreeItem';
import {
  fileTreeStore,
  loadInitialTree,
  clearFileTree,
  loadChildrenForDirectory,
  setSelectedFile,
  projectRootDirectoryStore,
} from '@/stores/fileTreeStore';
import { llmStore, showGlobalSnackbar } from '@/stores/llmStore';

import { ContextMenuItem, FileEntry } from '@/types';
import { showFileTreeContextMenu } from '@/stores/contextMenuStore';
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
  ArrowUpward as ArrowUpwardIcon, // Icon for going up a directory
} from '@mui/icons-material';
import { FileTreeContextMenuRenderer } from './FileTreeContextMenuRenderer';
import {
  CreateFileOrFolderDialog,
  RenameDialog,
  OperationPathDialog,
} from '@/components/dialogs';
import { deleteFile as apiDeleteFile } from '@/api/file';
import * as path from 'path-browserify';
import {
  isTerminalVisible,
  setShowTerminal,
  connectTerminal,
} from '@/stores/terminalStore';

interface FileTreeProps {
  //projectRoot?: string;
}

const FileTree: React.FC<FileTreeProps> = () => {
  const { files: treeFiles, isFetchingTree, fetchTreeError } = useStore(
    fileTreeStore,
  );
  const { scanPathsInput } = useStore(llmStore);
  const projectRoot = useStore(projectRootDirectoryStore);
  const showTerminal = useStore(isTerminalVisible);
  const theme = useTheme();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [pathForNewItem, setPathForNewItem] = useState('');

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<FileEntry | null>(null);

  const [isOperationPathDialogOpen, setIsOperationPathDialogOpen] = useState(
    false,
  );
  const [itemForOperation, setItemForOperation] = useState<FileEntry | null>(
    null,
  );
  const [operationMode, setOperationMode] = useState<'copy' | 'move'>('copy');
  const [terminalDialogOpen, setTerminalDialogOpen] = useState(false);

  // State for search
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (projectRoot) {
      loadInitialTree(projectRoot);
    }
    return () => {
      clearFileTree();
    };
  }, [projectRoot]);

  const refreshPath = useCallback(
    async (targetPath: string) => {
      const parentDir = path.dirname(targetPath);
      const isRoot = parentDir === targetPath;
      const pathToRefresh = isRoot ? targetPath : parentDir;

      if (pathToRefresh) {
        await loadChildrenForDirectory(pathToRefresh);
      } else if (projectRoot) {
        await loadInitialTree(projectRoot);
      }
    },
    [projectRoot],
  );

  const handleRefreshTree = () => {
    if (projectRoot) {
      loadInitialTree(projectRoot);
      showGlobalSnackbar('File tree refreshed.', 'info');
    }
  };

  const handleCreateSuccess = useCallback(
    (newPath: string) => {
      const parentDir = path.dirname(newPath);
      refreshPath(parentDir);
      showGlobalSnackbar(
        `${isCreatingFolder ? 'Folder' : 'File'} created successfully at ${newPath}`,
        'success',
      );
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
            showGlobalSnackbar(result.message, 'success');
            refreshPath(node.path);
          } else {
            showGlobalSnackbar(result.message || 'Failed to delete.', 'error');
          }
        } catch (err: any) {
          showGlobalSnackbar(
            `Error deleting: ${err.message || String(err)}`,
            'error',
          );
        }
      }
    },
    [refreshPath],
  );

  const handleRenameSuccess = useCallback(
    (oldPath: string, newPath: string) => {
      refreshPath(oldPath);
      refreshPath(newPath);
      showGlobalSnackbar('Item renamed successfully!', 'success');
    },
    [refreshPath],
  );

  const handleOperationSuccess = useCallback(
    (sourcePath: string, destinationPath: string) => {
      if (operationMode === 'move') {
        refreshPath(sourcePath);
      }
      refreshPath(destinationPath);
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
      const parentPath = path.dirname(node.path);

      const items: ContextMenuItem[] = [
        {
          label: isFile ? 'Open File' : 'Open Folder',
          icon: <OpenInNewIcon fontSize="small" />,
          action: (file) => {
            if (file.type === 'file') {
              setSelectedFile(file.path);
              showGlobalSnackbar(`Opening file: ${file.name}`, 'info');
            } else {
              showGlobalSnackbar(`Folder selected: ${file.name}`, 'info');
            }
          },
        },
        { type: 'divider' },
        {
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
          label: 'Rename...',
          icon: <EditIcon fontSize="small" />,
          action: (file) => {
            setItemToRename(file);
            setIsRenameDialogOpen(true);
          },
        },
        {
          label: 'Copy...',
          icon: <FileCopyIcon fontSize="small" />,
          action: (file) => {
            setItemForOperation(file);
            setOperationMode('copy');
            setIsOperationPathDialogOpen(true);
          },
        },
        {
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
          label: 'Copy Path',
          icon: <ContentCopyIcon fontSize="small" />,
          action: (file) => {
            navigator.clipboard.writeText(file.path);
            showGlobalSnackbar('Path copied to clipboard!', 'success');
          },
        },
        {
          label: 'Open Terminal Here',
          icon: <TerminalIcon fontSize="small" />,
          action: (file) => {
            if (file.type === 'folder') {
              projectRootDirectoryStore.set(file.path);
              setShowTerminal(true);
              connectTerminal();
            }
          },
          disabled: isFile,
        },
        { type: 'divider' },
        {
          label: `Delete ${isFile ? 'File' : 'Folder'}...`,
          icon: <DeleteIcon fontSize="small" />,
          action: handleDeleteItem,
          className: '!text-red-500 hover:!bg-red-900/50',
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

  // Function to handle search term changes
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    // Implement your search logic here.  Consider filtering the `treeFiles`
    // and updating the display accordingly.  Since `treeFiles` is a nanostore,
    // you'll need to manage a separate state for the filtered results.
    // For example, update the `fileTreeStore` with the search results.
  };

  // Function to handle going up a directory
  const handleGoUpDirectory = () => {
    if (projectRoot) {
      const parentDir = path.dirname(projectRoot);
      projectRootDirectoryStore.set(parentDir);
      loadInitialTree(parentDir);
    }
  };

  return (
    <Box

      sx={{
        height: '100%',
        overflowY: 'auto',
  
        display: 'flex',
        flexDirection: 'column',

      }}
    >
      {/* Sticky Header */}
      <Paper
        elevation={2}
        sx={{
          position: 'sticky',
          top: 0,
          left: 0,
          borderRadius: 0,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.divider}`,
          zIndex: 1, // Ensure it stays on top of the file list

          p: 0.6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box className="flex items-center gap-0">
          <IconButton
            onClick={handleGoUpDirectory}
            disabled={!projectRoot || projectRoot === '/'}
            size="small"
            sx={{ color: theme.palette.text.secondary, mr: 1 }}
          >
            <ArrowUpwardIcon fontSize="small" />
          </IconButton>

        </Box>
        <TextField
          size="small"
          placeholder="Search files..."
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ width: '100%', maxWidth: '70%', mr: 0.5, border: `1px solid ${theme.palette.background.paper}`, backgroundColor: theme.palette.background.paper, }} // Adjust width as needed
        />

        <Box className="flex items-center gap-0">
          <IconButton
            onClick={handleRefreshTree}
            disabled={isFetchingTree || !projectRoot}
            size="small"
            sx={{ color: theme.palette.text.secondary }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>
      </Paper>

      {/* File List */}
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

      <RenameDialog
        open={isRenameDialogOpen}
        onClose={() => setIsRenameDialogOpen(false)}
        item={itemToRename}
        onRenameSuccess={handleRenameSuccess}
        snackbar={{ show: showGlobalSnackbar }}
      />

      <OperationPathDialog
        open={isOperationPathDialogOpen}
        onClose={() => setIsOperationPathDialogOpen(false)}
        item={itemForOperation}
        mode={operationMode}
        onOperationSuccess={handleOperationSuccess}
        snackbar={{ show: showGlobalSnackbar }}
        projectRoot={projectRoot}
      />

      {/*<TerminalDialog
        open={terminalDialogOpen}
        onClose={() => setTerminalDialogOpen(false)}
        token={localStorage.getItem('token') || ''}
        initialCwd={terminalStore.get().currentPath}
      />*/}
    </Box>
  );
};

export default FileTree;
