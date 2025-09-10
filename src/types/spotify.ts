import { MediaFileResponseDto } from './media'; // Import MediaFileResponseDto from the new media types file

export type RepeatMode = 'off' | 'context' | 'track';

/**
 * DTO matching the backend's CreatePlaylistDto payload for direct playlist creation.
 * Does NOT include mediaFileIds initially.
 */
export interface CreatePlaylistApiDto {
  name: string;
  description?: string;
  isPublic?: boolean;
}

/**
 * Frontend-specific request DTO for creating a playlist.
 * Can include an optional list of media file IDs to be added during creation.
 */
export interface PlaylistCreationRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
  mediaFileIds?: string[]; // Optional array of MediaFile IDs to include initially
}

// DTO for updating a playlist (matches backend)
export interface UpdatePlaylistDto {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

// DTO for adding/removing media to/from a playlist (matches backend)
export interface AddRemoveMediaToPlaylistDto {
  mediaFileId: string;
  order?: number; // Optional order for adding media
}

// DTO for a track within a playlist response (backend perspective)
export interface PlaylistTrackResponseDto {
  id: string; // PlaylistMediaFile ID
  playlistId: string;
  fileId: string;
  createdAt: string;
  updatedAt: string;
  order: number;
  file: MediaFileResponseDto; // Full media file details
}

// DTO for a playlist response from the backend (matches backend)
export interface PlaylistResponseDto {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  tracks: PlaylistTrackResponseDto[]; // Tracks are nested under playlistMediaFiles
  trackCount: number;
}

// DTO for playlist pagination queries (matches backend)
export interface PaginationPlaylistQueryDto {
  page?: number;
  pageSize?: number;
  name?: string;
  isPublic?: boolean;
}

// DTO for paginated playlist results (matches backend)
export interface PaginationPlaylistResultDto {
  items: PlaylistResponseDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// DTO for creating a PlaylistMediaFile (matches backend)
export interface CreatePlaylistMediaFileDto {
  playlistId: string;
  fileId: string;
  order: number;
}

// DTO for updating a PlaylistMediaFile (matches backend)
export interface UpdatePlaylistMediaFileDto {
  playlistId?: string;
  fileId?: string;
  order?: number;
}

// DTO for PlaylistMediaFile response (derived from backend DTO + timestamps/ID)
export interface PlaylistMediaFileResponseDto
  extends CreatePlaylistMediaFileDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  // Optionally include nested relations if the API returns them, e.g.:
  // playlist?: PlaylistResponseDto;
  // file?: MediaFileResponseDto;
}

// DTO for PlaylistMediaFile pagination queries (matches backend)
export interface PaginationPlaylistMediaFileQueryDto {
  page?: number;
  pageSize?: number;
  playlistId?: string;
  fileId?: string;
  order?: number;
}

// DTO for paginated PlaylistMediaFile results (matches backend)
export interface PaginationPlaylistMediaFileResultDto {
  items: PlaylistMediaFileResponseDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
