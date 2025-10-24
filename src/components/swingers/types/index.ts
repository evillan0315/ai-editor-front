export interface IDefaultRecordingProperties {
  id: number;
  name: string;
  hasAudio: boolean;
  hasVideo: boolean;
  outputMode: string;
  recordingLayout: string;
  resolution: string;
  frameRate: number;
  shmSize: number;
}

export interface IRoom {
  id: number;
  name: string;
  active: boolean;
  type: string;
  description: string | null;
  roomId: string;
  agreement: unknown | null;
  reset: boolean;
  allowTranscoding: boolean;
  recording: boolean;
  recordingMode: string;
  map_sessions: unknown | null;
  analytics: unknown | null;
  liveStream: boolean;
  shortName: unknown | null;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  forceVideoCodec: string;
  forcedVideoCodec: unknown | null;
  defaultRecordingProperties: IDefaultRecordingProperties;
  connections: unknown[];
}

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
