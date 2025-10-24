export interface IDefaultRecordingProperties {
  // `id` and `name` were inferred from the broader `IDefaultRecordingProperties` structure in existing types.
  // Based on `room.json`, these fields might not always be present at the top level of `defaultRecordingProperties`.
  // However, the object structure in `room.json` directly matches this interface's fields, so it's consistent.
  name: string;
  hasAudio: boolean;
  hasVideo: boolean;
  outputMode: string;
  recordingLayout: string;
  resolution: string;
  frameRate: number;
  shmSize: number;
}

// New interfaces for detailed room connections

interface IClientDataLocalSettingsDefaultRoom {
  value: string;
}

interface IClientDataLocalSettingsCamera {
  publishAudio: boolean;
  publishVideo: boolean;
  resolution: string;
  frameRate: number;
  insertMode: string;
  mirror: boolean;
  audioSource?: string; // Optional field
  videoSource?: string; // Optional field
}

interface IClientDataLocalSettingsGeneral {
  soundNotification: boolean;
  toggleWhisperOption: boolean;
  textSize: string;
  defaultRoom: IClientDataLocalSettingsDefaultRoom;
}

interface IClientDataLocalSettings {
  camera: IClientDataLocalSettingsCamera;
  general: IClientDataLocalSettingsGeneral;
  customCameraLabel?: string; // Can be directly under localSettings
  chat?: { chatColor: string }; // Optional field found in some clientData
}

export interface IInnerClientData {
  USERNAME: string;
  USERID: number;
  PICTURE: string;
  USERGROUPID: string;
  ROOMNAME: string;
  publicKey: string;
  USER_GENDER: string; // e.g., "Couple", "", "Female", "Male"
  GENDER1: number; // e.g., 0, 1
  GENDER2: string | number; // e.g., 1, ""
  PRIVATE: boolean;
  localSettings: IClientDataLocalSettings;
  id: number;
  GENDER_DESC: string | boolean; // e.g., "Couple", "Female", "Male" or false
  connectionId: string;
}

interface IClientDataContent {
  clientData: IInnerClientData;
  publicKey: string;
}

interface IVideoDimensions {
  width: number;
  height: number;
}

interface IMediaOptions {
  hasAudio: boolean;
  audioActive: boolean;
  hasVideo: boolean;
  videoActive: boolean;
  typeOfVideo: string;
  frameRate: number;
  videoDimensions: string; // This is a JSON string, client-side parsing needed
  filter: Record<string, unknown>; // Can be an empty object
}

export interface IPublisherSubscriber {
  createdAt: number;
  streamId: string;
  mediaOptions?: IMediaOptions; // Optional field
}

export interface IConnection {
  id: string;
  object: string;
  status: string;
  connectionId: string;
  sessionId: string;
  createdAt: number;
  activeAt: number;
  location: string;
  ip: string;
  platform: string;
  token: string;
  type: string;
  record: boolean;
  role: string;
  kurentoOptions: unknown | null;
  customIceServers: unknown[];
  rtspUri: unknown | null;
  adaptativeBitrate: unknown | null;
  onlyPlayWithSubscribers: unknown | null;
  networkCache: unknown | null;
  serverData: string;
  clientData: string; // This is a JSON string of IClientDataContent, client-side parsing needed
  publishers: IPublisherSubscriber[];
  subscribers: IPublisherSubscriber[];
}

interface ISessionConnections {
  numberOfElements: number;
  content: IConnection[];
}

export interface ISession {
  id: string;
  object: 'session';
  sessionId: string;
  createdAt: number;
  recording: boolean;
  mediaMode: string;
  recordingMode: string;
  defaultRecordingProperties: IDefaultRecordingProperties;
  customSessionId: string;
  forcedVideoCodec: string;
  allowTranscoding: boolean;
  connections: ISessionConnections;
}

export interface IRoom {
  id: number;
  name: string;
  active: boolean;
  type: 'club' | 'public';
  description: string | null;
  roomId: string;
  agreement: unknown | null;
  reset: boolean;
  allowTranscoding: boolean | null;
  recording: boolean;
  recordingMode: string | null; // e.g., "MANUAL"
  map_sessions: unknown | null;
  analytics: unknown | null;
  liveStream: boolean;
  shortName: string | null;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  forceVideoCodec: string | null; // e.g., "VP8"
  forcedVideoCodec: string | null; // e.g., "MEDIA_SERVER_PREFERRED"
  defaultRecordingProperties: IDefaultRecordingProperties | null;
  connections: unknown[]; // This appears to be an empty array in samples, distinct from `connect.content`.
  connect?: IConnect; // Optional, present in `room.json` but not `rooms.json`
}

export type IRooms = IRoom[];

