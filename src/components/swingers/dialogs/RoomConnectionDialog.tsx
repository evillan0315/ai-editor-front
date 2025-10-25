import React, { useCallback, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  Button,
  DialogContent,
  DialogContentText,
  TextField,
  CircularProgress,
  Typography,
  useTheme,
  Alert,
  IconButton,
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import MicIcon from '@mui/icons-material/Mic';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import CallIcon from '@mui/icons-material/Call';

import { useOpenViduSession } from '@/components/swingers/hooks/useOpenViduSession';
import { OpenViduVideoRenderer } from '@/components/swingers/openvidu/OpenViduVideoRenderer';
import { OpenViduControls } from '@/components/swingers/openvidu/OpenViduControls';
import { hideDialog } from '@/stores/dialogStore';

interface RoomConnectionDialogProps {
  roomId?: string; // Optional: If provided, connect to this specific room
  onSuccess?: () => void; // Optional callback on successful connection
}

const dialogContentSx = {
  p: 2,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  alignItems: 'center',
};

const videoPreviewContainerSx = {
  position: 'relative',
  width: '100%',
  maxWidth: '400px',
  paddingTop: '75%', // 4:3 aspect ratio
  backgroundColor: 'black',
  borderRadius: '8px',
  overflow: 'hidden',
  mt: 2,
  mb: 2,
  border: '2px solid',
  borderColor: 'divider',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
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

export const RoomConnectionDialog: React.FC<RoomConnectionDialogProps> = ({
  roomId,
  onSuccess,
}) => {
  const theme = useTheme();
  const { 
    sessionNameInput,
    handleSessionNameChange,
    joinSession,
    leaveSession,
    startPublishingMedia,
    toggleCamera,
    toggleMic,
    isCameraActive,
    isMicActive,
    isLoading,
    error,
  } = useOpenViduSession(roomId);

  useEffect(() => {
    // If a roomId is provided, attempt to join automatically, but only if not already connected
    // and not currently loading. The useOpenViduSession hook itself handles `initialSessionId` for auto-fill.
    // We'll rely on the 'Connect' button for explicit connection.
  }, [roomId]);

  const handleConnect = useCallback(async () => {
    if (!sessionNameInput) {
      // This error would be handled by useOpenViduSession, but adding a local check too.
      console.error('Session name is required to connect.');
      return;
    }
    try {
      await joinSession(sessionNameInput);
      // startPublishingMedia is called internally by joinSession if sessionIdToJoin is provided to it
      onSuccess && onSuccess();
      hideDialog(); // Close dialog on success
    } catch (e) {
      console.error('Failed to connect to room:', e);
      // Error feedback is handled by useOpenViduSession's error state
    }
  }, [sessionNameInput, joinSession, onSuccess]);

  const handleLeave = useCallback(async () => {
    await leaveSession();
    // Optionally hide dialog after leaving, or keep it open for re-connection
    // hideDialog();
  }, [leaveSession]);

  return (
    <DialogContent sx={dialogContentSx}>
      <Typography variant="h6" component="div" color="text.primary" className="font-bold">
        {roomId ? `Connect to Room: ${roomId}` : 'Configure & Connect to Room'}
      </Typography>
      <DialogContentText color="text.secondary">
        Configure your camera and microphone before joining the session.
      </DialogContentText>

      {error && (
        <Alert severity="error" className="w-full">
          {error}
        </Alert>
      )}

      {/* Local Video Preview */}
      <Box sx={videoPreviewContainerSx}>
        {isLoading && (
          <CircularProgress size={40} className="absolute z-10 text-white" />
        )}
       
      </Box>

      {/* Controls for Camera/Mic */}
      <Box className="flex gap-4 justify-center w-full">
        <Button
          variant="contained"
          color={isCameraActive ? 'primary' : 'secondary'}
          onClick={toggleCamera}
          startIcon={isCameraActive ? <VideocamIcon /> : <VideocamOffIcon />}
          disabled={isLoading}
        >
          {isCameraActive ? 'Camera ON' : 'Camera OFF'}
        </Button>
        <Button
          variant="contained"
          color={isMicActive ? 'primary' : 'secondary'}
          onClick={toggleMic}
          startIcon={isMicActive ? <MicIcon /> : <MicOffIcon />}
          disabled={isLoading}
        >
          {isMicActive ? 'Mic ON' : 'Mic OFF'}
        </Button>
      </Box>

      {/* Session Name Input */}
      {!roomId && (
        <TextField
          label="Session Name (Room ID)"
          variant="outlined"
          value={sessionNameInput}
          onChange={handleSessionNameChange}
          fullWidth
          disabled={isLoading}
          margin="normal"
        />
      )}

      {/* Action Buttons */}
      <Box className="flex gap-4 justify-end w-full mt-4">
        <Button
          variant="outlined"
          color="error"
          onClick={handleLeave}
          disabled={isLoading}
          startIcon={<CallEndIcon />}
        >
          Leave Session
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleConnect}
          disabled={isLoading || !sessionNameInput}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <CallIcon />}
        >
          {isLoading ? 'Connecting...' : 'Connect to Room'}
        </Button>
      </Box>
    </DialogContent>
  );
};
