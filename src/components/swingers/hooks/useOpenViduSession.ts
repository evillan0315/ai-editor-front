import React, { useState, useEffect, useCallback, useRef } from 'react';
import { OpenVidu } from 'openvidu-browser';
import { useStore } from '@nanostores/react';
import { nanoid } from 'nanoid';

import { createSession, deleteSession } from '@/components/swingers/api/sessions';
import { getConnections, createConnection } from '@/components/swingers/api/connections';
import { IOpenViduPublisher, IOpenViduSubscriber } from '@/components/swingers/types';
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
import { IConversationMessage } from '@/types/conversation';



/**
 * A custom hook to manage OpenVidu sessions within a React component.
 * Handles session connection, disconnection, publishing, subscribing, and media controls.
 * Includes functionality for sending and receiving chat messages via OpenVidu signals.
 * @param initialSessionId Optional: If provided, the session name input will be pre-filled and the session will attempt to auto-join.
 */
export const useOpenViduSession = (initialSessionId?: string) => {
  const ovState = useStore(openViduStore);
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
        data: JSON.stringify({ USERNAME: ovState.currentSessionId || 'Codejector User' }), // Example client data
      });
      return connection.token;
    } catch (error) {
      console.error('Error getting token:', error);
      throw new Error(`Failed to get OpenVidu token: ${error.message || error}`);
    }
  }, [ovState.currentSessionId]);

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
      setOpenViduSession(session as any);
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

      // New: Listen for custom 'chat' signals
      session.on('signal:global', (event) => {
        try {
          const signalData = JSON.parse(event.data || '{}');
          const connectionData = event.from?.data; // Connection data of the sender

          let senderName = 'Unknown';
          if (connectionData) {
            try {
              const clientDataMatch = connectionData.match(/"USERNAME":"([^"]+)"/);
              if (clientDataMatch && clientDataMatch[1]) {
                senderName = clientDataMatch[1];
              } else {
                const clientData = JSON.parse(connectionData);
                senderName = clientData.USERNAME || 'Unknown';
              }
            } catch (parseError) {
              // Fallback if connectionData is not JSON or unexpected format
              senderName = connectionData.replace('clientData_', '') || 'Unknown';
            }
          }


          console.log('Received chat message:', message);
        } catch (parseError) {
          console.error('Error parsing chat signal data:', parseError, event.data);
        }
      });

      await session.connect(token, { clientData: JSON.stringify({ USERNAME: 'Codejector User' }) });

    } catch (error: any) {
      console.error('Error connecting to session:', error.code, error.message);
      setOpenViduError(`Failed to connect to OpenVidu session: ${error.message || error}`);
      leaveSession();
    } finally {
      setOpenViduLoading(false);
    }
  }, [sessionNameInput, getToken]);

  const startPublishingMedia = useCallback(async (currentSessionId: string) => {
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

      getConnections(currentSessionId).then(c => updateRoomConnectionCount(currentSessionId, c.length));

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
  }, [ovState.session, isMicActive, isCameraActive]);

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
      const senderName = ovState.currentSessionId || 'You'; // Placeholder, ideally get from authStore
      const messagePayload = {
        sender: senderName,
        message: messageText,
        timestamp: Date.now(),
      };

      await ovState.session.signal({
        type: 'chat',
        data: JSON.stringify(messagePayload),
      });
      // Optimistically add own message to conversation store
      addMessage({ id: nanoid(), sender: senderName, content: messageText, timestamp: messagePayload.timestamp });

      console.log('Sent chat message:', messageText);
    } catch (error) {
      console.error('Error sending chat message via OpenVidu signal:', error);
      setOpenViduError(`Failed to send chat message: ${error.message || error}`);
    }
  }, [ovState.session, ovState.currentSessionId]);

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
