import React, { useState, useCallback, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  Button,
  List,
  Stack,
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
} from '@mui/material';
import { ChangeItem } from './ChangeItem';
import { addLog } from '@/stores/logStore';
import {
  setError,
} from '@/stores/errorStore';
import {
  llmStore,
  deselectAllChanges,
  setApplyingChanges,
  setLastLlmResponse,
  clearDiff,
  performPostApplyActions,
  selectChange,
  selectAllChanges,
  deselectChange,
} from '@/stores/llmStore';
import { projectRootDirectoryStore } from '@/stores/fileTreeStore';
import { FileChange } from '@/types/llm';
import { gitCreateBranch, gitCheckoutBranch } from '@/api/git';

interface Props {
  changes: FileChange[];
}

// Define the type for the apply result (matching what performPostApplyActions returns)
interface ApplyResult {
  success: boolean;
  messages: string[];
}

export const ChangesList: React.FC<Props> = ({ changes }) => {
  const {
    lastLlmResponse,
    applyingChanges,
    lastLlmGeneratePayload,
    selectedChanges,
  } = useStore(llmStore);
  const currentProjectPath = useStore(projectRootDirectoryStore);

  const [showCreateBranchDialog, setShowCreateBranchDialog] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  const handleApplySelectedChangesClick = useCallback(() => {
    if (Object.keys(selectedChanges).length === 0) {
      const msg = 'No changes selected to apply.';
      setError(msg);
      addLog('AI Response Display', msg, 'warning', undefined, undefined, true);
      return;
    }
    setShowCreateBranchDialog(true);
  }, [selectedChanges]);

  const handleConfirmApply = async () => {
    setShowCreateBranchDialog(false); // Close dialog immediately

    if (!currentProjectPath) {
      const msg = 'Project root is not set.';
      setError(msg);
      addLog('AI Response Display', msg, 'error', undefined, undefined, true);
      setApplyingChanges(false); // Ensure loading is off
      return;
    }

    if (!lastLlmGeneratePayload) {
      const msg =
        'Original AI generation payload missing. Cannot report errors.';
      setError(msg);
      addLog('AI Response Display', msg, 'error', undefined, undefined, true);
      setApplyingChanges(false); // Ensure loading is off
      return;
    }

    setApplyingChanges(true);
    setError(null);
    addLog(
      'AI Response Display',
      'Starting application process for selected changes...', 
      'info',
    );

    try {
      const changesToApply = Object.values(selectedChanges);

      // 1. Optional: Create and checkout new Git branch
      if (newBranchName.trim()) {
        addLog(
          'Git Workflow',
          `Attempting to create and checkout new branch: ${newBranchName}...`, 
          'info',
        );
        try {
          await gitCreateBranch(newBranchName.trim(), currentProjectPath);
          await gitCheckoutBranch(newBranchName.trim(), false, currentProjectPath);
          addLog(
            'Git Workflow',
            `Successfully created and checked out new branch: ${newBranchName}.`,
            'success',
          );
        } catch (gitErr) {
          const gitErrorMsg = `Failed to create/checkout branch \"${newBranchName}\": ${gitErr instanceof Error ? gitErr.message : String(gitErr)}`;
          setError(gitErrorMsg);
          addLog('Git Workflow', gitErrorMsg, 'error', String(gitErr), undefined, true);
          setApplyingChanges(false);
          return; // Stop if branch creation fails
        }
      }

      // 2. Proceed with applying file changes and executing LLM-suggested git instructions
      const applyResult = (await performPostApplyActions(
        currentProjectPath,
        changesToApply,
        lastLlmGeneratePayload,
        lastLlmResponse || {},
      )) as ApplyResult;

      if (applyResult.messages) {
        applyResult.messages.forEach((msg) =>
          addLog('AI Response Display', msg, 'info'),
        );
      }

      if (applyResult.success === false) {
        const msg = 'Some changes failed to apply. Check logs for details.';
        setError(msg);
        addLog(
          'AI Response Display',
          msg,
          'error',
          applyResult.messages.join('\n'),
          undefined,
          true,
        );
      } else {
        addLog(
          'AI Response Display',
          'Changes applied successfully.',
          'success',
        );
      }

      // Clear state after successful apply
      setLastLlmResponse(null);
      deselectAllChanges();
      clearDiff();
    } catch (err) {
      const errorMsg = `Failure during application of changes: ${err instanceof Error ? err.message : String(err)}`;
      setError(errorMsg);
      addLog(
        'AI Response Display',
        errorMsg,
        'error',
        String(err),
        undefined,
        true,
      );
    } finally {
      setApplyingChanges(false);
      setNewBranchName(''); // Clear branch name input
    }
  };

  const isAnyProcessRunning = applyingChanges;

  // Memoize the ChangeItem component to prevent unnecessary re-renders
  const ChangeItemMemo = useMemo(() => ChangeItem, []);

  const toggleChange = useCallback(
    (change: FileChange) => {
      const isSelected = !!selectedChanges[change.filePath];
      if (isSelected) {
        deselectChange(change);
      } else {
        selectChange(change);
      }
    },
    [selectedChanges],
  );

  const handleSelectAllChanges = useCallback(() => {
    selectAllChanges();
  }, []);

  const handleDeselectAllChanges = useCallback(() => {
    deselectAllChanges();
  }, []);

  if (!lastLlmResponse) return null;
  return (
    <Box>
      {/* Sticky action bar */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,

          p: 1,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="outlined"
            onClick={handleSelectAllChanges}
            disabled={isAnyProcessRunning}
          >
            Select All
          </Button>
          <Button
            variant="outlined"
            onClick={handleDeselectAllChanges}
            disabled={isAnyProcessRunning}
          >
            Deselect All
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleApplySelectedChangesClick}
            disabled={
              isAnyProcessRunning || Object.keys(selectedChanges).length === 0
            }
            startIcon={
              isAnyProcessRunning ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
          >
            {applyingChanges ? 'Applying...' : 'Apply Selected Changes'}
          </Button>
        </Stack>
      </Box>

      {applyingChanges && (
        <Alert severity="info" sx={{ mt: 3, flexShrink: 0 }}>
          {' '}
          {/* Added flexShrink */}
          Applying selected changes...
          <CircularProgress size={16} color="inherit" sx={{ ml: 1 }} />
        </Alert>
      )}


      <Paper
        elevation={3}
        sx={{
          maxHeight: 500,
          overflowY: 'auto',
          pr: 1,
          mt: 1,
        }}
      >
        <List disablePadding>
          {changes &&
            changes.map((change, index) => {
              const isSelected = !!selectedChanges[change.filePath];

              return (
                <ChangeItemMemo
                  key={change.filePath}
                  index={index}
                  change={change}
                  selected={isSelected}
                  onToggle={() => toggleChange(change)}
                />
              );
            })}
        </List>
      </Paper>

      <Dialog open={showCreateBranchDialog} onClose={() => setShowCreateBranchDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Apply Changes to New Branch?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            You can create a new Git branch before applying these changes.
            If you leave the branch name empty, changes will be applied to the current branch.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            id="new-branch-name"
            label="New Branch Name (optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            placeholder="e.g., feature/ai-fix-navbar"
            disabled={applyingChanges}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowCreateBranchDialog(false); setNewBranchName(''); }} disabled={applyingChanges}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmApply}
            color="primary"
            variant="contained"
            disabled={applyingChanges}
            startIcon={
              applyingChanges ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            {applyingChanges ? 'Applying...' : 'Create & Apply'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
