import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  CircularProgress,
  Alert,
} from '@mui/material'; // Removed Typography as title is moved to header
import { streamerStore, fetchStreamers } from './stores/streamerStore';
import { StreamerCard } from './StreamerCard';

const listContainerSx = {
  padding: '0 24px 24px 24px', // Modified: Removed top padding
  '@media (max-width: 600px)': {
    padding: '0 16px 16px 16px', // Modified: Removed top padding
  },
};

const loadingContainerSx = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '200px',
  width: '100%',
};

const errorAlertSx = {
  marginBottom: '16px',
  width: '100%',
};

export const StreamerList: React.FC = () => {
  const { streamers, loading, error } = useStore(streamerStore);

  useEffect(() => {
    fetchStreamers();
  }, []);

  return (
    <Box sx={listContainerSx} className="w-full flex flex-col items-center py-4 h-full">
      {/* Title removed, now handled by StreamerHeader component in SwingersPage.tsx */}
      {loading && (
        <Box sx={loadingContainerSx}>
          <CircularProgress color="primary" size={60} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={errorAlertSx} className="max-w-xl">
          {error}
        </Alert>
      )}

      {!loading && !error && streamers.length === 0 && (
        <Alert severity="info" className="max-w-xl">
          No active streamers found.
        </Alert>
      )}

      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 w-full max-w-7xl justify-items-center">
        {!loading &&
          streamers.map((streamer) => (
            <StreamerCard key={streamer.id} streamer={streamer} />
          ))}
      </Box>
    </Box>
  );
};
