import React, { useMemo, useCallback, useReducer } from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  Button,
  List,
  Stack,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ChangeItem, type ChangeEntry } from './ChangeItem';
import { addLog } from '@/stores/logStore';
import {
  aiEditorStore,
  setError, // Still used for immediate, transient UI error
} from '@/stores/aiEditorStore';
import {
  llmStore,
  deselectAllChanges,
  setApplyingChanges,
  setLastLlmResponse,
  clearDiff,
} from '@/stores/llmStore';
import { applyProposedChanges } from '@/api/llm';
import { projectRootDirectoryStore } from '@/stores/fileTreeStore';

interface Props {
  changes: ChangeEntry[];
}

// Define the state type
type ChangesListState = {
  selectedChanges: Record<string, ChangeEntry>;
};

// Define the action type
type ChangesListAction = {
  type: 'SELECT_CHANGE' | 'DESELECT_CHANGE';
  change: ChangeEntry;
};

// Reducer function to manage selected changes
const changesListReducer = (
  state: ChangesListState,
  action: ChangesListAction,
): ChangesListState => {
  switch (action.type) {
    case 'SELECT_CHANGE':
      return {
        ...state,
        selectedChanges: {
          ...state.selectedChanges,
          [action.change.filePath]: action.change,
        },
      };
    case 'DESELECT_CHANGE':
      const { [action.change.filePath]: _, ...rest } = state.selectedChanges;
      return {
        ...state,
        selectedChanges: rest,
      };
    default:
      return state;
  }
};

// Initial state for the reducer
const initialChangesListState: ChangesListState = {
  selectedChanges: {},
};

export const ChangesList: React.FC<Props> = ({ changes }) => {
  const {
    lastLlmResponse,
    applyingChanges,
    gitInstructions,
    lastLlmGeneratePayload,
    scanPathsInput,
  } = useStore(llmStore);
  const currentProjectPath = useStore(projectRootDirectoryStore);

  // UseReducer hook for managing selected changes
  const [state, dispatch] = useReducer(
    changesListReducer,
    initialChangesListState,
  );
  const selectedChanges = state.selectedChanges;

  const handleApplySelectedChanges = async () => {
    console.log(selectedChanges, 'selectedChanges');
    if (Object.keys(selectedChanges).length === 0) {
      const msg = 'No changes selected to apply.';
      setError(msg); // For immediate UI feedback
      addLog('AI Response Display', msg, 'warning', undefined, undefined, true);
      return;
    }
    if (!currentProjectPath) {
      const msg = 'Project root is not set.';
      setError(msg);
      addLog('AI Response Display', msg, 'error', undefined, undefined, true);
      return;
    }
    if (!lastLlmGeneratePayload) {
      const msg =
        'Original AI generation payload missing. Cannot report errors.';
      setError(msg);
      addLog('AI Response Display', msg, 'error', undefined, undefined, true);
      return;
    }

    // Start the overall application process indicator
    setApplyingChanges(true); // This action also logs the start of applying changes
    setError(null); // Clear previous immediate error

    addLog(
      'AI Response Display',
      'Starting application process for selected changes...',
      'info',
    );

    try {
      const changesToApply = Object.values(selectedChanges);
      console.log(changesToApply, 'changesToApply');
      const applyResult = await applyProposedChanges(
        changesToApply,
        currentProjectPath,
      );
      console.log(applyResult, 'applyResult');
      // Individual messages from applyResult.messages are now logged by `addLog` in aiEditorStore
      applyResult.messages.forEach((msg) =>
        addLog('AI Response Display', msg, 'info'),
      );

      if (!applyResult.success) {
        const msg = 'Some changes failed to apply. Check logs for details.';
        setError(msg); // For immediate UI feedback
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
          'Changes applied successfully. Proceeding to post-apply actions (build + git).',
          'success',
        );
        // // If changes applied successfully, proceed to post-apply actions (build + git)
        // if (lastLlmResponse && lastLlmGeneratePayload) {
        //   await performPostApplyActions(
        //     currentProjectPath,
        //     lastLlmResponse,
        //     lastLlmGeneratePayload,
        //     scanPathsInput
        //       .split(',')
        //       .map((s) => s.trim())
        //       .filter(Boolean),
        //   );
        // }
      }

      // Clear the response and selected changes after applying (and building/git)
      setLastLlmResponse(null);
      deselectAllChanges();
      clearDiff();
    } catch (err) {
      const errorMsg = `Overall failure during application of changes: ${err instanceof Error ? err.message : String(err)}`;
      setError(errorMsg); // For immediate UI feedback
      addLog(
        'AI Response Display',
        errorMsg,
        'error',
        String(err),
        undefined,
        true,
      );
    } finally {
      setApplyingChanges(false); // This action also logs the end of applying changes
    }
  };
  const isAnyProcessRunning = applyingChanges;

  // Memoize the ChangeItem component to prevent unnecessary re-renders
  const ChangeItemMemo = useMemo(() => ChangeItem, []);

  const toggleChange = useCallback(
    (change: ChangeEntry) => {
      const isSelected = !!selectedChanges[change.filePath];

      dispatch({
        type: isSelected ? 'DESELECT_CHANGE' : 'SELECT_CHANGE',
        change: change,
      });
    },
    [selectedChanges, dispatch],
  );

  const handleSelectAllChanges = useCallback(() => {
    changes.forEach((change) => {
      if (!selectedChanges[change.filePath]) {
        dispatch({
          type: 'SELECT_CHANGE',
          change: change,
        });
      }
    });
  }, [changes, selectedChanges, dispatch]);

  const handleDeselectAllChanges = useCallback(() => {
    changes.forEach((change) => {
      if (selectedChanges[change.filePath]) {
        dispatch({
          type: 'DESELECT_CHANGE',
          change: change,
        });
      }
    });
  }, [changes, selectedChanges, dispatch]);

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
            onClick={handleSelectAllChanges} // This action also logs
            disabled={isAnyProcessRunning}
          >
            Select All
          </Button>
          <Button
            variant="outlined"
            onClick={handleDeselectAllChanges} // This action also logs
            disabled={isAnyProcessRunning}
          >
            Deselect All
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleApplySelectedChanges}
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

      {/* Scrollable list with elevation */}
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
    </Box>
  );
};
