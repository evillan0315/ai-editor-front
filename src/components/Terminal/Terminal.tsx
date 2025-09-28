import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, useTheme } from '@mui/material';
import { useStore } from '@nanostores/react';

// Xterm imports
import { Terminal as XtermTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import '@xterm/xterm/css/xterm.css'; // Import xterm.js default CSS

import { TerminalToolbar } from './TerminalToolbar';
import TerminalSettingsDialog from './TerminalSettingsDialog';

import {
  terminalStore,
  connectTerminal,
  disconnectTerminal,
  resizeTerminal,
  registerTerminalWriteHandler,
  registerTerminalClearHandler,
  registerTerminalFitHandler,
} from '@/stores/terminalStore';
import { socketService } from '@/services/socketService';
import { handleLogout } from '@/services/authService';
import { themeStore } from '@/stores/themeStore';

interface XTerminalProps {
  onLogout: () => void;
  terminalHeight: number;
}

// Styles for the xterm container
const xtermContainerSx = {
  flexGrow: 1,
  // Ensure the xterm canvas/layers fill the parent Box
  '& .xterm': {
    width: '100%',
    height: '100%',
  },
  '& .xterm-viewport': {
    overflowY: 'auto !important', // xterm manages its own scrollbar
  },
  '& .xterm-screen': {
    width: '100%',
    height: '100%',
  },
};

export const XTerminal: React.FC<XTerminalProps> = ({
  onLogout,
  terminalHeight,
}) => {
  const { isConnected, currentPath } = useStore(terminalStore);
  const navigate = useNavigate();
  const { mode } = useStore(themeStore);
  const theme = useTheme();

  const xtermDivRef = useRef<HTMLDivElement>(null);
  const xtermTerminalRef = useRef<XtermTerminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const webglAddonRef = useRef<WebglAddon | null>(null);

  const [openSettingsDialog, setOpenSettingsDialog] = useState(false);

  // Xterm theme based on MUI theme. Memoize to prevent unnecessary re-creations
  // if only parent component re-renders but mode/theme haven't changed meaningfully.
  const xtermTheme = React.useMemo(() => ({
    background:
      mode === 'dark'
        ? theme.palette.background.default
        : theme.palette.grey[50],
    foreground:
      mode === 'dark'
        ? theme.palette.text.primary
        : theme.palette.text.primary,
    cursor:
      mode === 'dark'
        ? theme.palette.text.primary
        : theme.palette.text.primary,
    cursorAccent:
      mode === 'dark'
        ? theme.palette.background.default
        : theme.palette.grey[50],
    selectionBackground:
      mode === 'dark'
        ? 'rgba(255, 255, 255, 0.3)'
        : 'rgba(0, 0, 0, 0.3)',
    black: '#2E3436',
    red: '#CC0000',
    green: '#4E9A06',
    yellow: '#C4A000',
    blue: '#3465A4',
    magenta: '#75507B',
    cyan: '#06989A',
    white: '#D3D7CF',
    brightBlack: '#555753',
    brightRed: '#EF2929',
    brightGreen: '#8AE234',
    brightYellow: '#FCE94F',
    brightBlue: '#729FCF',
    brightMagenta: '#AD7FA8',
    brightCyan: '#34E2E2',
    brightWhite: '#EEEEEC',
  }), [mode, theme.palette.background.default, theme.palette.grey, theme.palette.text.primary]);

  /** Initialize Xterm.js terminal and addons ONCE on mount */
  useEffect(() => {
    if (!xtermDivRef.current) return;

    const term = new XtermTerminal({
      fontFamily: '"Fira Code", "Monaco", "Consolas", monospace',
      fontSize: 12,
      cursorBlink: true,
      theme: xtermTheme, // Use initial theme from memoized value
      allowTransparency: true,
      disableStdin: true, // Disable xterm.js's local input processing/echoing
    });

    const fitAddon = new FitAddon();
    const webglAddon = new WebglAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webglAddon);
    term.open(xtermDivRef.current);

    xtermTerminalRef.current = term;
    fitAddonRef.current = fitAddon;
    webglAddonRef.current = webglAddon;

    // Register handlers with the store, with safety checks for disposed terminal
    registerTerminalWriteHandler((data: string) => {
      if (xtermTerminalRef.current && !xtermTerminalRef.current.isDisposed) {
        xtermTerminalRef.current.write(data);
      }
    });
    registerTerminalClearHandler(() => {
      if (xtermTerminalRef.current && !xtermTerminalRef.current.isDisposed) {
        xtermTerminalRef.current.clear();
      }
    });
    registerTerminalFitHandler(() => {
      if (fitAddonRef.current && xtermTerminalRef.current && !xtermTerminalRef.current.isDisposed) {
        fitAddonRef.current.fit();
      }
    });

    // Initial fit
    fitAddon.fit();

    // Handle terminal input (e.g., user types command)
    // With disableStdin: true, term.onData will no longer fire for keyboard input.
    // We use term.onKey instead to send input to the backend.
    term.onKey((e: { key: string; domEvent: KeyboardEvent }) => {
      // Access isConnected directly from the store to avoid stale closures
      if (terminalStore.get().isConnected) {
        socketService.sendInput(e.key);
      }
    });

    // Handle terminal resize (when xterm detects a change in its dimensions)
    term.onResize(({ cols, rows }) => {
      // This event fires when the *terminal itself* detects a dimension change
      // (e.g., after fitAddon.fit()). We send these *character dimensions* to the backend PTY.
      // The visual fitting is handled by fitAddon within the component, triggered by other effects.
      resizeTerminal(cols, rows); // Send to backend PTY
    });

    return () => {
      // Cleanup on unmount
      // Ensure addons/terminal are not already disposed before attempting to dispose
      if (webglAddonRef.current && !webglAddonRef.current.isDisposed) {
        webglAddonRef.current.dispose();
      }
      if (fitAddonRef.current && !fitAddonRef.current.isDisposed) {
        fitAddonRef.current.dispose();
      }
      if (xtermTerminalRef.current && !xtermTerminalRef.current.isDisposed) {
        xtermTerminalRef.current.dispose();
      }

      xtermTerminalRef.current = null;
      fitAddonRef.current = null;
      webglAddonRef.current = null;
      registerTerminalWriteHandler(null);
      registerTerminalClearHandler(null);
      registerTerminalFitHandler(null);
    };
  }, []); // Empty dependency array: runs ONCE on mount

  /** Update theme of existing terminal when xtermTheme object itself changes (via useMemo dependencies) */
  useEffect(() => {
    if (xtermTerminalRef.current && !xtermTerminalRef.current.isDisposed) {
      xtermTerminalRef.current.options.theme = xtermTheme;
    }
  }, [xtermTheme]); // Only re-runs if the xtermTheme object reference changes

  /** Auto-connect if token exists */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) handleConnect();
  }, []); // Empty dependency array: runs once on mount

  /** Handle window resize -> fit xterm */
  useEffect(() => {
    const handleWindowResize = () => {
      // Only fit if terminal and addon are initialized and not disposed
      if (fitAddonRef.current && xtermTerminalRef.current && !xtermTerminalRef.current.isDisposed) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleWindowResize);
    handleWindowResize(); // Initial fit based on current window size

    return () => window.removeEventListener('resize', handleWindowResize);
  }, []); // Empty dependency array: Run once on mount and clean up

  /** Trigger fit when terminalHeight prop changes (e.g., parent container resized) */
  useEffect(() => {
    // Only fit if terminal and addon are initialized and not disposed
    if (fitAddonRef.current && xtermTerminalRef.current && !xtermTerminalRef.current.isDisposed) {
      fitAddonRef.current.fit();
    }
  }, [terminalHeight]);

  const handleConnect = async () => {
    try {
      await connectTerminal();
    } catch (error) {
      if (error === 'No authentication token.') {
        console.error('Connection failed:', error);
        await handleLogout();
        navigate('/login');
      }
    }
  };

  const handleDisconnect = () => {
    disconnectTerminal();
  };

  const handleSettings = () => {
    setOpenSettingsDialog(true);
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        border: 0,
        backgroundColor:
          mode === 'dark'
            ? theme.palette.background.paper
            : theme.palette.background.default,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <TerminalToolbar
        isConnected={isConnected}
        currentPath={currentPath}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onSettings={handleSettings}
        onLogout={onLogout}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      />

      <Box
        ref={xtermDivRef}
        sx={{
          ...xtermContainerSx,
          height: `calc(${terminalHeight}px - ${theme.spacing(5)})`, // Adjust height for toolbar
          backgroundColor: xtermTheme.background,
        }}
      />

      <TerminalSettingsDialog
        open={openSettingsDialog}
        onClose={() => setOpenSettingsDialog(false)}
      />
    </Paper>
  );
};