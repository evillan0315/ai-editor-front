import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  FormControlLabel,
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
import { FileEntry } from '@/types/fileTree'; // Import FileEntry
import { getFileTypeIcon } from '@/constants/fileIcons'; // Import the new utility

interface FilePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (selectedRelativePaths: string[]) => void;
  currentScanPaths: string[];
}

// Helper to flatten the hierarchical FileEntry array
const flattenTree = (nodes: FileEntry[]): FileEntry[] => {
  let flat: FileEntry[] = [];
  nodes.forEach((node) => {
    // Exclude the root folder itself if its relative path is just '.'
    // But include it if it's a folder in the tree, allowing users to explicitly select the project root.
    // For scan paths, '.' might be valid, so let's keep it generally, and rely on the filter below if specific exclusion is needed.
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
}) => {
  const {
    files: treeFiles,
    isFetchingTree,
    fetchTreeError,
    lastFetchedProjectRoot,
  } = useStore(fileTreeStore); // Use 'files' (the tree)
  const { currentProjectPath } = useStore(aiEditorStore); // Use currentProjectPath to derive relative paths if needed, though FileEntry should have it now
  const theme = useTheme();
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Load initial tree if dialog opens and project root is set but not yet loaded in fileTreeStore
    if (open && currentProjectPath && !lastFetchedProjectRoot) {
      loadInitialTree(currentProjectPath);
    }
  }, [open, currentProjectPath, lastFetchedProjectRoot]);

  useEffect(() => {
    // Initialize selected paths when dialog opens based on currentScanPaths
    if (open) {
      setSelectedPaths(new Set(currentScanPaths));
    }
    // Clear selection when dialog closes
    if (!open) {
      setSelectedPaths(new Set());
      setSearchTerm('');
    }
  }, [open, currentScanPaths]);

  const handleTogglePath = useCallback((relativePath: string) => {
    setSelectedPaths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(relativePath)) {
        newSet.delete(relativePath);
      } else {
        newSet.add(relativePath);
      }
      return newSet;
    });
  }, []);

  // Flatten the entire tree whenever `treeFiles` changes
  const allFilesAndFolders = useMemo(() => {
    return flattenTree(treeFiles);
  }, [treeFiles]);

  const filteredFiles = useMemo(() => {
    if (!searchTerm) return allFilesAndFolders;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return allFilesAndFolders.filter(
      (file) =>
        file.path.toLowerCase().includes(lowerCaseSearchTerm) ||
        file.name.toLowerCase().includes(lowerCaseSearchTerm), // Also search by name
    );
  }, [allFilesAndFolders, searchTerm]);

  const sortedFiles = useMemo(() => {
    return [...filteredFiles].sort((a, b) => {
      // Sort folders first, then files, alphabetically by relative path
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.path.localeCompare(b.path);
    });
  }, [filteredFiles]);

  const handleSelectAll = useCallback(() => {
    const allFilteredPaths = sortedFiles.map((file) => file.path); // Use path for selection consistency
    setSelectedPaths(new Set(allFilteredPaths));
  }, [sortedFiles]);

  const handleDeselectAll = useCallback(() => {
    setSelectedPaths(new Set());
  }, []);

  const handleConfirm = useCallback(() => {
    onSelect(Array.from(selectedPaths));
    onClose();
  }, [onSelect, onClose, selectedPaths]);

  const currentProjectRootLabel = currentProjectPath
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
        <IconButton onClick={onClose} size="small" sx={{ color: theme.palette.text.secondary }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {currentProjectRootLabel}
        </Typography>
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
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
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
            <Typography variant="body2" sx={{ ml: 2, color: theme.palette.text.secondary }}>
              Loading files...
            </Typography>
          </Box>
        ) : fetchTreeError ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {fetchTreeError}
          </Alert>
        ) : filteredFiles.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            {searchTerm ? 'No matching files found.' : 'No files available in the project root.'}
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
            {sortedFiles.map((fileEntry) => (
              <ListItem
                key={fileEntry.path} // Use absolute path as key for uniqueness
                secondaryAction={
                  <Checkbox
                    edge="end"
                    checked={selectedPaths.has(fileEntry.path)}
                    onChange={() => handleTogglePath(fileEntry.path)}
                    inputProps={{
                      'aria-labelledby': `checkbox-list-label-${fileEntry.path}`,
                    }}
                    sx={{ color: theme.palette.primary.main }}
                  />
                }
                sx={{
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                  },
                }}
              >
                <ListItemIcon>{getFileTypeIcon(fileEntry.name, fileEntry.type)}</ListItemIcon>
                <ListItemText
                  id={`checkbox-list-label-${fileEntry.path}`}
                  primary={fileEntry.path}
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
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          Selected: {selectedPaths.size}
        </Typography>
        <Box>
          <Button onClick={onClose} sx={{ mr: 1, color: theme.palette.text.secondary }}>
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
