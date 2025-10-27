import React, { useEffect, useCallback, useRef } from 'react';
import { OpenVidu } from 'openvidu-browser';
import { useStore } from '@nanostores/react';
import { decrypt, encrypt } from '../utils/crypto';
import { createSession, getSession } from '@/components/swingers/api/sessions';
import { createConnection } from '@/components/swingers/api/connections';
import { ISession, IChatMessage, IClientConnectionUserData, IClientDataPayload } from '@/components/swingers/types';
import {
  openViduStore,
  setOpenViduSessionId,
  setOpenViduSession,
  setOpenViduPublisher,
  addOpenViduSubscriber,
  removeOpenViduSubscriber,
  setOpenViduLoading,
  setOpenViduError,
  resetOpenViduStore,
  setOpenViduInstance,
  setIsCameraActive,
  setIsMicActive,
  setSessionNameInput as setOpenViduSessionNameInput,
} from '@/components/swingers/stores/openViduStore';
import { fetchSessionConnections, clearConnections, currentDefaultConnection, fetchDefaultConnection } from '@/components/swingers/stores/connectionStore';
import { authStore } from '@/stores/authStore';
import { addChatMessage, clearChat } from '@/components/swingers/stores/chatStore'; // NEW: Import chat store actions


/**
 * A custom hook to manage OpenVidu sessions within a React component.
 * Handles session connection, disconnection, publishing, subscribing, and media controls.
 * Includes functionality for sending and receiving chat messages via OpenVidu signals.
 * @param initialSessionId Optional: If provided, the session name input will be pre-filled and the session will attempt to auto-join.
 * @param connectionRole Optional: Specifies if the client should connect as a 'PUBLISHER' or 'SUBSCRIBER'. Defaults to 'PUBLISHER'.
 */
