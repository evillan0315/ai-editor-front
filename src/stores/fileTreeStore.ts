import { map } from 'nanostores';
import { FileTreeState, FileEntry } from '@/types/fileTree';
import { fetchProjectFiles as fetchApiFiles } from '@/api/file'; // Alias to avoid naming conflict
import {
  buildFileTree,
  findFileByPath,
  updateFolderStateRecursive,
  ensureFolderDefaults,
} from '@/utils/fileTree';
import { aiEditorStore, setOpenedFile } from './aiEditorStore'; // Import setOpenedFile

export const fileTreeStore = map<FileTreeState>({
  files: [], // Hierarchical file tree
  flatFileList: [], // Flat list from API (currently only stores the top-level or fetched children for simplicity)
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

export const setSelectedFile = (filePath: string | null) => {
  fileTreeStore.setKey('selectedFile', filePath);
  // When a file is selected in the tree, also set it in aiEditorStore to display its content.
  setOpenedFile(filePath); // Use the new action from aiEditorStore
};

/**
 * Fetches the initial root-level files and folders for the project tree.
 * This uses `recursive=false` in the API call to only get immediate children.
 */
export const fetchInitialFiles = async (projectRoot: string, scanPaths: string[]) => {
  const currentStore = fileTreeStore.get();
  const parsedScanPaths = scanPaths.filter(Boolean); // Ensure clean for comparison

  // Clear any existing tree state before fetching new data
  fileTreeStore.setKey('isFetchingTree', true);
  fileTreeStore.setKey('fetchTreeError', null);
  fileTreeStore.setKey('files', []);
  fileTreeStore.setKey('flatFileList', []);
  // Do NOT reset lastFetchedProjectRoot/ScanPaths here yet, as it indicates what was LAST successfully fetched.
  // Resetting them now would make the "fresh" check always false until successful completion.

  try {
    console.log('Fetching initial files for projectRoot:', projectRoot, 'scanPaths:', scanPaths);
    // Fetch only top-level files/folders from the projectRoot
    const apiFiles = await fetchApiFiles(projectRoot, parsedScanPaths);
    // The `apiFiles` here is already a flat list of `FileEntry` for direct children of `projectRoot`.
    // `buildFileTree` is used to initialize properties like `depth` and `collapsed` for these top-level items.
    const tree = buildFileTree(apiFiles, projectRoot); // This builds the initial top-level tree

    fileTreeStore.setKey('files', tree);
    fileTreeStore.setKey('flatFileList', apiFiles); // Store the flat list of top-level items
    fileTreeStore.setKey('lastFetchedProjectRoot', projectRoot);
    fileTreeStore.setKey('lastFetchedScanPaths', parsedScanPaths); // Store the *parsed* paths
  } catch (err) {
    console.error('Error fetching initial project files for tree:', err);
    fileTreeStore.setKey(
      'fetchTreeError',
      `Failed to load project files: ${err instanceof Error ? err.message : String(err)}`,
    );
    // On error, the fresh check will fail due to fetchTreeError not being null, so it will retry.
  } finally {
    fileTreeStore.setKey('isFetchingTree', false);
  }
};

/**
 * Fetches the children for a specific folder when it is expanded.
 * This also uses `recursive=false` in the API call to only get immediate children.
 */
export const fetchChildrenForFolder = async (folderPath: string) => {
  const state = fileTreeStore.get();
  const folderNode = findFileByPath(folderPath, state.files); // Find the folder in the current hierarchical tree

  if (!folderNode || folderNode.type !== 'folder') {
    console.warn(`Attempted to fetch children for non-folder or non-existent path: ${folderPath}`);
    return;
  }

  // Optimistically set loading state on the specific folder node
  let updatedTreeWithLoading = updateFolderStateRecursive(folderPath, state.files, {
    isLoadingChildren: true,
  });
  fileTreeStore.set({ ...state, files: updatedTreeWithLoading }); // Update the files in the store

  try {
    console.log('Fetching children for folder:', folderPath);
    // Fetch direct children of this folder using the API (recursive=false)
    const childrenApiFiles = await fetchApiFiles(folderPath, []); // Scan paths not relevant for direct children fetch
    const processedChildren = ensureFolderDefaults(childrenApiFiles); // Ensure UI defaults for the new children

    // Update the tree with the fetched children and set their open/loading states
    const updatedTreeWithChildren = updateFolderStateRecursive(
      folderPath,
      fileTreeStore.get().files, // Use the latest state to avoid race conditions if tree changed during await
      {
        isOpen: true, // Mark the folder as open
        isLoadingChildren: false, // Turn off loading indicator
        children: processedChildren, // Assign the fetched children
      },
    );
    fileTreeStore.set({
      ...fileTreeStore.get(),
      files: updatedTreeWithChildren,
      fetchTreeError: null,
    }); // Clear error on success
  } catch (err) {
    console.error(`Error fetching children for ${folderPath}:`, err);
    // Reset state on error: close the folder and turn off loading
    const updatedTreeWithError = updateFolderStateRecursive(folderPath, fileTreeStore.get().files, {
      isOpen: false, // Close the folder on error
      isLoadingChildren: false,
    });
    fileTreeStore.set({
      ...fileTreeStore.get(),
      files: updatedTreeWithError,
      fetchTreeError: `Failed to load children for ${folderPath}: ${String(err)}`,
    });
  }
};

/**
 * Toggles the expansion state of a directory.
 * If expanding and children are not yet loaded, it triggers a fetch.
 */
export const toggleDirExpansion = (filePath: string) => {
  const state = fileTreeStore.get();
  const newExpandedDirs = new Set(state.expandedDirs);
  const isCurrentlyExpanded = newExpandedDirs.has(filePath);
  const folderNode = findFileByPath(filePath, state.files); // Find the folder in the current hierarchical tree

  if (!folderNode || folderNode.type !== 'folder') {
    console.warn(`Attempted to toggle expansion for non-folder or non-existent path: ${filePath}`);
    return;
  }

  if (isCurrentlyExpanded) {
    // If currently expanded, collapse it
    newExpandedDirs.delete(filePath);
    const updatedTree = updateFolderStateRecursive(filePath, state.files, { isOpen: false });
    fileTreeStore.set({ ...state, expandedDirs: newExpandedDirs, files: updatedTree });
  } else {
    // If currently collapsed, expand it
    newExpandedDirs.add(filePath);

    // If children are not yet loaded, trigger fetch. `fetchChildrenForFolder` will update `isOpen` to true after fetching.
    // If children are already loaded, just update `isOpen` to true.
    if (!folderNode.children || folderNode.children.length === 0) {
      fetchChildrenForFolder(filePath); // This action will update the tree with isOpen: true upon success
    } else {
      const updatedTree = updateFolderStateRecursive(filePath, state.files, { isOpen: true });
      fileTreeStore.set({ ...state, expandedDirs: newExpandedDirs, files: updatedTree });
    }
  }
};

export const clearFileTree = () => {
  fileTreeStore.set({
    files: [],
    flatFileList: [],
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
