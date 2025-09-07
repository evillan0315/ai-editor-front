import React, { useState, useEffect, useRef } from 'react';
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
import FolderIcon from '@mui/icons-material/FolderOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { useStore } from '@nanostores/react';
import { fileTreeStore, fetchInitialFiles } from '@/stores/fileTreeStore'; // Updated import to fetchInitialFiles
import { aiEditorStore } from '@/stores/aiEditorStore';
import { FileEntry } from '@/types/fileTree';
import * as path from 'path-browserify';

interface FilePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (selectedRelativePaths: string[]) => void;
  currentScanPaths: string[];
}

const getFileIcon = (fileType: 'file' | 'directory') => {
  return fileType === 'directory' ? (
    <FolderIcon color="action" />
  ) : (
    <InsertDriveFileOutlinedIcon color="action" />
  );
};

const FilePickerDialog: React.FC<FilePickerDialogProps> = ({
  open,
  onClose,
  onSelect,
  currentScanPaths,
}) => {
  const { flatFileList, isFetchingTree, fetchTreeError } = useStore(fileTreeStore);
  const { currentProjectPath, scanPathsInput } = useStore(aiEditorStore);
  const theme = useTheme();
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Ref to ensure selectedPaths are initialized only once when the dialog opens
  const initialSelectionDone = useRef(false);

  useEffect(() => {
    if (open && currentProjectPath) {
      const parsedScanPaths = scanPathsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      fetchInitialFiles(currentProjectPath, parsedScanPaths); // Updated to fetchInitialFiles
    }
  }, [open, currentProjectPath, scanPathsInput]);

  // Effect for initializing selectedPaths and resetting on close
  useEffect(() => {
    if (open) {
      if (!initialSelectionDone.current) {
        // Only initialize if the dialog just opened for this session
        setSelectedPaths(new Set(currentScanPaths));
        initialSelectionDone.current = true;
      }
    } else {
      // Dialog is closed or `open` is false, reset state
      if (initialSelectionDone.current) {
        setSelectedPaths(new Set());
        setSearchTerm('');
        initialSelectionDone.current = false;
      }
    }
    // Only 'open' is a dependency. `currentScanPaths` is read during the 'open' transition,
    // but not explicitly a dependency that would trigger re-runs *while* open.
  }, [open]);

  const handleTogglePath = (fullPath: string) => {
    setSelectedPaths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fullPath)) {
        newSet.delete(fullPath);
      } else {
        newSet.add(fullPath);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allFilteredPaths = filteredFiles.map((file) => file.relativePath);
    setSelectedPaths(new Set(allFilteredPaths));
  };

  const handleDeselectAll = () => {
    setSelectedPaths(new Set());
  };

  const handleConfirm = () => {
    onSelect(Array.from(selectedPaths));
    onClose();
  };

  // Filter and map files to relative paths
  const filesAsRelativePaths = React.useMemo(() => {
    if (!currentProjectPath) return [];
    const normalizedProjectRoot = currentProjectPath.replace(/\\/g, '/');
    return flatFileList
      .map((entry) => {
        const fullPath = entry.filePath.replace(/\\/g, '/');
        return fullPath.startsWith(normalizedProjectRoot + '/')
          ? fullPath.substring(normalizedProjectRoot.length + 1)
          : fullPath === normalizedProjectRoot
            ? '.'
            : fullPath; // Fallback for outside project or root itself
      })
      .filter((entry) => entry.relativePath !== '.' || entry.type === 'directory'); // Exclude root file item itself if it's a file
  }, [flatFileList, currentProjectPath]);

  const filteredFiles = React.useMemo(() => {
    if (!searchTerm) return filesAsRelativePaths;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return filesAsRelativePaths.filter(
      (file) =>
        file.relativePath.toLowerCase().includes(lowerCaseSearchTerm) ||
        file.filePath.toLowerCase().includes(lowerCaseSearchTerm),
    );
  }, [filesAsRelativePaths, searchTerm]);

  const sortedFiles = React.useMemo(() => {
    return [...filteredFiles].sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      return a.relativePath.localeCompare(b.relativePath);
    });
  }, [filteredFiles]);

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
                key={fileEntry.filePath}
                secondaryAction={
                  <Checkbox
                    edge="end"
                    checked={selectedPaths.has(fileEntry.relativePath)}
                    onChange={() => handleTogglePath(fileEntry.relativePath)}
                    inputProps={{
                      'aria-labelledby': `checkbox-list-label-${fileEntry.filePath}`,
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
                <ListItemIcon>{getFileIcon(fileEntry.type)}</ListItemIcon>
                <ListItemText
                  id={`checkbox-list-label-${fileEntry.filePath}`}
                  primary={fileEntry.relativePath}
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
