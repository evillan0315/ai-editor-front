// llmStoreHelpers.ts
import { addLog } from '@/stores/logStore';
import { setError } from '@/stores/errorStore';

import { llmStore } from '@/stores/llmStore';
import {
  FileChange,
  AddOrModifyFileChange,
  LlmOutputFormat,
  LlmGeneratePayload,
  LlmGenerateResponse,
  RequestType,
} from '@/types/llm';

export const updateProposedChangeContent = (filePath: string, newContent: string) => {
  const state = llmStore.get();
  if (!state.lastLlmResponse) return;

  const updated = state.lastLlmResponse.changes.map(ch =>
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
  addLog('Proposed Change', `Content updated for: ${filePath}`, 'debug');
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
  const updated = state.lastLlmResponse.changes.map(ch => {
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

  const resetDiff = state.diffFilePath === oldPath
    ? { diffFilePath: null, currentDiff: null }
    : { diffFilePath: state.diffFilePath, currentDiff: state.currentDiff };

  llmStore.set({
    ...state,
    lastLlmResponse: { ...state.lastLlmResponse, changes: updated },
    selectedChanges: newSelected,
    ...resetDiff,
  });
  addLog('Proposed Change', `File path updated from '${oldPath}' to '${trimmed}'.`, 'info');
};
