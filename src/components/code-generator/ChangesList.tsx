import React, { useCallback } from 'react';
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
import { ChangeItem } from './ChangeItem';
import OutputLogger from '@/components/OutputLogger';
import { addLog } from '@/stores/logStore';
import {
  setError,
} from '@/stores/errorStore';
import {
  llmStore,
  selectAllChanges,
  deselectAllChanges,
  setApplyingChanges,
  setLastLlmResponse,
  clearDiff,
  performPostApplyActions,
} from '@/stores/llmStore';
import { projectRootDirectoryStore } from '@/stores/fileTreeStore';
import { FileChange, ModelResponse, RequestType, LlmOutputFormat, ApplyResult } from '@/types/llm';

interface Props {
  changes: FileChange[];
}

// Define a minimal default ModelResponse for scenarios where lastLlmResponse might be null
const defaultEmptyModelResponse: ModelResponse = {
  summary: 'No summary available.',
  changes: [],
  requestType: RequestType.LLM_GENERATION,
  outputFormat: LlmOutputFormat.JSON,
};

export const ChangesList: React.FC<Props> = ({ changes }) => {
  const {
    lastLlmResponse,
    applyingChanges,
    gitInstructions,
    lastLlmGeneratePayload,
    scanPathsInput,
    isBuilding,
    errorLlm,
    selectedChanges, // Get selectedChanges directly from llmStore
  } = useStore(llmStore);
  const currentProjectPath = useStore(projectRootDirectoryStore);

  const handleApplySelectedChanges = async () => {
    if (Object.keys(selectedChanges).length === 0) {
      const msg = 'No changes selected to apply.';
      setError(msg);
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

    setApplyingChanges(true);
    setError(null);
    addLog(
      'AI Response Display',
      'Starting application process for selected changes...', 'info',
    );

    try {
      const changesToApply = Object.values(selectedChanges);

      // Perform post-apply actions (file system changes + git commands)
      const applyResult: ApplyResult = await performPostApplyActions(
        currentProjectPath,
        changesToApply,
        lastLlmGeneratePayload,
        lastLlmResponse || defaultEmptyModelResponse,
      );

      // ApplyResult could have messages & success status
      if (applyResult) {
        if (applyResult.messages && applyResult.messages.length > 0) {
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
      } else {
        console.warn('performPostApplyActions returned an undefined or null result.');
      }

      // Clear state after successful apply (or partial success/error in apply process)
      setLastLlmResponse(null);
      deselectAllChanges(); // Uses the new global action
      clearDiff();
    } catch (err) {
      const errorMsg = `Overall failure during application of changes: ${err instanceof Error ? err.message : String(err)}`;
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
    }
  };
  const isAnyProcessRunning = applyingChanges;

  const handleSelectAllChanges = useCallback(() => {
    selectAllChanges(); // Call global action
  }, []);

  const handleDeselectAllChanges = useCallback(() => {
    deselectAllChanges(); // Call global action
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

              return (
                <ChangeItem
                  key={change.filePath}
                  index={index}
                  change={change}
                />
              );
            })}
        </List>
      </Paper>
    </Box>
  );
};
