import React, { useState, useEffect, useMemo } from 'react';
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
  CircularProgress,
  Alert,
  InputAdornment, // Added InputAdornment import
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import * as path from 'path-browserify';
import { FileEntry, RenameResult } from '@/types'; // Fixed import
import { renameFile as apiRenameFile } from '@/api/file';

interface RenameDialogProps {
  open: boolean;
  onClose: () => void;
  item: FileEntry | null; // The file/folder being renamed
  onRenameSuccess: (oldPath: string, newPath: string) => void;
  snackbar: {
    show: (message: string, severity: 'success' | 'error' | 'info') => void;
  };
}

const RenameDialog: React.FC<RenameDialogProps> = ({
  open,
  onClose,
  item,
  onRenameSuccess,
  snackbar,
}) => {
  const theme = useTheme();
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentParentPath = useMemo(() => {
    if (!item) return '';
    return item.isDirectory ? path.dirname(item.path) : path.dirname(item.path);
  }, [item]);

  useEffect(() => {
    if (open && item) {
      setNewName(item.name);
      setError(null);
      setLoading(false);
    } else if (!open) {
      setNewName(''); // Clear input when closing
    }
  }, [open, item]);

  const handleSubmit = async () => {
    if (!item) return;

    const trimmedNewName = newName.trim();
    if (!trimmedNewName) {
      setError('New name cannot be empty.');
      return;
    }
    if (trimmedNewName === item.name) {
      snackbar.show('No change detected. Renaming cancelled.', 'info');
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    const oldPath = item.path;
    const newPath = path.join(currentParentPath, trimmedNewName);

    try {
      const result: RenameResult = await apiRenameFile(oldPath, newPath);
      if (result.success) {
        snackbar.show(result.message, 'success');
        onRenameSuccess(oldPath, newPath); // Trigger tree refresh
        onClose();
      } else {
        setError(result.message || 'Failed to rename.');
        snackbar.show(result.message || 'Failed to rename.', 'error');
      }
    } catch (err: any) {
      setError(`Failed to rename: ${err.message || String(err)}`);
      snackbar.show(`Error renaming: ${err.message || String(err)}`, 'error');
    } finally {
      setLoading(false);
    }
  };

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
          Rename {item?.type === 'folder' ? 'Folder' : 'File'}
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
            Current Path: <strong>{item.path}</strong>
          </Typography>
        )}
        <TextField
          autoFocus
          margin="dense"
          id="newName"
          label={`New ${item?.type === 'folder' ? 'Folder' : 'File'} Name`}
          type="text"
          fullWidth
          variant="outlined"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          disabled={loading}
          sx={{ mt: 2 }}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            style: { color: theme.palette.text.primary },
            startAdornment: (
              <InputAdornment position="start">
                {item?.type === 'folder' ? (
                  <FolderIcon sx={{ color: theme.palette.warning.main }} />
                ) : (
                  <InsertDriveFileIcon
                    sx={{ color: theme.palette.info.main }}
                  />
                )}
              </InputAdornment>
            ),
          }}
        />
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
          disabled={loading || !newName.trim()}
          startIcon={loading && <CircularProgress size={20} />}
        >
          Rename
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RenameDialog;
