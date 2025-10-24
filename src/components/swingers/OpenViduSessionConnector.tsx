import React, { useState, useEffect, useCallback, useRef } from 'react';
import { OpenVidu } from 'openvidu-browser';
import { useStore } from '@nanostores/react';
import {
  Box, Typography, TextField, Button, CircularProgress, Alert,
  Card, CardContent, Divider,
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import CallIcon from '@mui/icons-material/Call';

import { createSession } from '@/components/swingers/api/sessions';
import { createConnection } from '@/components/swingers/api/connections';
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
import { IOpenViduPublisher, IOpenViduSubscriber } from '@/components/swingers/types';

// Environment variables for OpenVidu server
const OPENVIDU_SERVER_URL = import.meta.env.VITE_SLS_VIDU_URL;
const OPENVIDU_SERVER_SECRET = import.meta.env.VITE_SLS_API_KEY; // This should ideally be handled backend-side!

// --- Styles --- //
const containerSx = {
  padding: '24px',
  '@media (max-width: 600px)': {
    padding: '16px',
  },
};

const titleSx = {
  marginBottom: '24px',
  fontWeight: 700,
  textAlign: 'center',
};

const formContainerSx = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  marginBottom: '24px',
  padding: '16px',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: '8px',
  backgroundColor: 'background.paper',
  boxShadow: 1,
};

const videoContainerSx = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '16px',
  marginTop: '24px',
  width: '100%',
};

const videoCardSx = {
  position: 'relative',
  width: '100%',
  paddingTop: '75%', // 4:3 aspect ratio (or adjust as needed)
  backgroundColor: 'black',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
  overflow: 'hidden',
  '& video': {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '8px',
  },
};

const videoLabelSx = {
  position: 'absolute',
  bottom: '8px',
  left: '8px',
  backgroundColor: 'rgba(0,0,0,0.6)',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '0.8rem',
};

const controlsContainerSx = {
  display: 'flex',
  justifyContent: 'center',
  gap: '16px',
  marginTop: '16px',
};

