import { FileEntry as ApiFileEntry } from './index';

export interface FileEntry extends ApiFileEntry {
  children?: FileEntry[];
  collapsed?: boolean;
  depth?: number;
  relativePath?: string; // Relative path from the project root
}

export interface FileTreeState {
  files: FileEntry[]; // Top-level directories/files (after tree construction)
  flatFileList: ApiFileEntry[]; // All files returned from API (flat)
  // Removed 'loading' and 'error' as 'isFetchingTree' and 'fetchTreeError' are more specific
  expandedDirs: Set<string>; // Set of filePaths of expanded directories
  selectedFile: string | null; // filePath of the currently selected file
  isFetchingTree: boolean;
  fetchTreeError: string | null;
}
