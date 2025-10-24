import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { subscriberStore, fetchSubscribers } from './stores/subscriberStore';
import { SubscriberCard } from './SubscriberCard';

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

export const SubscriberList: React.FC = () => {
  const { subscribers, loading, error } = useStore(subscriberStore);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  return (
    <Box sx={listContainerSx} className="w-full flex flex-col items-center py-4 h-full">
      <Typography variant="h4" component="h1" sx={titleSx} className="text-3xl md:text-4xl text-blue-600 dark:text-blue-400">
        Subscribers
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

      {!loading && !error && subscribers.length === 0 && (
        <Alert severity="info" className="max-w-xl">
          No subscribers found.
        </Alert>
      )}

      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-7xl justify-items-center">
        {!loading &&
          subscribers.map((subscriber) => (
            <SubscriberCard key={subscriber.id} subscriber={subscriber} />
          ))}
      </Box>
    </Box>
  );
};
