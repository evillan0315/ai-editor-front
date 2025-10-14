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
  [key: string]: any; // Allow other properties
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
  data?: any;
  name?: string;
  type?: string; // Allow updating type
}

/**
 * Interface for recorder settings, intended for persistent storage.
 */
export interface IRecorderSettings {
  namePrefix: string;
  screenResolution: string; // e.g., '1920x1080'
  screenFramerate: number; // e.g., 30
  cameraResolution: string; // e.g., '1280x720'
  cameraFramerate: number; // e.g., 30
  cameraAudioDevice: string; // e.g., 'alsa_input.pci-0000_00_1b.0.analog-stereo'
  cameraVideoDevice: string; // e.g., '/dev/video0'
}