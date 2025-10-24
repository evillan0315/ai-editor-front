import React from 'react';
import { Card, CardContent, Typography, Box, Chip, CircularProgress, IconButton } from '@mui/material';
import { IRoom } from '@/components/swingers/types';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CallIcon from '@mui/icons-material/Call'; // New: Icon for joining a room
import VisibilityIcon from '@mui/icons-material/Visibility'; // New: Icon for viewing a room
import ReplayIcon from '@mui/icons-material/Replay'; // New: Icon for reset/refresh

interface RoomCardProps {
  room: IRoom;
  connectionCount: number | null;
  loadingConnections: boolean;
  isTopRoom: boolean;
  onJoinRoom?: (roomId: string) => void; // New prop for join action
  onViewRoom?: (roomId: string) => void; // New prop for view action
  onResetRoom?: (roomId: string) => void; // New prop for reset action
  resettingRoomId?: string | null; // To indicate if this room is currently being reset
}

const baseCardSx = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
  overflow: 'hidden',
  boxShadow: 3,
  borderRadius: 2,
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: 6,
  },
};

const liveCardHighlightSx = {
  borderColor: 'error.main',
  borderWidth: '2px',
  borderStyle: 'solid',
  boxShadow: '0 0 15px rgba(255, 0, 0, 0.5)',
  transform: 'scale(1.01)',
  '&:hover': {
    transform: 'scale(1.03) translateY(-4px)',
    boxShadow: '0 0 20px rgba(255, 0, 0, 0.7)',
  },
};

const topRoomHighlightSx = {
  borderColor: 'warning.main',
  borderWidth: '3px',
  boxShadow: '0 0 25px rgba(255, 165, 0, 0.7)',
  transform: 'scale(1.02)',
  '&:hover': {
    transform: 'scale(1.04) translateY(-6px)',
    boxShadow: '0 0 35px rgba(255, 165, 0, 0.9)',
  },
};

const contentSx = {
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: '16px',
  '&:last-child': {
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

export const RoomCard: React.FC<RoomCardProps> = ({ room, connectionCount, loadingConnections, isTopRoom, onJoinRoom, onViewRoom, onResetRoom, resettingRoomId }) => {
  const { name, type, active, description, roomId, recording, liveStream, created_at } = room;

  const isResetting = resettingRoomId === roomId;

  return (
    <Card sx={{ ...baseCardSx, ...(liveStream && liveCardHighlightSx), ...(isTopRoom && topRoomHighlightSx) }} className="flex-none w-full sm:w-80 md:w-full lg:w-96 min-h-60 h-auto">
      <Box className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center p-4">
        <MeetingRoomIcon className="text-white" sx={{ fontSize: '4rem' }} />
        
        {/* New: Live label at top-left */}
        {liveStream && (
          <Chip
            label="LIVE"
            size="small"
            icon={<LiveTvIcon fontSize="small" />}
            color="error"
            className="absolute top-2 left-2 animate-pulse font-bold z-10"
            sx={{ bgcolor: 'error.main', color: 'white', '& .MuiChip-icon': { color: 'white' } }}
          />
        )}

        {/* Original Active/Inactive label at top-right */}
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
          {/* Live chip moved, removed from here */}
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

        {/* New: Action buttons at the bottom */}
        <Box className="flex justify-end gap-2 mt-4">
          {roomId && onResetRoom && (
            <IconButton
              aria-label="reset room"
              color="secondary"
              onClick={() => onResetRoom(roomId)}
              disabled={isResetting}
              sx={{ '&:hover': { bgcolor: 'secondary.light' } }}
            >
              {isResetting ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <ReplayIcon />
              )}
            </IconButton>
          )}
          {roomId && onJoinRoom && (
            <IconButton
              aria-label="join room"
              color="primary"
              onClick={() => onJoinRoom(roomId)}
              sx={{ '&:hover': { bgcolor: 'primary.light' } }}
            >
              <CallIcon />
            </IconButton>
          )}
          {roomId && onViewRoom && (
            <IconButton
              aria-label="view room details"
              color="info"
              onClick={() => onViewRoom(roomId)}
              sx={{ '&:hover': { bgcolor: 'info.light' } }}
            >
              <VisibilityIcon />
            </IconButton>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
