import React, { useState, useEffect, useCallback, useRef } from 'react';
import { OpenVidu } from 'openvidu-browser';
import { useStore } from '@nanostores/react';
import { nanoid } from 'nanoid';

import { createSession } from '@/components/swingers/api/sessions';
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
import { authStore } from '@/stores/authStore'; // Import authStore for user info


/**
 * A custom hook to manage OpenVidu sessions within a React component.
 * Handles session connection, disconnection, publishing, subscribing, and media controls.
 * Includes functionality for sending and receiving chat messages via OpenVidu signals.
 * @param initialSessionId Optional: If provided, the session name input will be pre-filled and the session will attempt to auto-join.
 */
export const useOpenViduSession = (initialSessionId?: string) => {
  const ovState = useStore(openViduStore);
  const $auth = useStore(authStore); // Get auth state for user info
  const currentUserDisplayName = $auth.user?.username || 'Guest User'; // Get current user's display name

  const [sessionNameInput, setSessionNameInput] = useState<string>(initialSessionId || '');
  const [isCameraActive, setIsCameraActive] = useState(true); // Tracks intended camera state
  const [isMicActive, setIsMicActive] = useState(true);     // Tracks intended mic state

  const OV_REF = useRef<OpenVidu | null>(null);
  const SESSION_REF = useRef<openvidu_browser.Session | null>(null);
  const PUBLISHER_REF = useRef<IOpenViduPublisher | null>(null);

  // Initialize OpenVidu object once per hook instance
  useEffect(() => {
    if (!OV_REF.current) {
      OV_REF.current = new OpenVidu();
    }
    // If initialSessionId changes, update the input state
    if (initialSessionId && initialSessionId !== sessionNameInput) {
      setSessionNameInput(initialSessionId);
    }
    return () => {
      leaveSession();
      resetOpenViduStore();
    };
  }, [initialSessionId]); // Depend on initialSessionId

  const handleSessionNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSessionNameInput(event.target.value);
  }, []);

  const getToken = useCallback(async (mySessionId: string): Promise<string> => {
    try {
      const session = await createSession({ customSessionId: mySessionId });
      const connection = await createConnection(session.sessionId, {
        role: 'PUBLISHER',
        data: JSON.stringify({ USERNAME: currentUserDisplayName }), // Use consistent display name
      });
      return connection.token;
    } catch (error) {
      console.error('Error getting token:', error);
      throw new Error(`Failed to get OpenVidu token: ${error.message || error}`);
    }
  }, [currentUserDisplayName]);

  // startPublishingMedia needs to be defined before joinSession if it's called internally
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

      // Update connection count for the current session
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

  const joinSession = useCallback(async (sessionIdToJoin?: string) => {
    const effectiveSessionId = sessionIdToJoin || sessionNameInput;

    if (!effectiveSessionId || !OV_REF.current) return;

    setOpenViduLoading(true);
    setOpenViduError(null);

    try {
      const token = await getToken(effectiveSessionId);
      const session = OV_REF.current.initSession();
      SESSION_REF.current = session;
      setOpenViduSessionId(effectiveSessionId);
      setOpenViduSession(session as ISession); // Correct type assertion

      session.on('connectionCreated', (event) => {
         console.log('connectionCreated:', event);
      });

      session.on('streamCreated', (event) => {
        const subscriber = session.subscribe(event.stream, undefined) as IOpenViduSubscriber;
        setOpenViduError(null);
        subscriber.on('streamPlaying', () => {
          const videoElement = document.getElementById(`video-stream-${subscriber.streamId}`);
          if (videoElement) {
            subscriber.addVideoElement(videoElement as HTMLVideoElement);
          }
        });
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

      // Listen for custom 'chat' signals
      session.on('signal:chat', (event) => { // Listen for 'chat' type signals specifically
        try {
          const signalData = JSON.parse(event.data || '{}');
          const connectionData = event.from?.data; // Connection data of the sender

          let senderName = 'Unknown';
          if (connectionData) {
            try {
              const clientData = JSON.parse(connectionData);
              senderName = clientData.USERNAME || 'Unknown';
            } catch (parseError) {
              // Fallback if connectionData is not JSON or unexpected format
              senderName = connectionData.replace('clientData_', '') || 'Unknown';
            }
          }

          if (signalData.message) {
            addMessage({ id: nanoid(), sender: senderName, content: signalData.message, timestamp: signalData.timestamp });
            console.log('Received chat message:', signalData.message);
          }

        } catch (parseError) {
          console.error('Error parsing chat signal data:', parseError, event.data);
        }
      });

      await session.connect(token, { clientData: JSON.stringify({ USERNAME: currentUserDisplayName }) }); // Use consistent display name
      
      // Automatically start publishing media if joining a session from URL (e.g., a room link)
      if (sessionIdToJoin) {
        await startPublishingMedia();
      }

    } catch (error: any) {
      console.error('Error connecting to session:', error.code, error.message);
      setOpenViduError(`Failed to connect to OpenVidu session: ${error.message || error}`);
      leaveSession();
    } finally {
      setOpenViduLoading(false);
    }
  }, [sessionNameInput, getToken, startPublishingMedia, currentUserDisplayName]); // Added startPublishingMedia and currentUserDisplayName to dependencies

  const leaveSession = useCallback(() => {
    if (SESSION_REF.current) {
      SESSION_REF.current.disconnect();
      SESSION_REF.current = null;
    }
    resetOpenViduStore();
    PUBLISHER_REF.current = null;
    setIsCameraActive(true);
    setIsMicActive(true);
    // Manually trigger a connection count update to reflect leaving the room, if currentSessionId is available
    if (ovState.currentSessionId) {
      getConnections(ovState.currentSessionId).then(c => updateRoomConnectionCount(ovState.currentSessionId!, c.length));
    }
  }, [ovState.currentSessionId]);

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
        type: 'chat', // Use a specific signal type for chat
        data: JSON.stringify(messagePayload),
      });
      // Optimistically add own message to conversation store
      addMessage({ id: nanoid(), sender: currentUserDisplayName, content: messageText, timestamp: messagePayload.timestamp });

      console.log('Sent chat message:', messageText);
    } catch (error) {
      console.error('Error sending chat message via OpenVidu signal:', error);
      setOpenViduError(`Failed to send chat message: ${error.message || error}`);
    }
  }, [ovState.session, ovState.currentSessionId, currentUserDisplayName]); // Added currentUserDisplayName to dependencies

  return {
    sessionNameInput,
    handleSessionNameChange,
    joinSession,
    leaveSession,
    startPublishingMedia, // Still export if needed for manual calls
    toggleCamera,
    toggleMic,
    sendChatMessage,
    isCameraActive,
    isMicActive,
    isLoading: ovState.loading,
    error: ovState.error,
  };
};
