import { OpenVidu, Session, StreamEvent, ConnectionEvent, StreamPropertyChangedEvent, PublisherStartSpeakingEvent, PublisherStopSpeakingEvent, NetworkQualityChangedEvent, ExceptionEvent, Device, StreamManager, SignalEvent } from 'openvidu-browser';


interface UserData {
  USERID: number;
  USERNAME: string;
  PICTURE?: string;
  GENDER_DESC?: string;
  GENDER1?: number;
  GENDER2?: number;
  GENDER_ABBR?: string;
  PRIVATE?: boolean;
  online?: boolean;
  connectionId?: string;
  streamId?: string;
  BLOCK?: number; // 0 for not blocked, 1 for blocked
  localSettings?: LocalSettings;
  SECRET?: string;
  publicKey?: string;
  BLOCKED_MEMBERS?: UserData[];
  MY_BLOCKER?: { [key: number]: UserData };
  role?: { type: string }; // e.g., 'moderator'
}

interface CurrentUser extends UserData {
  BLOCKED_MEMBERS?: UserData[];
  MY_BLOCKER?: { [key: number]: UserData };
  role: { type: string };
}

interface RoomData {
  online?: { [userId: number]: UserData };
}

interface ConnectionInfo {
  connectionId: string;
  data: string;
  session: Session;
  remoteConnections: Map<string, any>; // OpenVidu's RemoteConnection object
}

interface StateObj {
  devices: Device[];
  currentUser: CurrentUser;
  connections: { [connectionId: string]: ConnectionInfo };
  MEMBERS: { [userId: number]: UserData };
  currentRoom: RoomData;
  publishers: { [streamIdOrUserId: string]: any }; // Publisher or publisher info
  streamCreated: { [streamId: string]: StreamEvent & { streamData?: any; subscribers?: { [userId: number]: UserData } } };
  private_publishers: { [streamerId: number]: any };
  notification: { [userId: number]: SignalEvent };
  isSLSLogin: boolean;
  session: Session | null;
  subscribers: { [userId: number]: UserData };
}

interface MapSessions {
  connectionCreated: { [userId: number]: ConnectionEvent };
  publishers: { [userId: number]: { subscribers?: { [userId: number]: UserData } } };
  subscribers: { [userId: number]: UserData };
  streamCreated: { [streamId: string]: StreamEvent };
}



interface ChatMessageData {
  messageCount: number;
  USERNAME: string;
  PICTURE: string;
  USERID: number;
  SENDER_INFO?: UserData;
  SENDER_GENDER?: string | false;
  RECEIVER_NAME?: string;
  RECEIVER?: number;
  RECEIVER_GENDER?: string;
  message: string;
  date: string;
  type: string;
  message_id?: string;
  id?: string;
  textColor?: string;
  connectionId?: string;
  private?: boolean;
}

/**
 * Converts a clientData string from OpenVidu connection data.
 */
const parseClientData = (dataString: string, currentUserSecret?: string): UserData => {
  let clientData: UserData;
  try {
    const parsed = JSON.parse(dataString);
    clientData = parsed.clientData;
  } catch (e) {
    clientData = {} as UserData; // Fallback
  }

  if (!clientData.USERID && currentUserSecret) {
    // Assuming `decrypt` is a function passed in from outside
    // clientData = decrypt(clientData, currentUserSecret) as UserData;
    console.warn('`decrypt` function needs to be implemented and passed for clientData decryption.');
  }
  return clientData;
};

// --- Utility Function Type Definitions (assuming they are passed as parameters) ---
type AppNotify = (title: string | null, message: string, options?: AppNotifyOptions) => void;
type SendErrorMessage = (err: any) => void;
type GetCamDevices = (devices: Device[]) => void;
type GetMemberConnection = (connectionId: string) => Promise<any>;
type SetMemberConnectionStatus = (response: any, status: string) => void;
type Refresh = () => void;
type CheckAuth = () => void;
type Decrypt = (data: any, key: string) => any;
type InsertUserListEl = (data: UserData, scrollId: string, itemClass: string, isCouple: boolean | string, connection: ConnectionInfo, connectionId?: string) => void;
type FindSLSMember = (data: { USERID: number }) => Promise<UserData>;
type RemoveUserElement = (user: UserData) => void;
type SendDataToBlockedMember = (member: UserData, blocker: UserData) => void;
type RemoveVideoElement = (event: StreamEvent) => void;
type AddVideoStreamElement = (event: StreamEvent) => void;
type StripHTML = (html: string) => string;
type AddChatElement = (data: ChatMessageData, event: SignalEvent) => void;
type PlaySoundNotification = (event: SignalEvent) => void;
type AuthenticateChat = (isSLSLogin: boolean) => boolean;
type AppendPrivateChatContent = (userD: UserData, isNew?: boolean) => void;
type AddPrivateChatElements = (messageData: ChatMessageData, senderId: number) => void;
type StreamPrivateActive = (streamer: any) => void;
type ShowVideoStream = (stream: StreamManager, isPrivate: boolean) => void;
type SubscribeToUserStream = (parFrom: UserData, isPrivate: boolean, status: string, event: SignalEvent) => void;
type CreateModalMessage = (selector: string, template: string, data: any) => void;
type BannedMessageModal = string; // Assuming it's a string template
type GetConnectionById = (connectionId: string) => Promise<any>;
type UpdateDB = (table: string, data: any, id: string | number) => Promise<any>;
type UpdateRoomConnectionCount = (sessionId: string, count: number) => void;

