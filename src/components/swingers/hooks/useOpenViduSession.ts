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
import { connectionStore, fetchSessionConnections, clearConnections, currentDefaultConnection } from '@/components/swingers/stores/connectionStore'; // Import new connection store actions
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
      await new Promise(resolve => setTimeout(resolve, 200)); // Give OpenVidu a moment to process
    }
    // Also destroy the publisher if it exists, regardless of session status
    if (ovState.publisher) {
        ovState.publisher.destroy();
    }
    if (ovState.currentSessionId) {
      await fetchSessionConnections(ovState.currentSessionId); // Fetching after disconnect should yield 0 connections
    }
    resetOpenViduStore();
    clearConnections(); // Clear connections from connectionStore
  }, [ovState.session, ovState.currentSessionId, ovState.publisher, clearConnections]);

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
      (async () => {
        if (ovState.session) {
          await leaveSession(); // This now includes publisher destroy
        } else if (ovState.publisher) { // If there was a publisher but no active session (e.g., just preview)
            ovState.publisher.destroy();
            setOpenViduPublisher(null);
        }
        resetOpenViduStore();
        clearConnections();
      })();
    };
  }, [initialSessionId, ovState.sessionNameInput, ovState.openViduInstance, ovState.session, ovState.publisher, leaveSession, clearConnections]);


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
    if (!ovState.openViduInstance) {
      setOpenViduError('OpenVidu instance not initialized.');
      return;
    }
    setOpenViduLoading(true);
    setOpenViduError(null);
    try {
      // If a publisher already exists, destroy it first to re-initialize with new settings (if any)
      if (ovState.publisher) {
        ovState.publisher.destroy();
        setOpenViduPublisher(null);
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
      setOpenViduError(`Failed to start media preview: ${error.message || error}`);
      setOpenViduPublisher(null);
    } finally {
      setOpenViduLoading(false);
    }
  }, [ovState.openViduInstance, ovState.isMicActive, ovState.isCameraActive, ovState.publisher]);

  // NEW: Function to destroy local publisher, used for cleaning up preview
  const destroyLocalMediaPreview = useCallback(() => {
    if (ovState.publisher) {
      ovState.publisher.destroy();
      setOpenViduPublisher(null);
    }
  }, [ovState.publisher]);


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

    setOpenViduLoading(true);

    try {
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

      session.on('signal:chat', (event) => {
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

      // Publish the existing preview publisher, or create a new one if preview was not started/failed
      if (ovState.publisher) {
        await session.publish(ovState.publisher);
      } else {
        // This case handles direct joins without preview or if preview failed
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
        await session.publish(publisher);
      }

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
    } finally {
      setOpenViduLoading(false);
    }
  }, [ovState.sessionNameInput, ovState.openViduInstance, getToken, currentUserDisplayName, ovState.session, ovState.publisher, leaveSession, fetchSessionConnections, clearConnections, ovState.isMicActive, ovState.isCameraActive]);

  const toggleCamera = useCallback(() => {
    const newCameraState = !ovState.isCameraActive;
    setIsCameraActive(newCameraState); // Update store immediately
    if (ovState.publisher) {
      ovState.publisher.publishVideo(newCameraState);
    } else {
      // If no publisher exists yet (e.g., before preview starts),
      // re-initialize preview with new setting if media is meant to be active.
      // This ensures `initLocalMediaPreview` (which runs on mount) respects the toggle.
      if (ovState.openViduInstance && newCameraState) {
        initLocalMediaPreview();
      }
    }
  }, [ovState.publisher, ovState.isCameraActive, ovState.openViduInstance, initLocalMediaPreview]);

  const toggleMic = useCallback(() => {
    const newMicState = !ovState.isMicActive;
    setIsMicActive(newMicState); // Update store immediately
    if (ovState.publisher) {
      ovState.publisher.publishAudio(newMicState);
    } else {
      // If no publisher exists yet, re-initialize preview with new setting if media is meant to be active.
      if (ovState.openViduInstance && newMicState) {
        initLocalMediaPreview();
      }
    }
  }, [ovState.publisher, ovState.isMicActive, ovState.openViduInstance, initLocalMediaPreview]);


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
    initLocalMediaPreview, // NEW
    destroyLocalMediaPreview, // NEW
    toggleCamera,
    toggleMic,
    sendChatMessage,
    isCameraActive: ovState.isCameraActive,
    isMicActive: ovState.isMicActive,
    isLoading: ovState.loading,
    error: ovState.error,
    publisher: ovState.publisher, // Expose publisher for preview
    currentSessionId: ovState.currentSessionId, // Expose for status
    openViduInstance: ovState.openViduInstance, // NEW: Expose OpenVidu instance
  };
};
