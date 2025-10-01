import { atom } from 'nanostores';
import type {
  FileChange,
  ModelResponse,
  LlmGeneratePayload,
  LlmOutputFormat,
  ApplyResult,
  RequestType
} from '@/types/llm';
import { runTerminalCommand } from '@/api/terminal';
import { reportErrorToLlm, applyProposedChanges as apiApplyProposedChanges } from '@/api/llm';
import { addLog } from '@/stores/logStore';
import { errorStore, setError } from '@/stores/errorStore';
import { showGlobalSnackbar } from '@/stores/snackbarStore';
import { loadInitialTree } from '@/stores/fileTreeStore';
import { projectRootDirectoryStore } from '@/stores/fileTreeStore';
import { TerminalCommandResponse } from '@/types/terminal';
import { LlmReportErrorApiPayload } from '@/types';
import { persistentAtom } from '@/utils/persistentAtom';

export interface LlmStore {
  instruction: string;
  aiInstruction: string;
  expectedOutputInstruction: string;
  requestType: RequestType;
  llmOutputFormat: LlmOutputFormat;
  currentProjectPath: string | null;
  response: string | null; // AI's last raw response string
  loading: boolean;
  errorLlm: string | null; // Specific error for LLM generation/parsing
  scanPathsInput: string;
  lastLlmResponse: ModelResponse | null; // Stores the full structured response from LLM
  lastLlmGeneratePayload: LlmGeneratePayload | null; // Stores the last payload sent to generateCode
  lastLlmGeneratePayloadString: string | null; // Serialized version for storage/debug
  selectedChanges: Record<string, FileChange>; // Map of filePath to FileChange for selected items
  currentDiff: string | null; // The content of the diff for the currently viewed file
  diffFilePath: string | null; // The filePath of the file whose diff is currently displayed
  applyingChanges: boolean; // Indicates if apply changes operation is in progress
  appliedMessages: string[]; // Messages from the backend after applying changes
  gitInstructions: string[] | null; // Optional git commands from LLM response
  runningGitCommandIndex: number | null; // Index of the git command currently being executed
  commandExecutionOutput: TerminalCommandResponse | null; // Output from the last git command execution
  commandExecutionError: string | null; // Error from the last git command execution
  isBuilding: boolean; // Indicates if a build process is running
  buildOutput: TerminalCommandResponse | null; // Output from the last build command
}

export const llmStore = atom<LlmStore>({
  instruction: '',
  aiInstruction: '',
  expectedOutputInstruction: '',
  requestType: RequestType.LLM_GENERATION,
  llmOutputFormat: LlmOutputFormat.JSON,
  currentProjectPath: null,
  response: null,
  loading: false,
  errorLlm: null,
  scanPathsInput: 'src, public, package.json, README.md, .env',
  lastLlmResponse: null,
  lastLlmGeneratePayload: null,
  lastLlmGeneratePayloadString: null,
  selectedChanges: {}, // Initialize selectedChanges
  currentDiff: null,
  diffFilePath: null,
  applyingChanges: false,
  appliedMessages: [],
  gitInstructions: null,
  runningGitCommandIndex: null,
  commandExecutionOutput: null,
  commandExecutionError: null,
  isBuilding: false,
  buildOutput: null,
});

// Persistent atom for auto-apply setting
export const autoApplyChanges = persistentAtom<boolean>(
  'autoApplyChanges',
  false,
);

export const setInstruction = (value: string) => {
  llmStore.set((state) => ({ ...state, instruction: value }));
};

export const setAiInstruction = (value: string) => {
  llmStore.set((state) => ({ ...state, aiInstruction: value }));
};

export const setExpectedOutputInstruction = (value: string) => {
  llmStore.set((state) => ({ ...state, expectedOutputInstruction: value }));
};

export const setRequestType = (value: RequestType) => {
  llmStore.set((state) => ({ ...state, requestType: value }));
};

