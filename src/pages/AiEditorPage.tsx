import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  aiEditorStore,
  clearDiff,
  setOpenedFile,
  setLastLlmResponse,
  setRequestType,
  setLlmOutputFormat,
  setInstruction,
  setUploadedFile,
  setError, // For global errors to be displayed at the top level
} from '@/stores/aiEditorStore';
import { addLog } from '@/stores/logStore'; // NEW: Import addLog for logging page events
import { resizeTerminal } from '@/stores/terminalStore'; 

import {
  Box,
  Typography,
  Alert, // Added for global error display
  useTheme,
  LinearProgress,
} from '@mui/material';
import { FileTree } from '@/components/file-tree';
import OpenedFileViewer from '@/components/OpenedFileViewer';
import { RequestType, LlmOutputFormat } from '@/types';
import FileTabs from '@/components/FileTabs';
import { useRightSidebar } from '@/components/Layout'; // Import the useRightSidebar hook
import AiSidebarContent from '@/components/AiSidebarContent'; // NEW: Import the consolidated AI sidebar content
import { XTerminal } from '@/components/Terminal/Terminal'; // NEW: Import XTerminal component
import { handleLogout } from '@/services/authService';

// Constants for layout.
const FILE_TREE_WIDTH = 300; // Fixed width for the file tree when visible
const FILE_TABS_HEIGHT = 48; // Approximate height of the new file tabs component (can be theme-driven later)
const RESIZE_HANDLE_HEIGHT = 4; // Height of the draggable divider

/**
 * The main AI Editor page component, displaying the file tree, file editor,
 * and integrating the AI sidebar content. It handles global loading, errors,
 * and URL parameter parsing for AI request types and output formats.
 */
