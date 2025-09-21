import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Typography,
  TextField as MuiTextField,
  InputAdornment,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { useStore } from '@nanostores/react';
import { fileTreeStore, loadInitialTree } from '@/stores/fileTreeStore';
import { aiEditorStore } from '@/stores/aiEditorStore';
import { FileEntry } from '@/types';
import { getFileTypeIcon } from '@/constants/fileIcons';
import path from 'path';

interface FilePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (selectedPaths: string[]) => void;
  currentScanPaths: string[];
  allowExternalPaths?: boolean;
  initialRootPath?: string;
}

// Flatten hierarchical file tree
const flattenTree = (nodes: FileEntry[]): FileEntry[] => {
  let flat: FileEntry[] = [];
  nodes.forEach((node) => {
    flat.push(node);
    if (node.type === 'folder' && node.children) {
      flat = flat.concat(flattenTree(node.children));
    }
  });
  return flat;
};

const FilePickerDialog: React.FC<FilePickerDialogProps> = ({
  open,
  onClose,
  onSelect,
  currentScanPaths,
  allowExternalPaths,
  initialRootPath,
}) => {
  const {
    files: treeFiles,
    isFetchingTree,
    fetchTreeError,
    lastFetchedProjectRoot,
  } = useStore(fileTreeStore);

  const { currentProjectPath } = useStore(aiEditorStore);
  const theme = useTheme();

  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [currentDir, setCurrentDir] = useState(
    initialRootPath || currentProjectPath || '/',
  );

  // Load file tree if open
  useEffect(() => {
    if (open && currentDir && !lastFetchedProjectRoot) {
      loadInitialTree(currentDir);
    }
  }, [open, currentDir, lastFetchedProjectRoot]);

  useEffect(() => {
    if (open) setSelectedPaths(new Set(currentScanPaths));
    else {
      setSelectedPaths(new Set());
      setSearchTerm('');
    }
  }, [open, currentScanPaths]);

  const handleTogglePath = useCallback((filePath: string) => {
    setSelectedPaths((prev) => {
      const newSet = new Set(prev);
      newSet.has(filePath) ? newSet.delete(filePath) : newSet.add(filePath);
      return newSet;
    });
  }, []);

  const allFilesAndFolders = useMemo(() => flattenTree(treeFiles), [treeFiles]);

  const filteredFiles = useMemo(() => {
    if (!searchTerm) return allFilesAndFolders;
    const term = searchTerm.toLowerCase();
    return allFilesAndFolders.filter(
      (file) =>
        file.path.toLowerCase().includes(term) ||
        file.name.toLowerCase().includes(term),
    );
  }, [allFilesAndFolders, searchTerm]);

  const sortedFiles = useMemo(
    () =>
      [...filteredFiles].sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.path.localeCompare(b.path);
      }),
    [filteredFiles],
  );

  const handleSelectAll = useCallback(() => {
    setSelectedPaths(new Set(sortedFiles.map((f) => f.path)));
  }, [sortedFiles]);

  const handleDeselectAll = useCallback(() => setSelectedPaths(new Set()), []);

  const handleConfirm = useCallback(() => {
    onSelect(Array.from(selectedPaths));
    onClose();
  }, [onSelect, onClose, selectedPaths]);

  // Navigate up directory tree
  const handleNavigateUp = useCallback(() => {
    const parent = path.dirname(currentDir);
    if (
      allowExternalPaths ||
      parent.startsWith(initialRootPath || currentProjectPath || '/')
    ) {
      setCurrentDir(parent);
      loadInitialTree(parent);
    }
  }, [currentDir, allowExternalPaths, initialRootPath, currentProjectPath]);

  const currentRootLabel = allowExternalPaths
    ? `Browsing: ${currentDir}`
    : currentProjectPath
      ? `Relative to: ${currentProjectPath}`
      : 'No project root loaded';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pr: 1,
        }}
      >
        <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
          Select Files and Folders
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: theme.palette.text.secondary }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {currentRootLabel}
        </Typography>

        {allowExternalPaths && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            sx={{ mb: 2 }}
            onClick={handleNavigateUp}
          >
            Up One Directory
          </Button>
        )}

        <MuiTextField
          fullWidth
          variant="outlined"
          placeholder="Search files and folders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            sx: {
              color: theme.palette.text.primary,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.divider,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
              },
            },
          }}
          sx={{ mb: 2 }}
          size="small"
        />

        <Box
          sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}
        >
          <Button
            variant="outlined"
            size="small"
            onClick={handleSelectAll}
            disabled={isFetchingTree || !filteredFiles.length}
          >
            Select All
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleDeselectAll}
            disabled={isFetchingTree || !filteredFiles.length}
          >
            Deselect All
          </Button>
        </Box>

        {isFetchingTree ? (
          <Box className="flex justify-center items-center h-48">
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
        ) : filteredFiles.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            {searchTerm
              ? 'No matching files found.'
              : 'No files available in this directory.'}
          </Alert>
        ) : (
          <List
            dense
            sx={{
              maxHeight: '400px',
              overflowY: 'auto',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              bgcolor: theme.palette.background.default,
            }}
          >
            {sortedFiles.map((file) => (
              <ListItem
                key={file.path}
                secondaryAction={
                  <Checkbox
                    edge="end"
                    checked={selectedPaths.has(file.path)}
                    onChange={() => handleTogglePath(file.path)}
                    sx={{ color: theme.palette.primary.main }}
                  />
                }
                sx={{ '&:hover': { bgcolor: theme.palette.action.hover } }}
              >
                <ListItemIcon>
                  {getFileTypeIcon(file.name, file.type)}
                </ListItemIcon>
                <ListItemText
                  primary={file.path}
                  primaryTypographyProps={{
                    style: { color: theme.palette.text.primary },
                  }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          p: 2,
          justifyContent: 'space-between',
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary }}
        >
          Selected: {selectedPaths.size}
        </Typography>
        <Box>
          <Button
            onClick={onClose}
            sx={{ mr: 1, color: theme.palette.text.secondary }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="primary"
            disabled={selectedPaths.size === 0}
          >
            Add Selected
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default FilePickerDialog;
