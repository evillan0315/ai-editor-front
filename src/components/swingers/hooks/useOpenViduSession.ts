import React, { useEffect, useCallback } from 'react';
import { OpenVidu } from 'openvidu-browser';
import { useStore } from '@nanostores/react';

import { createSession, getSession } from '@/components/swingers/api/sessions'; // Import getSession as well
import { getConnections, createConnection } from '@/components/swingers/api/connections';
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
import { updateRoomConnectionCount } from '@/components/swingers/stores/roomStore';
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
  const currentUserDisplayName = $auth.user?.username || 'Guest User';

  // --- Modified leaveSession to be async and awaitable ---
  const leaveSession = useCallback(async () => {
    if (ovState.session) {
      console.log(`Disconnecting from OpenVidu session ${ovState.session.sessionId}...`);
      ovState.session.disconnect();
      // Introduce a small delay to allow OpenVidu's internal WebSocket cleanup to begin.
      // This helps prevent race conditions if a new session connects immediately.
      await new Promise(resolve => setTimeout(resolve, 200)); // Increased delay for robustness
    }
    resetOpenViduStore();
    // Update connection count to reflect leaving the room
    if (ovState.currentSessionId) {
      try {
        const connections = await getConnections(ovState.currentSessionId);
        updateRoomConnectionCount(ovState.currentSessionId, connections.length);
      } catch (err) {
        console.warn("Failed to update connection count after leaving session:", err);
      }
    }
  }, [ovState.session, ovState.currentSessionId]); // Depends on currentSessionId to ensure connection count update is for the correct session

  // Initialize OpenVidu object and session name once per hook instance
  useEffect(() => {
    if (!ovState.openViduInstance) {
      setOpenViduInstance(new OpenVidu());
    }
    if (initialSessionId && ovState.sessionNameInput === '') {
      setOpenViduSessionNameInput(initialSessionId);
    }

    return () => {
      // Ensure leaveSession is awaited during cleanup to prevent resource leaks
      (async () => {
        if (ovState.session) { // Only call if a session was actually active
          await leaveSession();
        }
        resetOpenViduStore(); // Ensure store is fully reset on unmount
      })();
    };
  }, [initialSessionId, ovState.sessionNameInput, ovState.openViduInstance, ovState.session, leaveSession]);

  const handleSessionNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setOpenViduSessionNameInput(event.target.value);
  }, []);

  const getToken = useCallback(async (mySessionId: string): Promise<string> => {
    try {
      // createSession now handles the 409 Conflict internally, returning the existing session
      // if one already exists for the customSessionId.
      const session = await createSession({ customSessionId: mySessionId });
      const connection = await createConnection(session.sessionId, {
        role: 'PUBLISHER',
        data: JSON.stringify({ USERNAME: currentUserDisplayName }),
      });
      return connection.token;
    } catch (error: any) {
      // This catch block will only be hit for actual errors (not 409 handled by createSession)
      console.error('Error in getToken:', error);
      setOpenViduError(`Failed to get OpenVidu token: ${error.message || error}`);
      throw error;
    }
  }, [currentUserDisplayName]);

  const startPublishingMedia = useCallback(async () => {
    if (!ovState.session || !ovState.openViduInstance) return;

    setOpenViduLoading(true);
    setOpenViduError(null);

    try {
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
      await ovState.session.publish(publisher);

      if (ovState.currentSessionId) {
        getConnections(ovState.currentSessionId).then(c => updateRoomConnectionCount(ovState.currentSessionId!, c.length));
      }

    } catch (error: any) {
      console.error('Error publishing media:', error.code, error.message);
      setOpenViduError(`Failed to publish media: ${error.message || error}`);
      if (ovState.publisher) {
        ovState.publisher.destroy();
        setOpenViduPublisher(null);
      }
    } finally {
      setOpenViduLoading(false);
    }
  }, [ovState.session, ovState.currentSessionId, ovState.isMicActive, ovState.isCameraActive, ovState.openViduInstance, ovState.publisher]);

  // --- Modified joinSession to await leaveSession and handle auto-publish ---
  const joinSession = useCallback(async (sessionIdToJoin?: string) => {
    // If there's an active session, ensure it's fully disconnected before proceeding.
    // Awaiting leaveSession here prevents race conditions where a new connection
    // attempts to initialize while resources from a previous session are still tearing down.
    if (ovState.session) {
      console.warn('Attempting to join session while another might be active or pending. Cleaning up first.');
      await leaveSession();
    }

    const effectiveSessionId = sessionIdToJoin || ovState.sessionNameInput;

    if (!effectiveSessionId || !ovState.openViduInstance) {
      setOpenViduError('Session ID or OpenVidu object is missing.');
      return;
    }

    setOpenViduLoading(true);
    setOpenViduError(null);

    try {
      const token = await getToken(effectiveSessionId);
      const session = ovState.openViduInstance.initSession();
      setOpenViduSessionId(effectiveSessionId);
      setOpenViduSession(session as ISession);

      session.on('connectionCreated', (event) => {
         console.log('connectionCreated:', event);
      });

      session.on('streamCreated', (event) => {
        const subscriber = session.subscribe(event.stream, undefined);
        setOpenViduError(null);
        subscriber.on('streamPlaying', () => {}); // Renderer handles attachment
        addOpenViduSubscriber(subscriber);
        getConnections(effectiveSessionId).then(c => updateRoomConnectionCount(effectiveSessionId, c.length));
      });

      session.on('streamDestroyed', (event) => {
        removeOpenViduSubscriber(event.stream.streamId);
        getConnections(effectiveSessionId).then(c => updateRoomConnectionCount(effectiveSessionId, c.length));
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

      await session.connect(token, { clientData: JSON.stringify({ USERNAME: currentUserDisplayName }) });
      
      // Only start publishing if joining directly (e.g., via URL parameter), not if simply reconnecting
      // This condition is true when initialSessionId is passed to the hook and joinSession is called without args
      if (sessionIdToJoin) { 
        await startPublishingMedia();
      }

    } catch (error: any) {
      console.error('Error connecting to session:', error.code, error.message);
      setOpenViduError(`Failed to connect to OpenVidu session: ${error.message || error}`);
      
      // Explicitly disconnect and clean up if connection fails mid-process
      if (ovState.session) {
         ovState.session.disconnect();
      }
      resetOpenViduStore(); // Ensure store is in a clean state
    } finally {
      setOpenViduLoading(false);
    }
  }, [ovState.sessionNameInput, ovState.openViduInstance, getToken, startPublishingMedia, currentUserDisplayName, ovState.session, leaveSession]);

  const toggleCamera = useCallback(() => {
    if (ovState.publisher) {
      ovState.publisher.publishVideo(!ovState.isCameraActive);
      setIsCameraActive(!ovState.isCameraActive);
    }
  }, [ovState.publisher, ovState.isCameraActive]);

  const toggleMic = useCallback(() => {
    if (ovState.publisher) {
      ovState.publisher.publishAudio(!ovState.isMicActive);
      setIsMicActive(!ovState.isMicActive);
    }
  }, [ovState.publisher, ovState.isMicActive]);

  const sendChatMessage = useCallback(async (messageText: string) => {
    if (!ovState.session || !ovState.currentSessionId) {
      console.warn('Cannot send chat message: No active OpenVidu session.');
      return;
    }
    try {
      const messagePayload = {
        sender: currentUserDisplayName,
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
    startPublishingMedia,
    toggleCamera,
    toggleMic,
    sendChatMessage,
    isCameraActive: ovState.isCameraActive,
    isMicActive: ovState.isMicActive,
    isLoading: ovState.loading,
    error: ovState.error,
  };
};
