import { Box, Typography } from '@mui/material';
import { useStore } from '@nanostores/react';
import {
  isScreenRecordingStore,
  currentRecordingIdStore,
  isCameraRecordingStore,
  currentCameraRecordingIdStore,
} from '@/stores/recordingStore';

export function RecordingStatus() {
  const isScreenRecording = useStore(isScreenRecordingStore);
  const currentScreenRecordingId = useStore(currentRecordingIdStore);

  const isCameraRecording = useStore(isCameraRecordingStore);
  const currentCameraRecordingId = useStore(currentCameraRecordingIdStore);

  const isAnyRecordingActive = isScreenRecording || isCameraRecording;

  return (
    <Box className="flex flex-col gap-1">
      {isScreenRecording && (
        <Typography variant="body1" color="error">
          ● Screen Recording in progress
          {currentScreenRecordingId && ` (ID: ${currentScreenRecordingId})`}
        </Typography>
      )}
      {isCameraRecording && (
        <Typography variant="body1" color="error">
          ● Camera Recording in progress
          {currentCameraRecordingId && ` (ID: ${currentCameraRecordingId})`}
        </Typography>
      )}

      {!isAnyRecordingActive && (
        <Typography variant="body1" color="text.secondary">
          No active recording
        </Typography>
      )}
    </Box>
  );
}
