import React from 'react';
import { Card, CardContent, Typography, Box, Chip, CircularProgress } from '@mui/material';
import { IRoom } from '@/components/swingers/types';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'; // Import for connections count

interface RoomCardProps {
  room: IRoom;
  connectionCount: number | null; // New prop for connection count
  loadingConnections: boolean; // New prop for loading state
}

const cardSx = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
  overflow: 'hidden',
  boxShadow: 3,
  borderRadius: 2,
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: 6,
  },
};

const contentSx = {
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: '16px',
  '&:last-child': { // Important for CardContent to override default padding
    paddingBottom: '16px',
  },
};

const infoItemSx = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '4px',
  wordBreak: 'break-word',
};

export const RoomCard: React.FC<RoomCardProps> = ({ room, connectionCount, loadingConnections }) => {
  const { name, type, active, description, roomId, recording, liveStream, created_at } = room;

  return (
    <Card sx={cardSx} className="flex-none w-full sm:w-80 md:w-full lg:w-96 min-h-60 h-auto">
      <Box className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center p-4">
        <MeetingRoomIcon className="text-white" sx={{ fontSize: '4rem' }} />
        <Box className="absolute top-2 right-2 flex items-center gap-1 p-1 rounded-full text-white text-xs font-semibold"
             sx={{ bgcolor: active ? 'success.main' : 'error.main' }}>
          {active ? <DoneIcon fontSize="small" /> : <CloseIcon fontSize="small" />}
          {active ? 'Active' : 'Inactive'}
        </Box>
      </Box>
      <CardContent sx={contentSx} className="flex flex-col flex-grow p-4">
        <Typography variant="h6" component="div" className="mb-2 font-bold text-center" color="text.primary">
          {name}
        </Typography>
        <Box className="flex justify-center flex-wrap gap-2 mb-2">
          <Chip label={type.toUpperCase()} size="small" color="primary" />
          {recording && <Chip label="RECORDING" size="small" icon={<FiberManualRecordIcon />} color="warning" />}
          {liveStream && <Chip label="LIVE" size="small" icon={<LiveTvIcon />} color="error" />}
        </Box>
        {description && (
          <Box sx={infoItemSx}>
            <Typography variant="body2" color="text.secondary" className="italic">
              {description}
            </Typography>
          </Box>
        )}
        {roomId && (
          <Box sx={infoItemSx}>
            <Typography variant="body2" color="text.secondary" className="font-semibold">Room ID:</Typography>
            <Typography variant="body2" color="text.secondary">
              {roomId}
            </Typography>
          </Box>
        )}
        <Box sx={infoItemSx}>
          <Typography variant="body2" color="text.secondary" className="font-semibold">Created:</Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date(created_at).toLocaleDateString()}
          </Typography>
        </Box>
        <Box sx={infoItemSx}>
          <PeopleAltIcon color="action" fontSize="small" />
          <Typography variant="body2" color="text.secondary" className="font-semibold">Connections:</Typography>
          {loadingConnections ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            <Typography variant="body2" color="text.secondary">
              {connectionCount !== null ? connectionCount : 'N/A'}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
