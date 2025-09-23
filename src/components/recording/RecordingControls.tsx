// src/components/recording/RecordingControls.tsx
import { Box, CircularProgress, IconButton } from '@mui/material';
import { PhotoCamera, Stop, Videocam } from '@mui/icons-material';

export interface RecordingControlsProps {
  isRecording: boolean;
  isCapturing: boolean;
  onStart: () => void;
  onStop: () => void;
  onCapture: () => void;
}

export function RecordingControls({
  isRecording,
  isCapturing,
  onStart,
  onStop,
  onCapture,
}: RecordingControlsProps) {
  return (
    <Box className="flex items-center gap-4">
      {/* Only show Start if not recording */}
      {!isRecording && (
        <IconButton aria-label="start recording" onClick={onStart}>
          <Videocam />
        </IconButton>
      )}

      {/* Only show Stop if recording */}
      {isRecording && (
        <IconButton aria-label="stop recording" onClick={onStop}>
          <Stop />
        </IconButton>
      )}

      {/* Capture button */}
      <IconButton
        aria-label="capture screenshot"
        disabled={isCapturing}
        onClick={onCapture}
      >
        {isCapturing ? <CircularProgress size="small" /> : <PhotoCamera />}
      </IconButton>
    </Box>
  );
}
