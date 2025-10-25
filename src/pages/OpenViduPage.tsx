import React, { useEffect } from 'react';
import { Box, Typography, Alert, Card, CardContent, Divider, Button } from '@mui/material'; // Added Button for test message
import { useStore } from '@nanostores/react';
import { useParams } from 'react-router-dom';

import { openViduStore, setOpenViduError } from '@/components/swingers/stores/openViduStore'; // Import setOpenViduError
import { useOpenViduSession } from '@/components/swingers/hooks/useOpenViduSession';
import { OpenViduSessionForm } from '@/components/swingers/openvidu/OpenViduSessionForm';
import { OpenViduControls } from '@/components/swingers/openvidu/OpenViduControls';
import { OpenViduVideoGrid } from '@/components/swingers/openvidu/OpenViduVideoGrid';

// --- Styles ---
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

const alertSx = {
  marginBottom: '16px',
};

const OpenViduPage: React.FC = () => {
  const ovState = useStore(openViduStore);
  const { roomId } = useParams<{ roomId: string }>(); // Get roomId from URL parameters

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
    sendChatMessage, // New: Exposed function for sending chat messages
  } = useOpenViduSession(roomId); // Pass roomId to the hook

  // Effect to automatically join session if roomId is present in URL and not already connected
  // This effect will trigger if roomId changes, or if currentSessionId is null/different from roomId
  // It will also re-attempt if there was a previous error, by clearing it before trying to join.
  useEffect(() => {
    if (roomId && ovState.currentSessionId !== roomId && !isLoading) {
      // Clear any previous error before attempting to join again,
      // so the UI can reflect a fresh attempt.
      if (error) {
        setOpenViduError(null);
      }
      //joinSession(roomId);
    }
  }, [roomId, ovState.currentSessionId, isLoading, error, joinSession]);

  // Example of how to use sendChatMessage (e.g., in response to a button click)
  const handleSendTestMessage = () => {
    if (sendChatMessage) {
      sendChatMessage('Hello from OpenViduPage!');
    }
  };

  return (
    <Box sx={containerSx} className="w-full flex flex-col items-center py-4 h-full">
      <Typography variant="h4" component="h1" sx={titleSx} className="text-3xl md:text-4xl text-purple-600 dark:text-purple-400">
        OpenVidu Session Connector
      </Typography>

      <Box className="max-w-3xl w-full">
        {error && (
          <Alert severity="error" sx={alertSx} className="max-w-3xl w-full">
            {error}
          </Alert>
        )}

        <OpenViduSessionForm
          sessionNameInput={sessionNameInput}
          handleSessionNameChange={handleSessionNameChange}
          joinSession={joinSession}
          leaveSession={leaveSession}
          isLoading={isLoading}
          currentSessionId={ovState.currentSessionId}
          error={error}
          isRoomIdFromUrl={!!roomId} // Inform form if roomId came from URL
        />

        {ovState.currentSessionId && (
          <Card className="mb-4 max-w-3xl w-full">
            <CardContent>
              <Typography variant="h6" className="mb-2 font-semibold">Active Session: {ovState.currentSessionId}</Typography>
              <Divider className="mb-2" />
              <OpenViduControls
                isCameraActive={isCameraActive}
                toggleCamera={toggleCamera}
                isMicActive={isMicActive}
                toggleMic={toggleMic}
                publisher={ovState.publisher}
              />
              {/* Example chat button, replace with actual chat input/display */}
              {/* This button is for demonstration. Actual chat should use a dedicated input. */}
              <Button onClick={handleSendTestMessage} variant="outlined" className="mt-4">Send Test Chat Message</Button>
            </CardContent>
          </Card>
        )}

        <OpenViduVideoGrid publisher={ovState.publisher} subscribers={ovState.subscribers} />

        {!ovState.currentSessionId && !isLoading && !error && ( /* Adjusted condition to only show if not connected and no error */
          <Alert severity="info" className="max-w-3xl w-full mt-4">
            Enter a session name to start or join an OpenVidu video call.
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default OpenViduPage;
