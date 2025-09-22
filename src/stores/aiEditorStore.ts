import { atom } from 'nanostores';

export interface AiEditorState {
  globalSnackbarMessage: string | null;
  globalSnackbarSeverity: 'success' | 'info' | 'warning' | 'error' | null;
  showGlobalSnackbar: boolean;
  error: string | null; // Make error nullable
}

export const aiEditorStore = atom<AiEditorState>({
  globalSnackbarMessage: null,
  globalSnackbarSeverity: null,
  showGlobalSnackbar: false,
  error: null,
});

export const showGlobalSnackbar = (
  message: string,
  severity: AiEditorState['globalSnackbarSeverity'] = 'info',
) => {
  aiEditorStore.set({
    ...aiEditorStore.get(),
    globalSnackbarMessage: message,
    globalSnackbarSeverity: severity,
    showGlobalSnackbar: true,
  });

  // Reset the snackbar after a delay
  setTimeout(() => {
    aiEditorStore.set({
      ...aiEditorStore.get(),
      showGlobalSnackbar: false,
    });
  }, 3000);
};

export const setError = (errorMessage: string | null) => {
  aiEditorStore.set({
    ...aiEditorStore.get(),
    error: errorMessage,
  });
};