const AiEditorPage: React.FC = () => {
  const {
    error: globalError, // Renamed to avoid conflict, used for immediate page-level alerts
    currentProjectPath,
    lastLlmResponse,
    loading,
    applyingChanges,
    isBuilding,
  } = useStore(aiEditorStore);
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const [showFileTree, setShowFileTree] = useState(true); // State for toggling file tree visibility
  const { setRightSidebar } = useRightSidebar(); // Use the custom hook
  const navigate = useNavigate(); // For redirecting after terminal logout

  // State for resizable terminal
  const [terminalHeight, setTerminalHeight] = useState(300); // Initial height for terminal
  const [isResizing, setIsResizing] = useState(false);
  const [initialMouseY, setInitialMouseY] = useState(0);
  const [initialTerminalHeight, setInitialTerminalHeight] = useState(0);
  const contentAreaRef = useRef<HTMLDivElement>(null); // Ref for the resizable content area
  const [showTerminal, setShowTerminal] = useState(false);
  // New derived state for the loader
  const isAIGeneratingOrModifying = loading || applyingChanges || isBuilding;

  // Effect to set and unset the right sidebar content
  useEffect(() => {
    // Set the consolidated AI sidebar content component
    setRightSidebar(<AiSidebarContent />);
    addLog('AI Editor Page', 'AI Editor Page mounted, sidebar content set.', 'debug');

    // Cleanup: remove sidebar content when component unmounts
    return () => {
      setRightSidebar(null);
      addLog('AI Editor Page', 'AI Editor Page unmounted, sidebar content cleared.', 'debug');
    };
  }, [setRightSidebar]); // Dependencies only include setRightSidebar

  useEffect(() => {
    // Clear diff when project or response changes
    clearDiff();
  }, [lastLlmResponse, currentProjectPath]);

  // Handle requestType and llmOutputFormat from URL query parameters
  useEffect(() => {
    const requestTypeParam = searchParams.get('requestType');
    const outputFormatParam = searchParams.get('output');

    // Update RequestType from URL
    if (
      requestTypeParam &&
      RequestType[requestTypeParam as keyof typeof RequestType]
    ) {
      const newRequestType =
        RequestType[requestTypeParam as keyof typeof RequestType];
      if (aiEditorStore.get().requestType !== newRequestType) {
        setRequestType(newRequestType); // This action also logs internally
        // Clear related states when switching generator types via URL
        setInstruction('');
        setUploadedFile(null, null, null);
        setLastLlmResponse(null);
        setOpenedFile(null); // Close any currently viewed file when switching generator types
        addLog('AI Editor Page', `Request type set from URL: ${newRequestType}`, 'info');
      }
    } else if (aiEditorStore.get().requestType !== RequestType.LLM_GENERATION) {
      // If no requestType param, default to LLM_GENERATION
      setRequestType(RequestType.LLM_GENERATION); // This action also logs internally
      addLog('AI Editor Page', `Defaulting request type to LLM_GENERATION (no URL param).`, 'info');
    }

    // Update LlmOutputFormat from URL
    if (
      outputFormatParam &&
      LlmOutputFormat[outputFormatParam as keyof typeof LlmOutputFormat]
    ) {
      const newLlmOutputFormat =
        LlmOutputFormat[outputFormatParam as keyof typeof LlmOutputFormat];
      if (aiEditorStore.get().llmOutputFormat !== newLlmOutputFormat) {
        setLlmOutputFormat(newLlmOutputFormat); // This action also logs internally
        addLog('AI Editor Page', `Output format set from URL: ${newLlmOutputFormat}`, 'info');
      }
    } else if (aiEditorStore.get().llmOutputFormat !== LlmOutputFormat.YAML) {
      // If no outputFormat param, default to YAML (matching store default)
      setLlmOutputFormat(LlmOutputFormat.YAML); // This action also logs internally
      addLog('AI Editor Page', `Defaulting output format to YAML (no URL param).`, 'info');
    }
  }, [searchParams]);

  // Resizing handlers
  const startResize = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    setInitialMouseY(e.clientY);
    setInitialTerminalHeight(terminalHeight);
    document.body.style.cursor = 'ns-resize'; // Change cursor globally
  }, [terminalHeight]);

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const deltaY = e.clientY - initialMouseY;
    // For bottom-to-top resize:
    // If mouse moves up (deltaY is negative), terminal height increases.
    // If mouse moves down (deltaY is positive), terminal height decreases.
    let newHeight = initialTerminalHeight - deltaY;

    const MIN_TERMINAL_HEIGHT = 30; // Minimum pixel height for terminal
    const MIN_VIEWER_HEIGHT = 150; // Minimum pixel height for OpenedFileViewer

    const totalResizableHeight = contentAreaRef.current?.clientHeight || 0;
    // Calculate max possible terminal height respecting minimum viewer height
    const maxPossibleTerminalHeight = Math.max(0, totalResizableHeight - MIN_VIEWER_HEIGHT - RESIZE_HANDLE_HEIGHT);

    // Constrain newHeight within min and max bounds
    newHeight = Math.max(MIN_TERMINAL_HEIGHT, Math.min(newHeight, maxPossibleTerminalHeight));
    setTerminalHeight(newHeight);
  }, [isResizing, initialMouseY, initialTerminalHeight]);

  const stopResize = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = 'default'; // Reset cursor
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResize);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResize);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResize);
    };
  }, [isResizing, resize, stopResize]);

  const handleTerminalLogout = useCallback(async () => {
    try {
      await handleLogout();
      navigate('/login'); // Redirect to login page after logout
      addLog('Terminal', 'User logged out successfully via terminal.', 'info');
    } catch (error) {
      console.error('Failed to log out from terminal:', error);
      setError('Failed to log out from terminal.'); // Use global error store
      addLog('Terminal', `Failed to log out from terminal: ${error}`, 'error');
    }
  }, [navigate]);

  // Function to handle terminal resizing
  const handleTerminalResize = useCallback(() => {
    const cols = Math.floor(window.innerWidth / 10); // Adjust divisor as needed
    const rows = Math.floor(terminalHeight / 20); // Adjust divisor as needed
    console.log(`Resizing terminal to ${cols} cols and ${rows} rows`);
    console.log(`Terminal Height: ${terminalHeight}`);
    // console.log(`Window inner Height: ${window.innerHeight}`);
    // console.log(`Window outer Height: ${window.outerHeight}`);
    // console.log(`Window screen Height: ${window.screen.height}`);
    // console.log(`Document client Height: ${document.documentElement.clientHeight}`);
    // console.log(`Document offset Height: ${document.documentElement.offsetHeight}`);
    // console.log(`Window devicePixelRatio: ${window.devicePixelRatio}`);
    // Resize terminal with calculated cols and rows
    // Adjust divisor as needed

    // Resize terminal with calculated cols and rows
    // Adjust divisor as needed
    // resizeTerminal(cols, rows);
    // console.log(`Resizing terminal to ${cols} cols and ${rows} rows`);
    //resizeTerminal(cols, rows);
  }, [terminalHeight]);
  useEffect(() => {
    // Add event listener for window resize
    window.addEventListener('resize', handleTerminalResize);

    // Call handleTerminalResize on component mount to set initial terminal size
    handleTerminalResize();

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleTerminalResize);
    };
  }, [handleTerminalResize]);

