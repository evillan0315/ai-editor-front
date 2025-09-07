import {
  FileChange,
  ModelResponse,
  type FileAction,
  AddOrModifyFileChange,
  DeleteOrAnalyzeFileChange,
} from '@/constants';
import type { FileEntry } from './fileTree'; // Import FileEntry type

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
  ERROR_REPORT = 'ERROR_REPORT', // New: For reporting errors to LLM
}

export const RequestTypeValues = Object.values(RequestType);

// New enum for LLM output format
export enum LlmOutputFormat {
  JSON = 'json',
  YAML = 'yaml',
  MARKDOWN = 'markdown',
  TEXT = 'text',
}

export const LlmOutputFormatValues = Object.values(LlmOutputFormat);

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

// Re-export LlmGeneratePayload from '@/api/llm' if it's meant to be global
// Or define it here if it's truly a type specific to 'types/index'
export interface LlmRelevantFile {
  filePath: string;
  relativePath: string;
  content: string;
}

export interface LlmGeneratePayload {
  userPrompt: string;
  projectRoot: string;
  projectStructure: string;
  relevantFiles: LlmRelevantFile[];
  additionalInstructions: string; // Corresponds to `systemInstruction` in GeminiRequest
  expectedOutputFormat: string;
  scanPaths: string[];
  requestType: RequestType; // New: AI Request Type
  imageData?: string; // New: Base64 image data
  fileData?: string; // New: Base64 file data
  fileMimeType?: string; // New: Mime type of the uploaded file/image
  output?: LlmOutputFormat; // New: Desired output format for the LLM response
}

// New: Interface for reporting errors to LLM (Frontend's original payload structure)
// This is now aliased in src/api/llm.ts as FrontendLlmReportErrorPayload
export interface LlmReportErrorPayload {
  error: string; // The error message
  errorDetails?: string; // Additional details like stack trace or stderr
  originalRequestType?: RequestType; // Original request type that led to the build
  previousLlmResponse?: ModelResponse | null; // The LLM response that resulted in changes
  originalLlmGeneratePayload?: LlmGeneratePayload | null; // The original payload that generated the previousLlmResponse
  projectRoot: string;
  scanPaths: string[];
  buildOutput?: TerminalCommandResponse | null; // The full output of the failed build command
}

// New: Mirroring backend DTO structure for LlmReportError for frontend API calls
export interface LlmReportErrorContext {
  originalUserPrompt?: string; // From originalLlmGeneratePayload.userPrompt
  systemInstruction?: string; // From originalLlmGeneratePayload.additionalInstructions
  failedChanges?: FileChange[]; // From previousLlmResponse.changes
  originalFilePaths?: string[]; // Derived from failedChanges.filePath
}

export interface LlmReportErrorApiPayload { // This will be the type sent to the backend
  errorDetails: string; // Combination of frontend error and errorDetails + buildOutput
  projectRoot: string;
  context: LlmReportErrorContext;
  scanPaths?: string[]; // Made optional to match backend DTO
}

export interface AiEditorState {
  instruction: string;
  aiInstruction: string; // Editable version of INSTRUCTION constant
  expectedOutputInstruction: string; // Editable version of ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT constant
  requestType: RequestType; // New field for selecting request type
  llmOutputFormat: LlmOutputFormat; // New field for selecting LLM output format
  uploadedFileData: string | null; // Base64 content of an uploaded file/image
  uploadedFileName: string | null; // New: Name of the uploaded file/image
  uploadedFileMimeType: string | null; // Mime type of the uploaded file/image
  currentProjectPath: string | null;
  response: string | null; // AI's last raw response string
  loading: boolean;
  error: string | null;
  scanPathsInput: string; // Add scanPathsInput to the state
  lastLlmResponse: ModelResponse | null; // Stores the full structured response from LLM
  lastLlmGeneratePayload: LlmGeneratePayload | null; // New: Stores the last payload sent to generateCode
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
  isSavingFileContent: boolean; // New: Loading state for saving opened file content
  saveFileContentError: string | null; // New: Error state for saving opened file content
  isOpenedFileDirty: boolean; // New: Indicates if opened file content has unsaved changes
  autoApplyChanges: boolean; // New: Automatically apply changes after generation
  isBuilding: boolean; // New: Indicates if a build process is running
  buildOutput: TerminalCommandResponse | null; // New: Output from the last build command
  openedTabs: string[]; // New: List of file paths currently opened as tabs
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

// Context Menu Types (for FileTree and potentially other areas)
export interface ContextMenuItem {
  type?: 'item' | 'divider' | 'header';
  label?: string;
  icon?: React.ReactNode; // Can be a Material Icon component or other ReactNode
  action?: (file: FileEntry) => void;
  className?: string;
  disabled?: boolean;
}

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
  targetFile: FileEntry | null; // The FileEntry that the context menu was opened for
}

