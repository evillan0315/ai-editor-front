import { fetchWithBasicAuth, handleResponse, SLS_VIDU_URL, ApiError } from '@/api/fetch';
import { ISession } from '@/components/swingers/types';

// NOTE: These API calls interact directly with the OpenVidu server via a proxy.
// The `fetchWithBasicAuth` uses the VITE_SLS_API_KEY environment variable directly from the frontend.
// In a production environment, it is recommended to proxy these calls through your own backend
// to keep the OpenVidu secret server-side and only expose a generated token to the frontend.

const API_SESSIONS_BASE_URL = `${SLS_VIDU_URL}/api/sessions`;

/**
 * Options for creating a new OpenVidu session.
 * Corresponds to the body for POST /openvidu/api/sessions
 */
export interface ICreateSessionOptions {
  customSessionId?: string; // OpenVidu custom session ID
  mediaMode?: 'ROUTED' | 'RELAYED'; // 'ROUTED' by default if not specified
  recordingMode?: 'MANUAL' | 'ALWAYS'; // 'MANUAL' by default if not specified
  defaultRecordingProperties?: {
    name?: string;
    hasAudio?: boolean;
    hasVideo?: boolean;
    outputMode?: 'COMPOSED' | 'INDIVIDUAL';
    recordingLayout?: 'BEST_FIT' | 'CUSTOM' | 'PICTURE_IN_PICTURE' | 'VERTICAL_PRESENTATION' | 'HORIZONTAL_PRESENTATION';
    resolution?: string;
    frameRate?: number;
    shmSize?: number;
  };
}

/**
 * Creates or initializes a new OpenVidu session.
 * Corresponds to: POST /openvidu/api/sessions
 * @param options Optional parameters for session creation, such as customSessionId or mediaMode.
 * @returns A promise that resolves to the created ISession object (new or existing).
 */
export const createSession = async (options?: ICreateSessionOptions): Promise<ISession> => {
  try {
    const response = await fetchWithBasicAuth(
      API_SESSIONS_BASE_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options || {}),
      },
    );
    return handleResponse<ISession>(response); // This will return the session if OK, or throw ApiError
  } catch (error: unknown) {
    if (error instanceof ApiError && error.statusCode === 409) {
      // If a 409 Conflict occurs, OpenVidu sends back the existing session object in the response body.
      // handleResponse will have parsed this and attached it to error.data.
      if (error.data && typeof error.data === 'object' && (error.data as ISession).sessionId) {
        console.warn(`Session ${options?.customSessionId} already exists. Returning existing session from error data.`);
        return error.data as ISession; // Return the existing session data
      } else {
        // If error.data is missing or malformed for a 409, it's an unexpected scenario.
        // Re-throw or attempt to fetch if customSessionId is available (though error.data should be reliable).
        console.error(`409 Conflict: Session exists but could not retrieve details from error.data.`, error);
        throw new Error(`Session already exists but details could not be retrieved. Original error: ${error.message}`);
      }
    }
    console.error(`Error creating OpenVidu session:`, error);
    throw error; // Re-throw if it's not a 409 or 409 handling failed.
  }
};

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
    // The OpenVidu API returns a JSON object with a 'content' array for sessions
    const data = await handleResponse<{ content: ISession[] }>(response);
    return data.content;
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