export const useOpenViduSession = (initialSessionId?: string, connectionRole: 'PUBLISHER' | 'SUBSCRIBER' = 'PUBLISHER') => {
  const ovState = useStore(openViduStore);
  const $auth = useStore(authStore);
  const $currentDefaultConnection = useStore(currentDefaultConnection);

  // Add a ref to track if media initialization is in progress to prevent race conditions
  const isMediaInitInProgress = useRef(false);

  // Ensure currentUserDisplayName is safely parsed or defaulted
  const currentUserDisplayName = React.useMemo(() => {
    try {
      if ($currentDefaultConnection.clientData) {
        const parsedPayload: IClientDataPayload = JSON.parse($currentDefaultConnection.clientData);
        return parsedPayload.clientData; // This should be IClientConnectionUserData
      } else {
        fetchDefaultConnection();
        const parsedPayload: IClientDataPayload = JSON.parse($currentDefaultConnection.clientData);
        return parsedPayload.clientData; 
      }
      
    } catch (e) {
      console.error('Error parsing clientData for currentUserDisplayName:', e, $currentDefaultConnection.clientData);
      return { USERNAME: 'Guest' } as IClientConnectionUserData;
    }
  }, [$currentDefaultConnection.clientData]);


  // `leaveSession` is triggered by user action or explicit logic, so it's safe to reset the store.
  const leaveSession = useCallback(async () => {
    const currentSession = openViduStore.get().session; // Get latest session from store
    const currentPublisher = openViduStore.get().publisher; // Get latest publisher from store
    const currentSessionId = openViduStore.get().currentSessionId; // Get latest session ID from store

    if (currentSession) {
      console.log(`Disconnecting from OpenVidu session ${currentSession.sessionId}...`);
      currentSession.disconnect();
      // Introduce a small delay to allow OpenVidu to process the disconnect before destroying publisher
      // This can sometimes help prevent "device already in use" if the browser doesn't immediately release resources.
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    // Always destroy the publisher if it exists, as part of a complete cleanup, but only if it was intended for PUBLISHER role
    if (connectionRole === 'PUBLISHER' && currentPublisher && typeof currentPublisher.destroy === 'function') {
        currentPublisher.destroy();
        setOpenViduPublisher(null); // Ensure publisher is explicitly cleared from store
    } else if (connectionRole === 'SUBSCRIBER') {
        setOpenViduPublisher(null); // Ensure publisher is null for SUBSCRIBER role
    }

    if (currentSessionId) {
      // Only fetch connections if there was a session ID, otherwise it's moot
      await fetchSessionConnections(currentSessionId); // Fetching after disconnect should yield 0 connections
    }
    resetOpenViduStore(); // This is the intentional full reset
    clearConnections(); // Clear connections from connectionStore
    clearChat(); // NEW: Clear chat messages
    isMediaInitInProgress.current = false; // Reset flag on leaving session
  }, [clearConnections, fetchSessionConnections, resetOpenViduStore, connectionRole, clearChat]);

  // NEW: Function to initialize publisher for local preview without connecting to session
  const initLocalMediaPreview = useCallback(async () => {
    if (connectionRole === 'SUBSCRIBER') {
      setOpenViduPublisher(null); // No publisher for subscriber role
      return;
    }

    // Guard against multiple simultaneous initialization calls
    if (isMediaInitInProgress.current) {
        console.warn('Media initialization already in progress, skipping.');
        return;
    }
    const ovInstance = openViduStore.get().openViduInstance; // Get latest instance from store

    if (!ovInstance) {
      setOpenViduError('OpenVidu instance not initialized.');
      return;
    }

    setOpenViduLoading(true);
    setOpenViduError(null);
    isMediaInitInProgress.current = true; // Set flag to prevent re-entry
    try {
      // If a publisher already exists (read directly from store to avoid dependency issues),
      // destroy it first to re-initialize (e.g., if camera/mic state changed).
      const currentPublisher = openViduStore.get().publisher;
      if (currentPublisher && typeof currentPublisher.destroy === 'function') {
        console.log('Destroying existing publisher for re-initialization.');
        currentPublisher.destroy();
        setOpenViduPublisher(null); // Explicitly clear from store immediately
        // Add a small delay to give the browser a moment to release the device if it was just destroyed.
        // This is a common workaround for DEVICE_ALREADY_IN_USE errors.
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const publisher = await ovInstance.initPublisherAsync(undefined, {
        audioSource: undefined,
        videoSource: undefined,
        publishAudio: openViduStore.get().isMicActive, // Use current mic state
        publishVideo: openViduStore.get().isCameraActive, // Use current camera state
        resolution: '640x480',
        frameRate: 30,
        insertMode: 'APPEND',
        mirror: false,
      });
      setOpenViduPublisher(publisher);
    } catch (error: any) {
      console.error('Error initializing local publisher for preview:', error);
      setOpenViduError(`Failed to start media preview: ${error.message || error}. This might be due to the device being in use by another application or tab.`);
      setOpenViduPublisher(null); // Ensure publisher is null on error
    } finally {
      setOpenViduLoading(false);
      isMediaInitInProgress.current = false; // Reset flag
    }
  }, [connectionRole]); // Dependencies removed: ovState.openViduInstance, ovState.isMicActive, ovState.isCameraActive because we read dynamically

  // NEW: Function to destroy local publisher, used for cleaning up preview
  const destroyLocalMediaPreview = useCallback(() => {
    const currentPublisher = openViduStore.get().publisher; // Get latest from store
    if (currentPublisher && typeof currentPublisher.destroy === 'function') {
      console.log('Destroying local media preview publisher...');
      currentPublisher.destroy();
      setOpenViduPublisher(null);
    }
    isMediaInitInProgress.current = false; // Reset flag on destroying preview
  }, []); // Empty dependencies, as it fetches current state directly


  // This useEffect handles initialization of OpenVidu instance, initial session name, and component unmount cleanup.
  useEffect(() => {
    // 1. Initialize OpenVidu instance if not already done.
    // This ensures `new OpenVidu()` is called only once per component lifecycle.
    if (!ovState.openViduInstance) {
      setOpenViduInstance(new OpenVidu());
    }

    // 2. Set session name input if `initialSessionId` is provided and the input is currently empty.
    // Read sessionNameInput directly from store to avoid stale closure here too.
    if (initialSessionId && !openViduStore.get().sessionNameInput) {
      setOpenViduSessionNameInput(initialSessionId);
    }

    // Cleanup function: This runs on component unmount, or before the effect re-runs due to dependency changes.
    return () => {
      // Read current state directly from the Nanostore to avoid stale closures and ensure accuracy.
      const currentOvStateOnCleanup = openViduStore.get();

      if (currentOvStateOnCleanup.session) {
          // If there's an active session, fully disconnect and reset. `leaveSession` handles this.
          // Calling it here ensures a clean shutdown when the component unmounts.
          leaveSession();
      } else if (connectionRole === 'PUBLISHER' && currentOvStateOnCleanup.publisher) {
          // If only a preview publisher exists (no active session), destroy it, but only if intended for PUBLISHER role.
          destroyLocalMediaPreview();
      }
      // IMPORTANT: `resetOpenViduStore()` and `clearConnections()` are NOT called directly here.
      // They are part of `leaveSession()`. Calling them here on every dependency change was causing the infinite loop.

      // Always reset the media initialization flag on cleanup.
      isMediaInitInProgress.current = false;
    };
    // Dependencies are critical:
    // - `initialSessionId`, `ovState.openViduInstance`: For initial setup and instance availability.
    // - `leaveSession`, `destroyLocalMediaPreview`: These are stable `useCallback` functions and are needed for the cleanup to be up-to-date.
    // - `connectionRole`: Needed to determine if a publisher should be destroyed during cleanup.
    // - `openViduStore.get().sessionNameInput` is read directly in the effect body now.
    // - We intentionally EXCLUDE `ovState.session` and `ovState.publisher` from dependencies here.
    //   Including them would cause the cleanup to re-run when their values change (e.g., to null after `leaveSession()`), 
    //   leading to the infinite update loop when combined with `setOpenViduInstance` in the effect body.
  }, [initialSessionId, ovState.openViduInstance, leaveSession, destroyLocalMediaPreview, connectionRole]);

  // Separate useEffect to manage local media preview state changes (camera/mic toggles)
  // This effect ensures `initLocalMediaPreview` runs when camera/mic state changes or OpenVidu instance becomes available,
  // but ONLY when no actual session is active and role is PUBLISHER.
  useEffect(() => {
    // Only run if connectionRole is PUBLISHER, OpenVidu is initialized, not in an active session, and not already initializing media.
    if (connectionRole === 'PUBLISHER' && ovState.openViduInstance && !ovState.session && !isMediaInitInProgress.current) {
        //initLocalMediaPreview();
    } else if (connectionRole === 'SUBSCRIBER' && ovState.publisher) {
        // If role changes to SUBSCRIBER and there's an existing publisher (e.g., from a prior PUBLISHER connection), destroy it.
        //destroyLocalMediaPreview();
    }
    // Cleanup for this specific media preview effect:
    // If a session becomes active, this effect is no longer responsible for the publisher.
    // If the component unmounts without a session, `destroyLocalMediaPreview` is handled by the main unmount cleanup.
    // If camera/mic toggles, this cleanup runs, then the effect re-runs to re-init.
    return () => {
        const currentOvStateOnMediaCleanup = openViduStore.get();
        // If there's a publisher and no session is active, ensure it's destroyed.
        // This handles cases where `isCameraActive`/`isMicActive` dependencies change and a new preview is needed.
        if (connectionRole === 'PUBLISHER' && currentOvStateOnMediaCleanup.publisher && !currentOvStateOnMediaCleanup.session) {
             destroyLocalMediaPreview();
        }
    };
  }, [connectionRole, ovState.openViduInstance, ovState.session, ovState.isCameraActive, ovState.isMicActive, initLocalMediaPreview, destroyLocalMediaPreview]);


  const handleSessionNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setOpenViduSessionNameInput(event.target.value);
  }, []);

  const getToken = useCallback(async (mySessionId: string): Promise<string> => {
    try {
      // Ensure the OpenVidu session exists (or create it if it doesn't)
      const session = await getSession(mySessionId );

      // Now create a connection for this (potentially newly created or existing) session
      const connection = await createConnection(session.sessionId, {
        role: connectionRole, // Use the role passed to the hook
        // The `data` property here is `serverData` as per OpenVidu docs, and is not directly parsed by client.
        // Client data is passed in `session.connect` as the metadata argument.
      });
      return connection.token;
    } catch (error) {
      if(error.statusCode===409){
      
      } else if(error.statusCode===404){
        // Ensure the OpenVidu session exists (or create it if it doesn't)
	      const session = await createSession({ customSessionId: mySessionId });

	      // Now create a connection for this (potentially newly created or existing) session
	      const connection = await createConnection(session.sessionId, {
		role: connectionRole, // Use the role passed to the hook
		// The `data` property here is `serverData` as per OpenVidu docs, and is not directly parsed by client.
		// Client data is passed in `session.connect` as the metadata argument.
	      });
	      return connection.token;
      }
    }
  }, [connectionRole]);

  const joinSession = useCallback(async (sessionIdToJoin?: string) => {
    setOpenViduError(null);
    
    const ovSession = openViduStore.get().session; // Get latest
    let ovPublisher = openViduStore.get().publisher; // Get latest
    const ovInstance = openViduStore.get().openViduInstance; // Get latest
    const ovSessionNameInput = openViduStore.get().sessionNameInput; // Get latest
    
    const effectiveSessionId = sessionIdToJoin || ovSessionNameInput;

    // If already connected to a DIFFERENT session, disconnect first.
    if (ovSession && ovSession.sessionId !== effectiveSessionId) {
      console.warn(`Attempting to join session '${effectiveSessionId}' while active in '${ovSession.sessionId}'. Cleaning up old session first.`);
      await leaveSession(); // Ensure old session is properly disconnected and resources released
      // After leaveSession, ovSession, ovPublisher, etc., will be reset by resetOpenViduStore().
      // Re-read latest state after cleanup. ovPublisher needs to be re-assigned from store
      // if it was destroyed and recreated by a subsequent media init effect.
      ovPublisher = openViduStore.get().publisher; 
      console.log(ovPublisher);
    }

    clearChat(); // NEW: Clear chat messages on joining a new session

    try {
      console.log(effectiveSessionId, 'effectiveSessionId joinSession' );
      const token = await getToken(effectiveSessionId);
      const session = ovInstance.initSession();
      setOpenViduSessionId(effectiveSessionId);
      setOpenViduSession(session as ISession);
      
      await ovInstance.enableProdMode();
      // Uncomment this line to force media reconnection after network drops. Can help with ICE_CONNECTION_FAILED in some cases.
      //ovInstance.setAdvancedConfiguration({ forceMediaReconnectionAfterNetworkDrop: true });
      
      const devices = await ovInstance.getDevices()
      console.log(devices, 'devices')

      // NEW: Add exception handler for OpenVidu errors (e.g., WebRTC failures)
      session.on('exception', (exception) => {
        console.error('OpenVidu Session Exception:', exception);
        const errorMessage = `OpenVidu Error: ${exception.name || 'Unknown'}. ${exception.message || ''}`; 
        setOpenViduError(errorMessage);
        // Optionally, trigger a leaveSession for critical errors
        // if (['ICE_CONNECTION_FAILED', 'ICE_CANDIDATE_PAIR_FAILED'].includes(exception.name)) {
        //   leaveSession();
        // }
      });

      // NEW: Log ICE connection state changes for debugging network issues
      session.on('connectionPropertyChanged', (event) => {
        if (event.changedProperty === 'iceConnectionState') {
          console.log(`ICE Connection State changed for connection ${event.connection.connectionId}: ${event.newValue}`);
          if (event.newValue === 'failed') {
            setOpenViduError(`ICE Connection FAILED for connection ${event.connection.connectionId}. This often indicates network issues or problems with STUN/TURN servers.`);
          }
        }
      });
      
      session.on('connectionCreated', async (event) => {
         console.log('connectionCreated:', event);
         // Filter out our own connectionCreated event, as we handle local publisher separately
         // Access latest publisher state here for safety
         const latestPublisher = openViduStore.get().publisher;
         // MODIFIED: Added optional chaining for publisher.stream.connection to prevent TypeError
         if (latestPublisher?.stream?.connection && event.connection.connectionId === latestPublisher.stream.connection.connectionId) {
             console.log('Skipping connectionCreated for own publisher.');
             return;
         }
         // No need to fetch all connections, the `fetchSessionConnections` after `session.connect` handles the initial update.
         // Subsequent connectionCreated events are handled by OpenVidu's session management.
      });

      session.on('streamCreated', async (event) => {
        
        
        const subscriber = session.subscribe(event.stream, undefined);
        setOpenViduError(null);
        subscriber.on('streamPlaying', () => {
          
        });
        addOpenViduSubscriber(subscriber);
        await fetchSessionConnections(effectiveSessionId); // Only fetch connections when explicitly needed (e.g. after user action, not for every stream)
      });

      session.on('streamDestroyed', async (event) => {
        removeOpenViduSubscriber(event.stream.streamId);
        await fetchSessionConnections(effectiveSessionId); // Only fetch connections when explicitly needed (e.g. after user action, not for every stream)
      });

      session.on('networkQualityChanged', (event) => {
        console.log('Network quality changed:', event);
      });
      // NEW: Add handler for "chat" signal type
      session.on(`signal:global`, (event) => {
        try {
          const signalData = JSON.parse(event.data || '{}');
          const connectionData = event.from?.data; // Connection data of the sender

          let senderName = 'Unknown';
          let isMessageLocal = false; // Flag to check if message is from current user

          // Determine sender name and if it's a local message
          if (connectionData) {
            try {
              const clientDataPayload: IClientDataPayload = JSON.parse(connectionData);
              senderName = clientDataPayload.clientData.USERNAME || 'Unknown';
              // Compare connection IDs to identify local sender
              if (event.from?.connectionId === openViduStore.get().publisher?.stream?.connection?.connectionId) {
                isMessageLocal = true;
              }
            } catch (parseError) {
              // Fallback for malformed or older clientData structure
              senderName = connectionData.replace('clientData_', '') || 'Unknown';
              console.warn('Failed to parse connectionData as IClientDataPayload, falling back.', parseError);
            }
          }

          if (signalData.message) {
            console.log('Received chat message:', signalData.message);
            const chatMessage: IChatMessage = {
              sender: senderName,
              message: signalData.message,
              timestamp: signalData.timestamp || Date.now(),
              isLocal: isMessageLocal, // Correctly set local flag
            };
            addChatMessage(chatMessage); // Add message to the chat store
          }

        } catch (parseError) {
          console.error('Error parsing chat signal data:', parseError, event.data);
        }
      });
      session.on(`signal:${effectiveSessionId}`, (event) => {
         console.log(`Chat messge from room ${effectiveSessionId}`, event);
        try {
          const signalData = JSON.parse(event.data || '{}');
          const connectionData = event.from?.data; // Connection data of the sender
          console.log(`signalData ${effectiveSessionId}`, signalData);
          console.log(`connectionData ${effectiveSessionId}`, connectionData);
          let senderName = 'Unknown';
          let isMessageLocal = false; // Flag to check if message is from current user

          // Determine sender name and if it's a local message
          if (connectionData) {
            try {
              const clientDataPayload: IClientDataPayload = JSON.parse(connectionData);
              senderName = clientDataPayload.clientData.USERNAME || 'Unknown';
              // Compare connection IDs to identify local sender
              if (event.from?.connectionId === openViduStore.get().publisher?.stream?.connection?.connectionId) {
                isMessageLocal = true;
              }
            } catch (parseError) {
              // Fallback for malformed or older clientData structure
              senderName = connectionData.replace('clientData_', '') || 'Unknown';
              console.warn('Failed to parse connectionData as IClientDataPayload, falling back.', parseError);
            }
          }

          if (signalData.message) {
            console.log('Received chat message:', signalData.message);
            const chatMessage: IChatMessage = {
              sender: senderName,
              message: signalData.message,
              timestamp: signalData.timestamp || Date.now(),
              isLocal: isMessageLocal,
            };
            addChatMessage(chatMessage); // Add message to the chat store
          }

        } catch (parseError) {
          console.error('Error parsing chat signal data:', parseError, event.data);
        }
      });
      session.on("signal:whisper", (event) => {
        const data = JSON.parse(event.data);
        const from = event.from.data;
        const parFrom = JSON.parse(from).clientData;
        console.log(`whisper messge `, data);
      });
      
 
      // currentUserDisplayName is IClientConnectionUserData. Stringify it directly.
      const userDataString = JSON.stringify({ // Wrap in an object matching IClientDataPayload for consistency
        clientData: { ...currentUserDisplayName, USERGROUPID: effectiveSessionId, ROOMNAME: "" },
        publicKey: "" // Add a placeholder if publicKey is not available, or retrieve it from currentUserDisplayName if it exists
      });
      
      await session.connect(token, userDataString);

      // Publish the existing preview publisher only if the role is PUBLISHER
      if (connectionRole === 'PUBLISHER' && ovPublisher) {
        //await session.publish(ovPublisher);
      }

      // Fetch connections and update room store immediately after connecting
      await fetchSessionConnections(effectiveSessionId); // This call now updates `openViduEntitiesStore` as well.

    } catch (error: any) {
      // Safely access error properties and log the full error object for debugging
      console.error(
        'Error connecting to session:',
        (error as any).code || 'NoErrorCode', // Default 'NoErrorCode' if .code is undefined
        (error as Error).message || String(error), // Ensure message is always a string
        error // Log full error object
      );
      setOpenViduError(`Failed to connect to OpenVidu session: ${error.message || error}`);

      // Ensure full cleanup on connection error
      const latestOvSession = openViduStore.get().session;
      const latestOvPublisher = openViduStore.get().publisher;

      if (latestOvSession) {
         latestOvSession.disconnect();
      }
      if (connectionRole === 'PUBLISHER' && latestOvPublisher && typeof latestOvPublisher.destroy === 'function') {
          latestOvPublisher.destroy();
      }
      resetOpenViduStore(); // Reset store on connection failure
      clearConnections(); // Clear connections from connectionStore on error
      clearChat(); // NEW: Clear chat messages on connection failure
      isMediaInitInProgress.current = false; // Reset flag on error
    } finally {
      setOpenViduLoading(false);
    }
  }, [getToken, currentUserDisplayName, leaveSession, fetchSessionConnections, clearConnections, connectionRole, clearChat, addChatMessage]); // Add connectionRole and addChatMessage to dependencies

  const toggleCamera = useCallback(() => {
    if (connectionRole === 'SUBSCRIBER') return; // Cannot toggle camera if not a publisher

    const currentPublisher = openViduStore.get().publisher;
    const currentIsCameraActive = openViduStore.get().isCameraActive;
    const newCameraState = !currentIsCameraActive;
    setIsCameraActive(newCameraState); // Update store immediately
    // If publisher already exists, toggle its video. If not, initLocalMediaPreview will pick up new state.
    if (currentPublisher && typeof currentPublisher.publishVideo === 'function') {
      currentPublisher.publishVideo(newCameraState);
    } else {
      // If no publisher, triggering initLocalMediaPreview will respect the new `isCameraActive` state
      // (which `initLocalMediaPreview` now reads directly from the store).
      // This ensures that when a publisher is later initialized, it respects the desired camera state.
      initLocalMediaPreview();
    }
  }, [connectionRole, initLocalMediaPreview]); // Add initLocalMediaPreview dependency

  const toggleMic = useCallback(() => {
    if (connectionRole === 'SUBSCRIBER') return; // Cannot toggle mic if not a publisher

    const currentPublisher = openViduStore.get().publisher;
    const currentIsMicActive = openViduStore.get().isMicActive;
    const newMicState = !currentIsMicActive;
    setIsMicActive(newMicState); // Update store immediately
    // If publisher already exists, toggle its audio. If not, initLocalMediaPreview will pick up new state.
    if (currentPublisher && typeof currentPublisher.publishAudio === 'function') {
      currentPublisher.publishAudio(newMicState);
    } else {
      // If no publisher, triggering initLocalMediaPreview will respect the new `isMicActive` state.
      initLocalMediaPreview();
    }
  }, [connectionRole, initLocalMediaPreview]); // Add initLocalMediaPreview dependency


  const sendChatMessage = useCallback(async (messageText: string) => {
    const ovSession = openViduStore.get().session;
    const ovCurrentSessionId = openViduStore.get().currentSessionId;
    const localConnectionId = openViduStore.get().publisher?.stream?.connection?.connectionId;

    if (!ovSession || !ovCurrentSessionId) {
      console.warn('Cannot send chat message: No active OpenVidu session.');
      throw new Error('No active OpenVidu session to send message.');
    }
    try {
      const mySenderName = currentUserDisplayName?.USERNAME || 'You';
      const messagePayload: Omit<IChatMessage, 'isLocal'> = {
        sender: mySenderName,
        message: messageText,
        timestamp: Date.now(),
      };
      console.log(ovSession, 'ovSession');
      await ovSession.signal({
        type: ovSession.sessionId,
        data: JSON.stringify(messagePayload),
        //target: [connection], // Can target specific connections if needed for private chat
      });
      console.log('Sent chat message:', messageText);

      // Optimistically add message to local store, assuming it will be sent successfully.
      // The session.on('signal:chat') listener will also pick this up, but this ensures immediate display.
      // The `isLocal` flag here should be set to true as it's the sender's own message.
      addChatMessage({ ...messagePayload, isLocal: true });

    } catch (error: any) {
      console.error('Error sending chat message via OpenVidu signal:', error);
      setOpenViduError(`Failed to send chat message: ${error.message || error}`);
      throw error;
    }
  }, [currentUserDisplayName, addChatMessage]); // Dependencies removed: ovState.session, ovState.currentSessionId

  return {
    sessionNameInput: ovState.sessionNameInput,
    handleSessionNameChange,
    joinSession,
    leaveSession,
    initLocalMediaPreview,
    destroyLocalMediaPreview,
    toggleCamera,
    toggleMic,
    sendChatMessage,
    isCameraActive: ovState.isCameraActive,
    isMicActive: ovState.isMicActive,
    isLoading: ovState.loading,
    error: ovState.error,
    publisher: ovState.publisher,
    subscribers: ovState.subscribers,
    currentSessionId: ovState.currentSessionId,
    openViduInstance: ovState.openViduInstance,
    connectionRole,
    currentUserDisplayName,
  };
};