// --- Gemini Live Audio Types (mirroring backend DTOs) ---

/**
 * Represents server-side content within a LiveMessageDto.
 * (Input and output transcription fields are not available from the Gemini `generateContent` REST API).
 */
export interface LiveServerContentDto {
  turnComplete?: boolean;
}

/**
 * DTO for a single message part in a live session turn.
 */
export interface LiveMessageDto {
  text?: string | null;
  data?: string | null; // Base64 encoded audio or other inline data
  serverContent?: LiveServerContentDto | null;
}

/**
 * DTO representing the complete result of a turn from Gemini (from AI to client).
 */
export interface LiveTurnResultDto {
  messages: LiveMessageDto[];
  texts: string[];
  datas: any[]; // Raw data contents (may contain audio or inline data)
}

/**
 * DTO for configuration settings for a new live session.
 */
export interface LiveConfigDto {
  model?: string;
}

/**
 * DTO for options when connecting to a new live session.
 */
export interface LiveConnectOptionsDto {
  config?: LiveConfigDto;
  initialText?: string;
}

/**
 * DTO for the response containing the new session ID after a session has been successfully started.
 */
export interface LiveSessionResponseDto {
  sessionId: string;
}

/**
 * DTO for sending text input to an active live session.
 */
export interface LiveTextInputDto {
  sessionId: string;
  text: string;
}

/**
 * DTO for sending base64-encoded audio chunks to an active live session.
 */
export interface LiveAudioInputDto {
  sessionId: string;
  audioChunk: string; // Base64 encoded audio chunk
  mimeType: string;
}

/**
 * DTO for explicitly signaling the end of user input for a turn and requesting an AI response.
 */
export interface ProcessTurnDto {
  sessionId: string;
}

/**
 * DTO for ending an active live session.
 */
export interface LiveEndSessionDto {
  sessionId: string;
}

// --- Gemini Live Audio Store State ---
export interface GeminiLiveAudioState {
  sessionId: string | null;
  isSessionActive: boolean;
  isRecording: boolean;
  microphonePermissionGranted: boolean;
  userTranscript: string; // Accumulate transcription if client-side or from backend
  aiResponseText: string; // Accumulate AI's text responses
  aiResponseAudioQueue: string[]; // Queue of Base64 audio data URLs for playback
  currentInputText: string; // For initial text prompt or direct text input
  loading: boolean; // General loading state for session actions or turns
  error: string | null;
}

// --- Project Management Types (mirroring backend DTOs for Organization and Project) ---

export interface Organization {
  id: string;
  name: string;
  createdAt: string; // Assuming string representation of Date from backend
  updatedAt: string;
}

export interface CreateOrganizationDto {
  name: string;
}

export interface UpdateOrganizationDto {
  name?: string;
}

export interface PaginationOrganizationQueryDto {
  page?: number;
  pageSize?: number;
  name?: string;
}

export interface PaginationOrganizationResultDto {
  items: Organization[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  path: string;
  technologies: string[];
  versionControl: string;
  repositoryUrl: string;
  lastOpenedAt: string;
  ownerId: string;
  organizationId: string; // Link to organization
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  path: string;
  technologies: string[];
  versionControl?: string;
  repositoryUrl?: string;
  lastOpenedAt?: string; // Should be Date or ISO string
  ownerId?: string; // The user who owns the project
  organizationId: string; // Required to link to an organization
  metadata?: any;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  path?: string;
  technologies?: string[];
  versionControl?: string;
  repositoryUrl?: string;
  lastOpenedAt?: string; // Should be Date or ISO string
  ownerId?: string;
  organizationId?: string;
  metadata?: any;
}

export interface PaginationProjectQueryDto {
  page?: number;
  pageSize?: number;
  name?: string;
  description?: string;
  path?: string;
  technologies?: string[];
  versionControl?: string;
  repositoryUrl?: string;
  lastOpenedAt?: string; // Should be Date or ISO string
  ownerId?: string;
  organizationId?: string; // Filter by organization
  metadata?: any;
}

export interface PaginationProjectResultDto {
  items: Project[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export {
  type FileChange,
  type ModelResponse,
  FileAction,
  type AddOrModifyFileChange,
  type DeleteOrAnalyzeFileChange,
};
