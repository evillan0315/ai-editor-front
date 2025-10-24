import React, { useState, useEffect, useCallback, useRef } from 'react';
import { OpenVidu } from 'openvidu-browser';
import { useStore } from '@nanostores/react';
import {
  Box, Typography, Button, CircularProgress, Alert, Card, CardContent, Divider,
  Switch, FormControlLabel, Grid, IconButton, Tooltip
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import CallIcon from '@mui/icons-material/Call';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import { createSession } from '@/components/swingers/api/sessions';
import { createConnection } from '@/components/swingers/api/connections';
import { getRoom, getRooms } from '@/components/swingers/api/rooms';
import { getConnections } from '@/components/swingers/api/connections';
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
import { IOpenViduPublisher, IOpenViduSubscriber, IRoom } from '@/components/swingers/types';
import { hideDialog } from '@/stores/dialogStore';
import { fetchRooms, updateRoomConnectionCount } from '../stores/roomStore';

interface RoomSessionDialogContentProps {
  roomId: string;
  autoJoin?: boolean;
}

// Environment variables for OpenVidu server (should ideally be proxied via backend)
const OPENVIDU_SERVER_URL = import.meta.env.VITE_SLS_VIDU_URL;

// --- Styles --- //
const containerSx = {
  padding: '16px',
  maxHeight: '80vh',
  overflowY: 'auto',
};

const sectionHeaderSx = {
  marginTop: '24px',
  marginBottom: '16px',
  fontWeight: 600,
  color: 'primary.main',
};

const detailItemSx = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px',
  padding: '8px 0',
  borderBottom: '1px dashed',
  borderColor: 'divider',
  '&:last-child': {
    borderBottom: 'none',
    marginBottom: 0,
  },
};

const videoContainerSx = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '16px',
  marginTop: '24px',
  width: '100%',
};

