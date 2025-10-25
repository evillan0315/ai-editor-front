import React, { useState, useEffect, useCallback, useRef } from 'react';
import { OpenVidu } from 'openvidu-browser';
import { useStore } from '@nanostores/react';
import { nanoid } from 'nanoid';

import { createSession, getSession } from '@/components/swingers/api/sessions';
import { getConnections, createConnection } from '@/components/swingers/api/connections';
import { IOpenViduPublisher, IOpenViduSubscriber, ISession } from '@/components/swingers/types';
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

  const [sessionNameInput, setSessionNameInput] = useState<string>(initialSessionId || '');
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isMicActive, setIsMicActive] = useState(true);

  const OV_REF = useRef<OpenVidu | null>(null);
  const SESSION_REF = useRef<openvidu_browser.Session | null>(null);
  const PUBLISHER_REF = useRef<IOpenViduPublisher | null>(null);

  // --- Modified leaveSession to be async and awaitable ---
  const leaveSession = useCallback(async () => {
    if (SESSION_REF.current) {
      SESSION_REF.current.disconnect();
      // Introduce a small delay to allow OpenVidu's internal WebSocket cleanup to begin.
      // This helps prevent race conditions if a new session connects immediately.
      await new Promise(resolve => setTimeout(resolve, 100)); // Delay for 100ms
      SESSION_REF.current = null;
    }
    resetOpenViduStore();
    PUBLISHER_REF.current = null;
    setIsCameraActive(true);
    setIsMicActive(true);
    // Update connection count to reflect leaving the room
    if (ovState.currentSessionId) {
      try {
        const connections = await getConnections(ovState.currentSessionId);
        updateRoomConnectionCount(ovState.currentSessionId, connections.length);
      } catch (err) {
        console.warn("Failed to update connection count after leaving session:", err);
      }
    }
  }, [ovState.currentSessionId]); // Depends on currentSessionId to ensure connection count update is for the correct session

  // Initialize OpenVidu object once per hook instance
  useEffect(() => {
    if (!OV_REF.current) {
      OV_REF.current = new OpenVidu();
    }
    if (initialSessionId && sessionNameInput === '') {
      setSessionNameInput(initialSessionId);
    }
    return () => {
      // Ensure leaveSession is awaited during cleanup to prevent resource leaks
      (async () => {
        if (SESSION_REF.current) { // Only call if a session was actually active
          await leaveSession();
        }
        resetOpenViduStore(); // Ensure store is fully reset on unmount
      })();
    };
  }, [initialSessionId, sessionNameInput, leaveSession]);

  const handleSessionNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSessionNameInput(event.target.value);
  }, []);

  const getToken = useCallback(async (mySessionId: string): Promise<string> => {
    try {
      // Attempt to create a new session
      const session = await createSession({ customSessionId: mySessionId });
      const connection = await createConnection(session.sessionId, {
        role: 'PUBLISHER',
        data: JSON.stringify({ USERNAME: currentUserDisplayName }),
      });
      return connection.token;
    } catch (error: any) {
      console.error('Error in getToken:', error);

      if (error.message && error.message.includes('409 Conflict')) {
        console.warn(`Session ${mySessionId} already exists. Attempting to get existing session.`);
        try {
          const existingSession = await getSession(mySessionId);
          const connection = await createConnection(existingSession.sessionId, {
            role: 'PUBLISHER',
            data: JSON.stringify({ USERNAME: currentUserDisplayName }),
          });
          return connection.token;
        } catch (existingSessionError: any) {
          console.error(`Error getting existing session ${mySessionId} or creating connection for it:`, existingSessionError);
          setOpenViduError(`Failed to get or connect to existing session: ${existingSessionError.message || existingSessionError}`);
          throw existingSessionError;
        }
      } else {
        setOpenViduError(`Failed to get OpenVidu token: ${error.message || error}`);
        throw error;
      }
    }
  }, [currentUserDisplayName]);

  const startPublishingMedia = useCallback(async () => {
    if (!ovState.session || !OV_REF.current) return;

    setOpenViduLoading(true);
    setOpenViduError(null);

    try {
      const publisher = await OV_REF.current.initPublisherAsync(undefined, {
        audioSource: undefined,
        videoSource: undefined,
        publishAudio: isMicActive,
        publishVideo: isCameraActive,
        resolution: '640x480',
        frameRate: 30,
        insertMode: 'APPEND',
        mirror: true,
      }) as IOpenViduPublisher;

      PUBLISHER_REF.current = publisher;
      setOpenViduPublisher(publisher);
      await ovState.session.publish(publisher);

      if (ovState.currentSessionId) {
        getConnections(ovState.currentSessionId).then(c => updateRoomConnectionCount(ovState.currentSessionId!, c.length));
      }

    } catch (error: any) {
      console.error('Error publishing media:', error.code, error.message);
      setOpenViduError(`Failed to publish media: ${error.message || error}`);
      if (PUBLISHER_REF.current) {
        PUBLISHER_REF.current.destroy();
        PUBLISHER_REF.current = null;
        setOpenViduPublisher(null);
      }
    } finally {
      setOpenViduLoading(false);
    }
  }, [ovState.session, ovState.currentSessionId, isMicActive, isCameraActive]);

  // --- Modified joinSession to await leaveSession ---
  const joinSession = useCallback(async (sessionIdToJoin?: string) => {
    // If there's an active session, ensure it's fully disconnected before proceeding.
    // Awaiting leaveSession here prevents race conditions where a new connection
    // attempts to initialize while resources from a previous session are still tearing down.
    if (SESSION_REF.current || ovState.session) {
      console.warn('Attempting to join session while another might be active or pending. Cleaning up first.');
      await leaveSession();
    }

    const effectiveSessionId = sessionIdToJoin || sessionNameInput;

    if (!effectiveSessionId || !OV_REF.current) {
      setOpenViduError('Session ID or OpenVidu object is missing.');
      return;
    }

    setOpenViduLoading(true);
    setOpenViduError(null);

    try {
      const token = await getToken(effectiveSessionId);
      const session = OV_REF.current.initSession();
      SESSION_REF.current = session;
      setOpenViduSessionId(effectiveSessionId);
      setOpenViduSession(session as ISession);

      session.on('connectionCreated', (event) => {
         console.log('connectionCreated:', event);
      });

      session.on('streamCreated', (event) => {
        const subscriber = session.subscribe(event.stream, undefined) as IOpenViduSubscriber;
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
      
      if (sessionIdToJoin) {
        await startPublishingMedia();
      }

    } catch (error: any) {
      console.error('Error connecting to session:', error.code, error.message);
      setOpenViduError(`Failed to connect to OpenVidu session: ${error.message || error}`);
      
      // Explicitly disconnect and clean up if connection fails mid-process
      if (SESSION_REF.current) {
         SESSION_REF.current.disconnect();
         SESSION_REF.current = null;
      }
      resetOpenViduStore(); // Ensure store is in a clean state
    } finally {
      setOpenViduLoading(false);
    }
  }, [sessionNameInput, getToken, startPublishingMedia, currentUserDisplayName, ovState.session, leaveSession]);

  const toggleCamera = useCallback(() => {
    if (ovState.publisher) {
      ovState.publisher.publishVideo(!isCameraActive);
      setIsCameraActive(!isCameraActive);
    }
  }, [ovState.publisher, isCameraActive]);

  const toggleMic = useCallback(() => {
    if (ovState.publisher) {
      ovState.publisher.publishAudio(!isMicActive);
      setIsMicActive(!isMicActive);
    }
  }, [ovState.publisher, isMicActive]);

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
    sessionNameInput,
    handleSessionNameChange,
    joinSession,
    leaveSession,
    startPublishingMedia,
    toggleCamera,
    toggleMic,
    sendChatMessage,
    isCameraActive,
    isMicActive,
    isLoading: ovState.loading,
    error: ovState.error,
  };
};
