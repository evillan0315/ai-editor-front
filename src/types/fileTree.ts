// src/types/fileTree.ts
// No import needed from ./index for FileEntry here, it's self-contained

export interface FileEntry {
  // This is the UI-enriched file item
  name: string;
  filePath: string; // Frontend's consistent way of referring to the absolute path
  isDirectory: boolean;
  type: 'file' | 'folder'; // 'file' or 'folder'
  lang?: string;
  mimeType?: string;
  size?: number;
  createdAt?: string; // ISO string
  updatedAt?: string; // ISO string
  children?: FileEntry[]; // For the hierarchical tree in UI. Optional.
  collapsed?: boolean; // UI state for folders
  depth?: number; // UI state for indentation
  relativePath?: string; // Path relative to the project root
  isOpen?: boolean; // For explorer nodes to show open/close state (e.g., in legacy EditorExplorer)
  isLoadingChildren?: boolean; // For explorer nodes to show loading state (e.g., in legacy EditorExplorer)
}

export interface FileTreeState {
  files: FileEntry[]; // Top-level directories/files (after tree construction)
  flatFileList: FileEntry[]; // All files returned from API (flat, after flattening BackendFileTreeNode)
  expandedDirs: Set<string>; // Set of filePaths of expanded directories
  selectedFile: string | null; // filePath of the currently selected file
  isFetchingTree: boolean;
  fetchTreeError: string | null;
  lastFetchedProjectRoot?: string | null; // Tracks the project root for the last successful fetch
  lastFetchedScanPaths?: string[]; // Tracks the scan paths for the last successful fetch
}
