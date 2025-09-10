import { getToken } from '@/stores/authStore';
import {
  MediaFileResponseDto,
  PaginationMediaQueryDto,
  PaginationMediaResultDto,
  CreateMediaDto,
} from '@/types'; // Import DTOs from frontend types

const API_BASE_URL = `/api`;

interface ApiError extends Error {
  statusCode?: number;
  message: string;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || `API error: ${response.status}`);
  }
  return response.json();
};

const fetchWithAuth = async (url: string, options?: RequestInit) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  return fetch(url, { ...options, headers });
};

/**
 * Constructs a URL for streaming a file from the backend.
 * @param filePath The path to the file on the backend server.
 * @returns A URL string that can be used as an audio/video source.
 */
export const getFileStreamUrl = (filePath: string): string => {
  const token = getToken();
  // Construct the URL to the backend's stream endpoint
  const url = new URL(`${API_BASE_URL}/file/stream`, window.location.origin);
  url.searchParams.append('filePath', filePath);
  if (token) {
    url.searchParams.append('token', token); // Append token for authentication
  }
  return url.toString();
};

/**
 * Fetches a list of media files from the backend, with optional pagination and filters.
 * @param query Pagination and filter parameters.
 * @returns A promise that resolves to a paginated result of MediaFileResponseDto.
 */
export const fetchMediaFiles = async (
  query: PaginationMediaQueryDto = {},
): Promise<PaginationMediaResultDto> => {
  const queryString = new URLSearchParams(
    query as Record<string, any>,
  ).toString();
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/media?${queryString}`,
      {
        method: 'GET',
      },
    );
    return handleResponse<PaginationMediaResultDto>(response);
  } catch (error) {
    console.error('Error fetching media files:', error);
    throw error;
  }
};

/**
 * Sends a request to the backend to extract audio/video from a given URL.
 * @param dto The data transfer object containing the URL, format, provider, and cookieAccess.
 * @returns A promise that resolves to the details of the extracted media file.
 */
export const extractMediaFromUrl = async (
  dto: CreateMediaDto,
): Promise<MediaFileResponseDto> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/media/extract`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return handleResponse<MediaFileResponseDto>(response);
  } catch (error) {
    console.error('Error extracting media from URL:', error);
    throw error;
  }
};
