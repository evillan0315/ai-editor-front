import React from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  IconButton,
  Typography,
  Tooltip,
  useMediaQuery,
  useTheme,
  Paper
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import {
  isTerminalVisible,
  setShowTerminal,
  disconnectTerminal, // ✅ import the disconnect function
} from '@/stores/terminalStore';

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
  const showTerminal = useStore(isTerminalVisible);

  /** ✅ Disconnect socket session first, then hide terminal */
  const handleCloseTerminal = () => {
    if (isConnected) {
      disconnectTerminal();
    }
    setShowTerminal(!showTerminal);
  };

  return (
    <Paper
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 0.8,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderBottom: theme.palette.background.dark,
        ...sx,
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
      </Box>

      <Box>
        {!isSmallScreen && (
          <Tooltip title="Close Terminal">
            <IconButton
              onClick={handleCloseTerminal}
              size="small"
              sx={{ color: '#ffffff', marginLeft: '8px' }}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Paper>
  );
};
