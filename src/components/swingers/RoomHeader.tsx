import React, { useCallback } from 'react';
import { Box, IconButton, useTheme, Paper, ButtonGroup, Tooltip, Typography } from '@mui/material';
import DragIndicatorOutlinedIcon from '@mui/icons-material/DragIndicatorOutlined';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import VideoCallIcon from '@mui/icons-material/VideoCall'; // For connectClientData
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // Alternative for getClientData

import { showDialog } from '@/stores/dialogStore';
import { RoomConnectionDialog } from '@/components/swingers/dialogs/RoomConnectionDialog';
import { useStore } from '@nanostores/react';
import { currentDefaultConnection } from '@/components/swingers/stores/connectionStore';

interface RoomHeaderProps {
  // Define any props here
}

export const RoomHeader: React.FC<RoomHeaderProps> = () => {
  const theme = useTheme();
  const $currentDefaultConnection = useStore(currentDefaultConnection);

  const handleShowDefaultClientData = useCallback(() => {
    showDialog({
      title: 'Default Client Connection Data',
      content: (
        <Box sx={{ p: 2 }}>
          { $currentDefaultConnection.id ? (
            <>
              <Typography variant="body1" gutterBottom className="font-semibold">Connection ID: <span className="font-normal">{$currentDefaultConnection.id}</span></Typography>
              <Typography variant="body1" gutterBottom className="font-semibold">Session ID: <span className="font-normal">{$currentDefaultConnection.sessionId}</span></Typography>
              <Typography variant="body1" gutterBottom className="font-semibold">Token: <span className="font-normal break-all">{$currentDefaultConnection.token}</span></Typography>
              <Typography variant="body2" gutterBottom className="font-semibold">Role: <span className="font-normal">{$currentDefaultConnection.role}</span></Typography>
              { $currentDefaultConnection.clientData && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom className="font-semibold">Client Data:</Typography>
                  <pre className="whitespace-pre-wrap break-all text-xs p-2 rounded bg-gray-100 dark:bg-gray-800">{
                    JSON.stringify(JSON.parse($currentDefaultConnection.clientData), null, 2)
                  }</pre>
                </Box>
              )}
            </>
          ) : (
            <Typography variant="body1" color="text.secondary">No default client connection data found.</Typography>
          )}
        </Box>
      ),
      maxWidth: 'sm',
    });
  }, [$currentDefaultConnection]);

  const handleConnectDefaultClientGlobally = useCallback(() => {
    showDialog({
      title: 'Connect Default Client',
      content: <RoomConnectionDialog connectionRole={'SUBSCRIBER'}/>, // Pass connectionRole as SUBSCRIBER
      maxWidth: 'md',
      fullWidth: true,
      showCloseButton: true,
    });
  }, []);

  return (
    <Paper
      sx={{
        position: 'sticky',
        top: 0,
        left: 0,
        borderRadius: 0,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
        zIndex: 1,
        p: 0.6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 0,
        width:'100%'
      }}
      className="w-full"
    >
      <Box className="flex items-center gap-0">
        <IconButton sx={{ color: theme.palette.text.secondary, mr: 1 }}>
          <MenuOutlinedIcon />
        </IconButton>
      </Box>
      <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
        <Typography variant="h6" component="span" className="font-semibold">
          Rooms
        </Typography>
      </Box>
      
      <ButtonGroup variant="outlined" aria-label="room actions button group" size="small">
        <Tooltip title="Show Default Client Data">
          <IconButton size="small" onClick={handleShowDefaultClientData} color="info">
            <AccountCircleIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Connect Default Client (Global)">
          <IconButton size="small" onClick={handleConnectDefaultClientGlobally} color="primary">
            <VideoCallIcon />
          </IconButton>
        </Tooltip>
        <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
          <DragIndicatorOutlinedIcon />
        </IconButton>
      </ButtonGroup>
    </Paper>
  );
};