export const setLlmOutputFormat = (value: LlmOutputFormat) => {
  llmStore.set((state) => ({ ...state, llmOutputFormat: value }));
};

export const setCurrentProjectPath = (value: string | null) => {
  llmStore.set((state) => ({
    ...state,
    currentProjectPath: value,
  }));
};

export const setResponse = (value: string | null) => {
  llmStore.set((state) => ({ ...state, response: value }));
};

export const setLoading = (value: boolean) => {
  llmStore.set((state) => ({ ...state, loading: value }));
};

export const setLlmError = (value: string | null) => {
  llmStore.set((state) => ({ ...state, errorLlm: value }));
};

export const setScanPathsInput = (value: string) => {
  llmStore.set((state) => ({ ...state, scanPathsInput: value }));
};

export const setLastLlmGeneratePayload = (value: LlmGeneratePayload | null) => {
  llmStore.set((state) => ({
    ...state,
    lastLlmGeneratePayload: value,
    lastLlmGeneratePayloadString: value ? JSON.stringify(value) : null,
  }));
};

export const setLlmResponse = (value: string) => {
  llmStore.set((state) => ({ ...state, response: value }));
};

export const setLastLlmResponse = (response: ModelResponse | null) => {
  llmStore.set((state) => {
    if (response === null) {
      addLog('LLM Store', 'Clearing last LLM response.', 'debug');
      // If response is cleared, also clear selected changes for consistency
      return { ...state, lastLlmResponse: null, selectedChanges: {} };
    }
    addLog('LLM Store', 'Setting last LLM response.', 'debug');
    // When a new response comes in, assume previous selections are invalid for the new set of changes
    return { ...state, lastLlmResponse: response, selectedChanges: {} };
  });
};

export const setCurrentDiff = (filePath: string | null, diff: string | null) => {
  llmStore.set((state) => ({ ...state, diffFilePath: filePath, currentDiff: diff }));
};

export const clearDiff = () => {
  llmStore.set((state) => ({ ...state, diffFilePath: null, currentDiff: null }));
};

export const setApplyingChanges = (value: boolean) => {
  llmStore.set((state) => ({ ...state, applyingChanges: value }));
};

export const setAppliedMessages = (value: string[]) => {
  llmStore.set((state) => ({ ...state, appliedMessages: value }));
};

export const setGitInstructions = (value: string[] | null) => {
  llmStore.set((state) => ({ ...state, gitInstructions: value }));
};

export const setRunningGitCommandIndex = (value: number | null) => {
  llmStore.set((state) => ({ ...state, runningGitCommandIndex: value }));
};

export const setCommandExecutionOutput = (value: TerminalCommandResponse | null) => {
  llmStore.set((state) => ({ ...state, commandExecutionOutput: value }));
};

export const setCommandExecutionError = (value: string | null) => {
  llmStore.set((state) => ({ ...state, commandExecutionError: value }));
};

export const setIsBuilding = (value: boolean) => {
  llmStore.set((state) => ({ ...state, isBuilding: value }));
};

export const setBuildOutput = (value: TerminalCommandResponse | null) => {
  llmStore.set((state) => ({ ...state, buildOutput: value }));
};

export const clearLlmStore = () => {
  llmStore.set((state) => ({
    ...state,
    instruction: '',
    response: null,
    errorLlm: null,
    lastLlmResponse: null,
    lastLlmGeneratePayload: null,
    lastLlmGeneratePayloadString: null,
    selectedChanges: {}, // Clear selectedChanges on full store clear
    currentDiff: null,
    diffFilePath: null,
    applyingChanges: false,
    appliedMessages: [],
    gitInstructions: null,
    runningGitCommandIndex: null,
    commandExecutionOutput: null,
    commandExecutionError: null,
    isBuilding: false,
    buildOutput: null,
  }));
  errorStore.set(null); // Clear global error as well
  addLog('LLM Store', 'LLM store cleared.', 'debug');
};

