
// /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/project-board-front/src/types/index.ts
import { AlertColor } from '@mui/material';



// =========================================================================
// Core Type Exports from Refactored Modules
// =========================================================================
export * from './refactored/fileTree';
export * from './refactored/media';
export * from './refactored/spotify';
export * from './auth';


// =========================================================================
// AI/LLM Related Types
// =========================================================================

// File Actions for AI-generated changes
export enum FileAction {
  ADD = 'add',
  MODIFY = 'modify',
  DELETE = 'delete',
  REPAIR = 'repair',
  ANALYZE = 'analyze',
}

// Base interface for file changes
export interface BaseFileChange {
  filePath: string; // Absolute path to the file
  reason?: string;
  action: FileAction;
}

// Specific types for different file change actions
export interface AddOrModifyFileChange extends BaseFileChange {
  action: FileAction.ADD | FileAction.MODIFY | FileAction.REPAIR;
  newContent: string;
}

export interface DeleteOrAnalyzeFileChange extends BaseFileChange {
  action: FileAction.DELETE | FileAction.ANALYZE;
  newContent?: never; // Delete and analyze actions don't have new content
}

// Union type for all possible file changes
export type FileChange = AddOrModifyFileChange | DeleteOrAnalyzeFileChange;

// Model Response structure from LLM
export interface ModelResponse {
  summary: string;
  thoughtProcess?: string;
  changes: FileChange[];
  gitInstructions?: string[];
  requestType: RequestType;
  outputFormat: LlmOutputFormat;
  rawResponse?: string; // For debugging or display of raw LLM output
  error?: string; // If the LLM itself reports an error in its structured response
  buildScript?: string; // Optional build script from LLM response
}

// Request Types
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

// LLM Output Formats
export enum LlmOutputFormat {
  JSON = 'json',
  YAML = 'yaml',
  MARKDOWN = 'markdown',
  TEXT = 'text',
}

export const LlmOutputFormatValues = Object.values(LlmOutputFormat);

// LLM Payload and Context Types
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
  requestType: RequestType;
  imageData?: string; // Base64 image data
  fileData?: string; // Base64 file data
  fileMimeType?: string; // Mime type of the uploaded file/image
  output?: LlmOutputFormat; // Desired output format for the LLM response
}

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

export interface LlmReportErrorContext {
  originalUserPrompt?: string; // From originalLlmGeneratePayload.userPrompt
  systemInstruction?: string; // From originalLlmGeneratePayload.additionalInstructions
  failedChanges?: FileChange[]; // From previousLlmResponse.changes
  originalFilePaths?: string[]; // Derived from failedChanges.filePath
}

export interface LlmReportErrorApiPayload {
  errorDetails: string;
  projectRoot: string;
  context: LlmReportErrorContext;
  scanPaths?: string[];
}

// =========================================================================
// File Operation Types
// =========================================================================

// API Results for file operations
export interface FileOperationResult {
  success: boolean;
  message: string;
  filePath?: string; // Path of the file involved in the operation
  error?: string;
}

export interface RenameResult extends FileOperationResult {
  oldPath?: string;
  newPath?: string;
}

export interface CopyResult extends FileOperationResult {
  sourcePath?: string;
  destinationPath?: string;
}

export interface MoveResult extends FileOperationResult {
  sourcePath?: string;
  destinationPath?: string;
}

export interface FileContentResponse {
  content: string;
  filePath: string;
}

// =========================================================================
// Terminal & Build Related Types
// =========================================================================

export interface TerminalCommandResponse {
  stdout: string;
  stderr: string;
  exitCode: number;
}

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

// =========================================================================
// AI Editor State Types
// =========================================================================

export interface AiEditorState {
  instruction: string;
  aiInstruction: string;
  expectedOutputInstruction: string;
  requestType: RequestType;
  llmOutputFormat: LlmOutputFormat;
  uploadedFileData: string | null;
  uploadedFileName: string | null; // Name of the uploaded file/image
  uploadedFileMimeType: string | null;
  currentProjectPath: string | null;
  response: string | null; // AI's last raw response string
  loading: boolean;
  error: string | null;
  scanPathsInput: string; // Add scanPathsInput to the state
  lastLlmResponse: ModelResponse | null; // Stores the full structured response from LLM
  lastLlmGeneratePayload: LlmGeneratePayload | null; // Stores the last payload sent to generateCode
  selectedChanges: Record<string, FileChange>; // Map of filePath to ProposedFileChange
  currentDiff: string | null; // The content of the diff for the currently viewed file
  diffFilePath: string | null; // The filePath of the file whose diff is currently displayed
  applyingChanges: boolean; // Indicates if apply changes operation is in progress
  appliedMessages: string[]; // Messages from the backend after applying changes
  gitInstructions: string[] | null; // Optional git commands from LLM response
  runningGitCommandIndex: number | null; // Index of the git command currently being executed
  commandExecutionOutput: TerminalCommandResponse | null; // Output from the last git command execution
  commandExecutionError: string | null; // Error from the last git command execution
  openedFile: string | null; // Path of the file currently opened in the right editor panel
  openedFileContent: string | null; // Content of the file currently opened
  initialFileContentSnapshot: string | null; // Snapshot of file content when opened
  isFetchingFileContent: boolean; // Loading state for fetching opened file content
  fetchFileContentError: string | null; // Error state for fetching opened file content
  isSavingFileContent: boolean; // Loading state for saving opened file content
  saveFileContentError: string | null; // Error state for saving opened file content
  isOpenedFileDirty: boolean; // Indicates if opened file content has unsaved changes
  autoApplyChanges: boolean; // Automatically apply changes after generation
  isBuilding: boolean; // Indicates if a build process is running
  buildOutput: TerminalCommandResponse | null; // Output from the last build command
  openedTabs: string[]; // List of file paths currently opened as tabs
  snackbar: {
    open: boolean;
    message: string;
    severity: AlertColor | undefined;
  }; // Global snackbar state
}

// =========================================================================
// App & UI Component Types
// =========================================================================

// App Definition (for AppsMenuContent)
export interface AppDefinition {
  id: string;
  title: string;
  description: string;
  link: string;
  icon: React.ElementType; // For Material UI Icons
  linkText?: string; // Added linkText property
  requestType?: RequestType; // Optional, for apps that pre-configure AI editor
  llmOutputFormat?: LlmOutputFormat; // Optional, for apps that pre-configure AI editor
}

// Profile Menu Item Definition (for ProfileMenuContent)
export interface ProfileMenuItem {
  id: string;
  title: string;
  description?: string;
  link?: string;
  action?: 'logout'; // Specific action for logout
  icon: React.ElementType; // For Material UI Icons
}

// Context Menu Types (for FileTree and potentially other areas)
import { FileEntry } from './refactored/fileTree'; // Import FileEntry specifically for ContextMenuItem
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

// =========================================================================
// Gemini Live Audio Types
// =========================================================================

/**
 * Represents server-side content within a LiveMessageDto.
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

// Gemini Live Audio Store State
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

// =========================================================================
// Project Management Types
// =========================================================================

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

// =========================================================================
// Transcription Types (Re-exported from media for convenience)
// =========================================================================
/*export {
  TranscriptionSegment,
  TranscriptionResult,
  SyncTranscriptionRequest,
  SyncTranscriptionResponse,
  TranscriptionApi,
} from './refactored/media';*/