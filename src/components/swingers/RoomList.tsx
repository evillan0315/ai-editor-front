import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { roomStore, fetchRooms, fetchConnectionCountsForRooms } from './stores/roomStore';
import { RoomCard } from './RoomCard';

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

export const RoomList: React.FC = () => {
  const { rooms, loading, error, connectionCounts, loadingConnectionCounts } = useStore(roomStore);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (!loading && rooms.length > 0) {
      fetchConnectionCountsForRooms(rooms);
    }
  }, [loading, rooms]);

  // Sort rooms: live streams first, then by connection count (descending)
  const sortedRooms = [...rooms].sort((a, b) => {
    const aConnections = a.roomId ? connectionCounts[a.roomId] || 0 : 0;
    const bConnections = b.roomId ? connectionCounts[b.roomId] || 0 : 0;

    // Primary sort: liveStream rooms come first
    if (a.liveStream && !b.liveStream) return -1;
    if (!a.liveStream && b.liveStream) return 1;

    // Secondary sort: if both are live or both are not live, sort by connection count (descending)
    return bConnections - aConnections;
  });

  return (
    <Box sx={listContainerSx} className="w-full flex flex-col items-center py-4 h-full">
      <Typography variant="h4" component="h1" sx={titleSx} className="text-3xl md:text-4xl text-teal-600 dark:text-teal-400">
        Rooms
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

      {!loading && !error && rooms.length === 0 && (
        <Alert severity="info" className="max-w-xl">
          No rooms found.
        </Alert>
      )}

      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-7xl justify-items-center">
        {!loading &&
          sortedRooms.map((room, index) => (
            <RoomCard
              key={room.id}
              room={room}
              connectionCount={room.roomId ? connectionCounts[room.roomId] : null}
              loadingConnections={room.roomId ? loadingConnectionCounts[room.roomId] || false : false}
              isTopRoom={index === 0 && !loading && !error && sortedRooms.length > 0} // Pass isTopRoom prop to the first card
            />
          ))}
      </Box>
    </Box>
  );
};
