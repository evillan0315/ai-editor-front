import { map } from 'nanostores';
import { FileTreeState, FileEntry } from '@/types/fileTree';
import { fetchProjectFiles } from '@/api/file';
import { buildFileTree } from '@/utils/fileUtils';
import { aiEditorStore, setOpenedFile } from './aiEditorStore'; // Import setOpenedFile

export const fileTreeStore = map<FileTreeState>({
  files: [], // Hierarchical file tree
  flatFileList: [], // Flat list from API
  // Removed 'loading' and 'error' as 'isFetchingTree' and 'fetchTreeError' are more specific for tree fetching.
  expandedDirs: new Set(), // Store expanded directories by their full filePath
  selectedFile: null,
  isFetchingTree: false,
  fetchTreeError: null,
  lastFetchedProjectRoot: null,
  lastFetchedScanPaths: [],
});

export const setFiles = (files: FileEntry[]) => {
  fileTreeStore.setKey('files', files);
};

// Removed setLoading as it's superseded by setIsFetchingTree
// Removed setError as it's superseded by setFetchTreeError

export const toggleDirExpansion = (filePath: string) => {
  const state = fileTreeStore.get(); // Get current state
  const newExpandedDirs = new Set(state.expandedDirs);
  if (newExpandedDirs.has(filePath)) {
    newExpandedDirs.delete(filePath);
  } else {
    newExpandedDirs.add(filePath);
  }
  fileTreeStore.set({ ...state, expandedDirs: newExpandedDirs }); // Set new full state
};

export const setSelectedFile = (filePath: string | null) => {
  fileTreeStore.setKey('selectedFile', filePath);
  // When a file is selected in the tree, also set it in aiEditorStore to display its content.
  setOpenedFile(filePath); // Use the new action from aiEditorStore
};

export const fetchFiles = async (projectRoot: string, scanPaths: string[]) => {
  const currentStore = fileTreeStore.get();
  const parsedScanPaths = scanPaths.filter(Boolean); // Ensure clean for comparison

  // Check if data is already fresh and we're not currently fetching
  if (
    !currentStore.isFetchingTree &&
    currentStore.lastFetchedProjectRoot === projectRoot &&
    JSON.stringify(currentStore.lastFetchedScanPaths) ===
      JSON.stringify(parsedScanPaths) &&
    currentStore.fetchTreeError === null &&
    currentStore.flatFileList.length > 0 // Only consider fresh if there are files
  ) {
    console.log(
      'File tree data already fresh for projectRoot:',
      projectRoot,
      'and scanPaths:',
      scanPaths,
    );
    return; // No need to fetch
  }

  fileTreeStore.setKey('isFetchingTree', true);
  fileTreeStore.setKey('fetchTreeError', null);
  fileTreeStore.setKey('files', []);
  fileTreeStore.setKey('flatFileList', []);
  // Do NOT reset lastFetchedProjectRoot/ScanPaths here yet, as it indicates what was LAST successfully fetched.
  // Resetting them now would make the "fresh" check always false until successful completion.

  console.log(
    'Fetching files for projectRoot:',
    projectRoot,
    'scanPaths:',
    scanPaths,
  );
  try {
    const apiFiles = await fetchProjectFiles(projectRoot, parsedScanPaths);
    const tree = buildFileTree(apiFiles, projectRoot);
    fileTreeStore.setKey('files', tree);
    fileTreeStore.setKey('flatFileList', apiFiles);
    fileTreeStore.setKey('lastFetchedProjectRoot', projectRoot);
    fileTreeStore.setKey('lastFetchedScanPaths', parsedScanPaths); // Store the *parsed* paths
  } catch (err) {
    console.error('Error fetching project files for tree:', err);
    fileTreeStore.setKey(
      'fetchTreeError',
      `Failed to load project files: ${err instanceof Error ? err.message : String(err)}`,
    );
    // On error, the fresh check will fail due to fetchTreeError not being null, so it will retry.
  } finally {
    fileTreeStore.setKey('isFetchingTree', false);
  }
};

export const clearFileTree = () => {
  fileTreeStore.set({
    files: [],
    flatFileList: [],
    // Removed 'loading' and 'error' from clear state
    expandedDirs: new Set(),
    selectedFile: null,
    isFetchingTree: false,
    fetchTreeError: null,
    lastFetchedProjectRoot: null, // Clear these on full tree clear
    lastFetchedScanPaths: [], // Clear these on full tree clear
  });
  // Also clear any opened file content in aiEditorStore
  setOpenedFile(null); // Use the new action from aiEditorStore
};
