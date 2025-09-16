import { map } from 'nanostores';
import {
  FileChange,
  ModelResponse,
  AddOrModifyFileChange,
  RequestType,
  LlmOutputFormat,
  LlmGeneratePayload,
  TerminalCommandResponse, // Ensure this is imported for logStore
} from '@/types';
import {
  INSTRUCTION,
  ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
} from '@/constants';
import {
  applyProposedChanges as apiApplyProposedChanges,
} from '@/api/llm';
import { runTerminalCommand } from '@/api/terminal';
import { writeFileContent } from '@/api/file';
import { addLog, LogEntry } from './logStore'; // NEW: Import addLog and LogEntry


// --- Start Type Definitions for AiEditorState ---
// Moved here for self-containment as types/index.ts was not explicitly mentioned.
// Ideally, this would live in a shared types file.
export interface AiEditorState {
  instruction: string;
  aiInstruction: string;
  expectedOutputInstruction: string;
  requestType: RequestType;
  llmOutputFormat: LlmOutputFormat;
  uploadedFileData: string | null;
  uploadedFileMimeType: string | null;
  uploadedFileName: string | null;
  currentProjectPath: string | null;
  response: string | null; // Raw LLM response if not parsed into ModelResponse
  loading: boolean;
  error: string | null; // For immediate, transient UI error display
  scanPathsInput: string;
  lastLlmResponse: ModelResponse | null;
  lastLlmGeneratePayload: LlmGeneratePayload | null;
  lastLlmGeneratePayloadString: string | null;
  selectedChanges: Record<string, FileChange>;
  currentDiff: string | null;
  diffFilePath: string | null;
  applyingChanges: boolean;
  // removed appliedMessages from here, it will go to logStore
  gitInstructions: string[] | null;
  // removed runningGitCommandIndex, commandExecutionOutput, commandExecutionError from here
  openedFile: string | null;
  openedFileContent: string | null;
  initialFileContentSnapshot: string | null;
  isFetchingFileContent: boolean;
  fetchFileContentError: string | null;
  isSavingFileContent: boolean;
  saveFileContentError: string | null;
  isOpenedFileDirty: boolean;
  autoApplyChanges: boolean;
  isBuilding: boolean;
  // removed buildOutput from here
  openedTabs: string[];
  snackbar: {
    open: boolean;
    message: string;
    severity?: 'success' | 'error' | 'info';
  };
}
// --- End Type Definitions ---

export const aiEditorStore = map<AiEditorState>({
  instruction: '',
  aiInstruction: INSTRUCTION,
  expectedOutputInstruction: ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
  requestType: RequestType.LLM_GENERATION,
  llmOutputFormat: LlmOutputFormat.YAML,
  uploadedFileData: null,
  uploadedFileMimeType: null,
  uploadedFileName: null,
  currentProjectPath: null,
  response: null,
  loading: false,
  error: null, // Keep for immediate UI feedback if needed, but logs go to logStore
  scanPathsInput: 'src,package.json,README.md',
  lastLlmResponse: null,
  lastLlmGeneratePayload: null,
  lastLlmGeneratePayloadString: null,
  selectedChanges: {},
  currentDiff: null,
  diffFilePath: null,
  applyingChanges: false,
  gitInstructions: null,
  openedFile: null,
  openedFileContent: null,
  initialFileContentSnapshot: null,
  isFetchingFileContent: false,
  fetchFileContentError: null,
  isSavingFileContent: false,
  saveFileContentError: null,
  isOpenedFileDirty: false,
  autoApplyChanges: false,
  isBuilding: false,
  openedTabs: [],
  snackbar: {
    open: false,
    message: '',
    severity: undefined,
  },
});

export const setInstruction = (instruction: string) => {
  aiEditorStore.setKey('instruction', instruction);
  //addLog('Prompt Generator', `Instruction updated: ${instruction.substring(0, 50)}${instruction.length > 50 ? '...' : ''}`, 'debug');
};

