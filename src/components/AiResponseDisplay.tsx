import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  aiEditorStore,
  deselectAllChanges,
  setApplyingChanges,
  setLastLlmResponse,
  setError, // Still used for immediate, transient UI error
  clearDiff,
  performPostApplyActions, // Unified action, handles logging internally now
} from '@/stores/aiEditorStore';
import { addLog } from '@/stores/logStore'; // NEW: Import addLog for logging
import { useTheme } from '@mui/material';
import { applyProposedChanges } from '@/api/llm';
import { runTerminalCommand } from '@/api/terminal';
import { CodeGeneratorMain } from '@/components/code-generator/CodeGeneratorMain';
// import OutputLogger from './OutputLogger'; // Removed, it's now a central log viewer in AiSidebarContent

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

  return <CodeGeneratorMain data={lastLlmResponse} />;
};

export default AiResponseDisplay;