const videoCardSx = {
  position: 'relative',
  width: '100%',
  paddingTop: '75%', // 4:3 aspect ratio
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

export const RoomSessionDialogContent: React.FC<RoomSessionDialogContentProps> = ({ roomId, autoJoin = false }) => {
  const ovState = useStore(openViduStore);
  const [roomDetails, setRoomDetails] = useState<IRoom | null>(null);
  const [currentConnectionCount, setCurrentConnectionCount] = useState<number | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(true); // Tracks intended camera state, not actual publishing
  const [isMicActive, setIsMicActive] = useState(true);     // Tracks intended mic state
  const [isChatEnabled, setIsChatEnabled] = useState(false);
  const [fetchRoomError, setFetchRoomError] = useState<string | null>(null);

  const OV_REF = useRef<OpenVidu | null>(null);
  const SESSION_REF = useRef<openvidu_browser.Session | null>(null);
  const PUBLISHER_REF = useRef<IOpenViduPublisher | null>(null);

  // Initialize OpenVidu object once
  useEffect(() => {
    if (!OV_REF.current) {
      OV_REF.current = new OpenVidu();
    }
    return () => {
      // This cleanup ensures that if the dialog is closed, the session is properly disconnected
      leaveSession();
      resetOpenViduStore();
    };
  }, []);

  // Fetch room details and initial connection count
  useEffect(() => {
    const loadRoomDetails = async () => {
      try {
        const room = await getRoom(roomId);
        setRoomDetails(room);
        const connections = await getConnections(roomId);
        setCurrentConnectionCount(connections.length);
      } catch (error) {
        console.error('Failed to fetch room details or connections:', error);
        setFetchRoomError('Failed to load room details or connection count.');
      }
    };
    loadRoomDetails();
  }, [roomId]);

  // Auto-join if autoJoin is true and not already in a session
  useEffect(() => {
    if (autoJoin && roomId && !ovState.currentSessionId && !ovState.loading) {
      joinSession();
    }
  }, [autoJoin, roomId, ovState.currentSessionId, ovState.loading]);

  const getToken = useCallback(async (mySessionId: string): Promise<string> => {
    try {
      const session = await createSession({ customSessionId: mySessionId });
      const connection = await createConnection(session.sessionId, {
        role: 'PUBLISHER', // Requesting PUBLISHER role for future publishing
        data: `user_data_${Math.floor(Math.random() * 100)}`, // Example client data
      });
      return connection.token;
    } catch (error) {
      console.error('Error getting token:', error);
      throw new Error(`Failed to get OpenVidu token: ${error.message || error}`);
    }
  }, []);

  const joinSession = useCallback(async () => {
    if (!roomId || !OV_REF.current) return;

    setOpenViduLoading(true);
    setOpenViduError(null);
    setFetchRoomError(null);

    try {
      const token = await getToken(roomId);
      const session = OV_REF.current.initSession();
      SESSION_REF.current = session;
      setOpenViduSessionId(roomId);
      setOpenViduSession(session as any); // Cast to any for openvidu-browser's Session class type

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
        // Update connection count in RoomStore via socket service or by refetching
        getConnections(roomId).then(c => updateRoomConnectionCount(roomId, c.length));
      });

      session.on('streamDestroyed', (event) => {
        removeOpenViduSubscriber(event.stream.streamId);
        // Update connection count in RoomStore via socket service or by refetching
        getConnections(roomId).then(c => updateRoomConnectionCount(roomId, c.length));
      });

      session.on('networkQualityChanged', (event) => {
        console.log('Network quality changed:', event);
      });

      await session.connect(token, { clientData: 'Codejector User' });

      // No longer publishing stream automatically on join

      // Update connection count after successfully joining
      getConnections(roomId).then(c => setCurrentConnectionCount(c.length));
      fetchRooms(); // To update room list with new connection count status

    } catch (error) {
      console.error('Error connecting to session:', error.code, error.message);
      setOpenViduError(`Failed to connect to OpenVidu session: ${error.message || error}`);
      leaveSession();
    } finally {
      setOpenViduLoading(false);
    }
  }, [roomId, getToken]);

  const startPublishingMedia = useCallback(async () => {
    if (!ovState.session || !OV_REF.current) return;

    setOpenViduLoading(true);
    setOpenViduError(null);

    try {
      // Get your own camera and microphone stream and publish
      const publisher = await OV_REF.current.initPublisherAsync(undefined, {
        audioSource: undefined, // Default microphone
        videoSource: undefined, // Default webcam
        publishAudio: isMicActive, // Use current mic state
        publishVideo: isCameraActive, // Use current camera state
        resolution: '640x480',
        frameRate: 30,
        insertMode: 'APPEND',
        mirror: true,
      }) as IOpenViduPublisher;

      PUBLISHER_REF.current = publisher;
      setOpenViduPublisher(publisher);
      await ovState.session.publish(publisher);

      getConnections(roomId).then(c => setCurrentConnectionCount(c.length));
      fetchRooms();

    } catch (error) {
      console.error('Error publishing media:', error.code, error.message);
      setOpenViduError(`Failed to publish media: ${error.message || error}`);
      // If publishing fails, disconnect publisher, but keep session open for chat
      if (PUBLISHER_REF.current) {
        PUBLISHER_REF.current.destroy();
        PUBLISHER_REF.current = null;
        setOpenViduPublisher(null);
      }
    } finally {
      setOpenViduLoading(false);
    }
  }, [ovState.session, isMicActive, isCameraActive, roomId]);

  const leaveSession = useCallback(() => {
    if (SESSION_REF.current) {
      SESSION_REF.current.disconnect();
      SESSION_REF.current = null;
    }
    resetOpenViduStore();
    PUBLISHER_REF.current = null;
    // Update connection count after leaving
    getConnections(roomId).then(c => setCurrentConnectionCount(c.length));
    fetchRooms(); // To update room list
    setIsCameraActive(true); // Reset to default state
    setIsMicActive(true);     // Reset to default state
  }, [roomId]);

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

  const renderVideo = (streamManager: IOpenViduPublisher | IOpenViduSubscriber) => {
    const videoId = `video-stream-${streamManager.streamId}`;
    return (
      <Card key={streamManager.streamId} sx={videoCardSx}>
        <video
          id={videoId}
          autoPlay={true}
          muted={streamManager === ovState.publisher} // Mute local video
        />
        <Typography sx={videoLabelSx}>
          {streamManager.stream.connection.data.replace('clientData_', '') || 'Guest'}
          {streamManager === ovState.publisher ? ' (You)' : ''}
        </Typography>
      </Card>
    );
  };

  return (
    <Box sx={containerSx} className="flex flex-col">
      <Typography variant="h5" component="h2" sx={sectionHeaderSx} className="text-center">
        Room Information
      </Typography>

      {fetchRoomError && (
        <Alert severity="error" className="mb-4">
          {fetchRoomError}
        </Alert>
      )}

      {roomDetails ? (
        <Card variant="outlined" className="mb-4">
          <CardContent>
            <Box sx={detailItemSx}>
              <Typography variant="body1" component="span" fontWeight="bold">Room Name:</Typography>
              <Typography variant="body1" component="span">{roomDetails.name}</Typography>
            </Box>
            <Box sx={detailItemSx}>
              <Typography variant="body1" component="span" fontWeight="bold">Room ID:</Typography>
              <Typography variant="body1" component="span">{roomDetails.roomId || 'N/A'}</Typography>
            </Box>
            <Box sx={detailItemSx}>
              <Typography variant="body1" component="span" fontWeight="bold">Description:</Typography>
              <Typography variant="body1" component="span">{roomDetails.description || 'N/A'}</Typography>
            </Box>
            <Box sx={detailItemSx}>
              <Typography variant="body1" component="span" fontWeight="bold">Type:</Typography>
              <Typography variant="body1" component="span">{roomDetails.type}</Typography>
            </Box>
            <Box sx={detailItemSx}>
              <Typography variant="body1" component="span" fontWeight="bold">Status:</Typography>
              <Typography variant="body1" component="span" color={roomDetails.active ? 'success.main' : 'error.main'}>
                {roomDetails.active ? 'Active' : 'Inactive'}
              </Typography>
            </Box>
            <Box sx={detailItemSx}>
              <Typography variant="body1" component="span" fontWeight="bold">Connections:</Typography>
              {ovState.loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Typography variant="body1" component="span">{currentConnectionCount !== null ? currentConnectionCount : 'N/A'}</Typography>
              )}
            </Box>
            <Box sx={detailItemSx}>
              <Typography variant="body1" component="span" fontWeight="bold">Live Stream:</Typography>
              <Typography variant="body1" component="span" color={roomDetails.liveStream ? 'error.main' : 'text.secondary'}>
                {roomDetails.liveStream ? 'Yes' : 'No'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Box className="flex justify-center items-center h-20"><CircularProgress /></Box>
      )}

      <Typography variant="h5" component="h2" sx={sectionHeaderSx} className="text-center">
        Session Controls
      </Typography>

      {ovState.error && (
        <Alert severity="error" className="mb-4">
          {ovState.error}
        </Alert>
      )}

      <Grid container spacing={2} justifyContent="center" alignItems="center" className="mb-4">
        <Grid item>
          {!ovState.currentSessionId ? (
            <Button
              variant="contained"
              color="primary"
              onClick={joinSession}
              disabled={ovState.loading || !roomDetails}
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
        </Grid>
        {ovState.currentSessionId && !ovState.publisher && (
          <Grid item>
            <Button
              variant="contained"
              color="secondary"
              onClick={startPublishingMedia}
              disabled={ovState.loading}
              startIcon={ovState.loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
            >
              {ovState.loading ? 'Starting Stream...' : 'Publish Video/Audio'}
            </Button>
          </Grid>
        )}
      </Grid>

      {ovState.currentSessionId && ovState.publisher && (
        <Card variant="outlined" className="mb-4">
          <CardContent>
            <Typography variant="h6" className="mb-2 font-semibold text-center">Media Settings</Typography>
            <Divider className="mb-2" />
            <Grid container spacing={2} justifyContent="center">
              <Grid item>
                <Tooltip title={isCameraActive ? 'Turn Camera OFF' : 'Turn Camera ON'}>
                  <IconButton
                    color={isCameraActive ? 'primary' : 'default'}
                    onClick={toggleCamera}
                    disabled={!ovState.publisher}
                    size="large"
                  >
                    {isCameraActive ? <VideocamIcon /> : <VideocamOffIcon />}
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid item>
                <Tooltip title={isMicActive ? 'Turn Microphone OFF' : 'Turn Microphone ON'}>
                  <IconButton
                    color={isMicActive ? 'primary' : 'default'}
                    onClick={toggleMic}
                    disabled={!ovState.publisher}
                    size="large"
                  >
                    {isMicActive ? <MicIcon /> : <MicOffIcon />}
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
            <FormControlLabel
              control={
                <Switch
                  checked={isChatEnabled}
                  onChange={() => setIsChatEnabled(!isChatEnabled)}
                  name="enableChat"
                  color="primary"
                />
              }
              label={
                <Box display="flex" alignItems="center">
                  {isChatEnabled ? <ChatBubbleIcon sx={{ mr: 1 }} /> : <ChatBubbleOutlineIcon sx={{ mr: 1 }} />}
                  <Typography>Enable Chat</Typography>
                </Box>
              }
              className="mt-4"
              sx={{ width: '100%', justifyContent: 'center' }}
            />
          </CardContent>
        </Card>
      )}

      {ovState.currentSessionId && (
        <Box>
          <Typography variant="h5" component="h2" sx={sectionHeaderSx} className="text-center">
            Video Feeds
          </Typography>
          <Box sx={videoContainerSx} className="max-w-full">
            {ovState.publisher && renderVideo(ovState.publisher)}
            {ovState.subscribers.map(renderVideo)}
            {!ovState.publisher && ovState.subscribers.length === 0 && !ovState.loading && (
              <Alert severity="info" className="col-span-full">No active video feeds. Join the session to start streaming.</Alert>
            )}
          </Box>
        </Box>
      )}

      {!ovState.currentSessionId && !ovState.loading && !fetchRoomError && (
        <Alert severity="info" className="mt-4 text-center">
          Click "Join Session" to connect to {roomDetails?.name || 'this room'}.
        </Alert>
      )}
    </Box>
  );
};