export const setAiInstruction = (instruction: string) => {
  aiEditorStore.setKey('aiInstruction', instruction);
  //addLog('Prompt Generator', `AI System Instruction updated.`, 'debug');
};

export const setExpectedOutputInstruction = (instruction: string) => {
  aiEditorStore.setKey('expectedOutputInstruction', instruction);
  //addLog('Prompt Generator', `Expected Output Format Instruction updated.`, 'debug');
};

export const setRequestType = (type: RequestType) => {
  aiEditorStore.setKey('requestType', type);
  //addLog('Prompt Generator', `Request Type set to: ${type}`, 'info');
};

export const setLlmOutputFormat = (format: LlmOutputFormat) => {
  aiEditorStore.setKey('llmOutputFormat', format);
  //addLog('Prompt Generator', `LLM Output Format set to: ${format}`, 'info');
};

export const setUploadedFile = (
  data: string | null,
  mimeType: string | null,
  fileName: string | null,
) => {
  aiEditorStore.setKey('uploadedFileData', data);
  aiEditorStore.setKey('uploadedFileMimeType', mimeType);
  aiEditorStore.setKey('uploadedFileName', fileName);
  if (fileName) {
    //addLog('Prompt Generator', `File uploaded: ${fileName} (${mimeType})`, 'info');
  } else {
    //addLog('Prompt Generator', `Uploaded file cleared.`, 'info');
  }
};

export const setResponse = (response: string | null) => {
  aiEditorStore.setKey('response', response);
  if (response) {
    //addLog('AI Response Display', `Raw AI response received.`, 'debug');
  }
};

export const setLoading = (isLoading: boolean) => {
  aiEditorStore.setKey('loading', isLoading);
  if (isLoading) {
    //addLog('AI Generation', 'AI generation started...', 'info');
  } else {
    //addLog('AI Generation', 'AI generation finished.', 'info');
  }
};

export const setError = (message: string | null) => {
  aiEditorStore.setKey('error', message); // Keep for immediate UI feedback if a component needs it
  if (message) {
    //addLog('System Error', message, 'error', message, undefined, true);
  }
};

export const clearState = () => {
  aiEditorStore.set({
    instruction: '',
    aiInstruction: INSTRUCTION,
    expectedOutputInstruction: ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
    requestType: RequestType.LLM_GENERATION,
    llmOutputFormat: LlmOutputFormat.YAML,
    uploadedFileData: null,
    uploadedFileMimeType: null,
    uploadedFileName: null,
    currentProjectPath: null,
    response: null,
    loading: false,
    error: null,
    scanPathsInput: 'src,package.json,README.md,docs',
    lastLlmResponse: null,
    lastLlmGeneratePayload: null,
    lastLlmGeneratePayloadString: null,
    selectedChanges: {},
    currentDiff: null,
    diffFilePath: null,
    applyingChanges: false,
    gitInstructions: null,
    openedFile: null,
    openedFileContent: null,
    initialFileContentSnapshot: null,
    isFetchingFileContent: false,
    fetchFileContentError: null,
    isSavingFileContent: false,
    saveFileContentError: null,
    isOpenedFileDirty: false,
    autoApplyChanges: false,
    isBuilding: false,
    openedTabs: [],
    snackbar: {
      open: false,
      message: '',
      severity: undefined,
    },
  });
  //addLog('System', 'All editor state cleared.', 'info');
};

export const setScanPathsInput = (paths: string) => {
  aiEditorStore.setKey('scanPathsInput', paths);
  //addLog('Prompt Generator', `Scan paths updated: ${paths}`, 'info');
};

export const setLastLlmResponse = (response: ModelResponse | null) => {
  aiEditorStore.setKey('lastLlmResponse', response);
  if (response && response.changes) {
    const newSelectedChanges: Record<string, FileChange> = {};
    response.changes.forEach((change) => {
      newSelectedChanges[change.filePath] = change;
    });
    aiEditorStore.setKey('selectedChanges', newSelectedChanges);
    //addLog('AI Response Display', `AI response received with ${response.changes.length} proposed changes.`, 'success', response.summary);
  } else if (response) {
    //addLog('AI Response Display', `AI response received, but no changes proposed.`, 'info', response.summary);
  } else {
    //addLog('AI Response Display', `AI response cleared.`, 'debug');
  }
  aiEditorStore.setKey('gitInstructions', response?.gitInstructions || null);
  if (!response || !response.changes) {
    aiEditorStore.setKey('selectedChanges', {});
  }
};

