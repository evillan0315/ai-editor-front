import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  aiEditorStore,
  selectAllChanges,
  deselectAllChanges,
  setApplyingChanges,
  setLastLlmResponse,
  setError, // Still used for immediate, transient UI error
  clearDiff,
  setOpenedFile,
  performPostApplyActions, // Unified action, handles logging internally now
} from '@/stores/aiEditorStore';
import { addLog } from '@/stores/logStore'; // NEW: Import addLog for logging
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
// import OutputLogger from './OutputLogger'; // Removed, it's now a central log viewer in AiSidebarContent
import { ModelResponse, FileChange, RequestType } from '@/types';

interface AiResponseDisplayProps {
  // No specific props needed, all state comes from aiEditorStore
}

/**
 * Displays the AI's proposed changes, thought process, and provides controls
 * for reviewing, selecting, and applying these changes. It now logs detailed
 * operational messages to the central `logStore`.
 */
const AiResponseDisplay: React.FC<AiResponseDisplayProps> = () => {
  const {
    loading,
    lastLlmResponse,
    selectedChanges,
    applyingChanges,
    currentProjectPath,
    gitInstructions,
    lastLlmGeneratePayload,
    scanPathsInput,
    error: globalError, // Rename to avoid conflict with local scope 'error'
  } = useStore(aiEditorStore);
  const theme = useTheme();

  // `isBuilding`, `buildOutput`, `runningGitCommandIndex`, `commandExecutionOutput`,
  // `commandExecutionError`, `appliedMessages` are now managed by `logStore`
  // and internal to `performPostApplyActions`.
  // `applyingChanges` is the primary indicator for the overall UI blocking state.

  useEffect(() => {
    // Clear diff when response changes to avoid stale diffs
    clearDiff();
    // Close any opened file when a new LLM response arrives
    if (lastLlmResponse) {
      console.log(lastLlmResponse);
      //setOpenedFile(null);
    }
  }, [lastLlmResponse]);

  const handleApplySelectedChanges = async () => {
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
      const applyResult = await applyProposedChanges(
        changesToApply,
        currentProjectPath,
      );
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

  const handleRunGitCommand = async (command: string) => {
    // Removed index parameter, as status is now global to logStore
    if (!currentProjectPath) {
      const msg = 'Project root is not set. Cannot run git command.';
      setError(msg); // For immediate UI feedback
      addLog('AI Response Display', msg, 'error', undefined, undefined, true);
      return;
    }
    addLog(
      'Git Automation',
      `Manually running git command: \`${command}\``,
      'info',
    );

    try {
      const result = await runTerminalCommand(command, currentProjectPath);
      // Command execution output is now handled by `addLog`
      if (result.exitCode !== 0) {
        const msg = `Command exited with code ${result.exitCode}`;
        addLog(
          'Git Automation',
          `Git command failed: \`${command}\`. ${msg}`,
          'error',
          result.stderr,
          result,
          true,
        );
        setError(msg); // For immediate UI feedback
      } else {
        addLog(
          'Git Automation',
          `Git command succeeded: \`${command}\`.`,
          'success',
          result.stdout,
          result,
        );
      }
    } catch (err) {
      const errorMsg = `Failed to run command: ${err instanceof Error ? err.message : String(err)}`;
      addLog(
        'Git Automation',
        errorMsg,
        'error',
        String(err),
        { stdout: '', stderr: String(err), exitCode: 1 },
        true,
      );
      setError(errorMsg); // For immediate UI feedback
    }
  };

  // Simplified to just `applyingChanges` for overall process indicator,
  // as `isBuilding` and `runningGitCommandIndex` status are now logged
  // to the global log store and not needed for a dedicated UI element here.
  const isAnyProcessRunning = applyingChanges;

  if (!lastLlmResponse) return null;

  return (
    <Paper
      elevation={1}
      sx={{
        p: 3,
        bgcolor: theme.palette.background.paper,
        flexGrow: 1,
        height: '100%',
        display: 'flex', // Changed to flex container
        flexDirection: 'column', // Changed to column direction
        overflow: 'hidden', // Hide parent scroll to manage internal scroll
      }}
    >
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ flexShrink: 0 }}
        gutterBottom
      >
        {' '}
        {/* Added flexShrink */}
        {lastLlmResponse.summary}
      </Typography>
      {/*lastLlmResponse.thoughtProcess && (
        <Accordion sx={{ mb: 2, flexShrink: 0 }}> 
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
             
            </Typography>
          </AccordionDetails>
        </Accordion>
      )*/}

      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexShrink: 0 }}>
        <Button
          variant="outlined"
          onClick={selectAllChanges} // This action also logs
          disabled={isAnyProcessRunning}
        >
          Select All
        </Button>
        <Button
          variant="outlined"
          onClick={deselectAllChanges} // This action also logs
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
      </Box>

      {applyingChanges && (
        <Alert severity="info" sx={{ mt: 3, flexShrink: 0 }}>
          {' '}
          {/* Added flexShrink */}
          Applying selected changes...
          <CircularProgress size={16} color="inherit" sx={{ ml: 1 }} />
        </Alert>
      )}

      {/* `appliedMessages`, `buildOutput` are now displayed via the central `OutputLogger` in `AiSidebarContent` */}

      {gitInstructions && gitInstructions.length > 0 && (
        <Accordion sx={{ mt: 3, flexShrink: 0 }}>
          {' '}
          {/* Added flexShrink */}
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography
              variant="subtitle1"
              className="!font-semibold"
              sx={{ color: theme.palette.text.primary }}
            >
              Manual Git Instructions (Run below to log to Output)
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
                        onClick={() => handleRunGitCommand(command)} // Removed index
                        disabled={isAnyProcessRunning} // Disabled if any process is running
                        sx={{ color: theme.palette.success.main }}
                      >
                        {/* No specific per-command loading indicator needed here, as global log will show running state */}
                        <PlayArrowIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              ))}
            </Box>
            {/* `commandExecutionOutput` and `commandExecutionError` are now displayed via the central `OutputLogger` */}
          </AccordionDetails>
        </Accordion>
      )}

      <Typography
        variant="h6"
        className="!font-semibold"
        sx={{ mt: 3, mb: 2, color: theme.palette.text.primary, flexShrink: 0 }} // Added flexShrink
      >
        Detailed Changes:
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          flexGrow: 1,
          overflowY: 'auto', // Added overflowY: 'auto' here
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
