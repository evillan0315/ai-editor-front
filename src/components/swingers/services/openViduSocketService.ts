import { io, Socket } from 'socket.io-client';
import { updateRoomConnectionCount } from '@/components/swingers/stores/roomStore';
import { authStore, getToken } from '@/stores/authStore'; // Import authStore

interface RoomConnectionCountUpdatePayload {
  roomId: string;
  count: number;
}

class OpenViduSocketService {
  private socket: Socket | null = null;

  public initSocket(): void {
    if (this.socket && this.socket.connected) {
      console.warn('OpenVidu Socket already connected.');
      return;
    }

    const WS_URL = import.meta.env.VITE_WS_URL;
    if (!WS_URL) {
      console.error('VITE_WS_URL is not defined. Cannot initialize OpenVidu socket.');
      return;
    }

    const state = authStore.get();
    const token = getToken(); // Assuming accessToken holds the JWT

    this.socket = io(WS_URL, {
      path: '/socket.io', // Ensure this matches your backend's Socket.IO path
      transports: ['websocket'],
      auth: {
        token: token,
      }, // Pass the access token from authStore
    });

    this.socket.on('connect', () => {
      console.log('OpenVidu Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('OpenVidu Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('OpenVidu Socket connection error:', error);
    });

    // Listen for custom event from the backend for room connection count updates
    this.socket.on('openvidu:roomConnectionCountUpdate', (payload: RoomConnectionCountUpdatePayload) => {
      console.log('Received openvidu:roomConnectionCountUpdate event:', payload);
      updateRoomConnectionCount(payload.roomId, payload.count);
    });
  }

  public disconnectSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('OpenVidu Socket disconnected');
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }
}

export const openViduSocketService = new OpenViduSocketService();
