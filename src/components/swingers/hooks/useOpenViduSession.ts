import React, { useEffect, useCallback, useRef } from 'react';
import { OpenVidu } from 'openvidu-browser';
import { useStore } from '@nanostores/react';
import { decrypt, encrypt } from '../utils/crypto';
import { createSession, getSession } from '@/components/swingers/api/sessions';
import { createConnection } from '@/components/swingers/api/connections';
import { ISession, IChatMessage } from '@/components/swingers/types';
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
import { fetchSessionConnections, clearConnections, currentDefaultConnection } from '@/components/swingers/stores/connectionStore';
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
      return $currentDefaultConnection.clientData ? JSON.parse($currentDefaultConnection.clientData) : { USERNAME: 'Guest' };
    } catch (e) {
      console.error('Error parsing clientData:', e);
      return { USERNAME: 'Guest' };
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
    const isMic = openViduStore.get().isMicActive;
    const isCam = openViduStore.get().isCameraActive;

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
        publishAudio: false, // Default to audio off
        publishVideo: false, // Default to video off
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
        initLocalMediaPreview();
    } else if (connectionRole === 'SUBSCRIBER' && ovState.publisher) {
        // If role changes to SUBSCRIBER and there's an existing publisher (e.g., from a prior PUBLISHER connection), destroy it.
        destroyLocalMediaPreview();
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

      
      const session = await getSession(mySessionId);

      const connection = await createConnection(mySessionId, {
        role: connectionRole, // Use the role passed to the hook
        //data: JSON.stringify(currentUserDisplayName), // Pass client data
      });
      return connection.token;
    } catch (error: any) {
      if(error.statusCode === 409){
        
      } else {
        const session = await createSession({ customSessionId: mySessionId });
        console.log(session, 'session getToken');
        const connection = await createConnection(session.sessionId, {
		role: connectionRole, // Use the role passed to the hook
		//data: JSON.stringify(currentUserDisplayName), // Pass client data
	      });
	 return connection.token;
      }
      
    }
  }, [currentUserDisplayName, connectionRole]); // Add connectionRole to dependencies

  // Crucial: removed ovState.publisher from dependencies.


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

    // If we are already connected to the *same* session, just return.
    if (ovSession && ovSession.sessionId === effectiveSessionId) {
      console.log(`Already connected to session: ${effectiveSessionId}. Skipping join.`);
      setOpenViduLoading(false); // Ensure loading state is off if we early exit
      return;
    }

    if (!effectiveSessionId || !ovInstance) {
      setOpenViduError('Session ID or OpenVidu object is missing.');
      setOpenViduLoading(false); // Ensure loading is off if we error out early
      return;
    }

    // For PUBLISHER role, ensure publisher is ready before joining
    // Re-check ovPublisher after potential leaveSession call
    if (connectionRole === 'PUBLISHER' && !ovPublisher) {
      setOpenViduError('Local media publisher not initialized. Please ensure camera/mic are configured.');
      setOpenViduLoading(false); // Make sure loading state is off if we error out here
      return;
    }

    setOpenViduLoading(true);
    clearChat(); // NEW: Clear chat messages on joining a new session

    try {
      console.log(effectiveSessionId, 'effectiveSessionId joinSession' );
      const token = await getToken(effectiveSessionId);
      const session = ovInstance.initSession();
      setOpenViduSessionId(effectiveSessionId);
      setOpenViduSession(session as ISession);
      
      await ovInstance.enableProdMode();
      
  //ovInstance.setAdvancedConfiguration({ forceMediaReconnectionAfterNetworkDrop: true });
      const devices = await ovInstance.getDevices()
      console.log(devices, 'devices')
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
        // Prevent subscribing to our own stream if it's already managed by our local publisher
        const latestPublisher = openViduStore.get().publisher;
        // MODIFIED: Added optional chaining for publisher.stream.connection to prevent TypeError
        if (latestPublisher?.stream?.connection && event.stream.connection.connectionId === latestPublisher.stream.connection.connectionId) {
            console.log("Skipping subscription to own stream.");
            return;
        }
        const subscriber = session.subscribe(event.stream, undefined);
        setOpenViduError(null);
        subscriber.on('streamPlaying', () => {
          
        });
        addOpenViduSubscriber(subscriber);
        //await fetchSessionConnections(effectiveSessionId); // Only fetch connections when explicitly needed (e.g. after user action, not for every stream)
      });

      session.on('streamDestroyed', async (event) => {
        removeOpenViduSubscriber(event.stream.streamId);
        //await fetchSessionConnections(effectiveSessionId); // Only fetch connections when explicitly needed (e.g. after user action, not for every stream)
      });

      session.on('networkQualityChanged', (event) => {
        console.log('Network quality changed:', event);
      });
      // NEW: Add handler for \"chat\" signal type
      session.on(`signal:chat`, (event) => {
        try {
          const signalData = JSON.parse(event.data || '{}');
          const connectionData = event.from?.data; // Connection data of the sender

          let senderName = 'Unknown';
          let isMessageLocal = false; // Flag to check if message is from current user

          // Determine sender name and if it's a local message
          if (connectionData) {
            try {
              const clientData = JSON.parse(connectionData);
              senderName = clientData.USERNAME || 'Unknown';
              const localClientData = currentUserDisplayName; // Data of the current local user
              // Compare connection IDs to identify local sender
              if (event.from?.connectionId === openViduStore.get().publisher?.stream?.connection?.connectionId) {
                isMessageLocal = true;
              }
            } catch (parseError) {
              senderName = connectionData.replace('clientData_', '') || 'Unknown';
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
      session.on(`signal:${effectiveSessionId}`, (event) => {
         console.log(`Chat messge from room ${effectiveSessionId}`, event);
        try {
          const signalData = JSON.parse(event.data || '{}');
          const connectionData = event.from?.data; // Connection data of the sender

          let senderName = 'Unknown';
          let isMessageLocal = false; // Flag to check if message is from current user

          // Determine sender name and if it's a local message
          if (connectionData) {
            try {
              const clientData = JSON.parse(connectionData);
              senderName = clientData.USERNAME || 'Unknown';
              const localClientData = currentUserDisplayName; // Data of the current local user
              // Compare connection IDs to identify local sender
              if (event.from?.connectionId === openViduStore.get().publisher?.stream?.connection?.connectionId) {
                isMessageLocal = true;
              }
            } catch (parseError) {
              senderName = connectionData.replace('clientData_', '') || 'Unknown';
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
      session.on('signal:global', (event) => {
        try {
          const signalData = JSON.parse(event.data || '{}');
          const connectionData = event.from?.data;

          let senderName = 'Unknown';
          if (connectionData) {
            try {
              const clientData = JSON.parse(connectionData);
              senderName = clientData.USERNAME || 'Unknown';
            } catch (parseError) {
              senderName = connectionData.replace('clientData_', '') || 'Unknown';
            }
          }

          if (signalData.message) {
            console.log('Received chat message:', signalData.message);
          }

        } catch (parseError) {
          console.error('Error parsing chat signal data:', parseError, event.data);
        }
      });
      console.log(currentUserDisplayName, 'currentUserDisplayName');
      const userData = currentUserDisplayName.clientData;
      
      const nUserData = {
        ...userData,
        USERGROUPID: effectiveSessionId,
        ROOMNAME: ""
      };
      await session.connect(token, { clientData: nUserData });

      // Publish the existing preview publisher only if the role is PUBLISHER
      if (connectionRole === 'PUBLISHER' && ovPublisher) {
        await session.publish(ovPublisher);
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
    // initLocalMediaPreview will be triggered by `isCameraActive` dependency change in the separate useEffect
    if (currentPublisher && typeof currentPublisher.publishVideo === 'function') {
      currentPublisher.publishVideo(newCameraState);
    }
  }, [connectionRole]); // Add connectionRole to dependencies

  const toggleMic = useCallback(() => {
    if (connectionRole === 'SUBSCRIBER') return; // Cannot toggle mic if not a publisher

    const currentPublisher = openViduStore.get().publisher;
    const currentIsMicActive = openViduStore.get().isMicActive;
    const newMicState = !currentIsMicActive;
    setIsMicActive(newMicState); // Update store immediately
    // initLocalMediaPreview will be triggered by `isMicActive` dependency change in the separate useEffect
    if (currentPublisher && typeof currentPublisher.publishAudio === 'function') {
      currentPublisher.publishAudio(newMicState);
    }
  }, [connectionRole]); // Add connectionRole to dependencies


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

      await ovSession.signal({
        type: 'chat',
        data: JSON.stringify(messagePayload),
        //target: [connection], // Can target specific connections if needed for private chat
      });
      console.log('Sent chat message:', messageText);

      // Optimistically add message to local store if it's sent successfully
      // The session.on('signal:chat') listener will also pick this up, but this ensures immediate display
      // It's crucial to correctly identify if this is indeed an echo or the original send. Added localConnectionId for check
      addChatMessage({ ...messagePayload, isLocal: localConnectionId === ovSession.connection?.connectionId });

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
