import {
  FileChange,
  ModelResponse,
  type FileAction,
  AddOrModifyFileChange,
  DeleteOrAnalyzeFileChange,
} from '@/constants';
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

export interface TerminalCommandResponse {
  stdout: string;
  stderr: string;
  exitCode: number;
}

// Duplicating from Prisma schema for frontend usage
export enum RequestType {
  TEXT_ONLY = 'TEXT_ONLY',
  TEXT_WITH_IMAGE = 'TEXT_WITH_IMAGE',
  TEXT_WITH_FILE = 'TEXT_WITH_FILE',
  LLM_GENERATION = 'LLM_GENERATION',
  LIVE_API = 'LIVE_API',
  RESUME_GENERATION = 'RESUME_GENERATION',
  RESUME_OPTIMIZATION = 'RESUME_OPTIMIZATION',
  RESUME_ENHANCEMENT = 'RESUME_ENHANCEMENT',
  VIDEO_GENERATION = 'VIDEO_GENERATION',
  IMAGE_GENERATION = 'IMAGE_GENERATION',
}

export const RequestTypeValues = Object.values(RequestType);

export interface AiEditorState {
  instruction: string;
  aiInstruction: string; // Editable version of INSTRUCTION constant
  expectedOutputInstruction: string; // Editable version of ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT constant
  requestType: RequestType; // New field for selecting request type
  uploadedFileData: string | null; // Base64 content of an uploaded file/image
  uploadedFileMimeType: string | null; // Mime type of the uploaded file/image
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
  gitInstructions: string[] | null; // New: Optional git commands from LLM response
  runningGitCommandIndex: number | null; // New: Index of the git command currently being executed
  commandExecutionOutput: TerminalCommandResponse | null; // New: Output from the last git command execution
  commandExecutionError: string | null; // New: Error from the last git command execution
  openedFile: string | null; // Path of the file currently opened in the right editor panel
  openedFileContent: string | null; // Content of the file currently opened
  isFetchingFileContent: boolean; // Loading state for fetching opened file content
  fetchFileContentError: string | null; // Error state for fetching opened file content
}

export type {
  FileChange,
  ModelResponse,
  FileAction,
  AddOrModifyFileChange,
  DeleteOrAnalyzeFileChange,
};
