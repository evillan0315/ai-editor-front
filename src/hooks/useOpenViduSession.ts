import React, { useState, useEffect, useCallback, useRef } from 'react';
import { OpenVidu, Session, Publisher, StreamManager } from 'openvidu-browser';
import { useStore } from '@nanostores/react';
import { nanoid } from 'nanoid';

import { createSession } from '@/components/swingers/api/sessions';
import { createConnection } from '@/components/swingers/api/connections';
import {
  openViduStore,
  setOpenViduSessionId,
  setOpenViduSession,
  addOpenViduSubscriber,
  removeOpenViduSubscriber,
  setOpenViduLoading,
  setOpenViduError,
  resetOpenViduStore,
  setOpenViduPublisher,
} from '@/components/swingers/stores/openViduStore';
import { authStore } from '@/stores/authStore';
import { IOpenViduPublisher, IOpenViduSubscriber } from '@/components/swingers/types';
import { IAuthUser } from '@/types/auth'; // Assuming IAuthUser type is defined here

interface UseOpenViduSessionResult {
  sessionNameInput: string;
  handleSessionNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  joinSession: () => Promise<void>;
  leaveSession: () => void;
  toggleCamera: () => void;
  toggleMic: () => void;
  isCameraActive: boolean;
  isMicActive: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useOpenViduSession = (): UseOpenViduSessionResult => {
  const ovState = useStore(openViduStore);
  const { user } = useStore(authStore); // Get user from authStore

  const [sessionNameInput, setSessionNameInput] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isMicActive, setIsMicActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const OV_REF = useRef<OpenVidu | null>(null);
  const SESSION_REF = useRef<Session | null>(null);
  const PUBLISHER_REF = useRef<IOpenViduPublisher | null>(null);

  useEffect(() => {
    // Initialize OpenVidu object when component mounts
    if (!OV_REF.current) {
      OV_REF.current = new OpenVidu();
    }

    // Auto-generate session ID if not already set or in an active session
    if (!sessionNameInput && !ovState.currentSessionId) {
      setSessionNameInput(`session-${nanoid(8)}`);
    }

    // Clean up on unmount
    return () => {
      leaveSession();
    };
  }, [sessionNameInput, ovState.currentSessionId]);

  // Function to create/fetch a session and generate a token from the backend
  const getToken = useCallback(async (mySessionId: string): Promise<string> => {
    try {
      const session = await createSession({ customSessionId: mySessionId });
      const connection = await createConnection(session.sessionId, {
        role: 'PUBLISHER',
        data: JSON.stringify({
          USERNAME: user?.username || 'Guest',
          USERID: user?.id || 'anonymous',
          PICTURE: user?.pictureFull || '',
          USERGROUPID: mySessionId,
          GENDER1: user?.gender1 || '',
          GENDER2: user?.gender2 || '',
        }),
      });
      return connection.token;
    } catch (err: any) {
      console.error('Error getting token:', err);
      throw new Error(`Failed to get OpenVidu token: ${err.message || err}`);
    }
  }, [user]); // Depend on user to ensure clientData is up-to-date

  const joinSession = useCallback(async () => {
    if (!sessionNameInput) {
      setError('Please enter a session name.');
      return;
    }
    if (!OV_REF.current) return;

    setIsLoading(true);
    setError(null);
    setOpenViduLoading(true); // Update global loading state
    setOpenViduError(null);   // Clear global error state

    try {
      const token = await getToken(sessionNameInput);
      const session = OV_REF.current.initSession();
      SESSION_REF.current = session;

      setOpenViduSessionId(sessionNameInput);
      setOpenViduSession(session as any); // Type cast due to openvidu-browser's Session class type

      // Event listeners
      session.on('connectionDestroyed', (event) => {
        console.log('connectionDestroyed', event.connection.data);
      });

      session.on('connectionCreated', (event) => {
        console.log('connectionCreated', event.connection.data);
      });

      session.on('streamCreated', (event) => {
        const subscriber = session.subscribe(event.stream, undefined) as IOpenViduSubscriber;
        setOpenViduError(null);

        // The video element is attached by OpenViduVideoRenderer component
        addOpenViduSubscriber(subscriber);
      });

      session.on('streamDestroyed', (event) => {
        removeOpenViduSubscriber(event.stream.streamId);
      });

      session.on('networkQualityChanged', (event) => {
        console.log('Network quality changed:', event);
      });

      // Signal listeners (adjusted for clarity and to remove undefined 'globalSession')
      session.on('signal:global', (event) => {
        console.log('Global signal received:', event);
      });
      session.on('signal:whisper', (event) => {
        console.log('Whisper signal received:', event);
      });
      session.on('signal:announcement', (event) => {
        console.log('Announcement signal received:', event);
      });

      // Connect to the session
      await session.connect(token, JSON.stringify({
        USERNAME: user?.username || 'Guest',
        USERID: user?.id || 'anonymous',
        PICTURE: user?.pictureFull || '',
        USERGROUPID: sessionNameInput,
        GENDER1: user?.gender1 || '',
        GENDER2: user?.gender2 || '',
      }));

      // Initialize and publish your own stream after connecting
      const publisher = await OV_REF.current.initPublisherAsync(undefined, {
        audioSource: undefined,
        videoSource: undefined,
        publishAudio: true,
        publishVideo: true,
        resolution: '640x480',
        frameRate: 30,
        insertMode: 'APPEND',
        mirror: true,
      }) as IOpenViduPublisher;

      PUBLISHER_REF.current = publisher;
      setOpenViduPublisher(publisher);

      await session.publish(publisher);

    } catch (err: any) {
      console.error('There was an error connecting to the session:', err.code, err.message);
      setError(`Failed to connect to OpenVidu session: ${err.message || err}`);
      setOpenViduError(`Failed to connect to OpenVidu session: ${err.message || err}`);
      leaveSession();
    } finally {
      setIsLoading(false);
      setOpenViduLoading(false);
    }
  }, [sessionNameInput, user, getToken]);

  const leaveSession = useCallback(() => {
    if (SESSION_REF.current) {
      SESSION_REF.current.disconnect();
      SESSION_REF.current = null;
    }
    resetOpenViduStore(); // Reset global store state
    PUBLISHER_REF.current = null;
    setIsCameraActive(true);
    setIsMicActive(true);
    setIsLoading(false);
    setError(null);
  }, []);

  const toggleCamera = useCallback(() => {
    if (PUBLISHER_REF.current) {
      PUBLISHER_REF.current.publishVideo(!isCameraActive);
      setIsCameraActive((prev) => !prev);
    }
  }, [isCameraActive]);

  const toggleMic = useCallback(() => {
    if (PUBLISHER_REF.current) {
      PUBLISHER_REF.current.publishAudio(!isMicActive);
      setIsMicActive((prev) => !prev);
    }
  }, [isMicActive]);

  const handleSessionNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSessionNameInput(event.target.value);
  }, []);

  return {
    sessionNameInput,
    handleSessionNameChange,
    joinSession,
    leaveSession,
    toggleCamera,
    toggleMic,
    isCameraActive,
    isMicActive,
    isLoading,
    error,
  };
};