export interface IMemberJsonData {
  LAT: number;
  LON: number;
  AGE1: number;
  AGE2: string; // Can be empty string
  CITY: string;
  LONG: number;
  NAME: string;
  PAID: boolean;
  BLOCK: number;
  EMAIL: string;
  STATE: string;
  DRINK1: boolean;
  DRINK2: string; // Can be empty string
  FRIEND: number;
  ONLINE: number;
  SMOKE1: boolean;
  SMOKE2: string; // Can be empty string
  USERID: number;
  APPSAFE: boolean;
  CNTPICS: number;
  COUNTRY: string;
  GENDER1: number;
  GENDER2: string; // Can be empty string
  HEIGHT1: number;
  HEIGHT2: string; // Can be empty string
  PICTURE: string;
  PRIVATE: number;
  TAGLINE: string;
  WEIGHT1: number;
  WEIGHT2: string; // Can be empty string
  ZIPCODE: string;
  APPROVED: number;
  BLOCKBIT: number;
  CNTVIDEO: number;
  DISTANCE: string;
  EMPLOYEE: number;
  FAVORITE: number;
  HEIGHT1M: string;
  HEIGHT2M: string;
  USERNAME: string;
  WEIGHT1M: string;
  WEIGHT2M: string;
  INTERESTF: number;
  INTERESTM: number;
  CNTPRIVATE: number;
  INTERESTFF: number;
  INTERESTMF: number;
  INTERESTMM: number;
  MEMBERTYPE: string;
  WILLINGBIT: number;
  CNTHOTDATES: number;
  DATECREATED: string; // ISO date string
  INTERESTBIT: number;
  PHANTOMMAIL: number;
  PICTUREFULL: string;
  USERGROUPID: string;
  WILLINGFULL: number;
  WILLINGSOFT: number;
  CNTCERTIFIED: number;
  DATETIMEJOIN: string; // ISO date string
  DATETIMELAST: string; // ISO date string
  INTERESTFREE: boolean;
  ORIENTATION1: number;
  ORIENTATION2: string; // Can be empty string
  RELATIONSHIP: number;
  WILLINGWATCH: number;
  DATETIMEJOIN2: string;
  DATETIMELAST2: string;
  HEIGHT1INCHES: string;
  HEIGHT2INCHES: string;
  HIDEMEFROMBIT: number;
  INTERESTDRINK: number;
  INTERESTSMOKE: number;
  PICTURERATING: string;
  WEIGHT1POUNDS: string;
  WEIGHT2POUNDS: string;
  INTERESTLOWAGE: number;
  INTERESTHIGHAGE: number;
  RELATIONSHIPBIT: number;
  ORIENTATION1NAME: string;
  ORIENTATION2NAME: string;
  RELATIONSHIPNAME: string;
  USERGROUPIDDEFAULT: number;
  MAILFORUMRESTRICTION: number;
}

export interface IMember {
  id: number;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  role: number;
  userId: number;
  json_data: IMemberJsonData;
  blockedExpire: unknown | null;
  blockedStart: unknown | null;
  PAID: boolean;
  createGroup: boolean;
  EMPLOYEE: boolean;
  ONLINE: boolean;
  MEMBERTYPE: string;
  PICTURE: string;
  admin_user: unknown | null;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  LAT: string;
  LON: string;
  usetting: unknown | null;
  terms: unknown | null;
}

export interface IStreamer {
  id: number;
  name: string;
  connectionId: string;
  private: boolean;
  json: unknown | null;
  timestamp: string; // ISO date string
  active: boolean;
  member: number; // This is a member ID, not the full object
  room: number; // This is a room ID, not the full object
  connection: number;
  streamId: string;
  end_date: unknown | null;
  stream_duration: unknown | null;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export interface ISwinger {
  id: number;
  name: string;
  connectionId: string;
  streamerId: string;
  json: unknown | null;
  receivingFrom: string | null;
  timestamp: string; // ISO date string
  member: IMember;
  streamer: IStreamer | null; // Can be null
  room: IRoom;
  active: boolean;
  streamId: string;
  subscribed_member: IMember;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export interface IActivity {
  id: number;
  event: string;
  sessionId: string;
  participantId: string | null;
  clientData: IInnerClientData | null; // Reusing existing clientData type
  platform: string | null;
  timestamp: string; // ISO date string
  connectionId: string | null;
  from: string | null;
  connection: string | null; // e.g., "INBOUND", "OUTBOUND"
  type: string | null; // e.g., "connect", "blocker", "whisper", "streamDestroyed", "disconnect", "streamCreated", "userSettings", "unsubscribe"
  duration: number | null;
  receivingFrom: string | null;
  streamId: string | null;
  reason: string | null; // e.g., "unpublish", "disconnect"
  serverData: string | null;
  location: string | null;
  ip: string | null;
  startTime: string | null; // ISO date string
  videoSource: string | null; // e.g., "CAMERA"
  room: string | null; // Room ID/name
  member: string | null; // Member ID
  data: unknown | null;
  session_connection: unknown | null;
  connectId: unknown | null;
  name: string | null;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  date?: string; // e.g., "09/19/2025" - Optional
  hour?: string; // e.g., "14:00 (9/19)" - Optional
}

export type IActivities = IActivity[];