export const setLastLlmGeneratePayload = (
  payload: LlmGeneratePayload | null,
) => {
  aiEditorStore.setKey('lastLlmGeneratePayload', payload);
  if (payload) {
    //addLog('Prompt Generator', `LLM Generation Payload stored.`, 'debug', JSON.stringify(payload, null, 2));
  }
};

export const toggleSelectedChange = (change: FileChange) => {
  const state = aiEditorStore.get();
  const newSelected = { ...state.selectedChanges };
  if (newSelected[change.filePath]) {
    delete newSelected[change.filePath];
    //addLog('Proposed Change Card', `Deselected change for: ${change.filePath}`, 'info');
  } else {
    newSelected[change.filePath] = change;
    //addLog('Proposed Change Card', `Selected change for: ${change.filePath}`, 'info');
  }
  aiEditorStore.set({ ...state, selectedChanges: newSelected });
};

export const selectAllChanges = () => {
  const state = aiEditorStore.get();
  if (state.lastLlmResponse?.changes) {
    const newSelectedChanges: Record<string, FileChange> = {};
    state.lastLlmResponse.changes.forEach((change) => {
      newSelectedChanges[change.filePath] = change;
    });
    aiEditorStore.set({ ...state, selectedChanges: newSelectedChanges });
    //addLog('AI Response Display', 'All proposed changes selected.', 'info');
  }
};

export const deselectAllChanges = () => {
  aiEditorStore.setKey('selectedChanges', {});
  ///addLog('AI Response Display', 'All proposed changes deselected.', 'info');
};

export const setCurrentDiff = (
  filePath: string | null,
  diffContent: string | null,
) => {
  aiEditorStore.setKey('diffFilePath', filePath);
  aiEditorStore.setKey('currentDiff', diffContent);
  if (filePath && diffContent) {
    //addLog('Proposed Change Card', `Diff loaded for: ${filePath}`, 'debug', diffContent);
  } else if (filePath) {
    //addLog('Proposed Change Card', `Diff cleared for: ${filePath}`, 'debug');
  }
};

export const clearDiff = () => {
  aiEditorStore.setKey('currentDiff', null);
  aiEditorStore.setKey('diffFilePath', null);
  //addLog('Proposed Change Card', 'Diff view cleared.', 'debug');
};

export const setApplyingChanges = (isApplying: boolean) => {
  aiEditorStore.setKey('applyingChanges', isApplying);
  if (isApplying) {
    //addLog('AI Response Display', 'Applying selected changes...', 'info');
  } else {
    //addLog('AI Response Display', 'Finished applying changes.', 'info');
  }
};

// setAppliedMessages is removed; messages are now logged directly via addLog
// export const setAppliedMessages = (messages: string[]) => {
//   messages.forEach(msg => addLog('AI Response Display', msg, 'info'));
// };

export const updateProposedChangeContent = (
  filePath: string,
  newContent: string,
) => {
  const state = aiEditorStore.get();
  if (!state.lastLlmResponse) return;

  const updatedChanges: FileChange[] = state.lastLlmResponse.changes.map(
    (change) => {
      if (change.filePath === filePath) {
        if (
          change.action === 'add' ||
          change.action === 'modify' ||
          change.action === 'repair'
        ) {
          return { ...(change as AddOrModifyFileChange), newContent };
        }
        return change;
      }
      return change;
    },
  );

  const newSelectedChanges: Record<string, FileChange> = {
    ...state.selectedChanges,
  };
  const selectedChange = newSelectedChanges[filePath];

  if (selectedChange) {
    if (
      selectedChange.action === 'add' ||
      selectedChange.action === 'modify' ||
      selectedChange.action === 'repair'
    ) {
      newSelectedChanges[filePath] = {
        ...(selectedChange as AddOrModifyFileChange),
        newContent,
      };
    }
  }

  aiEditorStore.set({
    ...state,
    lastLlmResponse: { ...state.lastLlmResponse, changes: updatedChanges },
    selectedChanges: newSelectedChanges,
  });
  addLog('Proposed Change Card', `Content updated for: ${filePath}`, 'debug');
};

