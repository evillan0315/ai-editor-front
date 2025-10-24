import React, { useState, useEffect } from 'react';
import {
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { renameFile as apiRenameFile } from '@/api/file';
import { FileEntry } from '@/types/refactored/fileTree';
import * as path from 'path-browserify';
import { showDialog, hideDialog } from '@/stores/dialogStore';
import { showGlobalSnackbar } from '@/stores/snackbarStore';
import { projectStore } from '@/stores/projectStore'; 
import { useStore } from '@nanostores/react';

// -----------------------------------------------------------------------------
// Component for the content of the Rename Dialog
// -----------------------------------------------------------------------------
interface RenameContentProps {
  item: FileEntry | null; // The file or folder to rename
  onRenameSuccess: (oldPath: string, newPath: string) => void;
}

const RenameContent: React.FC<RenameContentProps> = ({ item, onRenameSuccess }) => {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const projectId = useStore(projectStore).currentProject?.id; // Get projectId from store

  useEffect(() => {
    if (item) {
      setNewName(item.name);
      setError('');
      setLoading(false);
    }
  }, [item]);

  const handleRename = async () => {
    if (!item) return;
    if (!newName.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    if (newName.trim() === item.name) {
      hideDialog(); // No change, just close
      return;
    }
    if (!projectId) {
      showGlobalSnackbar('No project selected. Cannot rename file/folder.', 'error');
      setError('No project selected. Cannot rename file/folder.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const parentDir = path.dirname(item.path);
      const newPath = path.join(parentDir, newName);
      const result = await apiRenameFile(item.path, newPath, projectId); 
      if (result.success) {
        onRenameSuccess(item.path, newPath);
        showGlobalSnackbar(result.message || 'Item renamed successfully!', 'success');
        hideDialog();
      } else {
        const errorMessage = result.message || 'Failed to rename item.';
        setError(errorMessage);
        showGlobalSnackbar(errorMessage, 'error');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred.';
      setError(errorMessage);
      showGlobalSnackbar(`Error renaming: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent sx={{ p: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {item && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Current Path: <strong>{item.path}</strong>
          </Typography>
        )}
        <TextField
          autoFocus
          margin="dense"
          label="New Name"
          type="text"
          fullWidth
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          error={!!error}
          helperText={error}
          sx={{ mb: 2 }}
        />
      <DialogActions sx={{ pt: 2, justifyContent: 'flex-end', borderTop: `1px solid`, borderColor: 'divider'}}>
        <Button onClick={hideDialog} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleRename} disabled={loading} variant="contained" color="primary">
          {loading ? <CircularProgress size={20} /> : 'Rename'}
        </Button>
      </DialogActions>
    </DialogContent>
  );
};

// -----------------------------------------------------------------------------
// Function to show the Rename Dialog via GlobalDialog
// -----------------------------------------------------------------------------
interface ShowRenameDialogProps {
  item: FileEntry | null;
  onRenameSuccess: (oldPath: string, newPath: string) => void;
}

export const showRenameDialog = ({
  item,
  onRenameSuccess,
}: ShowRenameDialogProps) => {
  if (!item) {
    showGlobalSnackbar('No item selected for rename.', 'warning');
    return;
  }
  showDialog({
    title: `Rename ${item.type === 'folder' ? 'Folder' : 'File'}: ${item.name}`,
    content: (
      <RenameContent
        item={item}
        onRenameSuccess={onRenameSuccess}
      />
    ),
    maxWidth: 'sm',
    fullWidth: true,
    showCloseButton: true,
    onClose: hideDialog,
  });
};
