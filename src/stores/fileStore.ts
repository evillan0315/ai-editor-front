import { map } from 'nanostores';
import { writeFileContent, readFileContent } from '@/api/file';
import { addLog } from './logStore';
import { persistentAtom } from '@/utils/persistentAtom';

interface OpenFile {
  content: string;
  path: string;
  isDirty?: boolean;
}

export interface FileStoreState {
  uploadedFileData: string | null;
  uploadedFileMimeType: string | null;
  uploadedFileName: string | null;
  openedFile: string | null;
  openedFileContent: string | null;
  initialFileContentSnapshot: string | null;
  isFetchingFileContent: boolean;
  fetchFileContentError: string | null;
  isSavingFileContent: boolean;
  saveFileContentError: string | null;
  isOpenedFileDirty: boolean;
  //openedTabs: string[]; // Removed from FileStoreState, now managed by persistentAtom
}

export const fileStore = map<FileStoreState>({
  uploadedFileData: null,
  uploadedFileMimeType: null,
  uploadedFileName: null,
  openedFile: null,
  openedFileContent: null,
  initialFileContentSnapshot: null,
  isFetchingFileContent: false,
  fetchFileContentError: null,
  isSavingFileContent: false,
  saveFileContentError: null,
  isOpenedFileDirty: false,
  //openedTabs: [], // Removed from fileStore, now managed by persistentAtom
});
export const openedFileContent = persistentAtom<string | null>('openedFileContent', null);
export const openedFile = persistentAtom<string | null>('openedFile', null);
export const isOpenedFileDirty = persistentAtom<boolean>('isOpenedFileDirty', false);
export const openedTabs = persistentAtom<string[]>('openedTabs', []);

export const setOpenedFile = (filePath: string | null) => {
  fileStore.setKey('openedFile', filePath);
  openedFile.set(filePath);
  //if (filePath && !fileStore.get().openedTabs.includes(filePath)) {
  if (filePath && !openedTabs.get().includes(filePath)) {
    addOpenedTab(filePath);
  } else if (filePath) {
    addLog('File Editor', `Switched to file: ${filePath}`, 'info');
  } else {
    addLog('File Editor', 'No file is currently opened in the editor.', 'info');
  }
  
  openedFileContent.set(null);
  isOpenedFileDirty.set(false);
  fileStore.setKey('openedFileContent', null);
  fileStore.setKey('initialFileContentSnapshot', null);
  fileStore.setKey('isFetchingFileContent', false);
  fileStore.setKey('fetchFileContentError', null);
  fileStore.setKey('isSavingFileContent', false);
  fileStore.setKey('saveFileContentError', null);
  fileStore.setKey('isOpenedFileDirty', false);
};
export const setOpenedFileContent = (content: string | null) => {
  openedFileContent.set(content);
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
  isOpenedFileDirty.set(isDirty);
  fileStore.setKey('isOpenedFileDirty', isDirty);
  if (isDirty) {
    //addLog('File Editor', `Active file has unsaved changes.`, 'warning');
  }
};

export const addOpenedTab = (filePath: string) => {
  //const state = fileStore.get();
  //if (!state.openedTabs.includes(filePath)) {
  if (!openedTabs.get().includes(filePath)) {
    //fileStore.setKey('openedTabs', [...state.openedTabs, filePath]);
    openedTabs.set([...openedTabs.get(), filePath]);
    addLog('File Editor', `Opened new tab for: ${filePath}`, 'info');
  }
};

export const removeOpenedTab = (filePath: string) => {
  //const state = fileStore.get();
  //const newOpenedTabs = state.openedTabs.filter((tab) => tab !== filePath);
  const newOpenedTabs = openedTabs.get().filter((tab) => tab !== filePath);
  const openFile = openedFile.get();
  //fileStore.setKey('openedTabs', newOpenedTabs);
  openedTabs.set(newOpenedTabs);
  addLog('File Editor', `Closed tab for: ${filePath}`, 'info');

  if (openFile === filePath) {
    if (newOpenedTabs.length > 0) {
      //const oldIndex = state.openedTabs.indexOf(filePath);
      const oldIndex = openedTabs.get().indexOf(filePath);
      const newActiveFile =
        oldIndex > 0 ? newOpenedTabs[oldIndex - 1] : newOpenedTabs[0];
      setOpenedFile(newActiveFile);
    } else {
      setOpenedFile(null);
    }
  }
};
export const saveActiveFile = async () => {
  //const { openedFile } = fileStore.get();
  const openFile = openedFile.get();
  const fileContent = openedFileContent.get();

  if (!openFile || fileContent === null) {
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
    const result = await writeFileContent(openFile, fileContent);
    if (result.success) {
      setInitialFileContentSnapshot(fileContent);
      setIsOpenedFileDirty(false);
      addLog('File Editor', `File saved: ${openFile}`, 'success');
    } else {
      const msg = result.message || 'Failed to save file.';
      setSaveFileContentError(msg);
      addLog(
        'File Editor',
        `Failed to save file: ${openFile}`,
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
      `Error saving file: ${openFile}`,
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
  const { initialFileContentSnapshot } = fileStore.get();
    const openFile = openedFile.get();
  const isDirty = isOpenedFileDirty.get();
  if (!openFile || !isDirty) {
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

// ────────────────────────────
// File upload
// ────────────────────────────
export const setUploadedFile = (
  data: string | null,
  mimeType: string | null,
  fileName: string | null,
) => {
  fileStore.setKey('uploadedFileData', data);
  fileStore.setKey('uploadedFileMimeType', mimeType);
  fileStore.setKey('uploadedFileName', fileName);
};
