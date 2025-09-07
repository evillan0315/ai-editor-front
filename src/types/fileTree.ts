import { FileTreeNode, ApiFileScanResult } from './index'; // Import ApiFileScanResult

/**
 * Represents a file or folder entry in the frontend's interactive file tree.
 * Extends FileTreeNode from the backend to include UI-specific state.
 */
export interface FileEntry extends FileTreeNode {
  collapsed: boolean; // Frontend-specific: true if folder is collapsed, false if expanded
  depth: number; // Frontend-specific: depth in the tree hierarchy for indentation
  relativePath: string; // Frontend-specific: path relative to the project root for display/selection
  children: FileEntry[]; // Crucial change: Children are also FileEntry, for recursive definition
}

export interface FileTreeState {
  files: FileEntry[]; // Top-level directories/files (after initial load, then updated hierarchically)
  flatFileList: ApiFileScanResult[]; // Flat list of *all* files from API for AI context
  expandedDirs: Set<string>; // Set of absolute filePaths of expanded directories
  selectedFile: string | null; // Absolute filePath of the currently selected file
  isFetchingTree: boolean;
  fetchTreeError: string | null;
  lastFetchedProjectRoot?: string | null; // Tracks the project root for the last successful initial fetch
  lastFetchedScanPaths?: string[]; // Tracks the scan paths for the last successful AI context fetch
}
