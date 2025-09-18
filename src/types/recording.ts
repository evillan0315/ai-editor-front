export interface PaginationRecordingQueryDto {
  page?: number;
  limit?: number;
}

export interface PaginationRecordingResultDto {
  items: RecordingResultDto[];
  total: number;
  page: number;
  limit: number;
}
export interface RecordingStartResponse {
  id: string;
  path: string;
}
export interface RecordingStopResponse extends RecordingStartResponse {
  status: string;
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
