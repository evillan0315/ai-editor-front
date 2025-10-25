import React, { useEffect, useCallback, useRef } from 'react';
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
import { fetchSessionConnections, clearConnections, currentDefaultConnection } from '@/components/swingers/stores/connectionStore';
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
    // Always destroy the publisher if it exists, as part of a complete cleanup
    if (currentPublisher && typeof currentPublisher.destroy === 'function') {
        currentPublisher.destroy();
        setOpenViduPublisher(null); // Ensure publisher is explicitly cleared from store
    }
    if (currentSessionId) {
      // Only fetch connections if there was a session ID, otherwise it's moot
      await fetchSessionConnections(currentSessionId); // Fetching after disconnect should yield 0 connections
    }
    resetOpenViduStore(); // This is the intentional full reset
    clearConnections(); // Clear connections from connectionStore
    isMediaInitInProgress.current = false; // Reset flag on leaving session
  }, [clearConnections, fetchSessionConnections, resetOpenViduStore]);

  // NEW: Function to initialize publisher for local preview without connecting to session
  const initLocalMediaPreview = useCallback(async () => {
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
        publishAudio: isMic,
        publishVideo: isCam,
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
  }, []); // Dependencies removed: ovState.openViduInstance, ovState.isMicActive, ovState.isCameraActive because we read dynamically

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
      } else if (currentOvStateOnCleanup.publisher) {
          // If only a preview publisher exists (no active session), destroy it.
          // `destroyLocalMediaPreview` handles just destroying the publisher without a full store reset.
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
    // - `openViduStore.get().sessionNameInput` is read directly in the effect body now.
    // - We intentionally EXCLUDE `ovState.session` and `ovState.publisher` from dependencies here.
    //   Including them would cause the cleanup to re-run when their values change (e.g., to null after `leaveSession()`),
    //   leading to the infinite update loop when combined with `setOpenViduInstance` in the effect body.
  }, [initialSessionId, ovState.openViduInstance, leaveSession, destroyLocalMediaPreview]);

  // Separate useEffect to manage local media preview state changes (camera/mic toggles)
  // This effect ensures `initLocalMediaPreview` runs when camera/mic state changes or OpenVidu instance becomes available,
  // but ONLY when no actual session is active.
  useEffect(() => {
    // Only run if OpenVidu is initialized, not in an active session, and not already initializing media.
    if (ovState.openViduInstance && !ovState.session && !isMediaInitInProgress.current) {
        initLocalMediaPreview();
    }
    // Cleanup for this specific media preview effect:
    // If a session becomes active, this effect is no longer responsible for the publisher.
    // If the component unmounts without a session, `destroyLocalMediaPreview` is handled by the main unmount cleanup.
    // If camera/mic toggles, this cleanup runs, then the effect re-runs to re-init.
    return () => {
        const currentOvStateOnMediaCleanup = openViduStore.get();
        // If there's a publisher and no session is active, ensure it's destroyed.
        // This handles cases where `isCameraActive`/`isMicActive` dependencies change and a new preview is needed.
        if (currentOvStateOnMediaCleanup.publisher && !currentOvStateOnMediaCleanup.session) {
             destroyLocalMediaPreview();
        }
    };
  }, [ovState.openViduInstance, ovState.session, ovState.isCameraActive, ovState.isMicActive, initLocalMediaPreview, destroyLocalMediaPreview]);


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

  // Crucial: removed ovState.publisher from dependencies.


  const joinSession = useCallback(async (sessionIdToJoin?: string) => {
    setOpenViduError(null);

    const ovSession = openViduStore.get().session; // Get latest
    const ovPublisher = openViduStore.get().publisher; // Get latest
    const ovInstance = openViduStore.get().openViduInstance; // Get latest
    const ovSessionNameInput = openViduStore.get().sessionNameInput; // Get latest

    // If already connected to a session, disconnect first.
    if (ovSession) {
      console.warn('Attempting to join session while another might be active. Cleaning up first.');
      await leaveSession(); // This will also destroy any existing publisher and reset the store.
    }

    const effectiveSessionId = sessionIdToJoin || ovSessionNameInput;

    if (!effectiveSessionId || !ovInstance) {
      setOpenViduError('Session ID or OpenVidu object is missing.');
      setOpenViduLoading(false); // Ensure loading is off if we error out early
      return;
    }

    if (!ovPublisher) { // Ensure publisher is ready before joining
      setOpenViduError('Local media publisher not initialized. Please ensure camera/mic are configured.');
      setOpenViduLoading(false); // Make sure loading state is off if we error out here
      return;
    }

    setOpenViduLoading(true);

    try {
      console.log(sessionIdToJoin, 'sessionIdToJoin');
      const token = await getToken(effectiveSessionId);
      const session = ovInstance.initSession();
      setOpenViduSessionId(effectiveSessionId);
      setOpenViduSession(session as ISession);

      session.on('connectionCreated', async (event) => {
         console.log('connectionCreated:', event);
         // Filter out our own connectionCreated event, as we handle local publisher separately
         // Access latest publisher state here for safety
         const latestPublisher = openViduStore.get().publisher;
         if (latestPublisher && event.connection.connectionId === latestPublisher.stream.connection.connectionId) {
             console.log('Skipping connectionCreated for own publisher.');
             return;
         }
         await fetchSessionConnections(effectiveSessionId);
      });

      session.on('streamCreated', async (event) => {
        // Prevent subscribing to our own stream if it's already managed by our local publisher
        const latestPublisher = openViduStore.get().publisher;
        if (latestPublisher && event.stream.connection.connectionId === latestPublisher.stream.connection.connectionId) {
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
      await session.publish(ovPublisher);


      // Fetch connections and update room store immediately after connecting
      await fetchSessionConnections(effectiveSessionId);

    } catch (error: any) {
      console.error('Error connecting to session:', error.code, error.message);
      setOpenViduError(`Failed to connect to OpenVidu session: ${error.message || error}`);

      // Ensure full cleanup on connection error
      const latestOvSession = openViduStore.get().session;
      const latestOvPublisher = openViduStore.get().publisher;

      if (latestOvSession) {
         latestOvSession.disconnect();
      }
      if (latestOvPublisher && typeof latestOvPublisher.destroy === 'function') {
          latestOvPublisher.destroy();
      }
      resetOpenViduStore(); // Reset store on connection failure
      clearConnections(); // Clear connections from connectionStore on error
      isMediaInitInProgress.current = false; // Reset flag on error
    } finally {
      setOpenViduLoading(false);
    }
  }, [getToken, currentUserDisplayName, leaveSession, fetchSessionConnections, clearConnections]); // Dependencies removed: ovState.session, ovState.publisher, ovState.sessionNameInput, ovState.openViduInstance

  const toggleCamera = useCallback(() => {
    const currentPublisher = openViduStore.get().publisher;
    const currentIsCameraActive = openViduStore.get().isCameraActive;
    const newCameraState = !currentIsCameraActive;
    setIsCameraActive(newCameraState); // Update store immediately
    // initLocalMediaPreview will be triggered by `isCameraActive` dependency change in the separate useEffect
    if (currentPublisher && typeof currentPublisher.publishVideo === 'function') {
      currentPublisher.publishVideo(newCameraState);
    }
  }, []); // Dependencies removed: ovState.publisher, ovState.isCameraActive

  const toggleMic = useCallback(() => {
    const currentPublisher = openViduStore.get().publisher;
    const currentIsMicActive = openViduStore.get().isMicActive;
    const newMicState = !currentIsMicActive;
    setIsMicActive(newMicState); // Update store immediately
    // initLocalMediaPreview will be triggered by `isMicActive` dependency change in the separate useEffect
    if (currentPublisher && typeof currentPublisher.publishAudio === 'function') {
      currentPublisher.publishAudio(newMicState);
    }
  }, []); // Dependencies removed: ovState.publisher, ovState.isMicActive


  const sendChatMessage = useCallback(async (messageText: string) => {
    const ovSession = openViduStore.get().session;
    const ovCurrentSessionId = openViduStore.get().currentSessionId;

    if (!ovSession || !ovCurrentSessionId) {
      console.warn('Cannot send chat message: No active OpenVidu session.');
      return;
    }
    try {
      const messagePayload = {
        sender: currentUserDisplayName.USERNAME,
        message: messageText,
        timestamp: Date.now(),
      };

      await ovSession.signal({
        type: 'chat',
        data: JSON.stringify(messagePayload),
      });
      console.log('Sent chat message:', messageText);
    } catch (error) {
      console.error('Error sending chat message via OpenVidu signal:', error);
      setOpenViduError(`Failed to send chat message: ${error.message || error}`);
    }
  }, [currentUserDisplayName]); // Dependencies removed: ovState.session, ovState.currentSessionId

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
