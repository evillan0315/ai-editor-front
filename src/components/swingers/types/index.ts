import { Session, Publisher, Subscriber, Stream, StreamManager } from 'openvidu-browser';

/**
 * Represents a member within the Swingers ecosystem.
 * This is a more detailed type for the 'member' object often nested in ISwingerSessionParticipant.
 */
export interface IMember {
  id: string;
  username: string;
  email: string;
  json_data: { [key: string]: any }; // Flexible for various user profile data
  // Add other relevant properties here based on API response
}

/**
 * Represents a swinger participant (subscriber or streamer) in the context of a session.
 */
export interface ISwingerSessionParticipant {
  id: string;
  member: IMember; // Detailed member information
  room: IRoom; // Associated room information
  active: boolean;
  streamId?: string; // OpenVidu stream ID if applicable
  // Add other relevant properties here based on API response
}

export interface IActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

/**
 * Represents an OpenVidu Connection object, enriched with our backend's connection metadata.
 */
export interface IConnection {
  connectionId: string; // OpenVidu's unique ID for the connection
  sessionId: string; // OpenVidu's unique ID for the session this connection belongs to
  createdAt: number; // Timestamp when the connection was created (milliseconds since epoch)
  role: 'PUBLISHER' | 'SUBSCRIBER' | 'VIEWER';
  serverData: string; // Custom data provided by the server when creating the connection
  clientData: string; // Custom data provided by the client when joining the session
  platform: string; // 'BROWSER' | 'MOBILE' | 'DESKTOP'
  token: string; // The token for this connection, used to join the session
  // Add other properties from OpenVidu Connection object as needed
}

/**
 * Represents a Room, potentially linked to an OpenVidu session.
 * `roomId` from backend maps to `customSessionId` in OpenVidu.
 */
export interface IRoom {
  id: string;
  name: string;
  type: 'club' | 'public';
  description: string;
  ownerId: string;
  members: string[]; // Array of member IDs
  created_at: string; // Using string for date from backend
  updatedAt: string;
  active: boolean;
  recording: boolean;
  liveStream: boolean;
  roomId?: string; // Backend's room ID, can be used as customSessionId for OpenVidu
  openViduSessionId?: string; // The actual session ID from OpenVidu if a session is created/active
}

/**
 * Represents an OpenVidu Session object, enriched with our backend's session metadata.
 */
export interface ISession {
  sessionId: string; // The ID of the session, same as customSessionId if provided
  createdAt: number; // Timestamp when the session was created (milliseconds since epoch)
  recording: boolean;
  mediaMode: 'ROUTED' | 'RELAYED';
  recordingMode: 'MANUAL' | 'ALWAYS';
  connections: IConnection[]; // Connections currently in this session
  // Add other properties from OpenVidu Session object as needed
}

export interface IStreamer extends ISwingerSessionParticipant {
  isLive: boolean;
  streamTitle?: string;
  viewersCount: number;
}

export interface ISubscriber extends ISwingerSessionParticipant {
  isPremium: boolean;
}

/**
 * Represents an OpenVidu Publisher object.
 */
export interface IOpenViduPublisher extends Publisher {}

/**
 * Represents an OpenVidu Subscriber object.
 */
export interface IOpenViduSubscriber extends Subscriber {}

/**
 * Represents an OpenVidu Stream object.
 */
export interface IOpenViduStream extends Stream {}

/**
 * Represents an OpenVidu StreamManager object.
 */
export interface IOpenViduStreamManager extends StreamManager {}
