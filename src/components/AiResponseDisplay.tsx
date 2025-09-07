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
  setBuildOutput, // New: Import setBuildOutput
  setIsBuilding, // New: Import setIsBuilding
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
import PlayArrowIcon from '@mui/icons-material/PlayArrow'; // New Import
import { applyProposedChanges, reportErrorToLlm } from '@/api/llm'; // New: Import reportErrorToLlm
import { runTerminalCommand } from '@/api/terminal'; // New Import
import ProposedChangeCard from './ProposedChangeCard';
import { ModelResponse, FileChange, RequestType } from '@/types'; // Import FileChange here

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
    isBuilding, // New: Get isBuilding state
    buildOutput, // New: Get buildOutput state
    lastLlmGeneratePayload, // New: Get lastLlmGeneratePayload for error reporting
    scanPathsInput, // New: Get scanPathsInput for error reporting
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

    setApplyingChanges(true);
    setError(null); // Clear previous error
    setAppliedMessages([]);
    setBuildOutput(null); // Clear previous build output

    try {
      const changesToApply = Object.values(selectedChanges);
      const result = await applyProposedChanges(
        changesToApply,
        currentProjectPath,
      );
      setAppliedMessages(result.messages);
      if (!result.success) {
        setError('Some changes failed to apply. Check messages above.');
        // New: Report error to LLM if changes failed to apply
        if (lastLlmResponse && lastLlmGeneratePayload) {
          await reportErrorToLlm({
            error: 'Failed to apply selected changes.',
            errorDetails: JSON.stringify(result.messages),
            originalRequestType: lastLlmGeneratePayload.requestType,
            previousLlmResponse: lastLlmResponse,
            originalLlmGeneratePayload: lastLlmGeneratePayload,
            projectRoot: currentProjectPath,
            scanPaths: scanPathsInput
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          });
        }
      } else {
        // If changes applied successfully, run the build script
        setIsBuilding(true);
        try {
          const buildResult = await runTerminalCommand(
            'pnpm run build',
            currentProjectPath,
          );
          setBuildOutput(buildResult);
          if (buildResult.exitCode !== 0) {
            setError(
              `Build failed with exit code ${buildResult.exitCode}. Check output.`,
            );
            // New: Report build failure to LLM
            if (lastLlmResponse && lastLlmGeneratePayload) {
              await reportErrorToLlm({
                error: `Build failed after applying changes. Exit Code: ${buildResult.exitCode}.`,
                errorDetails: buildResult.stderr || buildResult.stdout,
                originalRequestType: lastLlmGeneratePayload.requestType,
                previousLlmResponse: lastLlmResponse,
                originalLlmGeneratePayload: lastLlmGeneratePayload,
                projectRoot: currentProjectPath,
                scanPaths: scanPathsInput
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
                buildOutput: buildResult,
              });
            }
          } else {
            // Corrected: Directly pass the new array to setAppliedMessages
            setAppliedMessages([
              ...result.messages,
              'Project built successfully.',
            ]);
          }
        } catch (buildError) {
          setBuildOutput({
            stdout: '',
            stderr: String(buildError),
            exitCode: 1,
          });
          setError(
            `Failed to run build script: ${buildError instanceof Error ? buildError.message : String(buildError)}`,
          );
          // New: Report build script execution error to LLM
          if (lastLlmResponse && lastLlmGeneratePayload) {
            await reportErrorToLlm({
              error: `Failed to execute build script: ${buildError instanceof Error ? buildError.message : String(buildError)}`,
              errorDetails: String(buildError),
              originalRequestType: lastLlmGeneratePayload.requestType,
              previousLlmResponse: lastLlmResponse,
              originalLlmGeneratePayload: lastLlmGeneratePayload,
              projectRoot: currentProjectPath,
              scanPaths: scanPathsInput
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
              buildOutput: {
                stdout: '',
                stderr: String(buildError),
                exitCode: 1,
              },
            });
          }
        } finally {
          setIsBuilding(false);
        }
      }
      // Clear the response and selected changes after applying
      // Do NOT clear lastLlmResponse directly here, it will clear gitInstructions.
      // Instead, explicitly clear components of lastLlmResponse that should be reset.
      // For now, let's keep lastLlmResponse so gitInstructions can be seen.
      deselectAllChanges(); // Clear selected changes, but keep the full response visible
      clearDiff();
      // Note: If you want to explicitly clear git instructions after application, you'd add an action to aiEditorStore and call it here.
      // For now, they remain tied to lastLlmResponse.
    } catch (err) {
      setError(
        `Failed to apply changes: ${err instanceof Error ? err.message : String(err)}`,
      );
      // New: Report overall apply changes error to LLM
      if (lastLlmResponse && lastLlmGeneratePayload) {
        await reportErrorToLlm({
          error: `Overall failure during application of changes: ${err instanceof Error ? err.message : String(err)}`,
          errorDetails: String(err),
          originalRequestType: lastLlmGeneratePayload.requestType,
          previousLlmResponse: lastLlmResponse,
          originalLlmGeneratePayload: lastLlmGeneratePayload,
          projectRoot: currentProjectPath,
          scanPaths: scanPathsInput
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        });
      }
    } finally {
      setApplyingChanges(false);
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
        height: '100%', // Ensure it takes full height of parent
        maxHeight: '100%',
        overflowY: 'auto', // Allow scrolling for this panel
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
              ? 'Building...'
              : 'Apply Selected Changes'}
        </Button>
      </Box>

      {applyingChanges && ( // Show applying changes indicator
        <Alert severity="info" sx={{ mt: 3 }}>
          Applying selected changes...
          <CircularProgress size={16} color="inherit" sx={{ ml: 1 }} />
        </Alert>
      )}

      {appliedMessages &&
        appliedMessages.length > 0 && ( // Show messages after applying changes
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

      {isBuilding && (
        <Alert severity="info" sx={{ mt: 3 }}>
          Running build script...
          <CircularProgress size={16} color="inherit" sx={{ ml: 1 }} />
        </Alert>
      )}

      {buildOutput && (
        <Box sx={{ mt: 3 }}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Build Script Output
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {buildOutput.exitCode !== 0 && (
                <Alert severity="error" sx={{ mb: 1 }}>
                  Build failed with exit code {buildOutput.exitCode}.
                </Alert>
              )}
              <Box
                sx={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  bgcolor: theme.palette.background.default,
                  p: 1,
                  borderRadius: 1,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                {buildOutput.stdout && (
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.primary }}
                  >
                    {buildOutput.stdout}
                  </Typography>
                )}
                {buildOutput.stderr && (
                  <Typography variant="body2" color="error">
                    {buildOutput.stderr}
                  </Typography>
                )}
                {buildOutput.exitCode !== undefined && (
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    Exit Code: {buildOutput.exitCode}
                  </Typography>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}

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
            {(commandExecutionOutput || commandExecutionError) && (
              <Box sx={{ mt: 2 }}>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      Command Execution Output
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {commandExecutionError && (
                      <Alert severity="error" sx={{ mb: 1 }}>
                        {commandExecutionError}
                      </Alert>
                    )}
                    {commandExecutionOutput && (
                      <Box
                        sx={{
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'monospace',
                          bgcolor: theme.palette.background.default,
                          p: 1,
                          borderRadius: 1,
                          maxHeight: '200px',
                          overflowY: 'auto',
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        {commandExecutionOutput.stdout && (
                          <Typography
                            variant="body2"
                            sx={{ color: theme.palette.text.primary }}
                          >
                            {commandExecutionOutput.stdout}
                          </Typography>
                        )}
                        {commandExecutionOutput.stderr && (
                          <Typography variant="body2" color="error">
                            {commandExecutionOutput.stderr}
                          </Typography>
                        )}
                        {commandExecutionOutput.exitCode !== undefined && (
                          <Typography
                            variant="body2"
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            Exit Code: {commandExecutionOutput.exitCode}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}
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
