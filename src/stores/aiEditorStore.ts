import { persistentAtom } from '@/utils/persistentAtom';
import { useStore } from '@nanostores/react';
import { atom } from 'nanostores';

export const $globalSnackbar = atom<{
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
} | null>(null);

interface GlobalSnackbarProps {
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

export function showGlobalSnackbar(
  message: string,
  severity: GlobalSnackbarProps['severity'],
) {
  $globalSnackbar.set({ message, severity });
  setTimeout(() => {
    $globalSnackbar.set(null);
  }, 3000);
}

export const autoApplyChanges = persistentAtom<boolean>(
  'autoApplyChanges',
  false,
);
export const setAutoApplyChanges = (value: boolean) => {
  autoApplyChanges.set(value);
};

export const aiEditorStore = persistentAtom(
  'ai-editor-settings',
  {},
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  },
);

export const useAiEditorSettings = () => useStore(aiEditorStore);

export const setAiEditorSettings = (settings: any) =>
  aiEditorStore.set(settings);
