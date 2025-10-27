import { map } from 'nanostores';
import { IRoom, ISession, IConnectionList } from '@/components/swingers/types';
import { getRooms } from '@/components/swingers/api/rooms';
import { openViduEntitiesStore, fetchOpenViduSessions, updateSessionConnectionCount as updateOpenViduSessionConnectionCount, addOrUpdateOpenViduSession } from '@/components/swingers/stores/openViduEntitiesStore';

interface RoomStoreState {
  rooms: IRoom[];
  loading: boolean;
  error: string | null;
  connectionCounts: Record<string, number | null>; // Map roomId to connection count
  loadingConnectionCounts: Record<string, boolean>; // Map roomId to loading state for connections
}

export const roomStore = map<RoomStoreState>({
  rooms: [],
  loading: false,
  error: null,
  connectionCounts: {},
  loadingConnectionCounts: {},
});

export const fetchRooms = async () => {
  roomStore.setKey('loading', true);
  roomStore.setKey('error', null);
  try {
    const data = await getRooms();
    roomStore.setKey('rooms', data);
  } catch (err) {
    console.error('Failed to fetch rooms:', err);
    roomStore.setKey('error', 'Failed to load rooms. Please try again.');
    roomStore.setKey('rooms', []);
  } finally {
    roomStore.setKey('loading', false);
  }
};

/**
 * Fetches connection counts for a given list of rooms and updates the store.
 * This function now leverages the `openViduEntitiesStore` to avoid redundant API calls.
 * It first ensures the global list of OpenVidu sessions is fetched, then derives connection counts from it.
 * @param rooms An array of IRoom objects. These rooms should ideally already have their `liveStream` status determined.
 */
export const fetchConnectionCountsForRooms = async (rooms: IRoom[]) => {
  // Ensure global OpenVidu sessions are fetched first.
  // This acts as a single API call for all sessions.
  await fetchOpenViduSessions(); 

  const currentOpenViduSessions = openViduEntitiesStore.get().sessions;
  const newConnectionCounts: Record<string, number | null> = {};
  const newLoadingState: Record<string, boolean> = {};

  rooms.forEach((room) => {
    if (room.roomId) {
      const session = currentOpenViduSessions[room.roomId];
      // If the room has an active session in our global store, get its connection count.
      if (session) {
        newConnectionCounts[room.roomId] = session.connections?.numberOfElements || 0;
        newLoadingState[room.roomId] = false; // No longer loading since we have data
      } else {
        // If no session found in global store, it's considered to have 0 connections.
        newConnectionCounts[room.roomId] = 0;
        newLoadingState[room.roomId] = false;
      }
    }
  });

  // Update store with fetched counts and final loading states
  roomStore.setKey('connectionCounts', newConnectionCounts);
  roomStore.setKey('loadingConnectionCounts', newLoadingState);
};

/**
 * Updates the connection count for a specific room.
 * This is intended for real-time updates from a WebSocket or `connectionStore`.
 * It now also updates the global `openViduEntitiesStore` for consistency.
 * @param roomId The ID of the room whose connection count to update.
 * @param count The new connection count for the room.
 * @param connectionsContent Optional: The actual array of connections, for full consistency with `ISession.connections.content`.
 */
export const updateRoomConnectionCount = (
  roomId: string,
  count: number,
  connectionsContent: IConnectionList['content'] = [],
) => {
  roomStore.setKey('connectionCounts', {
    ...roomStore.get().connectionCounts,
    [roomId]: count,
  });
  roomStore.setKey('loadingConnectionCounts', {
    ...roomStore.get().loadingConnectionCounts,
    [roomId]: false,
  });

  // Also update the centralized openViduEntitiesStore for consistency
  updateOpenViduSessionConnectionCount(roomId, count, connectionsContent);
};
