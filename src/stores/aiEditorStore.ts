import { map } from 'nanostores';
import {
  AiEditorState,
  FileChange,
  ModelResponse,
  AddOrModifyFileChange,
  DeleteOrAnalyzeFileChange,
} from '@/types/index';

export const aiEditorStore = map<AiEditorState>({
  instruction: '',
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
  openedFile: null, // Path of the file currently opened in the right editor panel
  openedFileContent: null, // Content of the file currently opened
  isFetchingFileContent: false, // Loading state for fetching opened file content
  fetchFileContentError: null, // Error state for fetching opened file content
});

export const setInstruction = (instruction: string) => {
  aiEditorStore.setKey('instruction', instruction);
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
  } else {
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

export const setCurrentDiff = (filePath: string | null, diffContent: string | null) => {
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

export const updateProposedChangeContent = (filePath: string, newContent: string) => {
  const state = aiEditorStore.get(); // Get current state
  if (!state.lastLlmResponse) return; // No change if there's no LLM response

  // Update changes in lastLlmResponse
  const updatedChanges: FileChange[] = state.lastLlmResponse.changes.map((change) => {
    if (change.filePath === filePath) {
      if (change.action === 'add' || change.action === 'modify' || change.action === 'repair') {
        // Type guard ensures 'change' is AddOrModifyFileChange here
        return { ...(change as AddOrModifyFileChange), newContent };
      }
      // For 'delete' or 'analyze' actions, newContent is not applicable.
      return change; // Return the original change without modifying newContent
    }
    return change;
  });

  // Update changes in selectedChanges
  const newSelectedChanges: Record<string, FileChange> = { ...state.selectedChanges };
  const selectedChange = newSelectedChanges[filePath];

  if (selectedChange) {
    if (
      selectedChange.action === 'add' ||
      selectedChange.action === 'modify' ||
      selectedChange.action === 'repair'
    ) {
      // Type guard ensures 'selectedChange' is AddOrModifyFileChange here
      newSelectedChanges[filePath] = { ...(selectedChange as AddOrModifyFileChange), newContent };
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