/**
 * Initializes OpenVidu session event listeners for a given session object.
 * This function attaches all necessary handlers for various session and signal events.
 *
 * @param session The OpenVidu Session object to attach listeners to.
 * @param stateObj Mutable global state object containing current user, connections, members, etc.
 * @param mapSessions Mutable map of session-related data.
 * @param globalSession A global session identifier or name.
 * @param OPENVIDU_SERVER_SECRET The secret key for decrypting messages.
 * @param localSettings User's local settings.
 * @param $ JQuery instance for DOM manipulation (consider refactoring in a React app).
 * @param moment Moment.js instance for date formatting (consider refactoring).
 * @param appNotify Function to display application notifications.
 * @param sendErrorMessage Function to send error messages to a logging service.
 * @param refresh Function to refresh the application state or page.
 * @param checkAuth Function to check user authentication status.
 * @param decrypt Function to decrypt data.
 * @param getMemberConnection Function to get member connection status.
 * @param setMemberConnectionStatus Function to set member connection status.
 * @param getConnectionById Function to get a connection by its ID.
 * @param updateDB Function to update database records.
 * @param insertUserListEl Function to insert a user element into a list.
 * @param findSLSMember Function to find SLS member data.
 * @param removeUserElement Function to remove a user element from the UI.
 * @param sendDataToBlockedMember Function to notify a blocked member.
 * @param removeVideoElement Function to remove a video element from the UI.
 * @param addVideoStreamElement Function to add a video stream element to the UI.
 * @param stripHTML Function to strip HTML tags from a string.
 * @param addChatElement Function to add a chat message to the UI.
 * @param playSoundNotification Function to play a sound notification.
 * @param authenticateChat Function to authenticate chat.
 * @param appendPrivateChatContent Function to append private chat content.
 * @param addPrivateChatElements Function to add private chat messages to the UI.
 * @param streamPrivateActive Function to handle private stream activation.
 * @param showVideoStream Function to display a video stream.
 * @param subscribeToUserStream Function to subscribe to a user's stream.
 * @param createModalMessage Function to create a modal message.
 * @param bannedMessageModal Template string for a banned message modal.
 * @param getStreamConnection Function to get stream connection details.
 * @param updateRoomConnectionCount Function to update room connection count.
 */
