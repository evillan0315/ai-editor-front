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
import { updateRoomConnectionCount } from '@/components/swingers/stores/roomStore';
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
  const currentUserDisplayName = JSON.parse($currentDefaultConnection.clientData);
  
  const leaveSession = useCallback(async () => {
    if (ovState.session) {
      console.log(`Disconnecting from OpenVidu session ${ovState.session.sessionId}...`);
      ovState.session.disconnect();
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    // Update connection count to reflect leaving the room BEFORE resetting the store fully.
    // fetchSessionConnections will update roomStore.connectionCounts to 0 after disconnect.
    if (ovState.currentSessionId) {
      await fetchSessionConnections(ovState.currentSessionId); // Fetching after disconnect should yield 0 connections
    }
    resetOpenViduStore();
    clearConnections(); // Clear connections from connectionStore
  }, [ovState.session, ovState.currentSessionId, clearConnections]);

  // Initialize OpenVidu object and session name once per hook instance
  useEffect(() => {
    if (!ovState.openViduInstance) {
      setOpenViduInstance(new OpenVidu());
    }
    if (initialSessionId && ovState.sessionNameInput === '') {
      setOpenViduSessionNameInput(initialSessionId);
    }

    return () => {
      (async () => {
        if (ovState.session) {
          await leaveSession();
        }
        resetOpenViduStore();
        clearConnections(); // Ensure store is fully reset on unmount
      })();
    };
  }, [initialSessionId, ovState.sessionNameInput, ovState.openViduInstance, ovState.session, leaveSession, clearConnections]);

  const handleSessionNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setOpenViduSessionNameInput(event.target.value);
  }, []);

  const getToken = useCallback(async (mySessionId: string): Promise<string> => {
    try {
      const session = await createSession({ customSessionId: mySessionId });
      const connection = await createConnection(session.sessionId, {
        role: 'PUBLISHER',
        data: JSON.stringify(currentUserDisplayName),
      });
      return connection.token;
    } catch (error: any) {
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
        // Update connection details and count after publishing
        await fetchSessionConnections(ovState.currentSessionId);
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

  const joinSession = useCallback(async (sessionIdToJoin?: string) => {
    setOpenViduError(null);

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

    try {
      const token = await getToken(effectiveSessionId);
      const session = ovState.openViduInstance.initSession();
      setOpenViduSessionId(effectiveSessionId);
      setOpenViduSession(session as ISession);

      session.on('connectionCreated', async (event) => {
         console.log('connectionCreated:', event);
         await fetchSessionConnections(effectiveSessionId); // Refresh connection list on new connection
      });

      session.on('streamCreated', async (event) => {
        const subscriber = session.subscribe(event.stream, undefined);
        setOpenViduError(null);
        subscriber.on('streamPlaying', () => {});
        addOpenViduSubscriber(subscriber);
        await fetchSessionConnections(effectiveSessionId); // Refresh connection list on new stream
      });

      session.on('streamDestroyed', async (event) => {
        removeOpenViduSubscriber(event.stream.streamId);
        await fetchSessionConnections(effectiveSessionId); // Refresh connection list on stream destroyed
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

      // Fetch connections and update room store immediately after connecting
      await fetchSessionConnections(effectiveSessionId);
      
      if (sessionIdToJoin) { 
        await startPublishingMedia();
      }

    } catch (error: any) {
      console.error('Error connecting to session:', error.code, error.message);
      setOpenViduError(`Failed to connect to OpenVidu session: ${error.message || error}`);
      
      if (ovState.session) {
         ovState.session.disconnect();
      }
      resetOpenViduStore();
      clearConnections(); // Clear connections from connectionStore on error
    } finally {
      setOpenViduLoading(false);
    }
  }, [ovState.sessionNameInput, ovState.openViduInstance, getToken, startPublishingMedia, currentUserDisplayName, ovState.session, leaveSession, fetchSessionConnections, clearConnections]);

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
