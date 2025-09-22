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
import Brightness1Icon from '@mui/icons-material/Brightness1';
import TerminalIcon from '@mui/icons-material/Terminal';
import {
  isTerminalVisible,
  setShowTerminal,
  disconnectTerminal, 
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
      elevation={2}
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 0.8,
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        borderBottom: theme.palette.background.dark,
        borderTop: theme.palette.background.dark,
        borderRadius: 0,
        ...sx,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
         <Tooltip title="Close Terminal">
            <IconButton
              onClick={handleCloseTerminal}
              size="small"
            >
              <TerminalIcon />
            </IconButton>
          </Tooltip>
        <Typography variant="subtitle1" sx={{ marginRight: '16px' }}>
          Terminal
        </Typography>

        
      </Box>

      <Box>
        {!isSmallScreen && (
          <Tooltip title="Close Terminal">
            <IconButton
              onClick={handleCloseTerminal}
              size="small"
              sx={{ color: isConnected ? '#4caf50' : '#f44336', marginLeft: '8px',  }}
            >
              <Brightness1Icon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    
    </Paper>
  );
};
