import { map } from 'nanostores';
import {
  AiEditorState,
  FileChange,
  ModelResponse,
  AddOrModifyFileChange,
  RequestType,
  LlmOutputFormat,
  LlmGeneratePayload,
} from '@/types';
import {
  INSTRUCTION,
  ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
} from '@/constants';
import {
  applyProposedChanges as apiApplyProposedChanges,
  LlmReportErrorApiPayload,
  LlmReportErrorContext,
} from '@/api/llm'; // Import LlmReportErrorApiPayload and Context
import { runTerminalCommand } from '@/api/terminal';
import { writeFileContent } from '@/api/file';

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
  error: null,
  scanPathsInput: 'src,package.json,README.md',
  lastLlmResponse: null,
  lastLlmGeneratePayload: null,
  selectedChanges: {},
  currentDiff: null,
  diffFilePath: null,
  applyingChanges: false,
  appliedMessages: [],
  gitInstructions: null,
  runningGitCommandIndex: null,
  commandExecutionOutput: null,
  commandExecutionError: null,
  openedFile: null,
  openedFileContent: null,
  initialFileContentSnapshot: null, // New: Snapshot of content when file was last loaded/saved
  isFetchingFileContent: false,
  fetchFileContentError: null,
  isSavingFileContent: false,
  saveFileContentError: null,
  isOpenedFileDirty: false,
  autoApplyChanges: false,
  isBuilding: false,
  buildOutput: null,
  openedTabs: [],
  snackbar: {
    open: false,
    message: '',
    severity: null,
  },
});

export const setInstruction = (instruction: string) => {
  aiEditorStore.setKey('instruction', instruction);
};

export const setAiInstruction = (instruction: string) => {
  aiEditorStore.setKey('aiInstruction', instruction);
};

export const setExpectedOutputInstruction = (instruction: string) => {
  aiEditorStore.setKey('expectedOutputInstruction', instruction);
};

export const setRequestType = (type: RequestType) => {
  aiEditorStore.setKey('requestType', type);
};

export const setLlmOutputFormat = (format: LlmOutputFormat) => {
  aiEditorStore.setKey('llmOutputFormat', format);
};

export const setUploadedFile = (
  data: string | null,
  mimeType: string | null,
  fileName: string | null,
) => {
  aiEditorStore.setKey('uploadedFileData', data);
  aiEditorStore.setKey('uploadedFileMimeType', mimeType);
  aiEditorStore.setKey('uploadedFileName', fileName);
};

export const setResponse = (response: string | null) => {
  aiEditorStore.setKey('response', response);
};

export const setLoading = (isLoading: boolean) => {
  aiEditorStore.setKey('loading', isLoading);
};

export const setError = (message: string | null) => {
  aiEditorStore.setKey('error', message);
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
    selectedChanges: {},
    currentDiff: null,
    diffFilePath: null,
    applyingChanges: false,
    appliedMessages: [],
    gitInstructions: null,
    runningGitCommandIndex: null,
    commandExecutionOutput: null,
    commandExecutionError: null,
    openedFile: null,
    openedFileContent: null,
    initialFileContentSnapshot: null, // Clear on full state clear
    isFetchingFileContent: false,
    fetchFileContentError: null,
    isSavingFileContent: false,
    saveFileContentError: null,
    isOpenedFileDirty: false,
    autoApplyChanges: false,
    isBuilding: false,
    buildOutput: null,
    openedTabs: [],
    snackbar: {
      open: false,
      message: '',
      severity: null,
    },
  });
};

export const setScanPathsInput = (paths: string) => {
  aiEditorStore.setKey('scanPathsInput', paths);
};

export const setLastLlmResponse = (response: ModelResponse | null) => {
  aiEditorStore.setKey('lastLlmResponse', response);
  // Auto-select all changes when a new response comes in (for manual apply)
  if (response && response.changes) {
    const newSelectedChanges: Record<string, FileChange> = {};
    response.changes.forEach((change) => {
      newSelectedChanges[change.filePath] = change;
    });
    aiEditorStore.setKey('selectedChanges', newSelectedChanges);
  }
  aiEditorStore.setKey('gitInstructions', response?.gitInstructions || null);
  // Clear selected changes if no response or no changes
  if (!response || !response.changes) {
    aiEditorStore.setKey('selectedChanges', {});
  }
};

