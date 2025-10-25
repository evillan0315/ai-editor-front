import React, { useEffect, useCallback } from 'react';
import { OpenVidu } from 'openvidu-browser';
import { useStore } from '@nanostores/react';

import { createSession } from '@/components/swingers/api/sessions';
import { createConnection } from '@/components/swingers/api/connections';
import { ISession } from '@/components/swingers/types';
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
import { fetchSessionConnections, clearConnections, currentDefaultConnection } from '@/components/swingers/stores/connectionStore'; // Import new connection store actions
import { authStore } from '@/stores/authStore';


/**
 * A custom hook to manage OpenVidu sessions within a React component.
 * Handles session connection, disconnection, publishing, subscribing, and media controls.
 * Includes functionality for sending and receiving chat messages via OpenVidu signals.
 * @param initialSessionId Optional: If provided, the session name input will be pre-filled and the session will attempt to auto-join.
 */
export const useOpenViduSession = (initialSessionId?: string) => {
  const ovState = useStore(openViduStore);
  const $auth = useStore(authStore);
  const $currentDefaultConnection = useStore(currentDefaultConnection);
  console.log($currentDefaultConnection, '$currentDefaultConnection');
  // Add a ref to track if media initialization is in progress to prevent race conditions
  const isMediaInitInProgress = React.useRef(false);

  // Ensure currentUserDisplayName is safely parsed or defaulted
  const currentUserDisplayName = React.useMemo(() => {
    try {
      return $currentDefaultConnection.clientData ? JSON.parse($currentDefaultConnection.clientData) : { USERNAME: 'Guest' };
    } catch (e) {
      console.error('Error parsing clientData:', e);
      return { USERNAME: 'Guest' };
    }
  }, [$currentDefaultConnection.clientData]);


  const leaveSession = useCallback(async () => {
    if (ovState.session) {
      console.log(`Disconnecting from OpenVidu session ${ovState.session.sessionId}...`);
      ovState.session.disconnect();
      // Introduce a small delay to allow OpenVidu to process the disconnect before destroying publisher
      // This can sometimes help prevent "device already in use" if the browser doesn't immediately release resources.
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    // Always destroy the publisher if it exists, as part of a complete cleanup
    if (ovState.publisher) {
        ovState.publisher.destroy();
        setOpenViduPublisher(null); // Ensure publisher is explicitly cleared from store
    }
    if (ovState.currentSessionId) {
      // Only fetch connections if there was a session ID, otherwise it's moot
      await fetchSessionConnections(ovState.currentSessionId); // Fetching after disconnect should yield 0 connections
    }
    resetOpenViduStore();
    clearConnections(); // Clear connections from connectionStore
    isMediaInitInProgress.current = false; // Reset flag on leaving session
  }, [ovState.session, ovState.currentSessionId, ovState.publisher, clearConnections]);

  // NEW: Function to destroy local publisher, used for cleaning up preview
  const destroyLocalMediaPreview = useCallback(() => {
    if (ovState.publisher) {
      ovState.publisher.destroy();
      setOpenViduPublisher(null);
    }
    isMediaInitInProgress.current = false; // Reset flag on destroying preview
  }, [ovState.publisher]);


  // Initialize OpenVidu object and session name once per hook instance
  // This useEffect ensures the OpenVidu instance is ready and session name input is set if provided.
  useEffect(() => {
    if (!ovState.openViduInstance) {
      setOpenViduInstance(new OpenVidu());
    }
    if (initialSessionId && ovState.sessionNameInput === '') {
      setOpenViduSessionNameInput(initialSessionId);
    }

    // Cleanup: Disconnect and reset store on component unmount
    return () => {
      // Ensure a full cleanup. If session is active, leave it. If only a preview publisher exists, destroy it.
      if (ovState.session) {
          leaveSession(); // Fully disconnect and destroy publisher
      } else if (ovState.publisher) {
          destroyLocalMediaPreview(); // Destroy publisher if no session was active (only preview)
      }
      resetOpenViduStore();
      clearConnections();
      isMediaInitInProgress.current = false; // Ensure flag is reset on component unmount
    };
  }, [initialSessionId, ovState.sessionNameInput, ovState.openViduInstance, ovState.session, ovState.publisher, leaveSession, clearConnections, destroyLocalMediaPreview]);


  const handleSessionNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setOpenViduSessionNameInput(event.target.value);
  }, []);

  const getToken = useCallback(async (mySessionId: string): Promise<string> => {
    try {
      const session = await createSession({ customSessionId: mySessionId });
      const connection = await createConnection(session.sessionId, {
        role: 'PUBLISHER',
        data: JSON.stringify(currentUserDisplayName), // Pass client data
      });
      return connection.token;
    } catch (error: any) {
      console.error('Error in getToken:', error);
      setOpenViduError(`Failed to get OpenVidu token: ${error.message || error}`);
      throw error;
    }
  }, [currentUserDisplayName]);

  // NEW: Function to initialize publisher for local preview without connecting to session
  const initLocalMediaPreview = useCallback(async () => {
    // Guard against multiple simultaneous initialization calls
    if (isMediaInitInProgress.current) {
        console.warn('Media initialization already in progress, skipping.');
        return;
    }
    if (!ovState.openViduInstance) {
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
      if (currentPublisher) {
        currentPublisher.destroy();
        setOpenViduPublisher(null); // Explicitly clear from store immediately
        // Add a small delay to give the browser a moment to release the device if it was just destroyed.
        // This is a common workaround for DEVICE_ALREADY_IN_USE errors.
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const publisher = await ovState.openViduInstance.initPublisherAsync(undefined, {
        audioSource: undefined,
        videoSource: undefined,
        publishAudio: ovState.isMicActive,
        publishVideo: ovState.isCameraActive,
        resolution: '640x480',
        frameRate: 30,
        insertMode: 'APPEND',
        mirror: true,
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
  }, [ovState.openViduInstance, ovState.isMicActive, ovState.isCameraActive]); // Crucial: removed ovState.publisher from dependencies.


  const joinSession = useCallback(async (sessionIdToJoin?: string) => {
    setOpenViduError(null);

    // If already connected to a session, disconnect first.
    if (ovState.session) {
      console.warn('Attempting to join session while another might be active. Cleaning up first.');
      await leaveSession(); // This will also destroy any existing publisher.
    }

    const effectiveSessionId = sessionIdToJoin || ovState.sessionNameInput;

    if (!effectiveSessionId || !ovState.openViduInstance) {
      setOpenViduError('Session ID or OpenVidu object is missing.');
      return;
    }

    if (!ovState.publisher) { // Ensure publisher is ready before joining
      setOpenViduError('Local media publisher not initialized. Please ensure camera/mic are configured.');
      setOpenViduLoading(false); // Make sure loading state is off if we error out here
      return;
    }

    setOpenViduLoading(true);

    try {
      console.log(sessionIdToJoin, 'sessionIdToJoin');
      const token = await getToken(effectiveSessionId);
      const session = ovState.openViduInstance.initSession();
      setOpenViduSessionId(effectiveSessionId);
      setOpenViduSession(session as ISession);

      session.on('connectionCreated', async (event) => {
         console.log('connectionCreated:', event);
         // Filter out our own connectionCreated event, as we handle local publisher separately
         if (ovState.publisher && event.connection.connectionId === ovState.publisher.stream.connection.connectionId) {
             console.log('Skipping connectionCreated for own publisher.');
             return;
         }
         await fetchSessionConnections(effectiveSessionId);
      });

      session.on('streamCreated', async (event) => {
        // Prevent subscribing to our own stream if it's already managed by our local publisher
        if (ovState.publisher && event.stream.connection.connectionId === ovState.publisher.stream.connection.connectionId) {
            console.log("Skipping subscription to own stream.");
            return;
        }
        const subscriber = session.subscribe(event.stream, undefined);
        setOpenViduError(null);
        subscriber.on('streamPlaying', () => {});
        addOpenViduSubscriber(subscriber);
        await fetchSessionConnections(effectiveSessionId);
      });

      session.on('streamDestroyed', async (event) => {
        removeOpenViduSubscriber(event.stream.streamId);
        await fetchSessionConnections(effectiveSessionId);
      });

      session.on('networkQualityChanged', (event) => {
        console.log('Network quality changed:', event);
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

      await session.connect(token, { clientData: JSON.stringify(currentUserDisplayName) });

      // Publish the existing preview publisher. We now require it to be initialized already.
      await session.publish(ovState.publisher);


      // Fetch connections and update room store immediately after connecting
      await fetchSessionConnections(effectiveSessionId);

    } catch (error: any) {
      console.error('Error connecting to session:', error.code, error.message);
      setOpenViduError(`Failed to connect to OpenVidu session: ${error.message || error}`);

      // Ensure full cleanup on connection error
      if (ovState.session) {
         ovState.session.disconnect();
      }
      if (ovState.publisher) {
          ovState.publisher.destroy();
      }
      resetOpenViduStore();
      clearConnections(); // Clear connections from connectionStore on error
      isMediaInitInProgress.current = false; // Reset flag on error
    } finally {
      setOpenViduLoading(false);
    }
  }, [ovState.sessionNameInput, ovState.openViduInstance, getToken, currentUserDisplayName, ovState.session, ovState.publisher, leaveSession, fetchSessionConnections, clearConnections]);

  const toggleCamera = useCallback(() => {
    const newCameraState = !ovState.isCameraActive;
    setIsCameraActive(newCameraState); // Update store immediately
    // initLocalMediaPreview will be triggered by `isCameraActive` dependency change
    if (ovState.publisher) {
      ovState.publisher.publishVideo(newCameraState);
    }
  }, [ovState.publisher, ovState.isCameraActive]);

  const toggleMic = useCallback(() => {
    const newMicState = !ovState.isMicActive;
    setIsMicActive(newMicState); // Update store immediately
    // initLocalMediaPreview will be triggered by `isMicActive` dependency change
    if (ovState.publisher) {
      ovState.publisher.publishAudio(newMicState);
    }
  }, [ovState.publisher, ovState.isMicActive]);


  const sendChatMessage = useCallback(async (messageText: string) => {
    if (!ovState.session || !ovState.currentSessionId) {
      console.warn('Cannot send chat message: No active OpenVidu session.');
      return;
    }
    try {
      const messagePayload = {
        sender: currentUserDisplayName.USERNAME,
        message: messageText,
        timestamp: Date.now(),
      };

      await ovState.session.signal({
        type: 'chat',
        data: JSON.stringify(messagePayload),
      });
      console.log('Sent chat message:', messageText);
    } catch (error) {
      console.error('Error sending chat message via OpenVidu signal:', error);
      setOpenViduError(`Failed to send chat message: ${error.message || error}`);
    }
  }, [ovState.session, ovState.currentSessionId, currentUserDisplayName]);

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
    currentSessionId: ovState.currentSessionId,
    openViduInstance: ovState.openViduInstance,
  };
};
