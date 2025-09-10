import axios from 'axios';
import { getToken } from '@/stores/authStore';
import {
  CreatePlaylistMediaFileDto,
  UpdatePlaylistMediaFileDto,
  PlaylistMediaFileResponseDto,
  PaginationPlaylistMediaFileQueryDto,
  PaginationPlaylistMediaFileResultDto,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const playlistMediaFileApi = axios.create({
  baseURL: `${API_BASE_URL}/api/playlist-media-file`, // Base URL for playlist media file endpoints
  withCredentials: true,
});

// Add a request interceptor to include the Authorization header
playlistMediaFileApi.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/**
 * Creates a new PlaylistMediaFile record.
 */
export const createPlaylistMediaFile = async (
  dto: CreatePlaylistMediaFileDto,
): Promise<PlaylistMediaFileResponseDto> => {
  const response =
    await playlistMediaFileApi.post<PlaylistMediaFileResponseDto>('/', dto);
  return response.data;
};

/**
 * Retrieves all PlaylistMediaFile records.
 */
export const fetchAllPlaylistMediaFiles = async (): Promise<
  PlaylistMediaFileResponseDto[]
> => {
  const response =
    await playlistMediaFileApi.get<PlaylistMediaFileResponseDto[]>('/');
  return response.data;
};

/**
 * Retrieves paginated PlaylistMediaFile records.
 */
export const fetchPaginatedPlaylistMediaFiles = async (
  query: PaginationPlaylistMediaFileQueryDto = { page: 1, pageSize: 10 },
): Promise<PaginationPlaylistMediaFileResultDto> => {
  const response =
    await playlistMediaFileApi.get<PaginationPlaylistMediaFileResultDto>(
      '/paginated',
      { params: query },
    );
  return response.data;
};

/**
 * Finds a PlaylistMediaFile record by its ID.
 */
export const fetchPlaylistMediaFileById = async (
  id: string,
): Promise<PlaylistMediaFileResponseDto> => {
  const response = await playlistMediaFileApi.get<PlaylistMediaFileResponseDto>(
    `/${id}`,
  );
  return response.data;
};

/**
 * Updates a PlaylistMediaFile record by its ID.
 */
export const updatePlaylistMediaFile = async (
  id: string,
  dto: UpdatePlaylistMediaFileDto,
): Promise<PlaylistMediaFileResponseDto> => {
  const response =
    await playlistMediaFileApi.patch<PlaylistMediaFileResponseDto>(
      `/${id}`,
      dto,
    );
  return response.data;
};

/**
 * Deletes a PlaylistMediaFile record by its ID.
 */
export const deletePlaylistMediaFile = async (
  id: string,
): Promise<{ message: string }> => {
  const response = await playlistMediaFileApi.delete<{ message: string }>(
    `/${id}`,
  );
  return response.data;
};
