import {
  FileChange,
  ModelResponse,
  type FileAction,
  AddOrModifyFileChange,
  DeleteOrAnalyzeFileChange,
} from '@/constants';

/**
 * Represents a file or folder entry returned by the backend's /api/file/list (non-recursive) endpoint.
 * This interface mirrors the backend's FileTreeNode directly.
 */
export interface FileTreeNode {
  name: string;
  path: string; // Absolute path to the file or folder
  isDirectory: boolean;
  type: 'file' | 'folder';
  lang?: string;
  mimeType?: string;
  size?: number;
  createdAt?: Date;
  updatedAt?: Date;
  children: FileTreeNode[]; // Will be empty when recursive=false is used.
}

/**
 * Represents a file entry returned by the backend's /api/file/scan endpoint.
 * This is used for providing AI context and is a flat structure.
 */
export interface ApiFileScanResult {
  filePath: string; // Absolute path to the file
  relativePath: string; // Path relative to the project root (e.g., "src/components/MyComponent.tsx")
  content: string;
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

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | null;

export interface PackageScript {
  name: string;
  script: string; // The raw script command from package.json, e.g., "vite --port 3001"
}

export interface ProjectScriptsResponse {
  scripts: PackageScript[];
  packageManager: PackageManager;
}

export enum ScriptStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

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
  autoApplyChanges: boolean; // New: Automatically apply changes after generation
}

export interface TranslatorState {
  inputText: string;
  uploadedFileData: string | null;
  uploadedFileName: string | null; // To display the name of the uploaded file
  uploadedFileMimeType: string | null;
  targetLanguage: string;
  translatedContent: string | null;
  loading: boolean;
  error: string | null;
}

export {
  type FileChange,
  type ModelResponse,
  FileAction,
  type AddOrModifyFileChange,
  type DeleteOrAnalyzeFileChange,
};
