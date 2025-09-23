// Source: src/components/recording/RecordingStatus.tsx
import { Box, Typography } from '@mui/material';
import { useStore } from '@nanostores/react';
import {
  isCurrentRecording,
  currentRecordingIdStore,
} from '@/stores/recordingStore';

export function RecordingStatus() {
  const isRecording = useStore(isCurrentRecording);
  const currentId = useStore(currentRecordingIdStore);

  return (
    <Box className="flex flex-col gap-1">
      {isRecording ? (
        <>
          <Typography variant="body1" color="error">
            ● Recording in progress
          </Typography>
          {currentId && (
            <Typography variant="body2" color="text.secondary">
              ID: {currentId}
            </Typography>
          )}
        </>
      ) : (
        <Typography variant="body1" color="text.secondary">
          No active recording
        </Typography>
      )}
    </Box>
  );
}
