import React from 'react';
import { Card, CardContent, Typography, Box, Chip, CircularProgress, IconButton, useTheme, Tooltip } from '@mui/material';
import { IRoom } from '@/components/swingers/types';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CallIcon from '@mui/icons-material/Call'; // Icon for joining a room
import VisibilityIcon from '@mui/icons-material/Visibility'; // Icon for viewing a room
import ReplayIcon from '@mui/icons-material/Replay'; // Icon for reset/refresh
import VideocamIcon from '@mui/icons-material/Videocam'; // New icon for connecting default client

interface RoomCardProps {
  room: IRoom;
  connectionCount: number | null;
  loadingConnections: boolean;
  onJoinRoom?: (roomId: string) => void;
  onViewRoom?: (roomId: string) => void;
  onResetRoom?: (roomId: string) => void;
  resettingRoomId?: string | null;
  onConnectDefaultClient?: (roomId: string) => void; // New prop for connecting default client
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

// --- New Sticky Footer Styles ---
const stickyFooterSx = (theme: ReturnType<typeof useTheme>) => ({
  position: 'sticky',
  bottom: 0,
  zIndex: 1, // Ensure it stays on top of the card content if it scrolls
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
  padding: '8px 16px',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
});

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  connectionCount,
  loadingConnections,
  onJoinRoom,
  onViewRoom,
  onResetRoom,
  resettingRoomId,
  onConnectDefaultClient, // New prop
}) => {
  const { name, type, active, description, roomId, recording, liveStream, created_at } = room;
  const theme = useTheme();

  const isResetting = resettingRoomId === roomId;

  return (
    <Card sx={{ ...baseCardSx, ...(liveStream && liveCardHighlightSx) }} className="flex-none w-full min-h-60 h-auto" elevation={2}>
      <Box className={`relative h-28 w-full overflow-hidden bg-gradient-to-br ${active ? 'from-teal-500 to-cyan-600' : 'from-red-500 to-orange-600'} flex items-center justify-center p-4`}>
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
      </Box>
      <CardContent sx={contentSx} className="flex flex-col flex-grow p-4">
        <Typography variant="h6" component="div" className="mb-2 font-bold text-center" color="text.primary">
          {name}
        </Typography>
        <Box className="flex justify-center flex-wrap gap-2 mb-2">
          <Chip label={type.toUpperCase()} size="small" color="primary" />
          {recording && <Chip label="RECORDING" size="small" icon={<FiberManualRecordIcon />} color="warning" />}
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
         
          {loadingConnections ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            <Typography variant="body2" color="text.secondary">
              {connectionCount !== null ? connectionCount : 'N/A'}
            </Typography>
          )}
        </Box>
      </CardContent>

      {/* New: Sticky Footer for Action buttons */}
      <Box sx={stickyFooterSx(theme)}>
        {roomId && onResetRoom && (
          <Tooltip title="Reset Room Session">
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
          </Tooltip>
        )}
        {roomId && onViewRoom && (
          <Tooltip title="View Room Details">
            <IconButton
              aria-label="view room details"
              color="info"
              onClick={() => onViewRoom(roomId)}
              sx={{ '&:hover': { bgcolor: 'info.light' } }}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        )}
        {roomId && onConnectDefaultClient && (
          <Tooltip title="Connect to Room with Default Client">
            <IconButton
              aria-label="connect default client"
              color="primary"
              onClick={() => onConnectDefaultClient(roomId)}
              sx={{ '&:hover': { bgcolor: 'primary.light' } }}
            >
              <VideocamIcon />
            </IconButton>
          </Tooltip>
        )}
        {roomId && onJoinRoom && (
          <Tooltip title="Join Room">
            <IconButton
              aria-label="join room"
              color="success"
              onClick={() => onJoinRoom(roomId)}
              sx={{ '&:hover': { bgcolor: 'success.light' } }}
            >
              <CallIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Card>
  );
};
