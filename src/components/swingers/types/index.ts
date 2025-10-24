/**
 * Represents a swinger subscriber or streamer.
 */
export interface ISwinger {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  status?: 'online' | 'offline' | 'busy';
  // Add other relevant properties here based on API response
}

export interface IActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export interface IConnection {
  id: string;
  initiatorId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
}

export interface IRoom {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: string[]; // Array of member IDs
  createdAt: string;
  updatedAt: string;
}

export interface ISession {
  id: string;
  roomId: string;
  startTime: string;
  endTime?: string;
  participants: string[]; // Array of participant IDs
}

export interface IStreamer extends ISwinger {
  // Streamer-specific properties if any
  isLive: boolean;
  streamTitle?: string;
  viewersCount: number;
}

export interface ISubscriber extends ISwinger {
  // Subscriber-specific properties if any
  isPremium: boolean;
}
