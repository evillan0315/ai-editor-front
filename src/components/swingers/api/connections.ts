import { ApiError, fetchWithBasicAuth, handleResponse, SLS_VIDU_URL } from '@/api/fetch';
import { IConnection, IConnectionList } from '@/components/swingers/types';

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
    const response = await fetchWithBasicAuth<IConnection>(
      `${SLS_VIDU_URL}/api/sessions/${sessionId}/connection`,
      {
        method: 'POST',
        data: options || {}, // Use 'data' for POST request body with Axios
      },
    );
    return handleResponse<IConnection>(response);
  } catch (error) {
    console.error(`Error creating OpenVidu connection for session ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Fetches all active OpenVidu connections for a specific session.
 * Corresponds to: GET /openvidu/api/sessions/{sessionId}/connection
 * @param sessionId The ID of the session to fetch connections for.
 * @returns A promise that resolves to an array of IConnection objects.
 */
export const getConnections = async (sessionId: string): Promise<IConnection[]> => {
  try {
    // The OpenVidu API returns a JSON object with a 'content' array for connections
    const response = await fetchWithBasicAuth<IConnectionList>(
      `${SLS_VIDU_URL}/api/sessions/${sessionId}/connection`,
      { method: 'GET' },
    );
    return handleResponse<IConnectionList>(response).content;
  } catch (error) {
    console.error(`Error fetching OpenVidu connections for session ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Fetches a specific OpenVidu connection by its ID.
 * Corresponds to: GET /openvidu/api/connections/{connectionId}
 * @param connectionId The ID of the connection to fetch.
 * @returns A promise that resolves to a single IConnection object.
 */
export const getConnection = async (connectionId: string, sessionId: string): Promise<IConnection> => {
  try {
    const response = await fetchWithBasicAuth<IConnection>(
      `${SLS_VIDU_URL}/api/sessions/${sessionId}/connection/${connectionId}`,
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
export const deleteConnection = async (connectionId: string, sessionId: string): Promise<void> => {
  try {
    // fetchWithBasicAuth now returns data directly, but for DELETE, we might not expect content.
    // The success/failure is indicated by the promise resolving/rejecting.
    const response = await fetchWithBasicAuth<void>(
      `${SLS_VIDU_URL}/api/sessions/${sessionId}/connection/${connectionId}`,
      { method: 'DELETE' },
    );
    handleResponse<void>(response);
  } catch (error) {
    console.error(`Error deleting OpenVidu connection with ID ${connectionId}:`, error);
    throw error;
  }
};