export const updateProposedChangeContent = (filePath: string, newContent: string) => {
  llmStore.set((state) => {
    const newLastLlmResponse = state.lastLlmResponse
      ? { ...state.lastLlmResponse }
      : null;
    if (!newLastLlmResponse) return state;

    const newChanges = newLastLlmResponse.changes.map((change) =>
      change.filePath === filePath ? { ...change, newContent } : change,
    );
    newLastLlmResponse.changes = newChanges;

    // If this change was selected, also update its content in selectedChanges
    const newSelectedChanges = { ...state.selectedChanges };
    if (newSelectedChanges[filePath]) {
      newSelectedChanges[filePath] = { ...newSelectedChanges[filePath], newContent };
      addLog('LLM Store', `Updated selected change content for ${filePath}.`, 'debug');
    }

    addLog('LLM Store', `Updated proposed change content for ${filePath}.`, 'debug');
    return { ...state, lastLlmResponse: newLastLlmResponse, selectedChanges: newSelectedChanges };
  });
};

export const updateProposedChangePath = (oldPath: string, newPath: string) => {
  llmStore.set((state) => {
    const newLastLlmResponse = state.lastLlmResponse
      ? { ...state.lastLlmResponse }
      : null;
    if (!newLastLlmResponse) return state;

    const newChanges = newLastLlmResponse.changes.map((change) =>
      change.filePath === oldPath ? { ...change, filePath: newPath } : change,
    );
    newLastLlmResponse.changes = newChanges;

    // IMPORTANT: Update selectedChanges if the item was selected
    const newSelectedChanges = { ...state.selectedChanges };
    if (newSelectedChanges[oldPath]) {
      // Create a new FileChange object with the updated path
      // and put it into the newSelectedChanges with the newPath as key.
      // The content of the selected change is taken from the updated 'changes' array directly.
      const updatedChangeInResponse = newChanges.find(c => c.filePath === newPath);
      if (updatedChangeInResponse) {
        newSelectedChanges[newPath] = updatedChangeInResponse; // Store the updated object
      } else {
        // Fallback: if somehow not found, use old content with new path
        newSelectedChanges[newPath] = { ...newSelectedChanges[oldPath], filePath: newPath };
      }
      delete newSelectedChanges[oldPath];
      addLog('LLM Store', `Updated selected change path from ${oldPath} to ${newPath}.`, 'debug');
    }

    addLog('LLM Store', `Updated proposed change path from ${oldPath} to ${newPath}.`, 'debug');
    return { ...state, lastLlmResponse: newLastLlmResponse, selectedChanges: newSelectedChanges };
  });
};

export const toggleChangeSelection = (change: FileChange) => {
  llmStore.set((state) => {
    const newSelectedChanges = { ...state.selectedChanges };
    if (newSelectedChanges[change.filePath]) {
      delete newSelectedChanges[change.filePath];
      addLog('LLM Store', `Deselected change: ${change.filePath}`, 'debug');
    } else {
      newSelectedChanges[change.filePath] = change;
      addLog('LLM Store', `Selected change: ${change.filePath}`, 'debug');
    }
    return { ...state, selectedChanges: newSelectedChanges };
  });
};

export const selectAllChanges = () => {
  llmStore.set((state) => {
    const allChanges = state.lastLlmResponse?.changes || [];
    const newSelectedChanges: Record<string, FileChange> = {};
    for (const change of allChanges) {
      newSelectedChanges[change.filePath] = change;
    }
    addLog('LLM Store', 'Selected all changes.', 'debug');
    return { ...state, selectedChanges: newSelectedChanges };
  });
};

export const deselectAllChanges = () => {
  llmStore.set((state) => {
    addLog('LLM Store', 'Deselected all changes.', 'debug');
    return { ...state, selectedChanges: {} };
  });
};