export const setLastLlmGeneratePayload = (
  payload: LlmGeneratePayload | null,
) => {
  aiEditorStore.setKey('lastLlmGeneratePayload', payload);
};

export const toggleSelectedChange = (change: FileChange) => {
  const state = aiEditorStore.get();
  const newSelected = { ...state.selectedChanges };
  if (newSelected[change.filePath]) {
    delete newSelected[change.filePath];
  } else {
    newSelected[change.filePath] = change;
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
  }
};

export const deselectAllChanges = () => {
  aiEditorStore.setKey('selectedChanges', {});
};

export const setCurrentDiff = (
  filePath: string | null,
  diffContent: string | null,
) => {
  aiEditorStore.setKey('diffFilePath', filePath);
  aiEditorStore.setKey('currentDiff', diffContent);
};

export const clearDiff = () => {
  aiEditorStore.setKey('currentDiff', null);
  aiEditorStore.setKey('diffFilePath', null);
};

export const setApplyingChanges = (isApplying: boolean) => {
  aiEditorStore.setKey('applyingChanges', isApplying);
};

export const setAppliedMessages = (messages: string[]) => {
  aiEditorStore.setKey('appliedMessages', messages);
};

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
};

export const updateProposedChangePath = (
  oldFilePath: string,
  newFilePath: string,
) => {
  const state = aiEditorStore.get();
  if (!state.lastLlmResponse) {
    console.warn(
      'Cannot update proposed change path: No LLM response available.',
    );
    setError('New file path cannot be empty.');
    return;
  }

  const trimmedNewFilePath = newFilePath.trim();
  if (!trimmedNewFilePath) {
    console.warn(
      'Cannot update proposed change path: New file path cannot be empty.',
    );
    setError('New file path cannot be empty.');
    return;
  }
  if (trimmedNewFilePath === oldFilePath) {
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
    console.warn(
      `File change for path '${oldFilePath}' not found in lastLlmResponse. No update performed.`,
    );
    setError(`Could not find change for path: ${oldFilePath}`);
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
};

export const addOpenedTab = (filePath: string) => {
  const state = aiEditorStore.get();
  if (!state.openedTabs.includes(filePath)) {
    aiEditorStore.setKey('openedTabs', [...state.openedTabs, filePath]);
  }
};

export const removeOpenedTab = (filePath: string) => {
  const state = aiEditorStore.get();
  const newOpenedTabs = state.openedTabs.filter((tab) => tab !== filePath);
  aiEditorStore.setKey('openedTabs', newOpenedTabs);

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
  }
  aiEditorStore.setKey('openedFileContent', null);
  aiEditorStore.setKey('initialFileContentSnapshot', null); // Clear snapshot when changing opened file
  aiEditorStore.setKey('isFetchingFileContent', false);
  aiEditorStore.setKey('fetchFileContentError', null);
  aiEditorStore.setKey('isSavingFileContent', false);
  aiEditorStore.setKey('saveFileContentError', null);
  aiEditorStore.setKey('isOpenedFileDirty', false);
};

export const setOpenedFileContent = (content: string | null) => {
  aiEditorStore.setKey('openedFileContent', content);
  // isOpenedFileDirty is now computed in OpenedFileViewer based on initialFileContentSnapshot
  aiEditorStore.setKey('saveFileContentError', null);
};

export const setInitialFileContentSnapshot = (content: string | null) => {
  aiEditorStore.setKey('initialFileContentSnapshot', content);
};

export const setIsFetchingFileContent = (isLoading: boolean) => {
  aiEditorStore.setKey('isFetchingFileContent', isLoading);
};

export const setFetchFileContentError = (message: string | null) => {
  aiEditorStore.setKey('fetchFileContentError', message);
};

export const setIsSavingFileContent = (isLoading: boolean) => {
  aiEditorStore.setKey('isSavingFileContent', isLoading);
};

