import React, { useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  CircularProgress,
  Typography,
  Alert,
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import MicIcon from '@mui/icons-material/Mic';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import CallIcon from '@mui/icons-material/Call';

import { useOpenViduSession } from '@/components/swingers/hooks/useOpenViduSession';
import { hideDialog } from '@/stores/dialogStore';

interface RoomConnectionDialogProps {
  roomId?: string; // Optional: If provided, connect to this specific room
  onSuccess?: () => void; // Optional callback on successful connection
}

// No longer directly renders a Dialog, just its content.
// Padding for this content is now handled by this component itself, as GlobalDialog's DialogContent has p:0.

export const RoomConnectionDialog: React.FC<RoomConnectionDialogProps> = ({
  roomId,
  onSuccess,
}) => {
  const {
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
  } = useOpenViduSession(roomId); // Pass roomId to hook for initial session name

  // No need for a useEffect here to auto-join based on roomId if the 'Connect' button is the explicit trigger.
  // The useOpenViduSession hook already handles pre-filling sessionNameInput if roomId is provided.

  const handleConnect = useCallback(async () => {
    if (!sessionNameInput) {
      console.error('Session name is required to connect.');
      return;
    }
    try {
      await joinSession(sessionNameInput);
      onSuccess && onSuccess();
      hideDialog(); // Close dialog on success
    } catch (e) {
      console.error('Failed to connect to room:', e);
      // Error feedback is handled by useOpenViduSession's error state
    }
  }, [sessionNameInput, joinSession, onSuccess]);

  const handleLeave = useCallback(async () => {
    await leaveSession();
    // Optionally hide dialog after leaving, or keep it open for re-connection.
    hideDialog();
  }, [leaveSession]);

  return (
    <Box
      sx={{
        p: 2, // Add padding here directly for the content within GlobalDialog's DialogContent
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        alignItems: 'center',
      }}
    >
      {/* Title and main descriptive text are handled by GlobalDialog. */}
      {/* Keeping specific instructional text here. */}
      <Typography variant="h6" component="div" color="text.primary" className="font-bold">
        {roomId ? `Connect to Room: ${roomId}` : 'Configure & Connect to Room'}
      </Typography>
      <Typography color="text.secondary">
        Configure your camera and microphone before joining the session.
      </Typography>

      {error && (
        <Alert severity="error" className="w-full">
          {error}
        </Alert>
      )}

      {/* Local Video Preview removed for simplicity as `useOpenViduSession` doesn't expose `publisher` easily here. */}
      {/* The main OpenVidu page will display the video grid. This dialog focuses on connection setup. */}

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
    </Box>
  );
};
