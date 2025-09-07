import React, { useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import FolderOpenIcon from '@mui/icons-material/FolderOpenOutlined';
import { useStore } from '@nanostores/react';
import { fileTreeStore, fetchInitialFiles } from '@/stores/fileTreeStore'; // Updated import to fetchInitialFiles
import { aiEditorStore, setOpenedFile } from '@/stores/aiEditorStore';
import { FileTreeItem } from '@/components/file-tree';

interface FileBrowserDialogProps {
  open: boolean;
  onClose: () => void;
}

const FileBrowserDialog: React.FC<FileBrowserDialogProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const { files: treeFiles, isFetchingTree, fetchTreeError } = useStore(fileTreeStore);
  const { currentProjectPath, scanPathsInput } = useStore(aiEditorStore);

  const parsedScanPaths = scanPathsInput
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const handleFetchFiles = useCallback(() => {
    if (currentProjectPath) {
      fetchInitialFiles(currentProjectPath, parsedScanPaths); // Updated to fetchInitialFiles
    }
  }, [currentProjectPath, parsedScanPaths]);

  useEffect(() => {
    if (open) {
      handleFetchFiles();
    }
  }, [open, handleFetchFiles]);

  const handleFileSelect = useCallback(
    (filePath: string) => {
      setOpenedFile(filePath);
      onClose();
    },
    [onClose],
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
          <FolderOpenIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Browse Project Files
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: theme.palette.text.secondary }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        {!currentProjectPath ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Please set a Project Root Path in the editor to browse files.
          </Alert>
        ) : (
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              bgcolor: theme.palette.background.default,
              minHeight: 200,
              maxHeight: '70vh',
            }}
          >
            {isFetchingTree ? (
              <Box className="flex justify-center items-center h-full">
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ ml: 2, color: theme.palette.text.secondary }}>
                  Loading files...
                </Typography>
              </Box>
            ) : fetchTreeError ? (
              <Alert severity="error" sx={{ m: 2 }}>
                {fetchTreeError}
              </Alert>
            ) : treeFiles.length === 0 ? (
              <Alert severity="info" sx={{ m: 2 }}>
                No files found for project root: {currentProjectPath}. Check path and scan paths.
              </Alert>
            ) : (
              <Box sx={{ p: 1 }}>
                {treeFiles.map((entry) => (
                  <FileTreeItem
                    key={entry.filePath}
                    fileEntry={entry}
                    projectRoot={currentProjectPath}
                    onFileClick={handleFileSelect}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          p: 2,
          justifyContent: 'space-between',
        }}
      >
        <IconButton
          onClick={handleFetchFiles}
          disabled={isFetchingTree || !currentProjectPath}
          size="small"
          sx={{ color: theme.palette.text.secondary }}
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
        <Button onClick={onClose} sx={{ color: theme.palette.text.secondary }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileBrowserDialog;
