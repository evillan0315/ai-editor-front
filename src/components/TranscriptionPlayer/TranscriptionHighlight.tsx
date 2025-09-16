// src/components/TranscriptionPlayer/TranscriptionHighlight.tsx
import React from 'react';
import { Box, Typography, Chip, Paper } from '@mui/material';
import { TranscriptionResult, SyncTranscriptionResponse } from '@/types';

interface TranscriptionHighlightProps {
  syncData: SyncTranscriptionResponse;
  currentTime: number;
  onSeek: (time: number) => void;
}

export const TranscriptionHighlight: React.FC<TranscriptionHighlightProps> = ({
  syncData,
  currentTime,
  onSeek,
}) => {
  const { currentSegment, previousSegments, upcomingSegments } = syncData;

  return (
    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
      {/* Previous Segments */}
      {previousSegments.map((segment, index) => (
        <Typography
          key={index}
          variant="body1"
          sx={{ mb: 1, opacity: 0.7 }}
          onClick={() => onSeek(segment.start)}
        >
          {segment.text}
        </Typography>
      ))}

      {/* Current Segment - Highlighted */}
      {currentSegment && (
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mb: 2,
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            cursor: 'pointer',
          }}
          onClick={() => onSeek(currentSegment.start)}
        >
          <Typography variant="body1" fontWeight="bold">
            {currentSegment.text}
          </Typography>
          <Chip
            label={`${currentSegment.start.toFixed(1)}s - ${currentSegment.end.toFixed(1)}s`}
            size="small"
            sx={{
              mt: 1,
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'inherit',
            }}
          />
        </Paper>
      )}

      {/* Upcoming Segments */}
      {upcomingSegments.map((segment, index) => (
        <Typography
          key={index}
          variant="body1"
          sx={{ mb: 1, opacity: 0.5 }}
          onClick={() => onSeek(segment.start)}
        >
          {segment.text}
        </Typography>
      ))}

      {/* Progress Indicator */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Chip
          label={`Current: ${currentTime.toFixed(1)}s / Total: ${syncData.fullTranscription.duration.toFixed(1)}s`}
          color="primary"
          variant="outlined"
        />
      </Box>
    </Box>
  );
};
