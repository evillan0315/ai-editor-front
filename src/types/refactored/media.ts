export enum FileType {
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT',
  CODE = 'CODE',
  TEXT = 'TEXT',
  ZIP = 'ZIP',
  PDF = 'PDF',
  MARKDOWN = 'MARKDOWN',
  YAML = 'YAML',
  JSON = 'JSON',
  JAVASCRIPT = 'JAVASCRIPT',
  TYPESCRIPT = 'TYPESCRIPT',
  JSX = 'JSX',
  TSX = 'TSX',
  CSS = 'CSS',
  HTML = 'HTML',
  SQL = 'SQL',
  PYTHON = 'PYTHON',
  JAVA = 'JAVA',
  XML = 'XML',
  TRANSCRIPT = 'TRANSCRIPT',
  OTHER = 'OTHER',
}

/**
 * A constant array of allowed media formats for extraction/processing.
 */
export const allowedMediaFormats = [
  'mp3',
  'webm',
  'm4a',
  'wav',
  'mp4',
  'flv',
] as const;

/**
 * Type representing one of the allowed media formats.
 */
export type AllowedMediaFormat = (typeof allowedMediaFormats)[number];

/**
 * Interface for generic audio or video metadata (e.g., for AUDIO, VIDEO, IMAGE).
 */
export interface GenericMediaMetadataData {
  title?: string;
  duration?: string; // Duration as string for general media
  thumbnail?: string | null;
}

export type MediaPlayerType = 'AUDIO' | 'VIDEO';

/**
 * Base interface for common metadata properties.
 */
export interface BaseMediaMetadata {
  id: string;
  tags: string[];
  createdAt: string;
  fileId: string;
  createdById: string | null;
}

/**
 * Discriminated union for MediaMetadata, allowing different `data` types
 * based on the `type` of the metadata.
 */
export type MediaMetadata =
  | (BaseMediaMetadata & {
      type: Exclude<FileType, FileType.TRANSCRIPT>;
      data: GenericMediaMetadataData; // For all types except TRANSCRIPT
    })
  | (BaseMediaMetadata & {
      type: FileType.TRANSCRIPT;
      data: TranscriptionResult; // Specifically TranscriptionResult for TRANSCRIPT type
    });

/**
 * DTO for creating a new media file entry in the backend.
 */
export interface CreateMediaDto {
  url: string;
  format?: AllowedMediaFormat;
  provider?: string;
  cookieAccess?: boolean;
}

/**
 * DTO representing a media file response from the backend.
 * This is the pure data model received from the API, aligned with the Prisma `File` model
 * and the backend `MediaFileResponseDto` with necessary adjustments for frontend types.
 */
export interface MediaFileResponseDto {
  id: string;
  name: string;
  content?: string | null; // Added from Prisma File model
  path: string;
  fileType: FileType;
  mimeType?: string | null;
  size?: string; // Prisma uses BigInt, string is common for frontend representation
  provider?: string | null;
  url?: string | null;
  createdAt: string; // Assuming string serialization of Date from backend
  updatedAt: string | null; // Assuming string serialization of Date from backend
  songId?: string | null;
  videoId?: string | null;
  createdById: string;
  folderId?: string | null;
  metadata?: MediaMetadata[] | null; // Now using the discriminated union type
  song?: Song | null;
  video?: Video | null;
}
export interface MediaFileResponseDtoUrl extends MediaFileResponseDto {
  streamUrl: string;
}
/**
 * DTO for querying media files with pagination.
 */
export interface PaginationMediaQueryDto {
  page?: number;
  pageSize?: number;
  name?: string;
  fileType?: FileType[]; // Changed to array of FileType
  provider?: string;
  url?: string;
  folderId?: string;
}

/**
 * DTO for paginated media file results.
 */
export interface PaginationMediaResultDto {
  items: MediaFileResponseDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * DTO for Media Scan Request, matching backend.
 */
export interface MediaScanRequestDto {
  directoryPath: string;
}

/**
 * DTO for Media Scan Response, matching backend.
 */
export interface MediaScanResponseDto {
  success: boolean;
  message: string;
  scannedFilesCount: number;
  errors?: string[];
}

// =========================================================================
// Transcription Types
// =========================================================================

/**
 * Represents a single segment of transcribed text with timing information
 */
export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  confidence: number;
}

/**
 * Complete transcription result for an audio file
 */
export interface TranscriptionResult {
  segments: TranscriptionSegment[];
  fullText: string;
  duration: number; // Duration as number for transcription
  language?: string;
  languageProbability?: number;
  model?: string;
  device?: string;
  id?: string; // Added for potential tracking if transcription result is stored separately
}

/**
 * Request DTO for synchronized transcription
 */
export interface SyncTranscriptionRequest {
  currentTime: number;
}

/**
 * Response DTO for synchronized transcription with highlighting data
 */
export interface SyncTranscriptionResponse {
  currentSegment: TranscriptionSegment | null;
  previousSegments: TranscriptionSegment[];
  upcomingSegments: TranscriptionSegment[];
}

/**
 * Convenience type for transcription API functions
 */
export interface TranscriptionApi {
  transcribe: (fileId: string) => Promise<TranscriptionResult>;
  getTranscription: (fileId: string) => Promise<TranscriptionResult>;
  getSyncTranscription: (
    fileId: string,
    currentTime: number,
  ) => Promise<SyncTranscriptionResponse>;
}

export interface Song {
  id: string;
  title: string;
  duration: number;
  year: number | null;
  createdAt: string;
  updatedAt: string;
  artistId: string;
  albumId: string;
  createdById: string;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  year: number | null;
  rating: number | null;
  director: string | null;
  cast: string[];
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string;
}
