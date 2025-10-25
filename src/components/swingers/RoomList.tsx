import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { roomStore, fetchRooms, fetchConnectionCountsForRooms } from './stores/roomStore';
import { RoomCard } from './RoomCard';
import { deleteSession, createSession } from '@/components/swingers/api/sessions';
import { IRoom } from '@/components/swingers/types';

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

const accordionSummarySx = {
  backgroundColor: 'background.paper',
  borderBottom: '1px solid',
  borderColor: 'divider',
  '& .MuiAccordionSummary-content': {
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: '12px 0',
  },
};

const accordionDetailsSx = {
  padding: '16px',
};

export const RoomList: React.FC = () => {
  const { rooms, loading, error, connectionCounts, loadingConnectionCounts } = useStore(roomStore);
  const [resettingRoomId, setResettingRoomId] = useState<string | null>(null); // State to track which room is being reset
  const [expanded, setExpanded] = useState<string | false>('public'); // 'public' accordion expanded by default
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (!loading && rooms.length > 0) {
      fetchConnectionCountsForRooms(rooms);
    }
  }, [loading, rooms]);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  // Callback for joining a room
  const handleJoinRoom = useCallback(
    (roomId: string) => {
      navigate(`/apps/swingers/${roomId}`);
    },
    [navigate],
  );

  // Callback for viewing room details
  const handleViewRoom = useCallback(
    (roomId: string) => {
      navigate(`/apps/swingers/${roomId}`);
      console.log(`Viewing details for room: ${roomId}`);
    },
    [navigate],
  );

  // Callback for resetting/recreating a room's OpenVidu session
  const handleResetRoom = useCallback(
    async (roomId: string) => {
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
    },
    [],
  );

  // Memoize grouped and sorted rooms to prevent unnecessary re-renders
  const groupedAndSortedRooms = useMemo(() => {
    if (loading || error) return {};

    const grouped: Record<string, IRoom[]> = {};
    rooms.forEach((room) => {
      if (!grouped[room.type]) {
        grouped[room.type] = [];
      }
      grouped[room.type].push(room);
    });

    const sortedTypes = Object.keys(grouped).sort((a, b) => {
      if (a.toLowerCase() === 'public') return -1; // 'public' first
      if (b.toLowerCase() === 'public') return 1;
      return a.localeCompare(b); // Alphabetical for others
    });

    const finalGroupedAndSorted: Record<string, IRoom[]> = {};
    sortedTypes.forEach((type) => {
      finalGroupedAndSorted[type] = grouped[type].sort((a, b) => {
        const aConnections = a.roomId ? connectionCounts[a.roomId] || 0 : 0;
        const bConnections = b.roomId ? connectionCounts[b.roomId] || 0 : 0;
        return bConnections - aConnections; // Descending by connection count
      });
    });

    return finalGroupedAndSorted;
  }, [rooms, loading, error, connectionCounts]);

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

      {!loading && !error && rooms.length > 0 && (
        <Box className="w-full max-w-7xl flex flex-col gap-4">
          {Object.entries(groupedAndSortedRooms).map(([type, roomsForType]) => (
            <Accordion key={type} expanded={expanded === type} onChange={handleChange(type)} className="w-full shadow-md rounded-lg overflow-hidden">
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`${type}-content`}
                id={`${type}-header`}
                sx={accordionSummarySx}
              >
                <Typography variant="h6" component="span" className="font-semibold text-lg">
                  {type.charAt(0).toUpperCase() + type.slice(1)} Rooms
                </Typography>
                <Typography variant="body2" color="text.secondary" className="ml-4">
                  ({roomsForType.length} {roomsForType.length === 1 ? 'room' : 'rooms'})
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={accordionDetailsSx}>
                <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full justify-items-center">
                  {roomsForType.map((room, index) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      connectionCount={room.roomId ? connectionCounts[room.roomId] : null}
                      loadingConnections={room.roomId ? loadingConnectionCounts[room.roomId] || false : false}
                      isTopRoom={index === 0} // Highlight the top room within each group
                      onJoinRoom={handleJoinRoom}
                      onViewRoom={handleViewRoom}
                      onResetRoom={handleResetRoom}
                      resettingRoomId={resettingRoomId}
                    />
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  );
};
