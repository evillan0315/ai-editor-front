export interface PaginationRecordingQueryDto {
  page?: number;
  limit?: number;
}

export interface PaginationRecordingResultDto {
  items: RecordingResultDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number; // Ensure totalPages is defined here
}
export interface RecordingStartResponse {
  id: string;
  path: string;
}
export interface RecordingStopResponse extends RecordingStartResponse {
  status: string;
}
export interface RecordingStatusDto {
  id: string;
  recording: boolean;
  file: string | null;
  startedAt: string | null;
}
export interface RecordingResultDto extends RecordingStartResponse {
  type: string;
  pid: string;
  status: string;
  data: RecordingDataDto;
  createdAt: string;
  createdById: string;
}

export interface RecordingDataDto {
  duration?: number;
  fileSize?: number;
  startedAt?: string;
  stoppedAt?: string;
  capturedAt?: string;
  animatedGif?: string;
}
export interface TranscodeToGifDto {
  inputFilename: string;
  fps?: number;
  width?: number;
  loop?: number;
}
export interface TranscodeToGifResult {
  message: string;
  outputFilename: string;
  fullPath: string;
}

export interface StartCameraRecordingDto {
  audioDevice?: string[];
  cameraDevice?: string[];
  resolution?: string;
  framerate?: number;
  duration?: number; // In seconds
  name?: string;
}

export interface CameraRecordingResponseDto {
  id: string;
  message: string;
  path: string;
  pid?: string;
}

export interface UpdateRecordingDto {
  data: any;
}

/**
 * Represents a recording item displayed in the frontend table.
 * Moved from src/components/recording/Recording.tsx for shared use.
 */
export interface RecordingItem {
  id: string;
  name: string;
  createdAt: string;
  sizeBytes: number;
  type: string;
  status: string;
  path: string;
  createdById: string;
  data: {
    duration?: number;
    fileSize?: number;
    animatedGif?: string; // Added animatedGif property
    [key: string]: any; // Allow other properties
  };
}
