import { map } from 'nanostores';
import {
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
import { applyProposedChanges as apiApplyProposedChanges } from '@/api/llm';
import { runTerminalCommand } from '@/api/terminal';
import { writeFileContent } from '@/api/file';
import { addLog } from './logStore';

export * from '@/stores/snackbarStore';

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
  response: string | null;
  loading: boolean;
  error: string | null;
  scanPathsInput: string;
  lastLlmResponse: ModelResponse | null;
  lastLlmGeneratePayload: LlmGeneratePayload | null;
  lastLlmGeneratePayloadString: string | null;
  selectedChanges: Record<string, FileChange>;
  currentDiff: string | null;
  diffFilePath: string | null;
  applyingChanges: boolean;
  gitInstructions: string[] | null;
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
  openedTabs: string[];
}

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
});

export const setInstruction = (instruction: string) =>
  aiEditorStore.setKey('instruction', instruction);

export const setAiInstruction = (instruction: string) =>
  aiEditorStore.setKey('aiInstruction', instruction);

export const setExpectedOutputInstruction = (instruction: string) =>
  aiEditorStore.setKey('expectedOutputInstruction', instruction);

export const setRequestType = (type: RequestType) =>
  aiEditorStore.setKey('requestType', type);

export const setLlmOutputFormat = (format: LlmOutputFormat) =>
  aiEditorStore.setKey('llmOutputFormat', format);

export const setUploadedFile = (
  data: string | null,
  mimeType: string | null,
  fileName: string | null,
) => {
  aiEditorStore.setKey('uploadedFileData', data);
  aiEditorStore.setKey('uploadedFileMimeType', mimeType);
  aiEditorStore.setKey('uploadedFileName', fileName);
};

export const setResponse = (response: string | null) =>
  aiEditorStore.setKey('response', response);

export const setLoading = (isLoading: boolean) =>
  aiEditorStore.setKey('loading', isLoading);

export const setError = (message: string | null) =>
  aiEditorStore.setKey('error', message);

export const clearState = () =>
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
  });

export const setScanPathsInput = (paths: string) =>
  aiEditorStore.setKey('scanPathsInput', paths);

export const setLastLlmResponse = (response: ModelResponse | null) => {
  aiEditorStore.setKey('lastLlmResponse', response);
  if (response?.changes) {
    const newSelectedChanges: Record<string, FileChange> = {};
    response.changes.forEach((c) => (newSelectedChanges[c.filePath] = c));
    aiEditorStore.setKey('selectedChanges', newSelectedChanges);
  } else {
    aiEditorStore.setKey('selectedChanges', {});
  }
  aiEditorStore.setKey('gitInstructions', response?.gitInstructions || null);
};

export const setLastLlmGeneratePayload = (payload: LlmGeneratePayload | null) =>
  aiEditorStore.setKey('lastLlmGeneratePayload', payload);

export const toggleSelectedChange = (change: FileChange) => {
  const state = aiEditorStore.get();
  const selected = { ...state.selectedChanges };
  selected[change.filePath]
    ? delete selected[change.filePath]
    : (selected[change.filePath] = change);
  aiEditorStore.setKey('selectedChanges', selected);
};

export const selectAllChanges = () => {
  const state = aiEditorStore.get();
  if (state.lastLlmResponse?.changes) {
    const all: Record<string, FileChange> = {};
    state.lastLlmResponse.changes.forEach((c) => (all[c.filePath] = c));
    aiEditorStore.setKey('selectedChanges', all);
  }
};

export const deselectAllChanges = () =>
  aiEditorStore.setKey('selectedChanges', {});

export const setCurrentDiff = (
  filePath: string | null,
  diff: string | null,
) => {
  aiEditorStore.setKey('diffFilePath', filePath);
  aiEditorStore.setKey('currentDiff', diff);
};

export const clearDiff = () => {
  aiEditorStore.setKey('diffFilePath', null);
  aiEditorStore.setKey('currentDiff', null);
};

export const setApplyingChanges = (isApplying: boolean) =>
  aiEditorStore.setKey('applyingChanges', isApplying);

