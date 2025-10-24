import React from 'react';
import { Box, Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';

import { IOpenViduPublisher } from '@/components/swingers/types';

// --- Interfaces ---
interface OpenViduControlsProps {
  isCameraActive: boolean;
  toggleCamera: () => void;
  isMicActive: boolean;
  toggleMic: () => void;
  publisher: IOpenViduPublisher | null;
}

// --- Styles --- //
const controlsContainerSx = {
  display: 'flex',
  justifyContent: 'center',
  gap: '16px',
  marginTop: '16px',
};

export const OpenViduControls: React.FC<OpenViduControlsProps> = ({
  isCameraActive,
  toggleCamera,
  isMicActive,
  toggleMic,
  publisher,
}) => {
  return (
    <Box sx={controlsContainerSx}>
      <Button
        variant="contained"
        color={isCameraActive ? 'primary' : 'secondary'}
        onClick={toggleCamera}
        startIcon={isCameraActive ? <VideocamIcon /> : <VideocamOffIcon />}
        disabled={!publisher}
      >
        {isCameraActive ? 'Camera ON' : 'Camera OFF'}
      </Button>
      <Button
        variant="contained"
        color={isMicActive ? 'primary' : 'secondary'}
        onClick={toggleMic}
        startIcon={isMicActive ? <MicIcon /> : <MicOffIcon />}
        disabled={!publisher}
      >
        {isMicActive ? 'Mic ON' : 'Mic OFF'}
      </Button>
    </Box>
  );
};
