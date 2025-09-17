import { getToken } from '@/stores/authStore';
import {
  BaseReponseDto,
} from '@/types';
import { PaginationRecordingQueryDto, PaginationRecordingResultDto, TranscodeToGifDto } from '@/types/recording';

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


export const recordingApi = {
  startRecording: async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/recording/record-start`, {
        method: 'POST',
      });
      return handleResponse<BaseReponseDto>(response);
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  },
  stopRecording: async (id: string) => {
    try {
       const response = await fetchWithAuth(`${API_BASE_URL}/recording/record-stop?id=${id}`, {
        method: 'POST',
      });
      return handleResponse<BaseReponseDto>(response);
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw error;
    }
  },
  capture: async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/recording/capture`, {
        method: 'POST',
      });
      return handleResponse<BaseReponseDto>(response);
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      throw error;
    }
  },
  recordingStatus: async () => {
     try {
      const response = await fetchWithAuth(`${API_BASE_URL}/recording/status`);
      return handleResponse<BaseReponseDto>(response);
    } catch (error) {
      console.error('Error getting recording status:', error);
      throw error;
    }
  },
  convertToGif: async (dto: TranscodeToGifDto) => {
     try {
      const response = await fetchWithAuth(`${API_BASE_URL}/ffmpeg/transcode-gif`, {
         method: 'POST',
        body: JSON.stringify(dto),
      });
      return handleResponse<BaseReponseDto>(response);
    } catch (error) {
      console.error('Error converting to GIF:', error);
      throw error;
    }
  },
  getRecordings: async (query: PaginationRecordingQueryDto = {}): Promise<PaginationRecordingResultDto> => {
    try {
      const queryString = new URLSearchParams(
        query as Record<string, any>,
      ).toString();
      const response = await fetchWithAuth(
        `${API_BASE_URL}/recording/paginated?${queryString}`,
        {
          method: 'GET',
        },
      );
      return handleResponse<PaginationRecordingResultDto>(response);
    } catch (error) {
      console.error('Error fetching paginated recordings:', error);
      throw error;
    }
  },
};
