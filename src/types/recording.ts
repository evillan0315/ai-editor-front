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

export interface RecordingResultDto {
  id: string;
  path: string;
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