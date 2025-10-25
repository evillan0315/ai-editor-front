import { Session, Publisher, Subscriber, Stream, StreamManager } from 'openvidu-browser';

/**
 * Represents a member within the Swingers ecosystem.
 * This is a more detailed type for the 'member' object often nested in ISwingerSessionParticipant.
 * Assuming `id` is a string as it might be a UUID from a database, not necessarily a numeric OpenVidu `USERID`.
 */
export interface IMember {
  id: string;
  username: string;
  email: string;
  json_data: { [key: string]: any }; // Flexible for various user profile data
  // Add other relevant properties here based on API response
}

/**
 * Represents various properties for default session recording.
 */
export interface IDefaultRecordingProperties {
  name: string;
  hasAudio: boolean;
  hasVideo: boolean;
  outputMode: string;
  recordingLayout: string;
  resolution: string;
  frameRate: number;
  shmSize: number;
}

/**
 * Represents camera settings within client's local settings.
 */
export interface ICameraSettings {
  publishAudio: boolean;
  publishVideo: boolean;
  resolution: string;
  frameRate: number;
  insertMode: string;
  mirror: boolean;
  audioSource?: string; // Optional field, appears in some connections
  videoSource?: string; // Optional field, appears in some connections
}

/**
 * Represents default room settings within client's local settings.
 */
export interface IDefaultRoomSettings {
  value: string;
}

/**
 * Represents general settings within client's local settings.
 */
export interface IGeneralSettings {
  soundNotification: boolean;
  toggleWhisperOption: boolean;
  textSize: 'normal' | 'medium' | 'large';
  defaultRoom: IDefaultRoomSettings;
}

/**
 * Represents chat settings within client's local settings (optional).
 */
export interface IChatSettings {
  chatColor: string;
}

/**
 * Represents local settings configured by the client.
 */
export interface ILocalSettings {
  camera: ICameraSettings;
  general: IGeneralSettings;
  chat?: IChatSettings; // Optional chat settings
}

/**
 * Represents user-related data found within the 'clientData' string of an OpenVidu connection.
 * This is a subset/client-view of a full IMember.
 */
export interface IClientConnectionUserData {
  USERNAME: string;
  USERID: number;
  PICTURE: string;
  USERGROUPID: string;
  ROOMNAME: string;
  publicKey: string;
  USER_GENDER: string; // e.g., "Couple", "Female", "Male", or ""
  GENDER1: number; // 0 or 1
  GENDER2: number | string; // 1, 0, or ""
  PRIVATE: boolean;
  localSettings: ILocalSettings;
  id: number; // A client-side or connection-specific ID
  GENDER_DESC: string | boolean; // e.g., "Female", "Couple", "Male", or false
  connectionId: string;
  customCameraLabel?: string; // Optional field, appears in some connections
}

/**
 * Represents the full payload parsed from the 'clientData' string in an OpenVidu connection.
 */
export interface IClientDataPayload {
  clientData: IClientConnectionUserData;
  publicKey: string;
}

/**
 * Represents media options for a publisher's stream.
 */
export interface IMediaOptions {
  hasAudio: boolean;
  audioActive: boolean;
  hasVideo: boolean;
  videoActive: boolean;
  typeOfVideo: string;
  frameRate: number;
  videoDimensions: string; // This is a JSON string, e.g., "{\"width\":640,\"height\":480}"
  filter: object; // Can be more specific if needed, but for now object
}

/**
 * Represents data for a publisher within an OpenVidu connection.
 */
export interface IPublisherData {
  createdAt: number;
  streamId: string;
  mediaOptions: IMediaOptions;
}

/**
 * Represents data for a subscriber within an OpenVidu connection.
 */
export interface ISubscriberData {
  createdAt: number;
  streamId: string;
}

/**
 * Represents an OpenVidu Connection object, enriched with our backend's connection metadata.
 * The 'clientData' field is a JSON string that can be parsed into IClientDataPayload.
 */
