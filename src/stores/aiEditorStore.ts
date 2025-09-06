import { map } from 'nanostores';
import {
  AiEditorState,
  FileChange,
  ModelResponse,
  AddOrModifyFileChange,
  DeleteOrAnalyzeFileChange,
  RequestType,
} from '@/types/index';
import {
  INSTRUCTION,
  ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
} from '@/constants';

export const aiEditorStore = map<AiEditorState>({
  instruction: '',
  aiInstruction: INSTRUCTION, // Initialize with default INSTRUCTION
  expectedOutputInstruction: ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT, // Initialize with default
  requestType: RequestType.LLM_GENERATION, // Default request type changed to LLM_GENERATION
  uploadedFileData: null,
  uploadedFileMimeType: null,
  currentProjectPath: null, // Initialized to null, will be set from VITE_BASE_DIR or user input
  response: null,
  loading: false,
  error: null,
  scanPathsInput: 'src,package.json,README.md', // Initialize with default scan paths
  lastLlmResponse: null, // Stores the full structured response from LLM
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

export const setUploadedFile = (
  data: string | null,
  mimeType: string | null,
) => {
  aiEditorStore.setKey('uploadedFileData', data);
  aiEditorStore.setKey('uploadedFileMimeType', mimeType);
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
    expectedOutputInstruction: ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT, // Reset to default
    requestType: RequestType.LLM_GENERATION, // Reset to default, which is now LLM_GENERATION
    uploadedFileData: null,
    uploadedFileMimeType: null,
    currentProjectPath: null,
    response: null,
    loading: false,
    error: null,
    scanPathsInput: 'src,package.json,README.md', // Reset to default scan paths as well
    lastLlmResponse: null,
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
  });
};

export const setScanPathsInput = (paths: string) => {
  aiEditorStore.setKey('scanPathsInput', paths);
};

export const setLastLlmResponse = (response: ModelResponse | null) => {
  aiEditorStore.setKey('lastLlmResponse', response);
  // Auto-select all changes when a new response comes in
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
        ...(selectedChange as AddOrModifyFileChange),
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
    ...state,
    lastLlmResponse: { ...state.lastLlmResponse, changes: updatedChanges },
    selectedChanges: newSelectedChanges,
    diffFilePath: newDiffFilePath,
    currentDiff: newCurrentDiff,
  });
};

// Actions for opened file content
export const setOpenedFile = (filePath: string | null) => {
  aiEditorStore.setKey('openedFile', filePath);
  // Clear content and errors when a new file is opened or file is closed
  aiEditorStore.setKey('openedFileContent', null);
  aiEditorStore.setKey('isFetchingFileContent', false);
  aiEditorStore.setKey('fetchFileContentError', null);
};

export const setOpenedFileContent = (content: string | null) => {
  aiEditorStore.setKey('openedFileContent', content);
};

export const setIsFetchingFileContent = (isLoading: boolean) => {
  aiEditorStore.setKey('isFetchingFileContent', isLoading);
};

export const setFetchFileContentError = (message: string | null) => {
  aiEditorStore.setKey('fetchFileContentError', message);
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