export const setSaveFileContentError = (message: string | null) => {
  aiEditorStore.setKey('saveFileContentError', message);
};

export const setIsOpenedFileDirty = (isDirty: boolean) => {
  aiEditorStore.setKey('isOpenedFileDirty', isDirty);
};

export const setRunningGitCommandIndex = (index: number | null) => {
  aiEditorStore.setKey('runningGitCommandIndex', index);
};

export const setCommandExecutionOutput = (
  output: { stdout: string; stderr: string; exitCode: number } | null,
) => {
  aiEditorStore.setKey('commandExecutionOutput', output);
};

export const setCommandExecutionError = (error: string | null) => {
  aiEditorStore.setKey('commandExecutionError', error);
};

export const setAutoApplyChanges = (value: boolean) => {
  aiEditorStore.setKey('autoApplyChanges', value);
};

export const setIsBuilding = (building: boolean) => {
  aiEditorStore.setKey('isBuilding', building);
};

export const setBuildOutput = (
  output: { stdout: string; stderr: string; exitCode: number } | null,
) => {
  aiEditorStore.setKey('buildOutput', output);
};

export const showGlobalSnackbar = (
  message: string,
  severity: 'success' | 'error' | 'info',
) => {
  aiEditorStore.setKey('snackbar', {
    open: true,
    message,
    severity,
  });
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
    return;
  }

  setIsSavingFileContent(true);
  setSaveFileContentError(null);

  try {
    const result = await writeFileContent(openedFile, openedFileContent);
    if (result.success) {
      setInitialFileContentSnapshot(openedFileContent); // Update snapshot to new saved content
      setIsOpenedFileDirty(false); // Mark as clean after saving
      showGlobalSnackbar(`File saved: ${openedFile}`, 'success');
    } else {
      setSaveFileContentError(result.message || 'Failed to save file.');
      showGlobalSnackbar(
        `Failed to save: ${result.message || openedFile}`,
        'error',
      );
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    setSaveFileContentError(`Failed to save file: ${errorMessage}`);
    showGlobalSnackbar(`Error saving: ${errorMessage}`, 'error');
  } finally {
    setIsSavingFileContent(false);
  }
};

export const discardActiveFileChanges = () => {
  const {
    openedFile,
    openedFileContent,
    initialFileContentSnapshot,
    isOpenedFileDirty,
  } = aiEditorStore.get();

  if (!openedFile || !isOpenedFileDirty) {
    showGlobalSnackbar('No unsaved changes to discard.', 'info');
    return;
  }

  if (
    window.confirm(
      'Are you sure you want to discard unsaved changes? This action cannot be undone.',
    )
  ) {
    setOpenedFileContent(initialFileContentSnapshot); // Revert to snapshot
    setIsOpenedFileDirty(false); // Mark as clean
    setSaveFileContentError(null); // Clear any save errors
    showGlobalSnackbar('Changes discarded.', 'info');
  }
};

/**
 * Orchestrates post-application actions: running a build script and then AI-suggested Git commands.
 * This function centralizes logic used by both manual and auto-apply flows.
 */
