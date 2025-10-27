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
  Grid,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LiveTvIcon from '@mui/icons-material/LiveTv'; // Import LiveTvIcon
import { roomStore, fetchRooms, fetchConnectionCountsForRooms } from './stores/roomStore';
import { fetchDefaultConnection } from './stores/connectionStore';
import { RoomCard } from './RoomCard';
import { deleteSession, createSession } from '@/components/swingers/api/sessions';
import { IRoom } from '@/components/swingers/types';

import { useNavigate } from 'react-router-dom';
import { showDialog } from '@/stores/dialogStore';
import { RoomConnectionDialog } from '@/components/swingers/dialogs/RoomConnectionDialog';
import { RoomConnectionsTable } from './RoomConnectionsTable'; // New import

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
    fetchDefaultConnection();
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

  // Callback for joining a room (navigates to OpenVidu page)
  const handleJoinRoom = useCallback(
    (roomId: string) => {
      // To do: implement logic for connecting to room. Connection should open in a dialog modal
    },
    [navigate],
  );

  // Callback for viewing room details (navigates to OpenVidu page)
  const handleViewRoom = useCallback(
    (roomId: string) => {
      // To do: implement logic for Viewing room details. Connection should open in a dialog modal
      showDialog({
      title: `View Room: ${roomId}`,
      content: <RoomConnectionDialog roomId={roomId} connectionRole={'PUBLISHER'} />,
      maxWidth: 'md',
      fullWidth: true,
      showCloseButton: true,
    });
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

  // New callback for opening the connection dialog with a specific roomId
  const handleConnectDefaultClient = useCallback((roomId: string) => {
    showDialog({
      title: `Connect to Room: ${roomId}`,
      content: <RoomConnectionDialog roomId={roomId} connectionRole={'PUBLISHER'} />,
      maxWidth: 'md',
      fullWidth: true,
      showCloseButton: true,
    });
  }, []);

  // New callback for viewing connections in a dialog
  const handleViewConnections = useCallback((roomId: string) => {
    showDialog({
      title: `Room Connections ${roomId}`,
      content: <RoomConnectionsTable roomId={roomId} />,
      maxWidth: 'lg',
      fullWidth: true,
      showCloseButton: true,
      paperPropsSx: {
        maxHeight: '80vh', // Limit dialog height
        display: 'flex',
        flexDirection: 'column',
      },
    });
  }, []);

  // Memoize grouped and sorted rooms to prevent unnecessary re-renders
  const allSortedRooms = useMemo(() => {
    if (loading || error || rooms.length === 0) return [];

    const sorted = [...rooms].sort((a, b) => {
      const aConnections = a.roomId ? connectionCounts[a.roomId] || 0 : 0;
      const bConnections = b.roomId ? connectionCounts[b.roomId] || 0 : 0;

      // 1. Live rooms first
      if (a.liveStream && !b.liveStream) return -1;
      if (!a.liveStream && b.liveStream) return 1;

      // If both are live or both are not live, proceed to secondary sorts
      // 2. More connections first (descending)
      if (aConnections !== bConnections) return bConnections - aConnections;

      // 3. 'public' type first, then alphabetical by type
      const aTypeLower = a.type?.toLowerCase();
      const bTypeLower = b.type?.toLowerCase();
      if (aTypeLower === 'public' && bTypeLower !== 'public') return -1;
      if (aTypeLower !== 'public' && bTypeLower === 'public') return 1;
      if (aTypeLower && bTypeLower && aTypeLower !== bTypeLower) return aTypeLower.localeCompare(bTypeLower);

      // 4. Alphabetical by name (for stable sort)
      return a.name.localeCompare(b.name);
    });

    return sorted;
  }, [rooms, loading, error, connectionCounts]);

  const sortedLiveRooms = useMemo(() => allSortedRooms.filter((room) => room.liveStream), [allSortedRooms]);
  const sortedNonLiveRooms = useMemo(() => allSortedRooms.filter((room) => !room.liveStream), [allSortedRooms]);

  const groupedNonLiveRooms = useMemo(() => {
    const grouped: Record<string, IRoom[]> = {};
    sortedNonLiveRooms.forEach((room) => {
      if (!grouped[room.type]) {
        grouped[room.type] = [];
      }
      grouped[room.type].push(room);
    });

    const sortedTypes = Object.keys(grouped).sort((a, b) => {
      if (a.toLowerCase() === 'public') return -1;
      if (b.toLowerCase() === 'public') return 1;
      return a.localeCompare(b);
    });

    const finalGrouped: Record<string, IRoom[]> = {};
    sortedTypes.forEach((type) => {
      finalGrouped[type] = grouped[type]; // Rooms are already globally sorted, maintain order within type groups
    });
    return finalGrouped;
  }, [sortedNonLiveRooms]);

  return (
    <Box sx={listContainerSx} className="w-full flex flex-col items-center h-full">
      {loading && (
        <Box sx={loadingContainerSx}>
          <CircularProgress color="primary" size={40} />
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
        <Box className="w-full flex flex-col gap-4">
          {sortedLiveRooms.length > 0 && (
            <Accordion
              key="live-rooms"
              expanded={expanded === 'live-rooms'}
              onChange={handleChange('live-rooms')}
              className="w-full shadow-md rounded-lg overflow-hidden "
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="live-rooms-content"
                id="live-rooms-header"
                sx={accordionSummarySx}
              >
                <Typography variant="h6" component="span" className="font-semibold text-lg text-red-500">
                  <LiveTvIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Live Sessions
                </Typography>
                <Typography variant="body2" color="text.secondary" className="ml-4">
                  ({sortedLiveRooms.length} {sortedLiveRooms.length === 1 ? 'room' : 'rooms'})
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={accordionDetailsSx}>
                <Box className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3   gap-6 w-full justify-items-center">
                  {sortedLiveRooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      connectionCount={room.roomId ? connectionCounts[room.roomId] : null}
                      loadingConnections={room.roomId ? loadingConnectionCounts[room.roomId] || false : false}
                      onJoinRoom={handleJoinRoom}
                      onViewRoom={handleViewRoom}
                      onResetRoom={handleResetRoom}
                      resettingRoomId={resettingRoomId}
                      onConnectDefaultClient={handleConnectDefaultClient} // Pass new handler
                      onViewConnections={handleViewConnections} // Pass the new handler
                    />
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {Object.entries(groupedNonLiveRooms).map(([type, roomsForType]) => (
            <Accordion
              key={type}
              expanded={expanded === type}
              onChange={handleChange(type)}
              className="w-full shadow-md rounded-lg overflow-hidden"
            >
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
                <Box className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-6 w-full justify-items-center">
                  {roomsForType.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      connectionCount={room.roomId ? connectionCounts[room.roomId] : null}
                      loadingConnections={room.roomId ? loadingConnectionCounts[room.roomId] || false : false}
                      onJoinRoom={handleJoinRoom}
                      onViewRoom={handleViewRoom}
                      onResetRoom={handleResetRoom}
                      resettingRoomId={resettingRoomId}
                      onConnectDefaultClient={handleConnectDefaultClient} // Pass new handler
                      onViewConnections={handleViewConnections} // Pass the new handler
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
