import { fetchWithBasicAuth, handleResponse, SLS_VIDU_URL } from '@/api/fetch';
import { ISession } from '@/components/swingers/types';

const API_SESSIONS_BASE_URL = `${SLS_VIDU_URL}/api/sessions`;

/**
 * Fetches all active OpenVidu sessions.
 * Corresponds to: GET /openvidu/api/sessions
 * @returns A promise that resolves to an array of ISession objects.
 */
export const getSessions = async (): Promise<ISession[]> => {
  try {
    const response = await fetchWithBasicAuth(
      API_SESSIONS_BASE_URL,
      { method: 'GET' },
    );
    return handleResponse<ISession[]>(response);
  } catch (error) {
    console.error(
      `Error fetching OpenVidu sessions:`, // Corrected error message
      error,
    );
    throw error;
  }
};

/**
 * Fetches a specific OpenVidu session by its ID.
 * Corresponds to: GET /openvidu/api/sessions/<SESSION_ID>
 * @param sessionId The ID of the session to fetch.
 * @returns A promise that resolves to a single ISession object.
 */
export const getSession = async (sessionId: string): Promise<ISession> => {
  try {
    const response = await fetchWithBasicAuth(
      `${API_SESSIONS_BASE_URL}/${sessionId}`,
      { method: 'GET' },
    );
    return handleResponse<ISession>(response);
  } catch (error) {
    console.error(
      `Error fetching OpenVidu session with ID ${sessionId}:`, // Corrected error message
      error,
    );
    throw error;
  }
};

/**
 * Deletes a specific OpenVidu session by its ID.
 * Corresponds to: DELETE /openvidu/api/sessions/<SESSION_ID>
 * @param sessionId The ID of the session to delete.
 * @returns A promise that resolves when the session is successfully deleted.
 */
export const deleteSession = async (sessionId: string): Promise<void> => {
  try {
    const response = await fetchWithBasicAuth(
      `${API_SESSIONS_BASE_URL}/${sessionId}`,
      { method: 'DELETE' },
    );
    // handleResponse will throw if response.ok is false
    await handleResponse(response);
  } catch (error) {
    console.error(
      `Error deleting OpenVidu session with ID ${sessionId}:`, // Corrected error message
      error,
    );
    throw error;
  }
};
