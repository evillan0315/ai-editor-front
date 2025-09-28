import { Box, CircularProgress, IconButton } from '@mui/material';
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
  return (
    <Box className="flex items-center gap-4">

      {!isScreenRecording && (
        <IconButton
          aria-label="start screen recording"
          onClick={onStartScreenRecording}
          color="primary"
        >
          <Videocam />
        </IconButton>
      )}
      {isScreenRecording && (
        <IconButton
          aria-label="stop screen recording"
          onClick={onStopScreenRecording}
          color="error"
        >
          <Stop />
        </IconButton>
      )}
      {!isCameraRecording && (
        <IconButton
          aria-label="start camera recording"
          onClick={onStartCameraRecording}
          color="primary"
        >
          <CameraAlt />
        </IconButton>
      )}
      {isCameraRecording && (
        <IconButton
          aria-label="stop camera recording"
          onClick={onStopCameraRecording}
          color="error"
        >
          <StopCircle />
        </IconButton>
      )}


      <IconButton
        aria-label="capture screenshot"
        disabled={isCapturing}
        onClick={onCapture}
        color="secondary"
      >
        {isCapturing ? <CircularProgress size={24} /> : <PhotoCamera />}
      </IconButton>
    </Box>
  );
}
