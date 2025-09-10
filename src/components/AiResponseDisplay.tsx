import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  aiEditorStore,
  selectAllChanges,
  deselectAllChanges,
  setApplyingChanges,
  setAppliedMessages,
  setLastLlmResponse,
  setError,
  clearDiff,
  setOpenedFile,
  setRunningGitCommandIndex,
  setCommandExecutionError,
  setCommandExecutionOutput,
  setBuildOutput,
  setIsBuilding,
  performPostApplyActions, // New: Import the unified action
} from '@/stores/aiEditorStore';
import {
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  Tooltip,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { applyProposedChanges } from '@/api/llm';
import { runTerminalCommand } from '@/api/terminal';
import ProposedChangeCard from './ProposedChangeCard';
import OutputLogger from './OutputLogger'; // New: Import OutputLogger
import { ModelResponse, FileChange, RequestType } from '@/types';

interface AiResponseDisplayProps {
  // No specific props needed, all state comes from aiEditorStore
}

const AiResponseDisplay: React.FC<AiResponseDisplayProps> = () => {
  const {
    loading,
    lastLlmResponse,
    selectedChanges,
    applyingChanges,
    appliedMessages,
    currentProjectPath,
    gitInstructions,
    runningGitCommandIndex,
    commandExecutionOutput,
    commandExecutionError,
    isBuilding,
    buildOutput,
    lastLlmGeneratePayload,
    scanPathsInput,
    error: globalError, // Rename to avoid conflict with local scope 'error'
  } = useStore(aiEditorStore);
  const theme = useTheme();

  useEffect(() => {
    // Clear diff when response changes to avoid stale diffs
    clearDiff();
    // Close any opened file when a new LLM response arrives
    if (lastLlmResponse) {
      setOpenedFile(null);
    }
  }, [lastLlmResponse]);

  const handleApplySelectedChanges = async () => {
    if (Object.keys(selectedChanges).length === 0) {
      setError('No changes selected to apply.');
      return;
    }
    if (!currentProjectPath) {
      setError('Project root is not set.');
      return;
    }
    if (!lastLlmGeneratePayload) {
      setError('Original AI generation payload missing. Cannot report errors.');
      return;
    }

    // Start the overall application process indicator
    setApplyingChanges(true);
    setError(null); // Clear previous error
    setAppliedMessages([]);
    setBuildOutput(null); // Clear previous build output
    setIsBuilding(false); // Ensure building state is reset before starting any new process
    // Clear any previous individual git command outputs as we are starting a new sequence
    setCommandExecutionError(null);
    setCommandExecutionOutput(null);

    try {
      const changesToApply = Object.values(selectedChanges);
      const applyResult = await applyProposedChanges(
        changesToApply,
        currentProjectPath,
      );
      setAppliedMessages(applyResult.messages);

      if (!applyResult.success) {
        setError('Some changes failed to apply. Check messages above.');
        // Removed reportErrorToLlm call here
      } else {
        // If changes applied successfully, proceed to post-apply actions (build + git)
        if (lastLlmResponse && lastLlmGeneratePayload) {
          await performPostApplyActions(
            currentProjectPath,
            lastLlmResponse,
            lastLlmGeneratePayload,
            scanPathsInput
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          );
        }
      }

      // Clear the response and selected changes after applying (and building/git)
      setLastLlmResponse(null);
      deselectAllChanges();
      clearDiff();
    } catch (err) {
      setError(
        `Overall failure during application of changes: ${err instanceof Error ? err.message : String(err)}`,
      );
      // Removed reportErrorToLlm call here
    } finally {
      setApplyingChanges(false); // End overall loading indicator
    }
  };

  const handleRunGitCommand = async (command: string, index: number) => {
    if (!currentProjectPath) {
      setError('Project root is not set. Cannot run git command.');
      return;
    }
    setRunningGitCommandIndex(index);
    setCommandExecutionError(null);
    setCommandExecutionOutput(null);

    try {
      const result = await runTerminalCommand(command, currentProjectPath);
      setCommandExecutionOutput(result);
      if (result.exitCode !== 0) {
        setCommandExecutionError(`Command exited with code ${result.exitCode}`);
      }
    } catch (err) {
      setCommandExecutionError(
        `Failed to run command: ${err instanceof Error ? err.message : String(err)}`,
      );
      setCommandExecutionOutput({ stdout: '', stderr: '', exitCode: 1 }); // Clear previous output on error
    } finally {
      setRunningGitCommandIndex(null);
    }
  };

  if (!lastLlmResponse) return null;

  return (
    <Paper
      elevation={1}
      sx={{
        p: 3,
        bgcolor: theme.palette.background.paper,
        flexGrow: 1,
        height: '100%',
        maxHeight: '100%',
        overflowY: 'auto',
      }}
    >
      <Typography
        variant="h5"
        className="!font-bold"
        sx={{ color: theme.palette.text.primary }}
        gutterBottom
      >
        AI Proposed Changes:
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        {lastLlmResponse.summary}
      </Typography>
      {lastLlmResponse.thoughtProcess && (
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography
              variant="subtitle1"
              className="!font-semibold"
              sx={{ color: theme.palette.text.primary }}
            >
              AI Thought Process
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              sx={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                bgcolor: theme.palette.background.default,
                p: 2,
                borderRadius: 1,
                overflowX: 'auto',
                color: theme.palette.text.primary,
              }}
            >
              {lastLlmResponse.thoughtProcess}
            </Typography>
          </AccordionDetails>
        </Accordion>
      )}

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          variant="outlined"
          onClick={selectAllChanges}
          disabled={loading || applyingChanges || isBuilding}
        >
          Select All
        </Button>
        <Button
          variant="outlined"
          onClick={deselectAllChanges}
          disabled={loading || applyingChanges || isBuilding}
        >
          Deselect All
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleApplySelectedChanges}
          disabled={
            loading ||
            applyingChanges ||
            isBuilding ||
            Object.keys(selectedChanges).length === 0
          }
          startIcon={
            applyingChanges || isBuilding ? (
              <CircularProgress size={16} color="inherit" />
            ) : null
          }
        >
          {applyingChanges
            ? 'Applying...'
            : isBuilding
              ? 'Processing...'
              : 'Apply Selected Changes'}
        </Button>
      </Box>

      {applyingChanges && (
        <Alert severity="info" sx={{ mt: 3 }}>
          Applying selected changes...
          <CircularProgress size={16} color="inherit" sx={{ ml: 1 }} />
        </Alert>
      )}

      {appliedMessages && appliedMessages.length > 0 && (
        <Paper
          elevation={1}
          sx={{
            mt: 3,
            p: 2,
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography
            variant="h6"
            className="!font-semibold"
            sx={{ color: theme.palette.text.primary }}
            gutterBottom
          >
            Application Summary:
          </Typography>
          <Box
            sx={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              maxHeight: '200px',
              overflowY: 'auto',
              p: 1,
              bgcolor: theme.palette.background.default,
              borderRadius: 1,
              color: theme.palette.text.primary,
            }}
          >
            {appliedMessages.map((msg, index) => (
              <Typography
                key={index}
                component="div"
                sx={{ mb: 0.5, color: theme.palette.text.primary }}
              >
                {msg}
              </Typography>
            ))}
          </Box>
        </Paper>
      )}

      {/* Refactored Build Output */}
      <OutputLogger
        title="Build Script Output"
        output={buildOutput}
        isLoading={isBuilding}
        defaultExpanded={buildOutput?.exitCode !== 0}
      />

      {gitInstructions && gitInstructions.length > 0 && (
        <Accordion sx={{ mt: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography
              variant="subtitle1"
              className="!font-semibold"
              sx={{ color: theme.palette.text.primary }}
            >
              Git Instructions
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              sx={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                bgcolor: theme.palette.background.default,
                p: 2,
                borderRadius: 1,
                overflowX: 'auto',
                color: theme.palette.text.primary,
                position: 'relative',
              }}
            >
              {gitInstructions.map((command, index) => (
                <Box
                  key={index}
                  sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                >
                  <Typography
                    component="span"
                    sx={{
                      flexGrow: 1,
                      mr: 1,
                      color: theme.palette.text.primary,
                    }}
                  >
                    {command}
                  </Typography>
                  <Tooltip title="Copy command">
                    <IconButton
                      size="small"
                      onClick={() => navigator.clipboard.writeText(command)}
                      sx={{ color: theme.palette.text.secondary, mr: 0.5 }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Run command in NestJS terminal">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handleRunGitCommand(command, index)}
                        disabled={
                          runningGitCommandIndex !== null &&
                          runningGitCommandIndex !== index
                        }
                        sx={{ color: theme.palette.success.main }}
                      >
                        {runningGitCommandIndex === index ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <PlayArrowIcon fontSize="small" />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              ))}
            </Box>
            {/* Refactored Command Execution Output */}
            <OutputLogger
              title="Command Execution Output"
              output={commandExecutionOutput}
              error={commandExecutionError}
              isLoading={runningGitCommandIndex !== null}
              defaultExpanded={
                commandExecutionOutput?.exitCode !== 0 ||
                !!commandExecutionError
              }
            />
          </AccordionDetails>
        </Accordion>
      )}

      <Typography
        variant="h6"
        className="!font-semibold"
        sx={{ mt: 3, mb: 2, color: theme.palette.text.primary }}
      >
        Detailed Changes:
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          flexGrow: 1,
        }}
      >
        {lastLlmResponse.changes &&
          lastLlmResponse.changes.map((change: FileChange, index: number) => (
            <ProposedChangeCard key={index} change={change} index={index} />
          ))}
      </Box>
    </Paper>
  );
};

export default AiResponseDisplay;
