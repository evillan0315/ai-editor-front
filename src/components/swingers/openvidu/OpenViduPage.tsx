import React from 'react';
import { Box, Typography, Alert, Card, CardContent, Divider } from '@mui/material';
import { useStore } from '@nanostores/react';

import { openViduStore } from '@/components/swingers/stores/openViduStore';
import { useOpenViduSession } from '@/hooks/useOpenViduSession';
import { OpenViduSessionForm } from './OpenViduSessionForm';
import { OpenViduControls } from './OpenViduControls';
import { OpenViduVideoGrid } from './OpenViduVideoGrid';

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

const alertSx = {
  marginBottom: '16px',
};

export const OpenViduPage: React.FC = () => {
  const ovState = useStore(openViduStore);

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
  } = useOpenViduSession();

  return (
    <Box sx={containerSx} className="w-full flex flex-col items-center py-4 h-full">
      <Typography variant="h4" component="h1" sx={titleSx} className="text-3xl md:text-4xl text-purple-600 dark:text-purple-400">
        OpenVidu Session Connector
      </Typography>

      <Box className="max-w-3xl w-full">
        <OpenViduSessionForm
          sessionNameInput={sessionNameInput}
          handleSessionNameChange={handleSessionNameChange}
          joinSession={joinSession}
          leaveSession={leaveSession}
          isLoading={isLoading}
          currentSessionId={ovState.currentSessionId}
          error={error}
        />

        {error && (
          <Alert severity="error" sx={alertSx} className="max-w-3xl w-full">
            {error}
          </Alert>
        )}

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
            </CardContent>
          </Card>
        )}

        <OpenViduVideoGrid publisher={ovState.publisher} subscribers={ovState.subscribers} />

        {!ovState.currentSessionId && !isLoading && !error && (
          <Alert severity="info" className="max-w-3xl w-full mt-4">
            Enter a session name to start or join an OpenVidu video call.
          </Alert>
        )}
      </Box>
    </Box>
  );
};
