import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { streamerStore, fetchStreamers } from './stores/streamerStore';
import { StreamerCard } from './StreamerCard';

const listContainerSx = {
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
      <Typography variant="h4" component="h1" sx={titleSx} className="text-3xl md:text-4xl text-green-600 dark:text-green-400">
        Active Streamers
      </Typography>

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

      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-7xl justify-items-center">
        {!loading &&
          streamers.map((streamer) => (
            <StreamerCard key={streamer.id} streamer={streamer} />
          ))}
      </Box>
    </Box>
  );
};
