import React, { useEffect, useCallback, useState } from 'react';
import { useStore } from '@nanostores/react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { roomStore, fetchRooms, fetchConnectionCountsForRooms } from './stores/roomStore';
import { RoomCard } from './RoomCard';
import { deleteSession, createSession } from '@/components/swingers/api/sessions';

import { useNavigate } from 'react-router-dom';


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
  const [resettingRoomId, setResettingRoomId] = useState<string | null>(null); // State to track which room is being reset
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();

    
  }, []); // Empty dependency array means this runs once on mount and once on unmount

  useEffect(() => {
    if (!loading && rooms.length > 0) {
      fetchConnectionCountsForRooms(rooms);
    }
  }, [loading, rooms]);

  // Callback for joining a room
  const handleJoinRoom = useCallback((roomId: string) => {
    navigate(`/apps/swingers/${roomId}`);
  }, [navigate]);

  // Callback for viewing room details
  const handleViewRoom = useCallback((roomId: string) => {
    // This handler can be implemented if there's a specific 'view' route/dialog for room info
    // For now, it remains a stub as the main request is for joining. Just navigate to the room.
    navigate(`/apps/swingers/${roomId}`);
    console.log(`Viewing details for room: ${roomId}`);
  }, [navigate]);

  // Callback for resetting/recreating a room's OpenVidu session
  const handleResetRoom = useCallback(async (roomId: string) => {
    if (!roomId) {
      console.error('Cannot reset room: roomId is missing.');
      return;
    }

    setResettingRoomId(roomId); // Set loading state for this specific room
    try {
      // 1. Delete the existing OpenVidu session
      await deleteSession(roomId);
      console.log(`OpenVidu session ${roomId} deleted.`);

      // 2. Create a new OpenVidu session with the same customSessionId
      // The createSession API function now handles 409 (conflict/already exists) by returning the existing session
      // So, if we deleted it, it will be truly recreated. If delete failed silently, createSession would return the existing.
      await createSession({ customSessionId: roomId });
      console.log(`OpenVidu session ${roomId} recreated.`);

      // 3. Refresh rooms and connection counts to update UI
      // fetchRooms will update the roomStore, and the useEffect will trigger fetchConnectionCountsForRooms
      await fetchRooms();

    } catch (error) {
      console.error(`Error resetting room ${roomId}:`, error);
      // TODO: Implement a global snackbar/toast for user feedback
    } finally {
      setResettingRoomId(null); // Clear loading state
    }
  }, []);

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
              isTopRoom={index === 0 && !loading && !error && sortedRooms.length > 0}
              onJoinRoom={handleJoinRoom} // Pass the join handler
              onViewRoom={handleViewRoom} // Pass the view handler
              onResetRoom={handleResetRoom} // Pass the new reset handler
              resettingRoomId={resettingRoomId} // Pass the ID of the room currently being reset
            />
          ))}
      </Box>
    </Box>
  );
};