export interface IConnection {
  id: string; // OpenVidu's internal connection ID (from 'id' field in JSON array item)
  object: 'connection'; // Literal type for consistency with OpenVidu API
  status: string; // e.g., "active"
  connectionId: string; // OpenVidu's unique ID for the connection (from 'connectionId' field in JSON)
  sessionId: string; // OpenVidu's unique ID for the session this connection belongs to
  createdAt: number; // Timestamp when the connection was created (milliseconds since epoch)
  activeAt: number; // Timestamp when the connection became active
  location: string; // e.g., "unknown"
  ip: string;
  platform: string; // e.g., "Safari 26.0.1 on OS X 10.15.7"
  token: string; // The token for this connection, used to join the session
  type: string; // e.g., "WEBRTC"
  record: boolean;
  role: 'PUBLISHER' | 'SUBSCRIBER' | 'VIEWER';
  kurentoOptions: any | null;
  customIceServers: any[];
  rtspUri: any | null;
  adaptativeBitrate: any | null;
  onlyPlayWithSubscribers: any | null;
  networkCache: any | null;
  serverData: string; // Custom data provided by the server when creating the connection
  clientData: string; // Custom data provided by the client when joining the session (JSON string, parse to IClientDataPayload)
  publishers: IPublisherData[];
  subscribers: ISubscriberData[];
}

/**
 * Represents a list of connections, typically found nested in session or room objects.
 */
export interface IConnectionList {
  numberOfElements: number;
  content: IConnection[];
}

/**
 * Represents a Room, potentially linked to an OpenVidu session.
 * `roomId` from backend maps to `customSessionId` in OpenVidu.
 */
export interface IRoom {
  id: number; // Changed from string to number based on room.json
  name: string;
  active: boolean; // Added based on room.json
  type: 'club' | 'public' | string; // Made more flexible, originally 'club' | 'public'
  description: string | null; // Changed to allow null based on room.json
  roomId: string; // This corresponds to OpenVidu's customSessionId
  agreement: any | null; // Added based on room.json
  reset: boolean; // Added based on room.json
  allowTranscoding: boolean; // Added based on room.json
  recording: boolean; // Existing
  recordingMode: 'MANUAL' | 'ALWAYS' | string; // Added based on room.json, similar to ISession
  map_sessions: any | null; // Added based on room.json
  analytics: any | null; // Added based on room.json
  liveStream: boolean; // Existing
  shortName: string | null; // Added based on room.json
  created_at: string; // Existing
  updated_at: string; // Renamed from 'updatedAt' to 'updated_at' based on room.json
  forceVideoCodec: string; // Added based on room.json
  forcedVideoCodec: string; // Added based on room.json
  defaultRecordingProperties: IDefaultRecordingProperties; // Added based on room.json structure
  connections?: IConnection[]; // Added, optional field for the empty 'connections' array at room.json root
  connect: IConnectionList; // Added to capture the actual connections data from 'connect' property in room.json
  // Removed ownerId, members, openViduSessionId as they are not explicitly present in the provided room.json
}

/**
 * Represents a swinger participant (subscriber or streamer) in the context of a session.
 * Note: If IRoom no longer has `ownerId` or `members`, `ISwingerSessionParticipant`'s `member` and `room` fields should be
 * understood in the context of the updated IRoom definition.
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
 * Represents an OpenVidu Session object, enriched with our backend's session metadata.
 * This interface now includes all properties found in the provided session.json.
 */
export interface ISession {
  id: string; // OpenVidu's internal session ID (from 'id' field in session.json)
  object: 'session'; // Literal type for consistency with OpenVidu API
  sessionId: string; // The ID of the session, same as customSessionId if provided
  createdAt: number; // Timestamp when the session was created (milliseconds since epoch)
  recording: boolean;
  mediaMode: 'ROUTED' | 'RELAYED';
  recordingMode: 'MANUAL' | 'ALWAYS';
  defaultRecordingProperties: IDefaultRecordingProperties; // Detailed recording properties
  customSessionId: string; // The custom session ID provided during session creation, often same as sessionId
  forcedVideoCodec: string; // e.g., "MEDIA_SERVER_PREFERRED"
  allowTranscoding: boolean;
  connections: IConnectionList; // Changed to use IConnectionList for consistency
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
