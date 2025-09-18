import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, useTheme } from '@mui/material';
import { useStore } from '@nanostores/react';
import { TerminalToolbar } from './TerminalToolbar';
import TerminalSettingsDialog from './TerminalSettingsDialog';

import {
  terminalStore,
  connectTerminal,
  disconnectTerminal,
  executeCommand,
  browseHistory,
  resizeTerminal,
  appendOutput,
} from '@/stores/terminalStore';
import { socketService } from '@/services/socketService';
import { themeStore } from '@/stores/themeStore';

interface XTerminalProps {
  onLogout: () => void;
  terminalHeight: number;
}

export const XTerminal: React.FC<XTerminalProps> = ({
  onLogout,
  terminalHeight,
}) => {
  const { output, currentPath, isConnected, commandHistory, historyIndex } =
    useStore(terminalStore);

  const { mode } = useStore(themeStore);
  const theme = useTheme();

  const inputRef = useRef<HTMLInputElement>(null);
  const settingsDialogRef = useRef<HTMLDialogElement>(null);
  const outputContainerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  // const [terminalHeight, setTerminalHeight] = useState('400px');

  const handleConnect = async () => {
    try {
      await connectTerminal();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = () => {
    disconnectTerminal();
  };

  const handleSettings = () => {
    setOpen(true);
  };

  /** Command history navigation + execution */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      browseHistory('up');
      if (inputRef.current && historyIndex >= 0) {
        inputRef.current.value = commandHistory[historyIndex] || '';
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      browseHistory('down');
      if (inputRef.current) {
        inputRef.current.value =
          historyIndex < commandHistory.length - 1
            ? commandHistory[historyIndex] || ''
            : '';
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const command = inputRef.current?.value || '';
      if (command.trim()) {
        executeCommand(command);
        if (inputRef.current) inputRef.current.value = '';
      }
    }
  };

  /** Auto-connect if token exists */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) handleConnect();
  }, []);

  /** Register socket listeners once and clean up on unmount
   *  to prevent double output when React.StrictMode mounts twice.
   */
  useEffect(() => {
    const handleOutput = (data: string) => appendOutput(data);
    const handleError = (data: string) => appendOutput(`Error: ${data}`);

    socketService.on('output', handleOutput);
    socketService.on('outputMessage', handleOutput);
    socketService.on('error', handleError);

    return () => {
      socketService.off('output');
      socketService.off('outputMessage');
      socketService.off('error');
    };
  }, []);

  /** Auto-scroll when output changes */
  useEffect(() => {
    const container = outputContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [output]);

  /** Handle window resize -> send size to backend */
  useEffect(() => {
    if (!isConnected) return;

    const handleResize = () => {
      const cols = Math.floor(window.innerWidth / 10);
      const rows = Math.floor(terminalHeight / 20);
      resizeTerminal(cols, rows);
    };

    handleResize(); // send initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isConnected, terminalHeight]);

  /** Focus the input on initial load */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /** Clicking output container also focuses the input */
  const handleOutputClick = () => {
    inputRef.current?.focus();
  };

  const getTruncatedPath = (path: string) => {
    const parts = path.split('/').filter((part) => part !== '');
    if (parts.length <= 3) {
      return path;
    }
    return '.../' + parts.slice(-3).join('/');
  };

  return (
    <Paper
      elevation={3}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor:
          mode === 'dark'
            ? theme.palette.background.default
            : theme.palette.background.paper,
        color:
          mode === 'dark'
            ? theme.palette.text.primary
            : theme.palette.text.secondary,
        overflow: 'hidden',
        position: 'relative', // Make Paper a positioning context
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
        ref={outputContainerRef}
        onClick={handleOutputClick}
        sx={{
          flexGrow: 1,
          padding: '8px',
          overflow: 'auto',
          color:
            mode === 'dark'
              ? theme.palette.text.primary
              : theme.palette.text.secondary,
          fontFamily: '"Fira Code", "Monaco", "Consolas", monospace',
          fontSize: '12px',
          whiteSpace: 'pre-wrap',
          cursor: 'text',
        }}
      >
        {output.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px',
          backgroundColor:
            mode === 'dark'
              ? theme.palette.background.default
              : theme.palette.background.paper,
          position: 'sticky', // Stick to the bottom
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        {/*<Box
          sx={{
            color: '#4ec9b0',
            marginRight: '8px',
            fontFamily: 'monospace',
            overflow: 'hidden', // Hide overflowing text
            whiteSpace: 'nowrap', // Prevent wrapping
            textOverflow: 'ellipsis', // Add ellipsis
            maxWidth: 'calc(20vw - 16px)', // occupy maximum 30% of the viewport width to allow space for the input
            '@media (max-width: 500px)': {
              maxWidth: 'calc(10vw - 16px)', // Adjust the width for smaller screens
            },
          }}
        >
          <span className="full-path" style={{ display: 'inline' }}>
            <Box
              sx={{
                display: 'inline',
                '@media (max-width: 500px)': {
                  display: 'none',
                },
              }}
            >
              {currentPath}$
            </Box>
          </span>
          <span className="truncated-path" style={{ display: 'none' }}>
            <Box
              sx={{
                display: 'none',
                '@media (max-width: 500px)': {
                  display: 'inline',
                },
              }}
            >
              {getTruncatedPath(currentPath)}$
            </Box>
          </span>
        </Box> */}
        <input
          ref={inputRef}
          type="text"
          disabled={!isConnected}
          onKeyDown={handleKeyDown}
          placeholder="Type a command..."
          style={{
            flexGrow: 1,

            backgroundColor: 'transparent',
            border: 'none',
            color:
              mode === 'dark'
                ? theme.palette.text.primary
                : theme.palette.text.secondary,
            fontFamily: '"Fira Code", "Monaco", "Consolas", monospace',
            fontSize: '12px',
            outline: 'none',
          }}
        />
      </Box>

      <TerminalSettingsDialog open={open} onClose={() => setOpen(false)} />
    </Paper>
  );
};
