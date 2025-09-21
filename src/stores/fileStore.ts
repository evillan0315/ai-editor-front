import { map } from 'nanostores';
import { writeFileContent, readFileContent } from '@/api/file';
import { addLog } from './logStore';

export interface FileStoreState {
  openedFile: string | null;
  openedFileContent: string | null;
  initialFileContentSnapshot: string | null;
  isFetchingFileContent: boolean;
  fetchFileContentError: string | null;
  isSavingFileContent: boolean;
  saveFileContentError: string | null;
  isOpenedFileDirty: boolean;
  openedTabs: string[];
}

export const fileStore = map<FileStoreState>({
  openedFile: null,
  openedFileContent: null,
  initialFileContentSnapshot: null,
  isFetchingFileContent: false,
  fetchFileContentError: null,
  isSavingFileContent: false,
  saveFileContentError: null,
  isOpenedFileDirty: false,
  openedTabs: [],
});

export const setOpenedFile = (filePath: string | null) => {
  fileStore.setKey('openedFile', filePath);
  if (filePath && !fileStore.get().openedTabs.includes(filePath)) {
    addOpenedTab(filePath);
  } else if (filePath) {
    addLog('File Editor', `Switched to file: ${filePath}`, 'info');
  } else {
    addLog('File Editor', 'No file is currently opened in the editor.', 'info');
  }
  fileStore.setKey('openedFileContent', null);
  fileStore.setKey('initialFileContentSnapshot', null);
  fileStore.setKey('isFetchingFileContent', false);
  fileStore.setKey('fetchFileContentError', null);
  fileStore.setKey('isSavingFileContent', false);
  fileStore.setKey('saveFileContentError', null);
  fileStore.setKey('isOpenedFileDirty', false);
};

export const setOpenedFileContent = (content: string | null) => {
  fileStore.setKey('openedFileContent', content);
  fileStore.setKey('saveFileContentError', null);
  // Log a debug message, as this can be very frequent
  // addLog('File Editor', `Content updated for active file.`, 'debug');
};

export const setInitialFileContentSnapshot = (content: string | null) => {
  fileStore.setKey('initialFileContentSnapshot', content);
  //addLog('File Editor', `Initial content snapshot taken for active file.`, 'debug');
};

export const setIsFetchingFileContent = (isLoading: boolean) => {
  fileStore.setKey('isFetchingFileContent', isLoading);
  if (isLoading) {
    addLog('File Editor', `Fetching file content...`, 'debug');
  } else {
    //addLog('File Editor', `Finished fetching file content.`, 'debug');
  }
};

export const setFetchFileContentError = (message: string | null) => {
  fileStore.setKey('fetchFileContentError', message);
  if (message) {
    addLog(
      'File Editor',
      `Failed to fetch file content: ${message}`,
      'error',
      message,
      undefined,
      true,
    );
  }
};

export const setIsSavingFileContent = (isLoading: boolean) => {
  fileStore.setKey('isSavingFileContent', isLoading);
  if (isLoading) {
    addLog('File Editor', `Saving file content...`, 'info');
  } else {
    addLog('File Editor', `Finished saving file content.`, 'info');
  }
};

export const setSaveFileContentError = (message: string | null) => {
  fileStore.setKey('saveFileContentError', message);
  if (message) {
    addLog(
      'File Editor',
      `Failed to save file content: ${message}`,
      'error',
      message,
      undefined,
      true,
    );
  }
};

export const setIsOpenedFileDirty = (isDirty: boolean) => {
  fileStore.setKey('isOpenedFileDirty', isDirty);
  if (isDirty) {
    //addLog('File Editor', `Active file has unsaved changes.`, 'warning');
  }
};

export const addOpenedTab = (filePath: string) => {
  const state = fileStore.get();
  if (!state.openedTabs.includes(filePath)) {
    fileStore.setKey('openedTabs', [...state.openedTabs, filePath]);
    addLog('File Editor', `Opened new tab for: ${filePath}`, 'info');
  }
};

export const removeOpenedTab = (filePath: string) => {
  const state = fileStore.get();
  const newOpenedTabs = state.openedTabs.filter((tab) => tab !== filePath);
  fileStore.setKey('openedTabs', newOpenedTabs);
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

export const saveActiveFile = async () => {
  const { openedFile, openedFileContent } = fileStore.get();

  if (!openedFile || openedFileContent === null) {
    addLog(
      'File Editor',
      'Attempted to save, but no file or content available.',
      'warning',
      undefined,
      undefined,
      true,
    );
    return;
  }

  setIsSavingFileContent(true);
  setSaveFileContentError(null); // Clear local error

  try {
    const result = await writeFileContent(openedFile, openedFileContent);
    if (result.success) {
      setInitialFileContentSnapshot(openedFileContent);
      setIsOpenedFileDirty(false);
      addLog('File Editor', `File saved: ${openedFile}`, 'success');
    } else {
      const msg = result.message || 'Failed to save file.';
      setSaveFileContentError(msg);
      addLog(
        'File Editor',
        `Failed to save file: ${openedFile}`,
        'error',
        msg,
        undefined,
        true,
      );
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    setSaveFileContentError(`Failed to save file: ${errorMessage}`);
    addLog(
      'File Editor',
      `Error saving file: ${openedFile}`,
      'error',
      errorMessage,
      undefined,
      true,
    );
  } finally {
    setIsSavingFileContent(false);
  }
};

export const discardActiveFileChanges = () => {
  const { openedFile, initialFileContentSnapshot, isOpenedFileDirty } =
    fileStore.get();

  if (!openedFile || !isOpenedFileDirty) {
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
    //addLog('File Editor', `Changes discarded for: ${openedFile}`, 'info');
  }
};

export const fetchFileContent = async (filePath: string) => {
  setIsFetchingFileContent(true);
  setFetchFileContentError(null);

  try {
    const content = await readFileContent(filePath);
    setOpenedFileContent(content);
    setInitialFileContentSnapshot(content);
    setIsOpenedFileDirty(false);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    setFetchFileContentError(errorMessage);
  } finally {
    setIsFetchingFileContent(false);
  }
};
