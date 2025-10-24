import { map } from 'nanostores';
import { IRoom } from '@/components/swingers/types';
import { getRooms } from '@/components/swingers/api/rooms';

interface RoomStoreState {
  rooms: IRoom[];
  loading: boolean;
  error: string | null;
}

export const roomStore = map<RoomStoreState>({
  rooms: [],
  loading: false,
  error: null,
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
