import { API_BASE_URL, ResponseError, handleResponse, fetchWithAuth } from '@/api';

import {
  RecordingStartResponse,
  RecordingStopResponse,
  PaginationRecordingQueryDto,
  PaginationRecordingResultDto,
  TranscodeToGifDto,
  RecordingResultDto,
  UpdateRecordingDto,
  TranscodeToGifResult,
  RecordingStatusDto,
  StartCameraRecordingDto,
  CameraRecordingResponseDto,
} from '@/types';

export const recordingApi = {
  startRecording: async () => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/recording/record-start`,
        {
          method: 'POST',
        },
      );
      return handleResponse<RecordingStartResponse>(response);
    } catch (error: unknown) {
      console.error('Error starting recording:', error);
      throw (error instanceof ResponseError) ? error : new Error(error instanceof Error ? error.message : String(error));
    }
  },
  stopRecording: async (id: string) => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/recording/record-stop?id=${id}`,
        {
          method: 'POST',
        },
      );
      return handleResponse<RecordingStopResponse>(response);
    } catch (error: unknown) {
      console.error('Error stopping recording:', error);
      throw (error instanceof ResponseError) ? error : new Error(error instanceof Error ? error.message : String(error));
    }
  },
  capture: async () => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/recording/capture`,
        {
          method: 'POST',
        },
      );
      return handleResponse<RecordingStopResponse>(response);
    } catch (error: unknown) {
      console.error('Error capturing screenshot:', error);
      throw (error instanceof ResponseError) ? error : new Error(error instanceof Error ? error.message : String(error));
    }
  },
  recordingStatus: async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/recording/status`);
      return handleResponse<RecordingStatusDto>(response);
    } catch (error: unknown) {
      console.error('Error getting recording status:', error);
      throw (error instanceof ResponseError) ? error : new Error(error instanceof Error ? error.message : String(error));
    }
  },
  startCameraRecording: async (dto: StartCameraRecordingDto) => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/recording/camera-record-start`,
        {
          method: 'POST',
          body: JSON.stringify(dto),
        },
      );
      return handleResponse<CameraRecordingResponseDto>(response);
    } catch (error: unknown) {
      console.error('Error starting camera recording:', error);
      throw (error instanceof ResponseError) ? error : new Error(error instanceof Error ? error.message : String(error));
    }
  },
  stopCameraRecording: async (id: string) => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/recording/camera-record-stop?id=${id}`,
        {
          method: 'POST',
        },
      );
      return handleResponse<CameraRecordingResponseDto>(response);
    } catch (error: unknown) {
      console.error('Error stopping camera recording:', error);
      throw (error instanceof ResponseError) ? error : new Error(error instanceof Error ? error.message : String(error));
    }
  },
  convertToGif: async (dto: TranscodeToGifDto) => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/ffmpeg/transcode-gif`,
        {
          method: 'POST',
          body: JSON.stringify(dto),
        },
      );
      return handleResponse<TranscodeToGifResult>(response);
    } catch (error: unknown) {
      console.error('Error converting to GIF:', error);
      throw (error instanceof ResponseError) ? error : new Error(error instanceof Error ? error.message : String(error));
    }
  },
  getRecordings: async (
    query: PaginationRecordingQueryDto = {},
  ): Promise<PaginationRecordingResultDto> => {
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
    } catch (error: unknown) {
      console.error('Error fetching paginated recordings:', error);
      throw (error instanceof ResponseError) ? error : new Error(error instanceof Error ? error.message : String(error));
    }
  },
  getRecording: async (id: string): Promise<RecordingResultDto> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/recording/${id}`, {
        method: 'GET',
      });
      return handleResponse<RecordingResultDto>(response);
    } catch (error: unknown) {
      console.error('Error fetching recording:', error);
      throw (error instanceof ResponseError) ? error : new Error(error instanceof Error ? error.message : String(error));
    }
  },
  updateRecording: async (
    id: string,
    dto: UpdateRecordingDto,
  ): Promise<RecordingResultDto> => { // Changed return type to RecordingResultDto for consistency
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/recording/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
      return handleResponse<RecordingResultDto>(response);
    } catch (error: unknown) {
      console.error('Error updating recording:', error);
      throw (error instanceof ResponseError) ? error : new Error(error instanceof Error ? error.message : String(error));
    }
  },
  findRecording: async (id: string): Promise<RecordingResultDto> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/recording/${id}`, {
        method: 'GET',
      });
      return handleResponse<RecordingResultDto>(response);
    } catch (error: unknown) {
      console.error('Error fetching recording:', error);
      throw (error instanceof ResponseError) ? error : new Error(error instanceof Error ? error.message : String(error));
    }
  },
  deleteRecording: async (id: string): Promise<void> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/recording/${id}`, {
        method: 'DELETE',
      });
      await handleResponse<void>(response);
    } catch (error: unknown) {
      console.error('Error deleting recording:', error);
      throw (error instanceof ResponseError) ? error : new Error(error instanceof Error ? error.message : String(error));
    }
  },
};