export const performPostApplyActions = async (
  projectRoot: string,
  llmResponse: ModelResponse,
  llmGeneratePayload: LlmGeneratePayload,
  scanPaths: string[],
) => {
  const state = aiEditorStore.get();

  // Run the build script
  setIsBuilding(true); // Start build-specific loading indicator
  let buildPassed = false;
  try {
    const buildResult = await runTerminalCommand('pnpm run build', projectRoot);
    setBuildOutput(buildResult);

    if (buildResult.exitCode !== 0) {
      setError(
        `Build failed with exit code ${buildResult.exitCode}. Check output.`,
      );
      // Removed reportErrorToLlm call here
    } else {
      setAppliedMessages([
        ...state.appliedMessages,
        'Project built successfully.',
      ]);
      buildPassed = true;
    }
  } catch (buildError) {
    setBuildOutput({ stdout: '', stderr: String(buildError), exitCode: 1 });
    setError(
      `Failed to run build script: ${buildError instanceof Error ? buildError.message : String(buildError)}`,
    );
    // Removed reportErrorToLlm call here
  } finally {
    setIsBuilding(false); // End build-specific loading indicator
  }

  // If build was successful, proceed to run git instructions
  if (
    buildPassed &&
    llmResponse?.gitInstructions &&
    llmResponse.gitInstructions.length > 0
  ) {
    setAppliedMessages([
      ...aiEditorStore.get().appliedMessages,
      'Executing AI-suggested git instructions...',
    ]);
    let gitCommandsSuccessful = true;
    for (const command of llmResponse.gitInstructions) {
      setAppliedMessages([
        ...aiEditorStore.get().appliedMessages,
        `Running git command: \`${command}\``,
      ]);
      try {
        const gitExecResult = await runTerminalCommand(command, projectRoot);
        // Append individual command results to applied messages for visibility
        setAppliedMessages([
          ...aiEditorStore.get().appliedMessages,
          `Git command output for \`${command}\` (Exit Code: ${gitExecResult.exitCode}):`,
          `  Stdout: ${gitExecResult.stdout || 'None'} `,
          `  Stderr: ${gitExecResult.stderr || 'None'} `,
        ]);

        if (gitExecResult.exitCode !== 0) {
          const errMsg = `Git command failed: \`${command}\` (Exit Code: ${gitExecResult.exitCode}). See stderr above.`;
          setAppliedMessages([...aiEditorStore.get().appliedMessages, errMsg]);
          setError(errMsg); // Show a persistent error for failed git command
          gitCommandsSuccessful = false;
          // Removed reportErrorToLlm call here
          break; // Stop executing further git commands on first failure
        }
      } catch (gitExecError) {
        const errMsg = `Failed to execute git command \`${command}\`: ${gitExecError instanceof Error ? gitExecError.message : String(gitExecError)}`;
        setAppliedMessages([...aiEditorStore.get().appliedMessages, errMsg]);
        setError(errMsg);
        gitCommandsSuccessful = false;
        // Removed reportErrorToLlm call here
        break; // Stop executing further git commands on first failure
      }
    }
    if (gitCommandsSuccessful) {
      setAppliedMessages([
        ...aiEditorStore.get().appliedMessages,
        'All AI-suggested git instructions executed successfully.',
      ]);
    } else {
      setAppliedMessages([
        ...aiEditorStore.get().appliedMessages,
        'Some AI-suggested git instructions failed.',
      ]);
    }
  }
};

/**
 * Applies all provided changes to the file system.
 * This is typically used for automated application of AI responses.
 * @param changes An array of FileChange objects to apply.
 * @param projectRoot The root directory of the project.
 */
export const applyAllProposedChanges = async (
  changes: FileChange[],
  projectRoot: string,
) => {
  const state = aiEditorStore.get();

  if (changes.length === 0) {
    setError('No changes to apply.');
    return;
  }
  if (!projectRoot) {
    setError('Project root is not set for applying changes.');
    return;
  }
  if (!state.lastLlmResponse || !state.lastLlmGeneratePayload) {
    setError(
      'AI generation response or payload missing for post-apply actions. Cannot proceed automatically.',
    );
    return;
  }

  setApplyingChanges(true);
  setError(null); // Clear previous error
  setAppliedMessages([]);
  setBuildOutput(null); // Clear previous build output before applying changes
  setIsBuilding(false); // Ensure building state is reset
  setCommandExecutionError(null); // Clear any previous individual git command outputs
  setCommandExecutionOutput(null);

  try {
    const result = await apiApplyProposedChanges(changes, projectRoot);
    setAppliedMessages(result.messages);
    if (!result.success) {
      setError(
        'Some changes failed to apply during automation. Check messages above.',
      );
      // Removed reportErrorToLlm call here
    } else {
      // If changes applied successfully, perform post-apply actions (build + git)
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
    // Clear the AI response and selected changes after applying automatically
    setLastLlmResponse(null);
    deselectAllChanges();
    clearDiff();
  } catch (err) {
    setError(
      `Overall failure during automatic application of changes: ${err instanceof Error ? err.message : String(err)}`,
    );
    // Removed reportErrorToLlm call here
  } finally {
    setApplyingChanges(false);
  }
};
