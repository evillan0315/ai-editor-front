import { map } from 'nanostores';
import { persistentAtom } from '@/utils/persistentAtom';
import { IConnection } from '@/components/swingers/types';
import { getConnection, getConnections } from '@/components/swingers/api/connections';
import { getSessions, getSession } from '@/components/swingers/api/sessions';
import { getDefaultClient } from '@/components/swingers/api/activities';
import { updateRoomConnectionCount } from '@/components/swingers/stores/roomStore';

/**
 * @interface ConnectionStoreState
 * @description Represents the state of the connection Nanostore.
 * @property {IConnection[]} connections - An array of OpenVidu connection objects for the current session.
 * @property {boolean} loading - Indicates if connections are currently being fetched.
 * @property {string | null} error - Stores any error message encountered during fetching.
 * @property {string | null} currentSessionId - The ID of the session whose connections are currently loaded.
 */
interface ConnectionStoreState {
  connections: IConnection[];
  loading: boolean;
  error: string | null;
  currentSessionId: string | null;
}

/**
 * @const connectionStore
 * @description Nanostore for managing OpenVidu connection details for the active session.
 */
export const connectionStore = map<ConnectionStoreState>({
  connections: [],
  loading: false,
  error: null,
  currentSessionId: null,
});

export const currentDefaultConnection = persistentAtom<IConnection>('currentDefaultConnection', {});

/**
 * @function setConnections
 * @description Sets the connections array and updates the current session ID.
 * @param {string} sessionId - The ID of the session.
 * @param {IConnection[]} connections - The array of IConnection objects.
 */
export const setConnections = (sessionId: string, connections: IConnection[]) => {
  connectionStore.set({
    ...connectionStore.get(),
    connections,
    currentSessionId: sessionId,
    error: null, // Clear any previous errors on successful set
  });
};

export const fetchDefaultConnection = async () => {
  const getDefaultClientConnection = await getDefaultClient();
  console.log(getDefaultClientConnection, 'getDefaultClientConnection');
  const { participantId, sessionId } = getDefaultClientConnection[1];
  const getClientConnection =  await getConnection(participantId,sessionId);
  currentDefaultConnection.set( getClientConnection);
};
/**
 * @function setConnectionLoading
 * @description Sets the loading state for connections.
 * @param {boolean} loading - The loading state.
 */
export const setConnectionLoading = (loading: boolean) => {
  connectionStore.setKey('loading', loading);
};

/**
 * @function setConnectionError
 * @description Sets an error message for connection fetching.
 * @param {string | null} error - The error message.
 */
export const setConnectionError = (error: string | null) => {
  connectionStore.setKey('error', error);
};

/**
 * @function clearConnections
 * @description Resets the connection store to its initial state.
 */
export const clearConnections = () => {
  connectionStore.set({
    connections: [],
    loading: false,
    error: null,
    currentSessionId: null,
  });
};

/**
 * @function fetchSessionConnections
 * @description Fetches all active OpenVidu connections for a specific session
 * and updates both `connectionStore` and `roomStore`'s connection count.
 * @param {string} sessionId - The ID of the session to fetch connections for.
 */
export const fetchSessionConnections = async (sessionId: string) => {
  if (!sessionId) {
    console.warn('fetchSessionConnections called with null/undefined sessionId');
    clearConnections();
    updateRoomConnectionCount(sessionId, 0); // Update room count to 0 if session is invalid
    return;
  }

  setConnectionLoading(true);
  setConnectionError(null);
  connectionStore.setKey('currentSessionId', sessionId); // Ensure currentSessionId is set even before fetch completes

  try {
    const sessionConnections = await getSession(sessionId);
    console.log(sessionConnections, 'fetchSessionConnections');
    const { connections } = sessionConnections;
    setConnections(sessionId, connections.content);
    updateRoomConnectionCount(sessionId, connections.numberOfElements);
  } catch (err: any) {
    console.error(`Failed to fetch connections for session ${sessionId}:`, err);
    setConnectionError(`Failed to load connections: ${err.message || err}`);
    setConnections(sessionId, []); // Clear connections on error
    updateRoomConnectionCount(sessionId, 0); // Update room count to 0 on error
  } finally {
    setConnectionLoading(false);
  }
};