export const updateProposedChangeContent = (
  filePath: string,
  newContent: string,
) => {
  const state = aiEditorStore.get();
  if (!state.lastLlmResponse) return;

  const updated = state.lastLlmResponse.changes.map((ch) =>
    ch.filePath === filePath && ['add', 'modify', 'repair'].includes(ch.action)
      ? { ...(ch as AddOrModifyFileChange), newContent }
      : ch,
  );

  const newSelected = { ...state.selectedChanges };
  const sel = newSelected[filePath];
  if (sel && ['add', 'modify', 'repair'].includes(sel.action)) {
    newSelected[filePath] = { ...(sel as AddOrModifyFileChange), newContent };
  }

  aiEditorStore.set({
    ...state,
    lastLlmResponse: { ...state.lastLlmResponse, changes: updated },
    selectedChanges: newSelected,
  });
  addLog('Proposed Change Card', `Content updated for: ${filePath}`, 'debug');
};

export const updateProposedChangePath = (oldPath: string, newPath: string) => {
  const state = aiEditorStore.get();
  if (!state.lastLlmResponse) {
    setError('Cannot update path: no LLM response.');
    return;
  }

  const trimmed = newPath.trim();
  if (!trimmed) {
    setError('New file path cannot be empty.');
    return;
  }
  if (trimmed === oldPath) return;

  let found = false;
  const updated = state.lastLlmResponse.changes.map((ch) => {
    if (ch.filePath === oldPath) {
      found = true;
      return { ...ch, filePath: trimmed };
    }
    return ch;
  });

  if (!found) {
    setError(`Change for path '${oldPath}' not found.`);
    return;
  }

  const newSelected = { ...state.selectedChanges };
  if (newSelected[oldPath]) {
    newSelected[trimmed] = { ...newSelected[oldPath], filePath: trimmed };
    delete newSelected[oldPath];
  }

  let newDiff = state.currentDiff;
  let newDiffPath = state.diffFilePath;
  if (newDiffPath === oldPath) {
    newDiffPath = null;
    newDiff = null;
  }

  aiEditorStore.set({
    ...state,
    lastLlmResponse: { ...state.lastLlmResponse, changes: updated },
    selectedChanges: newSelected,
    diffFilePath: newDiffPath,
    currentDiff: newDiff,
  });
  addLog(
    'Proposed Change Card',
    `File path updated from '${oldPath}' to '${trimmed}'.`,
    'info',
  );
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
  const newTabs = state.openedTabs.filter((t) => t !== filePath);
  aiEditorStore.setKey('openedTabs', newTabs);
  addLog('File Editor', `Closed tab for: ${filePath}`, 'info');

  if (state.openedFile === filePath) {
    if (newTabs.length) {
      const idx = state.openedTabs.indexOf(filePath);
      const nextFile = idx > 0 ? newTabs[idx - 1] : newTabs[0];
      setOpenedFile(nextFile);
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
};

export const setInitialFileContentSnapshot = (content: string | null) =>
  aiEditorStore.setKey('initialFileContentSnapshot', content);

export const setIsFetchingFileContent = (isLoading: boolean) => {
  aiEditorStore.setKey('isFetchingFileContent', isLoading);
  if (isLoading) addLog('File Editor', `Fetching file content...`, 'debug');
};

export const setFetchFileContentError = (message: string | null) => {
  aiEditorStore.setKey('fetchFileContentError', message);
  if (message)
    addLog('File Editor', `Failed to fetch content: ${message}`, 'error');
};

export const setIsSavingFileContent = (isLoading: boolean) => {
  aiEditorStore.setKey('isSavingFileContent', isLoading);
  addLog(
    'File Editor',
    isLoading ? 'Saving file content...' : 'Finished saving file content.',
    'info',
  );
};

export const setSaveFileContentError = (message: string | null) => {
  aiEditorStore.setKey('saveFileContentError', message);
  if (message)
    addLog('File Editor', `Failed to save file content: ${message}`, 'error');
};

export const setIsOpenedFileDirty = (isDirty: boolean) =>
  aiEditorStore.setKey('isOpenedFileDirty', isDirty);

export const setAutoApplyChanges = (value: boolean) => {
  aiEditorStore.setKey('autoApplyChanges', value);
  addLog(
    'Prompt Generator',
    `Auto-apply changes toggled: ${value ? 'ON' : 'OFF'}`,
    'info',
  );
};

export const setIsBuilding = (building: boolean) => {
  aiEditorStore.setKey('isBuilding', building);
  addLog(
    'Build Process',
    building ? 'Build script started...' : 'Build script finished.',
    'info',
  );
};

export const saveActiveFile = async () => {
  const { openedFile, openedFileContent } = aiEditorStore.get();
  if (!openedFile || openedFileContent === null) {
    setError('No file or content to save.');
    addLog(
      'File Editor',
      'Attempted to save, but no file or content available.',
      'warning',
    );
    return;
  }

  setIsSavingFileContent(true);
  setSaveFileContentError(null);
  try {
    const result = await writeFileContent(openedFile, openedFileContent);
    if (result.success) {
      setInitialFileContentSnapshot(openedFileContent);
      setIsOpenedFileDirty(false);
      addLog('File Editor', `File saved: ${openedFile}`, 'success');
    } else {
      const msg = result.message || 'Failed to save file.';
      setSaveFileContentError(msg);
      setError(`Failed to save: ${msg}`);
      addLog('File Editor', `Failed to save file: ${openedFile}`, 'error');
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    setSaveFileContentError(errorMessage);
    setError(`Error saving: ${errorMessage}`);
    addLog('File Editor', `Error saving file: ${openedFile}`, 'error');
  } finally {
    setIsSavingFileContent(false);
  }
};

export const discardActiveFileChanges = () => {
  const { openedFile, initialFileContentSnapshot, isOpenedFileDirty } =
    aiEditorStore.get();

  if (!openedFile || !isOpenedFileDirty) {
    setError('No unsaved changes to discard.');
    addLog(
      'File Editor',
      'Attempted to discard, but no unsaved changes.',
      'info',
    );
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
    addLog('File Editor', `Changes discarded for: ${openedFile}`, 'info');
  }
};

export const performPostApplyActions = async (
  projectRoot: string,
  llmResponse: ModelResponse,
  llmGeneratePayload: LlmGeneratePayload,
  scanPaths: string[],
) => {
  setIsBuilding(true);
  let buildPassed = false;
  try {
    addLog('Build Process', 'Running `pnpm run build`...', 'info');
    const buildResult = await runTerminalCommand('pnpm run build', projectRoot);

    if (buildResult.exitCode !== 0) {
      addLog(
        'Build Process',
        `Build failed with exit code ${buildResult.exitCode}.`,
        'error',
      );
      setError(`Build failed with exit code ${buildResult.exitCode}.`);
    } else {
      addLog('Build Process', 'Project built successfully.', 'success');
      buildPassed = true;
    }
  } catch (err) {
    const errorMsg = `Failed to run build script: ${err instanceof Error ? err.message : String(err)}`;
    addLog('Build Process', errorMsg, 'error');
    setError(errorMsg);
  } finally {
    setIsBuilding(false);
  }

  if (buildPassed && llmResponse?.gitInstructions?.length) {
    addLog(
      'Git Automation',
      'Executing AI-suggested git instructions...',
      'info',
    );
    let gitCommandsSuccessful = true;
    for (const command of llmResponse.gitInstructions) {
      addLog('Git Automation', `Running git command: \`${command}\``, 'info');
      try {
        const gitExecResult = await runTerminalCommand(command, projectRoot);

        if (gitExecResult.exitCode !== 0) {
          const errMsg = `Git command failed: \`${command}\` (Exit Code: ${gitExecResult.exitCode}).`;
          addLog('Git Automation', errMsg, 'error');
          setError(errMsg);
          gitCommandsSuccessful = false;
          break;
        } else {
          addLog(
            'Git Automation',
            `Git command succeeded: \`${command}\`.`,
            'success',
          );
        }
      } catch (err) {
        const errMsg = `Failed to execute git command \`${command}\`: ${err instanceof Error ? err.message : String(err)}`;
        addLog('Git Automation ', errMsg, 'error');
        setError(errMsg);
        gitCommandsSuccessful = false;
        break;
      }
    }

    if (gitCommandsSuccessful) {
      addLog(
        'Git Automation',
        'All git instructions executed successfully.',
        'success',
      );
    }
  }

  // Re-run scan for updated changes after applying proposed changes
  try {
    await apiApplyProposedChanges({
      projectRoot,
      llmResponse,
      llmGeneratePayload,
      scanPaths,
    });
    addLog(
      'Post Apply',
      'Proposed changes applied and scan completed.',
      'success',
    );
  } catch (err) {
    const errMsg = `Failed to apply proposed changes: ${err instanceof Error ? err.message : String(err)}`;
    addLog('Post Apply', errMsg, 'error');
    setError(errMsg);
  }
};