export const OpenViduSessionConnector: React.FC = () => {
  const ovState = useStore(openViduStore);
  const [sessionNameInput, setSessionNameInput] = useState<string>('');
  const [OV, setOV] = useState<OpenVidu | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isMicActive, setIsMicActive] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const OV_REF = useRef<OpenVidu | null>(null);
  const SESSION_REF = useRef<openvidu_browser.Session | null>(null);
  const PUBLISHER_REF = useRef<IOpenViduPublisher | null>(null);

  useEffect(() => {
    // Initialize OpenVidu object when component mounts
    if (!OV_REF.current) {
      OV_REF.current = new OpenVidu();
      setOV(OV_REF.current);
    }

    // Clean up on unmount
    return () => {
      leaveSession();
    };
  }, []);

  // Function to create/fetch a session and generate a token
  const getToken = useCallback(async (mySessionId: string): Promise<string> => {
    try {
      // 1. Create a session in OpenVidu Server (if it doesn't exist)
      const session = await createSession({ customSessionId: mySessionId });

      // 2. Create a connection (and token) for this session
      const connection = await createConnection(session.sessionId, {
        role: 'PUBLISHER',
        data: `user_data_${Math.floor(Math.random() * 100)}`,
      });

      return connection.token;
    } catch (error) {
      console.error('Error getting token:', error);
      throw new Error(`Failed to get OpenVidu token: ${error.message || error}`);
    }
  }, []);

  const joinSession = useCallback(async () => {
    if (!sessionNameInput) {
      setOpenViduError('Please enter a session name.');
      return;
    }
    if (!OV) return;

    setOpenViduLoading(true);
    setOpenViduError(null);

    try {
      // 1. Get a token from your backend
      const token = await getToken(sessionNameInput);

      // 2. Initialize a session object from OpenVidu
      const session = OV.initSession();
      SESSION_REF.current = session;
      setOpenViduSessionId(sessionNameInput);
      setOpenViduSession(session as any); // Type cast to any for now due to openvidu-browser's Session class type

      // 3. On every new Stream received...
      session.on('streamCreated', (event) => {
        // Subscribe to the Stream to receive it
        // HTML video will be inserted in element with 'subscriber' id
        const subscriber = session.subscribe(event.stream, undefined) as IOpenViduSubscriber;
        setOpenViduError(null);

        subscriber.on('streamPlaying', (e) => {
          // Attach the video to the appropriate element
          const videoElement = document.getElementById(`video-stream-${subscriber.streamId}`);
          if (videoElement) {
            subscriber.addVideoElement(videoElement as HTMLVideoElement);
          }
        });
        addOpenViduSubscriber(subscriber);
      });

      // 4. On every Stream destroyed...
      session.on('streamDestroyed', (event) => {
        removeOpenViduSubscriber(event.stream.streamId);
      });

      // 5. On every network quality changed event...
      session.on('networkQualityChanged', (event) => {
        console.log('Network quality changed:', event);
      });

      // 6. Connect to the session
      await session.connect(token, { clientData: 'React App User' });

      // 7. Get your own camera and microphone stream
      const publisher = await OV.initPublisherAsync(undefined, {
        audioSource: undefined, // The source of audio. If undefined default microphone
        videoSource: undefined, // The source of video. If undefined default webcam
        publishAudio: true, // Whether you want to publish your mic in the session
        publishVideo: true, // Whether you want to publish your webcam in the session
        resolution: '640x480', // The resolution of your video
        frameRate: 30, // The frame rate of your video
        insertMode: 'APPEND', // How the video is inserted in the target element 'video-container'
        mirror: true, // Whether to mirror your local video or not
      }) as IOpenViduPublisher;

      PUBLISHER_REF.current = publisher;
      setOpenViduPublisher(publisher);

      // 8. Publish your stream
      await session.publish(publisher);

      // Optionally, attach local video to a specific element if you're not using the default
      if (localVideoRef.current) {
        publisher.addVideoElement(localVideoRef.current);
      }
    } catch (error) {
      console.error('There was an error connecting to the session:', error.code, error.message);
      setOpenViduError(`Failed to connect to OpenVidu session: ${error.message || error}`);
      leaveSession();
    } finally {
      setOpenViduLoading(false);
    }
  }, [sessionNameInput, OV, getToken]);

  const leaveSession = useCallback(() => {
    if (SESSION_REF.current) {
      SESSION_REF.current.disconnect();
      SESSION_REF.current = null;
    }
    resetOpenViduStore();
    PUBLISHER_REF.current = null;
  }, []);

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

  const handleSessionNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSessionNameInput(event.target.value);
  }, []);

  const renderVideo = (streamManager: IOpenViduPublisher | IOpenViduSubscriber) => {
    const videoId = `video-stream-${streamManager.streamId}`;
    return (
      <Card key={streamManager.streamId} sx={videoCardSx}>
        <video
          id={videoId}
          autoPlay={true}
          ref={streamManager === ovState.publisher ? localVideoRef : null}
          muted={streamManager === ovState.publisher} // Mute local video to prevent echo
        />
        <Typography sx={videoLabelSx}>
          {streamManager.stream.connection.data.replace('clientData_', '') || 'Guest'}
          {streamManager === ovState.publisher ? ' (You)' : ''}
        </Typography>
      </Card>
    );
  };

  return (
    <Box sx={containerSx} className="w-full flex flex-col items-center py-4 h-full">
      <Typography variant="h4" component="h1" sx={titleSx} className="text-3xl md:text-4xl text-purple-600 dark:text-purple-400">
        OpenVidu Session Connector
      </Typography>

      <Box className="max-w-3xl w-full">
        <Box sx={formContainerSx}>
          <TextField
            label="Session Name"
            variant="outlined"
            value={sessionNameInput}
            onChange={handleSessionNameChange}
            fullWidth
            disabled={ovState.loading || !!ovState.currentSessionId}
          />
          <Box className="flex gap-4 justify-end">
            {!ovState.currentSessionId ? (
              <Button
                variant="contained"
                color="primary"
                onClick={joinSession}
                disabled={ovState.loading || !sessionNameInput}
                startIcon={ovState.loading ? <CircularProgress size={20} color="inherit" /> : <CallIcon />}
              >
                {ovState.loading ? 'Connecting...' : 'Join Session'}
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="error"
                onClick={leaveSession}
                disabled={ovState.loading}
                startIcon={<CallEndIcon />}
              >
                Leave Session
              </Button>
            )}
          </Box>
        </Box>

        {ovState.error && (
          <Alert severity="error" className="mb-4 max-w-3xl w-full">
            {ovState.error}
          </Alert>
        )}

        {ovState.currentSessionId && (
          <Card className="mb-4 max-w-3xl w-full">
            <CardContent>
              <Typography variant="h6" className="mb-2 font-semibold">Active Session: {ovState.currentSessionId}</Typography>
              <Divider className="mb-2" />
              <Box sx={controlsContainerSx}>
                <Button
                  variant="contained"
                  color={isCameraActive ? 'primary' : 'secondary'}
                  onClick={toggleCamera}
                  startIcon={isCameraActive ? <VideocamIcon /> : <VideocamOffIcon />}
                >
                  {isCameraActive ? 'Camera ON' : 'Camera OFF'}
                </Button>
                <Button
                  variant="contained"
                  color={isMicActive ? 'primary' : 'secondary'}
                  onClick={toggleMic}
                  startIcon={isMicActive ? <MicIcon /> : <MicOffIcon />}
                >
                  {isMicActive ? 'Mic ON' : 'Mic OFF'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        <Box sx={videoContainerSx} className="max-w-7xl">
          {ovState.publisher && renderVideo(ovState.publisher)}
          {ovState.subscribers.map(renderVideo)}
        </Box>

        {!ovState.currentSessionId && !ovState.loading && !ovState.error && (
          <Alert severity="info" className="max-w-3xl w-full mt-4">
            Enter a session name to start or join an OpenVidu video call.
          </Alert>
        )}
      </Box>
    </Box>
  );
};
