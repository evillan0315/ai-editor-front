import { map } from 'nanostores';
import { IRoom } from '@/components/swingers/types';
import { getRooms } from '@/components/swingers/api/rooms';
import { getConnections } from '@/components/swingers'; // Import getConnections

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
 * @param rooms An array of IRoom objects.
 */
export const fetchConnectionCountsForRooms = async (rooms: IRoom[]) => {
  const newLoadingState: Record<string, boolean> = {};
  const newConnectionCounts: Record<string, number | null> = {};

  // Set initial loading state for all relevant rooms
  for (const room of rooms) {
    if (room.roomId) {
      newLoadingState[room.roomId] = true;
    }
  }
  roomStore.setKey('loadingConnectionCounts', { ...roomStore.get().loadingConnectionCounts, ...newLoadingState });

  const promises = rooms.map(async (room) => {
    if (room.roomId) {
      try {
        const connections = await getConnections(room.roomId);
        console.log(connections, 'connections fetchConnectionCountsForRooms');
        newConnectionCounts[room.roomId] = connections.length;
      } catch (err) {
        console.error(`Failed to fetch connections for room ${room.roomId}:`, err);
        newConnectionCounts[room.roomId] = null; // Indicate error/failure to fetch
      } finally {
        newLoadingState[room.roomId] = false; // Mark as no longer loading for this room
      }
    }
  });

  await Promise.allSettled(promises);

  // Update store with fetched counts and final loading states
  roomStore.setKey('connectionCounts', { ...roomStore.get().connectionCounts, ...newConnectionCounts });
  roomStore.setKey('loadingConnectionCounts', { ...roomStore.get().loadingConnectionCounts, ...newLoadingState });
};