const toggleTerminalVisibility = () => {
    setShowTerminal((prevShowTerminal) => !prevShowTerminal);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%', // Changed from 100dvh to 100% to fit within Layout's main content area
        width: '100%',
        // bgcolor: theme.palette.background.default, // Layout now provides this background
        color: theme.palette.text.primary,
        overflow: 'hidden', // Prevent outer scrollbars
      }}
    >
      {isAIGeneratingOrModifying && (
        <LinearProgress sx={{ width: '100%', flexShrink: 0, zIndex: 1200 }} />
      )}

      {globalError && (
        <Alert
          severity="error"
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1100,
            borderRadius: 0,
            flexShrink: 0,
          }}
        >
          <Typography variant="body2">{globalError}</Typography>
        </Alert>
      )}

      {/* Main content area: FileTree + Editor/Response + PromptGenerator */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          flexGrow: 1, // Allow this box to take up remaining vertical space
          width: '100%',
          minHeight: 0, // Crucial for flex containers
          position: 'relative', // For absolutely positioned elements inside if needed
        }}
      >
        {/* File Tree Panel */}
        <Box
          sx={{
            width: showFileTree ? FILE_TREE_WIDTH : 0,
            flexShrink: 0,
            overflow: 'hidden', // Hide content when collapsed
            transition: 'width 0.2s ease-in-out, border-right 0.2s ease-in-out',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: theme.palette.background.paper,
            borderRight: showFileTree
              ? `1px solid ${theme.palette.divider}`
              : 'none',
          }}
        >
          {currentProjectPath ? (
            <FileTree projectRoot={currentProjectPath} />
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No project opened.
            </Typography>
          </Box>
          )}
        </Box>

        {/* Main Editor/Response Area */}
        <Box
          sx={{
            flexGrow: 1,
            minWidth: 0, // Allow shrinking
            display: 'flex',
            flexDirection: 'column',
            position: 'relative', // For toggle buttons
            bgcolor: theme.palette.background.default,
          }}
        >
          {/* File Tabs */}
          <FileTabs sx={{ flexShrink: 0, height: FILE_TABS_HEIGHT }} setShowTerminal={setShowTerminal} showTerminal={showTerminal} toggleTerminalVisibility={toggleTerminalVisibility} />

          {/* Opened File Viewer, Resizer, and Terminal container */}
          <Box
            ref={contentAreaRef} // Attach ref here to get total height for resizing calculations
            sx={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1, // Takes all available vertical space in its parent
              minHeight: 0, // Allows children to properly manage their height within this flex container
              overflow: 'hidden', // Ensures inner scrollbars are respected
            }}
          >
            {/* Opened File Viewer */}
            <Box
              sx={{
                flexGrow: 1, // Allows OpenedFileViewer to take all remaining space above the terminal
                minHeight: '150px', // Minimum height for the file viewer (adjust as needed)
                overflow: 'auto', // Add scrollbar if content overflows
              }}
            >
              <OpenedFileViewer />
            </Box>

            {showTerminal && (
<>
              <Box
              onMouseDown={startResize}
              sx={{
                height: RESIZE_HANDLE_HEIGHT,
                bgcolor: theme.palette.divider,
                cursor: 'ns-resize',
                flexShrink: 0, // Prevent the handle from shrinking
                '&:hover': {
                  bgcolor: theme.palette.primary.main, // Visual feedback on hover
                },
              }}
            >
            </Box>
            <Box
              sx={{
                height: terminalHeight, // Controlled height
                minHeight: '50px', // Minimum terminal height
                flexShrink: 0, // Prevent terminal from shrinking below its height
                overflow: 'hidden', // XTerminal component itself handles internal scrolling
              }}
            >
              <XTerminal onLogout={handleTerminalLogout} terminalHeight={terminalHeight} />
            </Box>
              </>
            )}
            
          </Box>

          {/* Prompt Generator Panel and AiResponseDisplay are now in the right sidebar */}
        </Box>
      </Box>
    </Box>
  );
};

export default AiEditorPage;
