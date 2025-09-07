import { map } from 'nanostores';
import {
  AiEditorState,
  FileChange,
  ModelResponse,
  AddOrModifyFileChange,
  DeleteOrAnalyzeFileChange,
  RequestType,
  LlmOutputFormat,
  LlmGeneratePayload, // New: Import for lastLlmGeneratePayload
  LlmReportErrorPayload, // New: Import for error reporting
} from '@/types/index';
import {
  INSTRUCTION,
  ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
  MARKDOWN_ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
  YAML_ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
  TEXT_ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
} from '@/constants';
import {
  applyProposedChanges as apiApplyProposedChanges,
  reportErrorToLlm,
} from '@/api/llm'; // Rename to avoid conflict, New: Import reportErrorToLlm
import { runTerminalCommand } from '@/api/terminal'; // New: Import for running build script

export const aiEditorStore = map<AiEditorState>({
  instruction: '',
  aiInstruction: INSTRUCTION, // Initialize with default INSTRUCTION
  expectedOutputInstruction: ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT, // Initialize with default (JSON)
  requestType: RequestType.LLM_GENERATION, // Default request type changed to LLM_GENERATION
  llmOutputFormat: LlmOutputFormat.YAML, // New: Default LLM output format changed to YAML
  uploadedFileData: null,
  uploadedFileMimeType: null,
  uploadedFileName: null, // New: Add uploadedFileName to state
  currentProjectPath: null, // Initialized to null, will be set from VITE_BASE_DIR or user input
  response: null,
  loading: false,
  error: null,
  scanPathsInput: 'src,package.json,README.md', // Initialize with default scan paths
  lastLlmResponse: null, // Stores the full structured response from LLM
  lastLlmGeneratePayload: null, // New: Stores the last payload sent to generateCode
  selectedChanges: {}, // Map of filePath to FileChange for selected items
  currentDiff: null, // The content of the diff for the currently viewed file
  diffFilePath: null, // The filePath of the file whose diff is currently displayed
  applyingChanges: false, // New state for tracking if changes are being applied
  appliedMessages: [], // Messages from the backend after applying changes
  gitInstructions: null, // New: Optional git commands from LLM response
  runningGitCommandIndex: null, // New: Index of the git command currently being executed
  commandExecutionOutput: null, // New: Output from the last git command execution
  commandExecutionError: null, // New: Error from the last git command execution
  openedFile: null, // Path of the file currently opened in the right editor panel
  openedFileContent: null, // Content of the file currently opened
  isFetchingFileContent: false, // Loading state for fetching opened file content
  fetchFileContentError: null, // Error state for fetching opened file content
  isSavingFileContent: false, // New: Initialize isSavingFileContent
  saveFileContentError: null, // New: Initialize saveFileContentError
  isOpenedFileDirty: false, // New: Initialize isOpenedFileDirty
  autoApplyChanges: false, // New: Automatically apply changes after generation
  isBuilding: false, // New: Initialize isBuilding state
  buildOutput: null, // New: Initialize buildOutput state
  openedTabs: [], // New: Initialize openedTabs array
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
  fileName: string | null, // Added fileName parameter
) => {
  aiEditorStore.setKey('uploadedFileData', data);
  aiEditorStore.setKey('uploadedFileMimeType', mimeType);
  aiEditorStore.setKey('uploadedFileName', fileName); // Set uploadedFileName
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
    aiInstruction: INSTRUCTION, // Reset to default
    expectedOutputInstruction: ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT, // Reset to JSON default
    requestType: RequestType.LLM_GENERATION, // Reset to default, which is now LLM_GENERATION
    llmOutputFormat: LlmOutputFormat.YAML, // Reset to YAML default
    uploadedFileData: null,
    uploadedFileMimeType: null,
    uploadedFileName: null, // Reset uploadedFileName
    currentProjectPath: null,
    response: null,
    loading: false,
    error: null,
    scanPathsInput: 'src,package.json,README.md', // Reset to default scan paths as well
    lastLlmResponse: null,
    lastLlmGeneratePayload: null, // New: Reset lastLlmGeneratePayload
    selectedChanges: {},
    currentDiff: null,
    diffFilePath: null,
    applyingChanges: false,
    appliedMessages: [],
    gitInstructions: null, // Reset to null
    runningGitCommandIndex: null,
    commandExecutionOutput: null,
    commandExecutionError: null,
    openedFile: null,
    openedFileContent: null,
    isFetchingFileContent: false,
    fetchFileContentError: null,
    isSavingFileContent: false, // Reset new states
    saveFileContentError: null, // Reset new states
    isOpenedFileDirty: false, // Reset new states
    autoApplyChanges: false, // Reset to default
    isBuilding: false, // Reset build state
    buildOutput: null, // Reset build output
    openedTabs: [], // New: Reset openedTabs
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
      newSelectedChanges[change.filePath] = change; // Select all by default
    });
    aiEditorStore.setKey('selectedChanges', newSelectedChanges);
  }
  aiEditorStore.setKey('gitInstructions', response?.gitInstructions || null); // New: Set git instructions
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
  const state = aiEditorStore.get(); // Get current state
  const newSelected = { ...state.selectedChanges };
  if (newSelected[change.filePath]) {
    delete newSelected[change.filePath];
  } else {
    newSelected[change.filePath] = change;
  }
  aiEditorStore.set({ ...state, selectedChanges: newSelected }); // Set new full state
};