export const initializeSession = (
  session: Session,
  stateObj: StateObj,
  mapSessions: MapSessions,
  globalSession: string,
  OPENVIDU_SERVER_SECRET: string,
  appNotify: AppNotify,
  sendErrorMessage: SendErrorMessage,
  refresh: Refresh,
  decrypt: Decrypt,
  getMemberConnection: GetMemberConnection,
  setMemberConnectionStatus: SetMemberConnectionStatus,
  getConnectionById: GetConnectionById,
  insertUserListEl: InsertUserListEl,
  removeUserElement: RemoveUserElement,
  removeVideoElement: RemoveVideoElement,
  addVideoStreamElement: AddVideoStreamElement,
  stripHTML: StripHTML,
  addChatElement: AddChatElement,
  playSoundNotification: PlaySoundNotification,
  appendPrivateChatContent: AppendPrivateChatContent,
  addPrivateChatElements: AddPrivateChatElements,
  streamPrivateActive: StreamPrivateActive,
  showVideoStream: ShowVideoStream,
  subscribeToUserStream: SubscribeToUserStream,
  createModalMessage: CreateModalMessage,
  getStreamConnection: (streamId: string) => Promise<any>, // Added based on usage
  updateRoomConnectionCount: UpdateRoomConnectionCount,
) => {
  // Original OV.getDevices() logic is not an event handler, so it's excluded as per prompt.
  // It's likely handled by the useOpenViduSession hook or a similar service.

  session.on('exception', (event: ExceptionEvent) => {
    //console.log(event, 'exception on ' + event.name);
    let stream = event.origin;
    if (event.origin && (event.origin as any).stream) {
      stream = (event.origin as any).stream;
    }

    switch (event.name) {
      case 'NO_STREAM_PLAYING_EVENT':
        console.log(stream, 'NO_STREAM_PLAYING_EVENT');
        // Original AJAX call commented out, replaced with a placeholder console log
        console.warn('AJAX call for NO_STREAM_PLAYING_EVENT was commented out in original JS.');
        break;
      case 'ICE_CONNECTION_FAILED':
        console.warn('Stream ' + (stream as any)?.streamId + ' broke!');
        console.warn('Reconnection process automatically started');
        break;
      case 'ICE_CONNECTION_DISCONNECTED':
        if ((stream as any)?.connection?.connectionId) {
         // ToDo: GetMemberInfo
        }
        break;
      default:
        console.log(event, 'exception error');
        break;
    }
  });

  session.on('reconnecting', (e) => {
    console.log(e, 'reconnecting');
  });

  session.on('reconnected', (e) => {
    console.log(e, 'reconnected');
  });

  session.on('sessionConnected', (e) => {
    appNotify(
      'Session Connected',
      '<p class="text-center text-white mb-0">You are now connected. Enjoy and have fun.</p>',
      { delay: 3000, theme: 'bg-success', autohide: true },
    );
  });

  session.on('sessionCreated', (e) => {
    // console.log(e)
    appNotify(
      'Chat Session Created',
      '<p class="text-center text-white mb-0">Room Created.</p>',
      { delay: 3000, theme: 'bg-success', autohide: true },
    );
  });

  session.on('sessionDisconnected', (event: ConnectionEvent) => {
    
    appNotify(
      'Session disconnected',
      `<p class="text-center text-white mb-0">Connection to the server lost. <br>Reason: ` +
        reason +
        `</p>`,
      {
        delay: 30000,
        theme: 'bg-danger',
        autohide: false,
      },
    );

  });

  session.on('connectionDestroyed', (event: ConnectionEvent) => {
    // Todo: Add  remove offline user
  });

  session.on('connectionCreated', (event: ConnectionEvent) => {
    // Todo: Add  online user
  });

  session.on('streamDestroyed', (event: StreamEvent) => {
    // Todo: Remove videoElement
   
  });

  session.on('streamCreated', (event: StreamEvent) => {
    // Todo: Add videoElement
  });

  session.on('streamPropertyChanged', (event: StreamPropertyChangedEvent) => {
     // Todo: Update Video stream element
  });

  session.on('signal:global', (event: SignalEvent) => {
    
  });

  session.on(`signal:${globalSession}`, (event: SignalEvent) => {
    // Todo: Work on Chat

    addChatElement(
      {
        messageCount: messageCount + 1,
        USERNAME: data.SENDER_NAME,
        PICTURE: data.SENDER_PICTURE,
        USERID: data.SENDER,
        message: data.MESSAGE,
        date: data.TIME,
        type: data.TYPE,
      },
      event,
    );
  });

  session.on('signal:whisper', (event: SignalEvent) => {
    console.log(event, 'signal:whisper');
  });

  session.on('signal:ignore', (event) => {
    console.log(event, 'signal:ignore');
  });

  session.on('signal:announcement', (event: SignalEvent) => {
    console.log(event, 'signal:announcement');
    
  });

  session.on('signal:private', (event: SignalEvent) => {
    console.log(event, 'signal:private');
  });

  session.on('signal:privatestream', (event: SignalEvent) => {
    console.log(event, 'signal:privatestream');
  });

  session.on('signal:publicstream', (event: SignalEvent) => {
    console.log(event, 'signal:publicstream');
  });

  session.on('signal:requeststream', (event: SignalEvent) => {
   console.log(event, 'signal:requeststream');
  });

  session.on('signal:getstream', (event: SignalEvent) => {
    console.log(event, 'signal:getstream');
  });

  session.on('signal:kick', (event: SignalEvent) => {
    console.log(event, 'signal:kick');
  });

  session.on('signal:subscribe', (event: SignalEvent) => {
    console.log(event, 'signal:subscribe');
  });

  session.on('signal:unsubscribe', (event: SignalEvent) => {
    console.log(event, 'signal:unsubscribe');
  });

  session.on('signal:blocker', (event: SignalEvent) => {
    console.log(event, 'signal:blocker');
  });

  session.on('publisherStartSpeaking', (event: PublisherStartSpeakingEvent) => {
   console.log(event, 'publisherStartSpeaking');
  });

  session.on('publisherStopSpeaking', (event: PublisherStopSpeakingEvent) => {
    console.log(event, 'publisherStopSpeaking');
  });

  session.on('signal:count', (event) => {
    console.log(event, 'signal:count');
  });

  session.on('signal:notify', (event: SignalEvent) => {
    console.log(event, 'signal:notify');
  });

  session.on('signal:userSettings', (event: SignalEvent) => {
   console.log(event, 'signal:userSettings');
  });
};
