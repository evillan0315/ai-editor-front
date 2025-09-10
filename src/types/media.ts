export enum FileType {
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT',
  CODE = 'CODE',
  OTHER = 'OTHER',
}

export const allowedMediaFormats = [
  'mp3',
  'webm',
  'm4a',
  'wav',
  'mp4',
  'flv',
] as const;
export type AllowedMediaFormat = (typeof allowedMediaFormats)[number];

// New: Interface for metadata often returned by media extraction services
export interface MediaFileMetadata {
  data?: {
    title?: string;
    duration?: number;
    uploader?: string;
    thumbnail?: string;
  };
  // Add any other top-level metadata properties here if needed
}

export interface CreateMediaDto {
  url: string;

  format?: AllowedMediaFormat;

  provider?: string;

  cookieAccess?: boolean;
}

export interface MediaFileResponseDto {
  id: string;

  name: string;

  path: string;

  fileType: FileType;

  mimeType?: string | null;

  size?: string;

  provider?: string | null;

  url?: string | null;

  createdAt: string;

  updatedAt: string | null;

  createdById: string;

  folderId?: string | null;

  // New: Add metadata property to match actual API responses
  metadata?: MediaFileMetadata | null;
}

export interface PaginationMediaQueryDto {
  page?: number;

  pageSize?: number;

  name?: string;

  fileType?: FileType;

  provider?: string;

  url?: string;

  folderId?: string;
}

export interface PaginationMediaResultDto {
  items: MediaFileResponseDto[];

  total: number;

  page: number;

  pageSize: number;

  totalPages: number;
}