export const selectAllChanges = () => {
  const state = aiEditorStore.get(); // Get current state
  if (state.lastLlmResponse?.changes) {
    const newSelectedChanges: Record<string, FileChange> = {};
    state.lastLlmResponse.changes.forEach((change) => {
      newSelectedChanges[change.filePath] = change;
    });
    aiEditorStore.set({ ...state, selectedChanges: newSelectedChanges }); // Set new full state
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
  const state = aiEditorStore.get(); // Get current state
  if (!state.lastLlmResponse) return; // No change if there's no LLM response

  // Update changes in lastLlmResponse
  const updatedChanges: FileChange[] = state.lastLlmResponse.changes.map(
    (change) => {
      if (change.filePath === filePath) {
        if (
          change.action === 'add' ||
          change.action === 'modify' ||
          change.action === 'repair'
        ) {
          // Type guard ensures 'change' is AddOrModifyFileChange here
          return { ...(change as AddOrModifyFileChange), newContent };
        }
        // For 'delete' or 'analyze' actions, newContent is not applicable.
        return change; // Return the original change without modifying newContent
      }
      return change;
    },
  );

  // Update changes in selectedChanges
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
      // Type guard ensures 'selectedChange' is AddOrModifyFileChange here
      newSelectedChanges[filePath] = {
        ...(selectedChange as AddOrModifyFileChange), // Corrected line: Removed the extra '{'
        newContent,
      };
    }
    // For 'delete' or 'analyze' actions, newContent is not applicable.
    // So, no need to modify newSelectedChanges[filePath] for these actions.
  }

  aiEditorStore.set({
    // Set new full state
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
    setError('New file path cannot be empty.'); // Ensure error is set even if early exit
    return;
  }

  // Ensure newFilePath is not empty and different from oldFilePath
  const trimmedNewFilePath = newFilePath.trim();
  if (!trimmedNewFilePath) {
    console.warn(
      'Cannot update proposed change path: New file path cannot be empty.',
    );
    setError('New file path cannot be empty.');
    return;
  }
  if (trimmedNewFilePath === oldFilePath) {
    // No change, do nothing
    return;
  }

  // 1. Update lastLlmResponse.changes array
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

  // 2. Update selectedChanges map (if the item was selected)
  const newSelectedChanges: Record<string, FileChange> = {
    ...state.selectedChanges,
  };
  if (newSelectedChanges[oldFilePath]) {
    // Create a new entry with the new key and updated filePath, then delete the old key
    newSelectedChanges[trimmedNewFilePath] = {
      ...newSelectedChanges[oldFilePath],
      filePath: trimmedNewFilePath,
    };
    delete newSelectedChanges[oldFilePath];
  }

  // 3. Clear currentDiff if it was for the old file
  let newDiffFilePath = state.diffFilePath;
  let newCurrentDiff = state.currentDiff;
  if (state.diffFilePath === oldFilePath) {
    newDiffFilePath = null; // Clear the diff view, as the file path has changed
    newCurrentDiff = null;
  }

  aiEditorStore.set({
    // Set new full state
    ...state,
    lastLlmResponse: { ...state.lastLlmResponse, changes: updatedChanges },
    selectedChanges: newSelectedChanges,
    diffFilePath: newDiffFilePath,
    currentDiff: newCurrentDiff,
  });
};

// Actions for opened file content
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

  // If the closed tab was the currently active file
  if (state.openedFile === filePath) {
    if (newOpenedTabs.length > 0) {
      // Find index of closed tab in the *original* array to determine neighbor
      const oldIndex = state.openedTabs.indexOf(filePath);
      const newActiveFile =
        oldIndex > 0 ? newOpenedTabs[oldIndex - 1] : newOpenedTabs[0];
      setOpenedFile(newActiveFile); // This will recursively call addOpenedTab, but that's fine as it's idempotent.
    } else {
      setOpenedFile(null); // No more tabs, close editor
    }
  }
};

export const setOpenedFile = (filePath: string | null) => {
  aiEditorStore.setKey('openedFile', filePath);
  // Ensure the file is added to openedTabs if it's being opened.
  if (filePath && !aiEditorStore.get().openedTabs.includes(filePath)) {
    addOpenedTab(filePath);
  }
  // Clear content and errors when a new file is opened or file is closed
  aiEditorStore.setKey('openedFileContent', null);
  aiEditorStore.setKey('isFetchingFileContent', false);
  aiEditorStore.setKey('fetchFileContentError', null);
  aiEditorStore.setKey('isSavingFileContent', false); // Reset saving state
  aiEditorStore.setKey('saveFileContentError', null); // Reset saving error
  aiEditorStore.setKey('isOpenedFileDirty', false); // Reset dirty state
};