// Helper to perform file system apply + git commands + error reporting
export const performPostApplyActions = async (
  projectRoot: string,
  changesToApply: FileChange[],
  originalLlmGeneratePayload: LlmGeneratePayload,
  previousLlmResponse: ModelResponse,
): Promise<ApplyResult> => {
  let applyResult: ApplyResult = { success: true, messages: [] };
  let buildSuccess = true;
  let buildOutput: TerminalCommandResponse | null = null;

  // 1. Apply file system changes
  addLog('Post-Apply Actions', 'Applying file system changes...', 'info');
  try {
    applyResult = await apiApplyProposedChanges(changesToApply, projectRoot);
    if (applyResult.success) {
      addLog('Post-Apply Actions', 'File system changes applied.', 'success');
      // Reload the file tree to reflect new/modified/deleted files
      loadInitialTree(projectRoot);
    } else {
      addLog(
        'Post-Apply Actions',
        `Failed to apply some file system changes: ${applyResult.messages.join(', ')}`,
        'error',
      );
      setError(`Failed to apply file system changes: ${applyResult.messages.join(', ')}`);
      showGlobalSnackbar('Failed to apply file system changes', 'error');
      // Report partial failure to LLM
      await reportErrorToLlmBackend(
        'Failed to apply file system changes',
        applyResult.messages.join('\n'),
        originalLlmGeneratePayload,
        previousLlmResponse,
        projectRoot,
        originalLlmGeneratePayload.scanPaths,
      );
      return applyResult; // Stop if file changes fail significantly
    }
  } catch (fsErr: any) {
    const errorMessage = fsErr.message || String(fsErr);
    addLog('Post-Apply Actions', `Error applying file system changes: ${errorMessage}`, 'error');
    setError(`Error applying file system changes: ${errorMessage}`);
    showGlobalSnackbar('Error applying file system changes', 'error');
    await reportErrorToLlmBackend(
      'Error applying file system changes',
      errorMessage,
      originalLlmGeneratePayload,
      previousLlmResponse,
      projectRoot,
      originalLlmGeneratePayload.scanPaths,
    );
    return { success: false, messages: [`Error applying file system changes: ${errorMessage}`] };
  }

  // 2. Execute LLM-suggested build script (if any)
  if (previousLlmResponse.buildScript) {
    addLog('Post-Apply Actions', `Running build script: ${previousLlmResponse.buildScript}`, 'info');
    setIsBuilding(true);
    try {
      buildOutput = await runTerminalCommand(
        previousLlmResponse.buildScript,
        projectRoot,
      );
      setBuildOutput(buildOutput);

      if (buildOutput.exitCode !== 0) {
        buildSuccess = false;
        addLog(
          'Post-Apply Actions',
          `Build script failed: ${buildOutput.stderr}`,
          'error',
        );
        setError(`Build script failed: ${buildOutput.stderr}`);
        showGlobalSnackbar('Build script failed', 'error');

        await reportErrorToLlmBackend(
          'Build script failed',
          buildOutput.stderr,
          originalLlmGeneratePayload,
          previousLlmResponse,
          projectRoot,
          originalLlmGeneratePayload.scanPaths,
          buildOutput,
        );
      } else {
        addLog('Post-Apply Actions', 'Build script completed successfully.', 'success');
        showGlobalSnackbar('Build script completed successfully', 'success');
      }
    } catch (buildErr: any) {
      buildSuccess = false;
      const errorMessage = buildErr.message || String(buildErr);
      addLog('Post-Apply Actions', `Error running build script: ${errorMessage}`, 'error');
      setError(`Error running build script: ${errorMessage}`);
      showGlobalSnackbar('Error running build script', 'error');
      await reportErrorToLlmBackend(
        'Error running build script',
        errorMessage,
        originalLlmGeneratePayload,
        previousLlmResponse,
        projectRoot,
        originalLlmGeneratePayload.scanPaths,
      );
    } finally {
      setIsBuilding(false);
    }
  }

  // 3. Execute LLM-suggested Git instructions (if build was successful or no build script)
  if (buildSuccess && previousLlmResponse.gitInstructions && previousLlmResponse.gitInstructions.length > 0) {
    setGitInstructions(previousLlmResponse.gitInstructions);
    addLog('Post-Apply Actions', 'Executing Git instructions...', 'info');

    for (let i = 0; i < previousLlmResponse.gitInstructions.length; i++) {
      const command = previousLlmResponse.gitInstructions[i];
      setRunningGitCommandIndex(i);
      addLog('Post-Apply Actions', `Running git command: ${command}`, 'info');
      try {
        const gitOutput = await runTerminalCommand(command, projectRoot);
        setCommandExecutionOutput(gitOutput);
        if (gitOutput.exitCode !== 0) {
          addLog(
            'Post-Apply Actions',
            `Git command failed: ${command}\n${gitOutput.stderr}`,
            'error',
          );
          setError(`Git command failed: ${gitOutput.stderr}`);
          showGlobalSnackbar('Git command failed', 'error');
          await reportErrorToLlmBackend(
            'Git command failed',
            gitOutput.stderr,
            originalLlmGeneratePayload,
            previousLlmResponse,
            projectRoot,
            originalLlmGeneratePayload.scanPaths,
            gitOutput,
          );
          applyResult.success = false; // Mark overall as failure
          applyResult.messages.push(`Git command failed: ${command}`);
          break; // Stop executing further git commands on failure
        }
        addLog(
          'Post-Apply Actions',
          `Git command successful: ${command}`,
          'success',
        );
      } catch (gitErr: any) {
        const errorMessage = gitErr.message || String(gitErr);
        addLog('Post-Apply Actions', `Error running git command: ${errorMessage}`, 'error');
        setError(`Error running git command: ${errorMessage}`);
        showGlobalSnackbar('Error running git command', 'error');
        await reportErrorToLlmBackend(
          'Error running git command',
          errorMessage,
          originalLlmGeneratePayload,
          previousLlmResponse,
          projectRoot,
          originalLlmGeneratePayload.scanPaths,
        );
        applyResult.success = false; // Mark overall as failure
        applyResult.messages.push(`Error running git command: ${command}`);
        break; // Stop executing further git commands on failure
      }
    }
    setRunningGitCommandIndex(null);
    if (applyResult.success) {
      addLog('Post-Apply Actions', 'All Git commands executed successfully.', 'success');
    }
  }

  return applyResult;
};

