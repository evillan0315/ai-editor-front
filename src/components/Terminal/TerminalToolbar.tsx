import React from 'react';
import {
  Box,
  IconButton,
  Typography,
  Tooltip,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  PlayArrow as ConnectIcon,
  Stop as DisconnectIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

interface TerminalToolbarProps {
  isConnected: boolean;
  currentPath: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onSettings: () => void;
  onLogout: () => void;
  sx?: any;
}

export const TerminalToolbar: React.FC<TerminalToolbarProps> = ({
  isConnected,
  currentPath,
  onConnect,
  onDisconnect,
  onSettings,
  onLogout,
  sx,
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        backgroundColor: '#2d2d30',
        color: '#ffffff',
        borderBottom: '1px solid #3e3e42',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ marginRight: '16px' }}>
          Terminal
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: isConnected ? '#4caf50' : '#f44336',
              marginRight: '8px',
            }}
          />
          <Typography variant="caption">
            {isConnected ? 'Connected' : 'Disconnected'}
          </Typography>
        </Box>

        {/* {currentPath && (
          <Typography variant="caption" sx={{ marginLeft: '16px' }}>
            Path: {currentPath}
          </Typography>
        )} */}
      </Box>

      <Box>
        <Tooltip title={isConnected ? 'Disconnect' : 'Connect'}>
          <IconButton
            onClick={isConnected ? onDisconnect : onConnect}
            size="small"
            sx={{ color: '#ffffff' }}
          >
            {isConnected ? <DisconnectIcon /> : <ConnectIcon />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Settings">
          <IconButton
            onClick={onSettings}
            size="small"
            sx={{ color: '#ffffff', marginLeft: '8px' }}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>

        {!isSmallScreen && (
          <Button
            onClick={onLogout}
            size="small"
            sx={{ color: '#ffffff', marginLeft: '16px' }}
          >
            Logout
          </Button>
        )}
      </Box>
    </Box>
  );
};