export const setOpenedFileContent = (content: string | null) => {
  aiEditorStore.setKey('openedFileContent', content);
  // Mark file as dirty if content changes from initial load and is not null
  if (content !== null) {
    aiEditorStore.setKey('isOpenedFileDirty', true);
  } else {
    // If content becomes null (e.g., file closed), it's no longer dirty
    aiEditorStore.setKey('isOpenedFileDirty', false);
  }
  aiEditorStore.setKey('saveFileContentError', null); // Clear save error on new input
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

// New actions for running git commands
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

// New actions for build process
export const setIsBuilding = (building: boolean) => {
  aiEditorStore.setKey('isBuilding', building);
};

export const setBuildOutput = (
  output: { stdout: string; stderr: string; exitCode: number } | null,
) => {
  aiEditorStore.setKey('buildOutput', output);
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

  setApplyingChanges(true);
  setError(null); // Clear previous error
  setAppliedMessages([]);
  setBuildOutput(null); // Clear previous build output before applying changes

  try {
    const result = await apiApplyProposedChanges(changes, projectRoot); // Use the aliased import
    setAppliedMessages(result.messages);
    if (!result.success) {
      setError(
        'Some changes failed to apply during automation. Check messages above.',
      );
      // New: Report error to LLM if changes failed to apply
      if (state.lastLlmResponse && state.lastLlmGeneratePayload) {
        await reportErrorToLlm({
          error: 'Failed to apply proposed changes automatically.',
          errorDetails: JSON.stringify(result.messages),
          originalRequestType: state.lastLlmGeneratePayload.requestType,
          previousLlmResponse: state.lastLlmResponse,
          originalLlmGeneratePayload: state.lastLlmGeneratePayload,
          projectRoot: projectRoot,
          scanPaths: state.scanPathsInput
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
          projectRoot,
        );
        setBuildOutput(buildResult);
        if (buildResult.exitCode !== 0) {
          setError(
            `Build failed with exit code ${buildResult.exitCode}. Check output.`,
          );
          // New: Report build failure to LLM
          if (state.lastLlmResponse && state.lastLlmGeneratePayload) {
            await reportErrorToLlm({
              error: `Build failed after applying changes. Exit Code: ${buildResult.exitCode}.`,
              errorDetails: buildResult.stderr || buildResult.stdout,
              originalRequestType: state.lastLlmGeneratePayload.requestType,
              previousLlmResponse: state.lastLlmResponse,
              originalLlmGeneratePayload: state.lastLlmGeneratePayload,
              projectRoot: projectRoot,
              scanPaths: state.scanPathsInput
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
              buildOutput: buildResult,
            });
          }
        } else {
          // Corrected nanostore array update: get current, create new array, then set
          const currentMessages = aiEditorStore.get().appliedMessages;
          setAppliedMessages([
            ...currentMessages,
            'Project built successfully.',
          ]);
        }
      } catch (buildError) {
        setBuildOutput({ stdout: '', stderr: String(buildError), exitCode: 1 });
        setError(
          `Failed to run build script: ${buildError instanceof Error ? buildError.message : String(buildError)}`,
        );
        // New: Report build script execution error to LLM
        if (state.lastLlmResponse && state.lastLlmGeneratePayload) {
          await reportErrorToLlm({
            error: `Failed to execute build script: ${buildError instanceof Error ? buildError.message : String(buildError)}`,
            errorDetails: String(buildError),
            originalRequestType: state.lastLlmGeneratePayload.requestType,
            previousLlmResponse: state.lastLlmResponse,
            originalLlmGeneratePayload: state.lastLlmGeneratePayload,
            projectRoot: projectRoot,
            scanPaths: state.scanPathsInput
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
    // Clear the AI response and selected changes after applying automatically
    setLastLlmResponse(null); // Clear the full response
    deselectAllChanges(); // Ensure selected changes are cleared
    clearDiff();
  } catch (err) {
    setError(
      `Failed to apply changes automatically: ${err instanceof Error ? err.message : String(err)}`,
    );
    // New: Report overall apply changes error to LLM
    const currentStoreState = aiEditorStore.get();
    if (
      currentStoreState.lastLlmResponse &&
      currentStoreState.lastLlmGeneratePayload
    ) {
      await reportErrorToLlm({
        error: `Overall failure during automatic application of changes: ${err instanceof Error ? err.message : String(err)}`,
        errorDetails: String(err),
        originalRequestType:
          currentStoreState.lastLlmGeneratePayload.requestType,
        previousLlmResponse: currentStoreState.lastLlmResponse,
        originalLlmGeneratePayload: currentStoreState.lastLlmGeneratePayload,
        projectRoot: projectRoot,
        scanPaths: currentStoreState.scanPathsInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });
    }
  } finally {
    setApplyingChanges(false);
  }
};