// Helper for reporting errors to LLM backend
const reportErrorToLlmBackend = async (
  errorSummary: string,
  errorDetails: string,
  originalLlmGeneratePayload: LlmGeneratePayload,
  previousLlmResponse: ModelResponse,
  projectRoot: string,
  scanPaths: string[],
  buildOutput: TerminalCommandResponse | null = null,
) => {
  const context: LlmReportErrorApiPayload['context'] = {
    originalUserPrompt: originalLlmGeneratePayload.userPrompt,
    systemInstruction: originalLlmGeneratePayload.additionalInstructions,
    failedChanges: previousLlmResponse.changes, // Assuming all previous changes are relevant to the failure
    originalFilePaths: previousLlmResponse.changes?.map((c) => c.filePath),
  };

  const payload: LlmReportErrorApiPayload = {
    errorDetails: `${errorSummary}\n${errorDetails}`,
    projectRoot: projectRoot,
    context: context,
    scanPaths: scanPaths,
    // Optionally include buildOutput details in errorDetails if it's the build failure
    ...(buildOutput && { errorDetails: `${errorSummary}\n${errorDetails}\nBuild Output: ${buildOutput.stdout}\n${buildOutput.stderr}` }),
  };

  try {
    await reportErrorToLlm(payload);
    addLog(
      'Post-Apply Actions',
      'Error reported to LLM backend successfully.',
      'info',
    );
  } catch (reportErr: any) {
    addLog(
      'Post-Apply Actions',
      `Failed to report error to LLM backend: ${reportErr.message || String(reportErr)}`,
      'error',
    );
  }
};