export const updateProposedChangePath = (
  oldFilePath: string,
  newFilePath: string,
) => {
  const state = aiEditorStore.get();
  if (!state.lastLlmResponse) {
    addLog('Proposed Change Card', 'Cannot update proposed change path: No LLM response available.', 'warning', undefined, undefined, true);
    setError('New file path cannot be empty.'); // For immediate UI error
    return;
  }

  const trimmedNewFilePath = newFilePath.trim();
  if (!trimmedNewFilePath) {
    addLog('Proposed Change Card', 'Cannot update proposed change path: New file path cannot be empty.', 'error', undefined, undefined, true);
    setError('New file path cannot be empty.');
    return;
  }
  if (trimmedNewFilePath === oldFilePath) {
    addLog('Proposed Change Card', `File path for ${oldFilePath} not changed.`, 'debug');
    return;
  }

  let foundAndUpdated = false;
  const updatedChanges: FileChange[] = state.lastLlmResponse.changes.map(
    (change) => {
      if (change.filePath === oldFilePath) {
        foundAndUpdated = true;
        return { ...change, filePath: trimmedNewFilePath };
      }
      return change;
    },
  );

  if (!foundAndUpdated) {
    const errMsg = `File change for path '${oldFilePath}' not found in lastLlmResponse. No update performed.`;
    addLog('Proposed Change Card', errMsg, 'warning', undefined, undefined, true);
    setError(errMsg);
    return;
  }

  const newSelectedChanges: Record<string, FileChange> = {
    ...state.selectedChanges,
  };
  if (newSelectedChanges[oldFilePath]) {
    newSelectedChanges[trimmedNewFilePath] = {
      ...newSelectedChanges[oldFilePath],
      filePath: trimmedNewFilePath,
    };
    delete newSelectedChanges[oldFilePath];
  }

  let newDiffFilePath = state.diffFilePath;
  let newCurrentDiff = state.currentDiff;
  if (state.diffFilePath === oldFilePath) {
    newDiffFilePath = null;
    newCurrentDiff = null;
  }

  aiEditorStore.set({
    ...state,
    lastLlmResponse: { ...state.lastLlmResponse, changes: updatedChanges },
    selectedChanges: newSelectedChanges,
    diffFilePath: newDiffFilePath,
    currentDiff: newCurrentDiff,
  });
  addLog('Proposed Change Card', `File path updated from '${oldFilePath}' to '${trimmedNewFilePath}'.`, 'info');
};

export const addOpenedTab = (filePath: string) => {
  const state = aiEditorStore.get();
  if (!state.openedTabs.includes(filePath)) {
    aiEditorStore.setKey('openedTabs', [...state.openedTabs, filePath]);
    addLog('File Editor', `Opened new tab for: ${filePath}`, 'info');
  }
};

export const removeOpenedTab = (filePath: string) => {
  const state = aiEditorStore.get();
  const newOpenedTabs = state.openedTabs.filter((tab) => tab !== filePath);
  aiEditorStore.setKey('openedTabs', newOpenedTabs);
  addLog('File Editor', `Closed tab for: ${filePath}`, 'info');

  if (state.openedFile === filePath) {
    if (newOpenedTabs.length > 0) {
      const oldIndex = state.openedTabs.indexOf(filePath);
      const newActiveFile =
        oldIndex > 0 ? newOpenedTabs[oldIndex - 1] : newOpenedTabs[0];
      setOpenedFile(newActiveFile);
    } else {
      setOpenedFile(null);
    }
  }
};

