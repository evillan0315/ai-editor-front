import { map } from 'nanostores';
import { FileTreeState, FileEntry } from '@/types/fileTree';
import { FileTreeNode, ApiFileScanResult } from '@/types'; // Import FileTreeNode and ApiFileScanResult
import { fetchDirectoryContents, fetchScannedFilesForAI } from '@/api/file'; // Updated import
import { aiEditorStore, setOpenedFile } from './aiEditorStore'; // Import setOpenedFile
import { getRelativePath } from '@/utils'; // Import getRelativePath

export const fileTreeStore = map<FileTreeState>({
  files: [], // Hierarchical file tree
  flatFileList: [], // Flat list from API (for AI context)
  expandedDirs: new Set(), // Store expanded directories by their full path
  selectedFile: null,
  isFetchingTree: false,
  fetchTreeError: null,
  lastFetchedProjectRoot: null,
  lastFetchedScanPaths: [], // Retained for AI context scan paths, not directly for visual tree
});

export const setFiles = (files: FileEntry[]) => {
  fileTreeStore.setKey('files', files);
};

export const toggleDirExpansion = async (dirPath: string) => {
  const state = fileTreeStore.get(); // Get current state
  const newExpandedDirs = new Set(state.expandedDirs);
  const isCurrentlyExpanded = newExpandedDirs.has(dirPath);

  if (isCurrentlyExpanded) {
    newExpandedDirs.delete(dirPath);
  } else {
    newExpandedDirs.add(dirPath);
    // If expanding and children are not loaded, fetch them
    const dirNode = findFileEntryInTree(state.files, dirPath);
    if (
      dirNode &&
      dirNode.type === 'folder' &&
      (!dirNode.children || dirNode.children?.length === 0)
    ) {
      await loadChildrenForDirectory(dirPath); // Await children loading
    }
  }
  fileTreeStore.set({ ...state, expandedDirs: newExpandedDirs }); // Set new full state
};

export const setSelectedFile = (filePath: string | null) => {
  fileTreeStore.setKey('selectedFile', filePath);
  // When a file is selected in the tree, also set it in aiEditorStore to display its content.
  setOpenedFile(filePath);
};

/**
 * Recursively finds and updates a FileEntry in the tree.
 * Used to insert children or update properties.
 */
const updateFileEntryInTree = (
  nodes: FileEntry[],
  targetPath: string,
  updateFn: (node: FileEntry) => FileEntry,
): FileEntry[] => {
  return nodes.map((node) => {
    if (node.path === targetPath) {
      return updateFn(node);
    }
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        // Ensure node.children is correctly typed as FileEntry[] when passed recursively
        children: updateFileEntryInTree(node.children, targetPath, updateFn),
      };
    }
    return node;
  });
};

/**
 * Recursively finds a FileEntry in the tree.
 */
const findFileEntryInTree = (nodes: FileEntry[], targetPath: string): FileEntry | undefined => {
  for (const node of nodes) {
    if (node.path === targetPath) {
      return node;
    }
    if (node.children && node.children.length > 0) {
      // Ensure node.children is correctly typed as FileEntry[] when passed recursively
      const found = findFileEntryInTree(node.children, targetPath);
      if (found) return found;
    }
  }
  return undefined;
};

/**
 * Loads the initial tree for the project root. This should be called on project load/change.
 */
export const loadInitialTree = async (projectRoot: string) => {
  const currentStore = fileTreeStore.get();
  // For initial tree load, we just want the top level files. No scanPaths needed for this specific action.
  // This function also populates flatFileList for AI context.

  // If we want to use 'lastFetchedProjectRoot' for caching, we'd need to compare if projectRoot is same.
  // For now, assume a fresh fetch for the initial view.

  fileTreeStore.setKey('isFetchingTree', true);
  fileTreeStore.setKey('fetchTreeError', null);
  fileTreeStore.setKey('files', []); // Clear existing tree
  fileTreeStore.setKey('lastFetchedProjectRoot', projectRoot); // Set this immediately to indicate a fetch is in progress for this root

  try {
    // Fetch top-level directories and files
    const apiNodes = await fetchDirectoryContents(projectRoot);
    const initialTreeNodes: FileEntry[] = apiNodes.map((node) => ({
      ...node,
      depth: 0,
      collapsed: node.type === 'folder', // All new folders are collapsed by default
      relativePath: getRelativePath(node.path, projectRoot), // Calculate relative path
      children: [], // Initialize children as empty FileEntry[] for consistency
    }));

    // Sort folders first, then files
    initialTreeNodes.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });

    fileTreeStore.setKey('files', initialTreeNodes);

    // Additionally, fetch *all* relevant files for AI context using scan API
    // This uses aiEditorStore.scanPathsInput
    const { scanPathsInput } = aiEditorStore.get();
    const parsedScanPaths = scanPathsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const scannedFiles = await fetchScannedFilesForAI(projectRoot, parsedScanPaths);
    fileTreeStore.setKey('flatFileList', scannedFiles); // This is now correctly typed as ApiFileScanResult[]
    fileTreeStore.setKey('lastFetchedScanPaths', parsedScanPaths);
  } catch (err) {
    console.error('Error loading initial tree or scanned files:', err);
    fileTreeStore.setKey(
      'fetchTreeError',
      `Failed to load project files: ${err instanceof Error ? err.message : String(err)}`,
    );
    fileTreeStore.setKey('files', []); // Ensure tree is empty on error
    fileTreeStore.setKey('flatFileList', []);
  } finally {
    fileTreeStore.setKey('isFetchingTree', false);
  }
};

/**
 * Loads children for a given directory path and updates the tree state.
 */
export const loadChildrenForDirectory = async (parentPath: string) => {
  const state = fileTreeStore.get();
  // Prevent re-fetching if already fetching children for this path
  if (state.isFetchingTree) {
    return;
  }

  // Find the parent node to determine its depth and ensure it's a folder
  const parentNode = findFileEntryInTree(state.files, parentPath);
  if (!parentNode || parentNode.type !== 'folder') {
    console.warn(`Attempted to load children for non-folder or non-existent path: ${parentPath}`);
    return;
  }

  fileTreeStore.setKey('isFetchingTree', true); // Set global fetching state
  // No specific error key per folder yet, global fetchTreeError will be used for now.

  try {
    const childrenNodes = await fetchDirectoryContents(parentPath);

    const newChildren: FileEntry[] = childrenNodes.map((node) => ({
      ...node,
      depth: (parentNode.depth || 0) + 1,
      collapsed: node.type === 'folder', // All new folders are collapsed by default
      relativePath: getRelativePath(node.path, state.lastFetchedProjectRoot || ''),
      children: [], // Initialize children as empty FileEntry[]
    }));

    const updatedTree = updateFileEntryInTree(state.files, parentPath, (node) => ({
      ...node,
      children: newChildren.sort((a, b) => {
        // Sort directories first, then files, alphabetically
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
      }),
    }));
    fileTreeStore.setKey('files', updatedTree);
  } catch (err) {
    console.error(`Error loading children for directory ${parentPath}:`, err);
    fileTreeStore.setKey(
      'fetchTreeError',
      `Failed to load children for ${parentPath}: ${err instanceof Error ? err.message : String(err)}`,
    );
  } finally {
    fileTreeStore.setKey('isFetchingTree', false);
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
  setOpenedFile(null);
};
