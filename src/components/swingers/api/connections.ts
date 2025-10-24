import { fetchWithToken. fetchWithBasicAuth, handleResponse, SLS_VIDU_URL, SLS_API_URL } from '@/api/fetch';
import { IConnection } from '@/components/swingers/types';

const API_CONNECTIONS_BASE_URL = `${SLS_API_URL}/connections`;

/**
 * Options for creating a new OpenVidu connection within a session.
 * Corresponds to the body for POST /openvidu/api/sessions/{sessionId}/connection
 */
export interface ICreateConnectionOptions {
  type?: 'WEBRTC' | 'IPCAM' | 'RECORDER'; // Defaults to 'WEBRTC'
  role?: 'PUBLISHER' | 'SUBSCRIBER' | 'VIEWER'; // Defaults to 'PUBLISHER'
  data?: string; // Custom client data, will be available in the Connection object as 'serverData'
  record?: boolean; // Whether to record the streams published by this connection. Defaults to false.
  kurentoOptions?: {
    videoCodec?: 'VP8' | 'VP9' | 'H264' | 'NONE';
    allowedSendUnsubscribe?: boolean;
    allowedReceiveUnsubscribe?: boolean;
    allowedSendAudio?: boolean;
    allowedReceiveAudio?: boolean;
    allowedSendData?: boolean;
    allowedReceiveData?: boolean;
    allowedPublishingVideo?: boolean;
    allowedPublishingAudio?: boolean;
    allowedSubscribingToVideo?: boolean;
    allowedSubscribingToAudio?: boolean;
    adaptativeBitrate?: boolean;
    onlyPlayWithSubscribers?: boolean;
    networkCache?: number;
  };
}

/**
 * Creates a new OpenVidu connection (token) for a given session.
 * Corresponds to: POST /openvidu/api/sessions/{sessionId}/connection
 * @param sessionId The ID of the session to create the connection for.
 * @param options Optional parameters for connection creation.
 * @returns A promise that resolves to the created IConnection object.
 */
export const createConnection = async (
  sessionId: string,
  options?: ICreateConnectionOptions,
): Promise<IConnection> => {
  try {
    const response = await fetchWithBasicAuth(
      `${SLS_VIDU_URL}/api/sessions/${sessionId}/connection`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options || {}),
      },
    );
    return handleResponse<IConnection>(response);
  } catch (error) {
    console.error(`Error creating OpenVidu connection for session ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Fetches all active OpenVidu connections across all sessions.
 * Corresponds to: GET /openvidu/api/connections
 * @returns A promise that resolves to an array of IConnection objects.
 */
export const getConnections = async (): Promise<IConnection[]> => {
  try {
    const response = await fetchWithToken(
      API_CONNECTIONS_BASE_URL,
      { method: 'GET' },
    );
    return handleResponse<IConnection[]>(response);
  } catch (error) {
    console.error(`Error fetching OpenVidu connections:`, error);
    throw error;
  }
};

/**
 * Fetches a specific OpenVidu connection by its ID.
 * Corresponds to: GET /openvidu/api/connections/{connectionId}
 * @param connectionId The ID of the connection to fetch.
 * @returns A promise that resolves to a single IConnection object.
 */
export const getConnection = async (connectionId: string): Promise<IConnection> => {
  try {
    const response = await fetchWithToken(
      `${API_CONNECTIONS_BASE_URL}/${connectionId}`,
      { method: 'GET' },
    );
    return handleResponse<IConnection>(response);
  } catch (error) {
    console.error(`Error fetching OpenVidu connection with ID ${connectionId}:`, error);
    throw error;
  }
};

/**
 * Deletes a specific OpenVidu connection by its ID.
 * Corresponds to: DELETE /openvidu/api/connections/{connectionId}
 * @param connectionId The ID of the connection to delete.
 * @returns A promise that resolves when the connection is successfully deleted.
 */
export const deleteConnection = async (connectionId: string): Promise<void> => {
  try {
    const response = await fetchWithBasicAuth(
      `${API_CONNECTIONS_BASE_URL}/${connectionId}`,
      { method: 'DELETE' },
    );
    // handleResponse will throw if response.ok is false
    await handleResponse(response);
  } catch (error) {
    console.error(`Error deleting OpenVidu connection with ID ${connectionId}:`, error);
    throw error;
  }
};