export const setOpenedFile = (filePath: string | null) => {
  aiEditorStore.setKey('openedFile', filePath);
  if (filePath && !aiEditorStore.get().openedTabs.includes(filePath)) {
    addOpenedTab(filePath);
  } else if (filePath) {
    addLog('File Editor', `Switched to file: ${filePath}`, 'info');
  } else {
    addLog('File Editor', 'No file is currently opened in the editor.', 'info');
  }
  aiEditorStore.setKey('openedFileContent', null);
  aiEditorStore.setKey('initialFileContentSnapshot', null);
  aiEditorStore.setKey('isFetchingFileContent', false);
  aiEditorStore.setKey('fetchFileContentError', null);
  aiEditorStore.setKey('isSavingFileContent', false);
  aiEditorStore.setKey('saveFileContentError', null);
  aiEditorStore.setKey('isOpenedFileDirty', false);
};

export const setOpenedFileContent = (content: string | null) => {
  aiEditorStore.setKey('openedFileContent', content);
  aiEditorStore.setKey('saveFileContentError', null);
  // Log a debug message, as this can be very frequent
  // addLog('File Editor', `Content updated for active file.`, 'debug');
};

export const setInitialFileContentSnapshot = (content: string | null) => {
  aiEditorStore.setKey('initialFileContentSnapshot', content);
  //addLog('File Editor', `Initial content snapshot taken for active file.`, 'debug');
};

export const setIsFetchingFileContent = (isLoading: boolean) => {
  aiEditorStore.setKey('isFetchingFileContent', isLoading);
  if (isLoading) {
    addLog('File Editor', `Fetching file content...`, 'debug');
  } else {
    //addLog('File Editor', `Finished fetching file content.`, 'debug');
  }
};

export const setFetchFileContentError = (message: string | null) => {
  aiEditorStore.setKey('fetchFileContentError', message);
  if (message) {
    addLog('File Editor', `Failed to fetch file content: ${message}`, 'error', message, undefined, true);
  }
};

export const setIsSavingFileContent = (isLoading: boolean) => {
  aiEditorStore.setKey('isSavingFileContent', isLoading);
  if (isLoading) {
    addLog('File Editor', `Saving file content...`, 'info');
  } else {
    addLog('File Editor', `Finished saving file content.`, 'info');
  }
};

export const setSaveFileContentError = (message: string | null) => {
  aiEditorStore.setKey('saveFileContentError', message);
  if (message) {
    addLog('File Editor', `Failed to save file content: ${message}`, 'error', message, undefined, true);
  }
};

export const setIsOpenedFileDirty = (isDirty: boolean) => {
  aiEditorStore.setKey('isOpenedFileDirty', isDirty);
  if (isDirty) {
    //addLog('File Editor', `Active file has unsaved changes.`, 'warning');
  }
};

// `setRunningGitCommandIndex`, `setCommandExecutionOutput`, `setCommandExecutionError`
// are no longer needed as their information is logged directly to `logStore`.

export const setAutoApplyChanges = (value: boolean) => {
  aiEditorStore.setKey('autoApplyChanges', value);
  addLog('Prompt Generator', `Auto-apply changes toggled: ${value ? 'ON' : 'OFF'}`, 'info');
};

export const setIsBuilding = (building: boolean) => {
  aiEditorStore.setKey('isBuilding', building);
  if (building) {
    addLog('Build Process', 'Build script started...', 'info');
  } else {
    addLog('Build Process', 'Build script finished.', 'info');
  }
};

// `setBuildOutput` is no longer needed as build output is logged directly to `logStore`.

export const showGlobalSnackbar = (
  message: string,
  severity: 'success' | 'error' | 'info',
) => {
  aiEditorStore.setKey('snackbar', {
    open: true,
    message,
    severity,
  });
  // SnackBar messages are transient, no need to add to persistent logs unless it's an error.
  if (severity === 'error') {
    addLog('UI Notification', `Snackbar Error: ${message}`, 'error', message);
  } else if (severity === 'info') {
    addLog('UI Notification', `Snackbar Info: ${message}`, 'info', message);
  } else if (severity === 'success') {
    addLog('UI Notification', `Snackbar Success: ${message}`, 'success', message);
  }
};

