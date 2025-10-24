import React, { useState, useEffect, useMemo } from 'react';
import {
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Box
} from '@mui/material';
import { copyFile as apiCopyFile, moveFile as apiMoveFile } from '@/api/file';
import { FileEntry } from '@/types/refactored/fileTree';
import * as path from 'path-browserify';
import { showDialog, hideDialog } from '@/stores/dialogStore';
import { showGlobalSnackbar } from '@/stores/snackbarStore';
import { projectStore } from '@/stores/projectStore'; 
import { useStore } from '@nanostores/react';

// -----------------------------------------------------------------------------
// Component for the content of the Operation Path Dialog
// -----------------------------------------------------------------------------
interface OperationPathContentProps {
  item: FileEntry | null;
  mode: 'copy' | 'move';
  onOperationSuccess: (sourcePath: string, destinationPath: string) => void;
  projectRoot: string;
}

const OperationPathContent: React.FC<OperationPathContentProps> = ({
  item,
  mode,
  onOperationSuccess,
  projectRoot,
}) => {
  const [destinationPathInput, setDestinationPathInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const projectId = useStore(projectStore).currentProject?.id; 

  const operationLabel = mode === 'copy' ? 'Copy' : 'Move';

  useEffect(() => {
    if (item) {
      const parentDir = path.dirname(item.path);
      setDestinationPathInput(parentDir === projectRoot ? projectRoot : parentDir);
      setError('');
      setLoading(false);
    }
  }, [item, projectRoot]);

  const handleOperation = async () => {
    if (!item) return;
    if (!destinationPathInput.trim()) {
      setError('Destination path cannot be empty.');
      return;
    }
    if (!projectId) {
      showGlobalSnackbar('No project selected. Cannot perform file operation.', 'error');
      setError('No project selected. Cannot perform file operation.');
      return;
    }

    const finalDestinationPath = path.join(destinationPathInput, item.name);

    if (finalDestinationPath === item.path) {
      setError('Source and destination paths are the same.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      let result;
      if (mode === 'copy') {
        result = await apiCopyFile(item.path, finalDestinationPath, projectId);
      } else {
        result = await apiMoveFile(item.path, finalDestinationPath, projectId);
      }

      if (result.success) {
        onOperationSuccess(item.path, finalDestinationPath);
        showGlobalSnackbar(result.message || `${operationLabel}ed successfully!`, 'success');
        hideDialog();
      } else {
        const errorMessage = result.message || `Failed to ${mode} item.`;
        setError(errorMessage);
        showGlobalSnackbar(errorMessage, 'error');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred.';
      setError(errorMessage);
      showGlobalSnackbar(`Error ${mode}ing: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent sx={{ p: 2 }}>
      <Box  className="">
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
          label={`Destination Directory`}
          type="text"
          fullWidth
          value={destinationPathInput}
          onChange={(e) => setDestinationPathInput(e.target.value)}
          error={!!error}
          helperText={error || 'Enter the target directory for the operation.'}
          sx={{ mb: 2 }}
        />
        <Typography variant="caption" color="text.secondary">
          Final {operationLabel} Path: <strong>{path.join(destinationPathInput, item?.name || '')}</strong>
        </Typography>
     </Box>
      <DialogActions sx={{ pt: 2, justifyContent: 'flex-end', borderTop: `1px solid`, borderColor: 'divider'}}>
        <Button onClick={hideDialog} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleOperation} disabled={loading} variant="contained" color="primary">
          {loading ? <CircularProgress size={20} /> : operationLabel}
        </Button>
      </DialogActions>
    </DialogContent>
  );
};

// -----------------------------------------------------------------------------
// Function to show the Operation Path Dialog via GlobalDialog
// -----------------------------------------------------------------------------
interface ShowOperationPathDialogProps {
  item: FileEntry | null;
  mode: 'copy' | 'move';
  onOperationSuccess: (sourcePath: string, destinationPath: string) => void;
  projectRoot: string;
}

export const showOperationPathDialog = ({
  item,
  mode,
  onOperationSuccess,
  projectRoot,
}: ShowOperationPathDialogProps) => {
  if (!item) {
    showGlobalSnackbar('No item selected for operation.', 'warning');
    return;
  }
  showDialog({
    title: `${mode === 'copy' ? 'Copy' : 'Move'} ${item.type === 'folder' ? 'Folder' : 'File'}: ${item.name}`,
    content: (
      <OperationPathContent
        item={item}
        mode={mode}
        onOperationSuccess={onOperationSuccess}
        projectRoot={projectRoot}
      />
    ),
    maxWidth: 'sm',
    fullWidth: true,
    showCloseButton: true,
    onClose: hideDialog,
  });
};
