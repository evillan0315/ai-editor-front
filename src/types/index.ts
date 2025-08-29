import { FileChange, ModelResponse, type FileAction, AddOrModifyFileChange ,DeleteOrAnalyzeFileChange } from '@/constants';
import { FileEntry as TreeFileEntry } from './fileTree'; // Import for FileTree

export interface FileEntry {
  name: string;
  filePath: string; // Changed from 'path' to 'filePath'
  type: 'file' | 'directory';
  size?: number;
  lastModified?: string;
}

export interface FileContentResponse {
  content: string;
  filePath: string;
}

export interface AiEditorState {
  instruction: string;
  currentProjectPath: string | null;
  response: string | null; // AI's last raw response string
  loading: boolean;
  error: string | null;
  scanPathsInput: string; // Add scanPathsInput to the state
  lastLlmResponse: ModelResponse | null; // Stores the full structured response from LLM
  selectedChanges: Record<string, FileChange>; // Map of filePath to ProposedFileChange
  currentDiff: string | null; // The content of the diff for the currently viewed file
  diffFilePath: string | null; // The filePath of the file whose diff is currently displayed
  applyingChanges: boolean; // Indicates if apply changes operation is in progress
  appliedMessages: string[]; // Messages from the backend after applying changes
  openedFile: string | null; // Path of the file currently opened in the right editor panel
  openedFileContent: string | null; // Content of the file currently opened
  isFetchingFileContent: boolean; // Loading state for fetching opened file content
  fetchFileContentError: string | null; // Error state for fetching opened file content
}

export type { FileChange, ModelResponse, FileAction, AddOrModifyFileChange, DeleteOrAnalyzeFileChange };