export const hideGlobalSnackbar = () => {
  aiEditorStore.setKey('snackbar', {
    ...aiEditorStore.get().snackbar,
    open: false,
  });
};

export const saveActiveFile = async () => {
  const { openedFile, openedFileContent } = aiEditorStore.get();

  if (!openedFile || openedFileContent === null) {
    showGlobalSnackbar('No file or content to save.', 'error');
    addLog('File Editor', 'Attempted to save, but no file or content available.', 'warning', undefined, undefined, true);
    return;
  }

  setIsSavingFileContent(true);
  setSaveFileContentError(null); // Clear local error

  try {
    const result = await writeFileContent(openedFile, openedFileContent);
    if (result.success) {
      setInitialFileContentSnapshot(openedFileContent);
      setIsOpenedFileDirty(false);
      showGlobalSnackbar(`File saved: ${openedFile}`, 'success');
      addLog('File Editor', `File saved: ${openedFile}`, 'success');
    } else {
      const msg = result.message || 'Failed to save file.';
      setSaveFileContentError(msg);
      showGlobalSnackbar(`Failed to save: ${msg}`, 'error');
      addLog('File Editor', `Failed to save file: ${openedFile}`, 'error', msg, undefined, true);
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    setSaveFileContentError(`Failed to save file: ${errorMessage}`);
    showGlobalSnackbar(`Error saving: ${errorMessage}`, 'error');
    addLog('File Editor', `Error saving file: ${openedFile}`, 'error', errorMessage, undefined, true);
  } finally {
    setIsSavingFileContent(false);
  }
};

export const discardActiveFileChanges = () => {
  const {
    openedFile,
    initialFileContentSnapshot,
    isOpenedFileDirty,
  } = aiEditorStore.get();

  if (!openedFile || !isOpenedFileDirty) {
    showGlobalSnackbar('No unsaved changes to discard.', 'info');
    addLog('File Editor', 'Attempted to discard, but no unsaved changes.', 'info');
    return;
  }

  if (
    window.confirm(
      'Are you sure you want to discard unsaved changes? This action cannot be undone.',
    )
  ) {
    setOpenedFileContent(initialFileContentSnapshot);
    setIsOpenedFileDirty(false);
    setSaveFileContentError(null);
    showGlobalSnackbar('Changes discarded.', 'info');
    addLog('File Editor', `Changes discarded for: ${openedFile}`, 'info');
  }
};

export const performPostApplyActions = async (
  projectRoot: string,
  llmResponse: ModelResponse,
  llmGeneratePayload: LlmGeneratePayload,
  scanPaths: string[],
) => {
  setIsBuilding(true); // Sets state for UI, and also logs start of build
  let buildPassed = false;
  try {
    addLog('Build Process', 'Running `pnpm run build`...', 'info', `Command: pnpm run build in ${projectRoot}`);
    const buildResult = await runTerminalCommand('pnpm run build', projectRoot);
    
    if (buildResult.exitCode !== 0) {
      addLog('Build Process', `Build failed with exit code ${buildResult.exitCode}.`, 'error', buildResult.stderr, buildResult, true);
      setError(`Build failed with exit code ${buildResult.exitCode}. Check output.`); // For immediate UI error
    } else {
      addLog('Build Process', 'Project built successfully.', 'success', buildResult.stdout, buildResult);
      buildPassed = true;
    }
  } catch (buildError) {
    const errorMsg = `Failed to run build script: ${buildError instanceof Error ? buildError.message : String(buildError)}`;
    addLog('Build Process', errorMsg, 'error', String(buildError), { stdout: '', stderr: String(buildError), exitCode: 1 }, true);
    setError(errorMsg);
  } finally {
    setIsBuilding(false); // Sets state for UI, and also logs end of build
  }

  if (
    buildPassed &&
    llmResponse?.gitInstructions &&
    llmResponse.gitInstructions.length > 0
  ) {
    addLog('Git Automation', 'Executing AI-suggested git instructions...', 'info');
    let gitCommandsSuccessful = true;
    for (const command of llmResponse.gitInstructions) {
      addLog('Git Automation', `Running git command: \`${command}\``, 'info', `Command: ${command} in ${projectRoot}`);
      try {
        const gitExecResult = await runTerminalCommand(command, projectRoot);
        
        if (gitExecResult.exitCode !== 0) {
          const errMsg = `Git command failed: \`${command}\` (Exit Code: ${gitExecResult.exitCode}). See stderr.`;
          addLog('Git Automation', errMsg, 'error', gitExecResult.stderr, gitExecResult, true);
          setError(errMsg);
          gitCommandsSuccessful = false;
          break;
        } else {
          addLog('Git Automation', `Git command succeeded: \`${command}\`.`, 'success', gitExecResult.stdout, gitExecResult);
        }
      } catch (gitExecError) {
        const errMsg = `Failed to execute git command \`${command}\`: ${gitExecError instanceof Error ? gitExecError.message : String(gitExecError)}`;
        addLog('Git Automation', errMsg, 'error', String(gitExecError), { stdout: '', stderr: String(gitExecError), exitCode: 1 }, true);
        setError(errMsg);
        gitCommandsSuccessful = false;
        break;
      }
    }
    if (gitCommandsSuccessful) {
      addLog('Git Automation', 'All AI-suggested git instructions executed successfully.', 'success');
    } else {
      addLog('Git Automation', 'Some AI-suggested git instructions failed.', 'warning', undefined, undefined, true);
    }
  }
};

export const applyAllProposedChanges = async (
  changes: FileChange[],
  projectRoot: string,
) => {
  const state = aiEditorStore.get(); // Get current state for payload/response references

  if (changes.length === 0) {
    addLog('AI Response Display', 'No changes to apply.', 'warning', undefined, undefined, true);
    setError('No changes to apply.');
    return;
  }
  if (!projectRoot) {
    addLog('AI Response Display', 'Project root is not set for applying changes.', 'error', undefined, undefined, true);
    setError('Project root is not set for applying changes.');
    return;
  }
  if (!state.lastLlmResponse || !state.lastLlmGeneratePayload) {
    const msg = 'AI generation response or payload missing for post-apply actions. Cannot proceed automatically.';
    addLog('AI Response Display', msg, 'error', undefined, undefined, true);
    setError(msg);
    return;
  }

  setApplyingChanges(true); // Logs start of apply process
  setError(null);
  setIsBuilding(false); // Make sure build is not considered running initially
  addLog('AI Response Display', `Initiating automatic application of ${changes.length} proposed changes...`, 'info');

  try {
    const result = await apiApplyProposedChanges(changes, projectRoot);
    result.messages.forEach(msg => addLog('AI Response Display', msg, 'info'));

    if (!result.success) {
      addLog('AI Response Display', 'Some changes failed to apply during automation.', 'error', result.messages.join('\n'), undefined, true);
      setError('Some changes failed to apply during automation. Check logs.');
    } else {
      addLog('AI Response Display', 'All changes applied successfully via automation. Proceeding with post-apply actions (build & git).', 'success');
      await performPostApplyActions(
        projectRoot,
        state.lastLlmResponse,
        state.lastLlmGeneratePayload,
        state.scanPathsInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      );
    }
    setLastLlmResponse(null); // Clears the UI for the next generation
    deselectAllChanges();
    clearDiff();
  } catch (err) {
    const errorMsg = `Overall failure during automatic application of changes: ${err instanceof Error ? err.message : String(err)}`;
    addLog('AI Response Display', errorMsg, 'error', String(err), undefined, true);
    setError(errorMsg);
  } finally {
    setApplyingChanges(false); // Logs end of apply process
  }
};