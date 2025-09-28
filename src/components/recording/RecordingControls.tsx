import { Box, CircularProgress, IconButton, SxProps, Theme } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import {
  PhotoCamera,
  Stop,
  Videocam,
  CameraAlt,
  StopCircle,
} from '@mui/icons-material';

export interface RecordingControlsProps {
  isScreenRecording: boolean;
  isCameraRecording: boolean;
  isCapturing: boolean;
  onStartScreenRecording: () => void;
  onStopScreenRecording: () => void;
  onStartCameraRecording: () => void;
  onStopCameraRecording: () => void;
  onCapture: () => void;
}

// Define SX styles using theme
const commonIconButtonSx: SxProps<Theme> = (theme) => ({
  fontSize: '2rem', // Slightly larger icons for better visibility and touch targets
  '&:hover': {
    backgroundColor: theme.palette.action.hover, // Use theme's generic hover color for consistency
  },
});

const primaryIconColorSx: SxProps<Theme> = (theme) => ({
  color: theme.palette.primary.main,
});

const errorIconColorSx: SxProps<Theme> = (theme) => ({
  color: theme.palette.error.main,
});

const secondaryIconColorSx: SxProps<Theme> = (theme) => ({
  color: theme.palette.secondary.main,
});

const circularProgressColorSx: SxProps<Theme> = (theme) => ({
  color: theme.palette.secondary.main, // Keep consistent with capture button color
});

export function RecordingControls({
  isScreenRecording,
  isCameraRecording,
  isCapturing,
  onStartScreenRecording,
  onStopScreenRecording,
  onStartCameraRecording,
  onStopCameraRecording,
  onCapture,
}: RecordingControlsProps) {
  const theme = useTheme();

  return (
    <Box className="flex items-center gap-4">
      {!isScreenRecording && (
        <IconButton
          aria-label="start screen recording"
          onClick={onStartScreenRecording}
          sx={{ ...commonIconButtonSx(theme), ...primaryIconColorSx(theme) }}
        >
          <Videocam fontSize="inherit" />
        </IconButton>
      )}
      {isScreenRecording && (
        <IconButton
          aria-label="stop screen recording"
          onClick={onStopScreenRecording}
          sx={{ ...commonIconButtonSx(theme), ...errorIconColorSx(theme) }}
        >
          <Stop fontSize="inherit" />
        </IconButton>
      )}
      {!isCameraRecording && (
        <IconButton
          aria-label="start camera recording"
          onClick={onStartCameraRecording}
          sx={{ ...commonIconButtonSx(theme), ...primaryIconColorSx(theme) }}
        >
          <CameraAlt fontSize="inherit" />
        </IconButton>
      )}
      {isCameraRecording && (
        <IconButton
          aria-label="stop camera recording"
          onClick={onStopCameraRecording}
          sx={{ ...commonIconButtonSx(theme), ...errorIconColorSx(theme) }}
        >
          <StopCircle fontSize="inherit" />
        </IconButton>
      )}

      <IconButton
        aria-label="capture screenshot"
        disabled={isCapturing}
        onClick={onCapture}
        sx={{ ...commonIconButtonSx(theme), ...secondaryIconColorSx(theme) }}
      >
        {isCapturing ? (
          <CircularProgress size={24} sx={circularProgressColorSx(theme)} />
        ) : (
          <PhotoCamera fontSize="inherit" />
        )}
      </IconButton>
    </Box>
  );
}
