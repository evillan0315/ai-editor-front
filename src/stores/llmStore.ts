import { map } from 'nanostores';
import {
  FileChange,
  AddOrModifyFileChange,
  LlmOutputFormat,
  LlmGeneratePayload,
  LlmGenerateResponse,
  RequestType,
} from '@/types/llm';
import {
  INSTRUCTION,
  ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
} from '@/constants/instruction';
import { setError } from '@/stores/errorStore';
import { addLog } from '@/stores/logStore';

export * from './utils/llmStoreHelpers';

interface LlmStoreState {
  instruction: string;
  aiInstruction: string;
  expectedOutputInstruction: string;
  requestType: RequestType;
  llmOutputFormat: LlmOutputFormat;
  uploadedFileData: string | null;
  uploadedFileMimeType: string | null;
  uploadedFileName: string | null;
  lastLlmGeneratePayload: LlmGeneratePayload | null;
  lastLlmGeneratePayloadString: string | null;
  scanPathsInput: string;
  // Added for diff and LLM response handling:
  lastLlmResponse: LlmGenerateResponse | null;
  selectedChanges: Record<string, FileChange>;
  diffFilePath: string | null;
  currentDiff: string | null;
  applyingChanges: boolean;
  
}

export const llmStore = map<LlmStoreState>({
  instruction: '',
  aiInstruction: INSTRUCTION,
  expectedOutputInstruction: ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
  requestType: RequestType.LLM_GENERATION,
  llmOutputFormat: LlmOutputFormat.JSON,
  uploadedFileData: null,
  uploadedFileMimeType: null,
  uploadedFileName: null,
  lastLlmGeneratePayload: null,
  lastLlmGeneratePayloadString: null,
  lastLlmResponse: null,
  selectedChanges: {},
  diffFilePath: null,
  currentDiff: null,
  applyingChanges: false,
  scanPathsInput: 'src,package.json,README.md',
});

// ────────────────────────────
// Basic setters
// ────────────────────────────
export const setInstruction = (instruction: string) =>
  llmStore.setKey('instruction', instruction);

export const setAiInstruction = (instruction: string) =>
  llmStore.setKey('aiInstruction', instruction);

export const setExpectedOutputInstruction = (instruction: string) =>
  llmStore.setKey('expectedOutputInstruction', instruction);

export const setRequestType = (type: RequestType) =>
  llmStore.setKey('requestType', type);

export const setLlmOutputFormat = (format: LlmOutputFormat) =>
  llmStore.setKey('llmOutputFormat', format);

export const setScanPathsInput = (paths: string) =>
  llmStore.setKey('scanPathsInput', paths);

export const setUploadedFile = (
  data: string | null,
  mimeType: string | null,
  fileName: string | null,
) => {
  llmStore.setKey('uploadedFileData', data);
  llmStore.setKey('uploadedFileMimeType', mimeType);
  llmStore.setKey('uploadedFileName', fileName);
};

export const setLastLlmGeneratePayload = (
  payload: LlmGeneratePayload | null,
) => {
  llmStore.setKey('lastLlmGeneratePayload', payload);
};

export const setLastLlmResponse = (response: LlmGenerateResponse | null) => {
  llmStore.setKey('lastLlmResponse', response);
};

// ────────────────────────────
// Change selection and diff
// ────────────────────────────
export const selectAllChanges = () => {
  const state = llmStore.get();
  if (state.lastLlmResponse?.changes) {
    const all: Record<string, FileChange> = {};
    state.lastLlmResponse.changes.forEach((c) => (all[c.filePath] = c));
    llmStore.setKey('selectedChanges', all);
  }
};

export const deselectAllChanges = () =>
  llmStore.setKey('selectedChanges', {});

export const setCurrentDiff = (filePath: string | null, diff: string | null) => {
  llmStore.setKey('diffFilePath', filePath);
  llmStore.setKey('currentDiff', diff);
};

export const clearDiff = () => {
  llmStore.setKey('diffFilePath', null);
  llmStore.setKey('currentDiff', null);
};

export const setApplyingChanges = (isApplying: boolean) =>
  llmStore.setKey('applyingChanges', isApplying);

// ────────────────────────────
// Update proposed changes
// ────────────────────────────
export const updateProposedChangeContent = (
  filePath: string,
  newContent: string,
) => {
  const state = llmStore.get();
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

  llmStore.set({
    ...state,
    lastLlmResponse: { ...state.lastLlmResponse, changes: updated },
    selectedChanges: newSelected,
  });
  addLog('Proposed Change Card', `Content updated for: ${filePath}`, 'debug');
};

export const updateProposedChangePath = (oldPath: string, newPath: string) => {
  const state = llmStore.get();
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

  llmStore.set({
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

