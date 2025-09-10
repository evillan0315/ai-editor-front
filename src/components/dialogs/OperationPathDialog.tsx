import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  IconButton,
  useTheme,
  Box,
  CircularProgress,
  Alert,
  InputAdornment, // Added InputAdornment import
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FolderOpenIcon from '@mui/icons-material/FolderOpenOutlined';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import * as path from 'path-browserify';

import DirectoryPickerDialog from './DirectoryPickerDialog'; // Reuse existing picker
import { FileEntry, CopyResult, MoveResult } from '@/types';
import { copyFile as apiCopyFile, moveFile as apiMoveFile } from '@/api/file';

interface OperationPathDialogProps {
  open: boolean;
  onClose: () => void;
  item: FileEntry | null; // The file/folder being copied or moved
  mode: 'copy' | 'move';
  onOperationSuccess: (sourcePath: string, destinationPath: string) => void;
  snackbar: {
    show: (message: string, severity: 'success' | 'error' | 'info') => void;
  };
  projectRoot: string; // Needed for DirectoryPickerDialog initial path
}

const OperationPathDialog: React.FC<OperationPathDialogProps> = ({
  open,
  onClose,
  item,
  mode,
  onOperationSuccess,
  snackbar,
  projectRoot,
}) => {
  const theme = useTheme();
  const [destinationPath, setDestinationPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPickerDialogOpen, setIsPickerDialogOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setDestinationPath('');
      setError(null);
      setLoading(false);
    }
  }, [open, item]);

  const handleSelectDestination = useCallback((selectedPath: string) => {
    setDestinationPath(selectedPath);
    setIsPickerDialogOpen(false);
  }, []);

  const handleSubmit = async () => {
    if (!item) return;

    const trimmedDestinationPath = destinationPath.trim();
    if (!trimmedDestinationPath) {
      setError('Destination path cannot be empty.');
      return;
    }

    setLoading(true);
    setError(null);

    const sourcePath = item.path;
    let finalDestinationPath = trimmedDestinationPath;

    // If the destination is a directory, append the item's current name to the path
    // (Backend APIs for copy/move expect the *full new path including the item's name*)
    // However, the backend's `move` and `copy` functions internally handle if the destination
    // is an existing directory. `fs-extra.move` and `fs-extra.copy` expect the target path *including*
    // the new file/folder name. If `destinationPath` points to an existing directory and
    // `sourcePath` is a file/folder, it will attempt to move/copy *into* that directory.
    // To be explicit, let's assume `trimmedDestinationPath` is always the *final* desired path
    // including the new name. The backend will handle if the final path is a directory (e.g. `mv file.txt dir/`).
    // Let's refine this, if the user picks a folder, we generally want to put the item *inside* it.
    // If they type a full new file path, then use that.

    // Simplified approach: if it ends with '/', assume it's a directory and append item.name
    if (trimmedDestinationPath.endsWith('/') || trimmedDestinationPath === '') {
      finalDestinationPath = path.join(trimmedDestinationPath, item.name);
    } else {
      // Check if the input path refers to an existing directory before deciding to append name
      // This would require an additional API call to check if path is a directory.
      // For now, simplify and assume if it doesn't end with a slash, it's a specific target file/folder name.
      finalDestinationPath = trimmedDestinationPath;
    }
    // Ensure it's absolute if current input is relative
    if (!path.isAbsolute(finalDestinationPath)) {
      finalDestinationPath = path.join(projectRoot, finalDestinationPath);
    }

    try {
      let result: CopyResult | MoveResult;
      if (mode === 'copy') {
        result = await apiCopyFile(sourcePath, finalDestinationPath);
      } else {
        result = await apiMoveFile(sourcePath, finalDestinationPath);
      }

      if (result.success) {
        snackbar.show(result.message, 'success');
        onOperationSuccess(sourcePath, finalDestinationPath); // Trigger tree refresh
        onClose();
      } else {
        setError(result.message || `Failed to ${mode}.`);
        snackbar.show(result.message || `Failed to ${mode}.`, 'error');
      }
    } catch (err: any) {
      setError(`Failed to ${mode}: ${err.message || String(err)}`);
      snackbar.show(`Error ${mode}: ${err.message || String(err)}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
            {mode === 'copy' ? 'Copy' : 'Move'} "{item?.name}"
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
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {item && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Source Path: <strong>{item.path}</strong>
            </Typography>
          )}
          <TextField
            autoFocus
            margin="dense"
            id="destinationPath"
            label={`Destination Path for ${item?.type === 'folder' ? 'Folder' : 'File'} "${item?.name}"`}
            type="text"
            fullWidth
            variant="outlined"
            value={destinationPath}
            onChange={(e) => setDestinationPath(e.target.value)}
            disabled={loading}
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              style: { color: theme.palette.text.primary },
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Browse for Destination Folder">
                    <span>
                      <IconButton
                        onClick={() => setIsPickerDialogOpen(true)}
                        disabled={loading}
                        color="primary"
                        size="small"
                      >
                        <FolderOpenIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
            placeholder="e.g., /path/to/new/location or new_folder/new_file.txt"
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: 'block' }}
          >
            If the destination path ends with a slash (e.g., `/new_folder/`),
            the item will be placed inside that folder. Otherwise, the path will
            be used as the new item's name and location.
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            p: 2,
            justifyContent: 'flex-end',
          }}
        >
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            color="primary"
            variant="contained"
            disabled={loading || !destinationPath.trim()}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {mode === 'copy' ? 'Copy' : 'Move'}
          </Button>
        </DialogActions>
      </Dialog>

      <DirectoryPickerDialog
        open={isPickerDialogOpen}
        onClose={() => setIsPickerDialogOpen(false)}
        onSelect={handleSelectDestination}
        initialPath={projectRoot} // Start directory picker at project root
      />
    </>
  );
};

export default OperationPathDialog;
