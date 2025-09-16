import React, {
  useEffect,
  useState,
  createContext,
  useContext,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { checkAuthStatus } from '@/services/authService';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

// Constants for layout
const NAVBAR_HEIGHT = 64; // Approximate height of MUI AppBar
const FOOTER_HEIGHT = 0; // Keeping footer height minimal as it's not present globally

// Constants for resizable right sidebar
const RIGHT_SIDEBAR_STORAGE_KEY = 'rightSidebarWidth';
const DEFAULT_RIGHT_SIDEBAR_WIDTH = 300;
const MIN_RIGHT_SIDEBAR_WIDTH = 300;
const MAX_RIGHT_SIDEBAR_WIDTH = 1000;
const SIDEBAR_RESIZER_WIDTH = 4; // Width of the draggable handle in pixels

// Define context type for the right sidebar
interface RightSidebarContextType {
  setRightSidebar: (content: React.ReactNode | null) => void;
}

// Create a context for the right sidebar
const RightSidebarContext = createContext<RightSidebarContextType | undefined>(
  undefined,
);

// Custom hook to use the right sidebar context
export const useRightSidebar = () => {
  const context = useContext(RightSidebarContext);
  if (context === undefined) {
    throw new Error('useRightSidebar must be used within a Layout component');
  }
  return context;
};

const Layout: React.FC = () => {
  const { loading: authLoading } = useStore(authStore);
  const theme = useTheme();
  const [rightSidebarContent, setRightSidebarContent] =
    useState<React.ReactNode | null>(null);

  // State for resizable sidebar
  const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(() => {
    const storedWidth = localStorage.getItem(RIGHT_SIDEBAR_STORAGE_KEY);
    return storedWidth
      ? parseInt(storedWidth, 10)
      : DEFAULT_RIGHT_SIDEBAR_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const initialMouseX = useRef(0);
  const initialSidebarWidth = useRef(0);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      setRightSidebar: setRightSidebarContent,
    }),
    [],
  );

  // --- Resizing Handlers ---
  const startResizing = useCallback(
    (e: React.MouseEvent) => {
      setIsResizing(true);
      initialMouseX.current = e.clientX;
      initialSidebarWidth.current = rightSidebarWidth;
      document.body.style.cursor = 'ew-resize'; // Change cursor globally
      document.body.style.userSelect = 'none'; // Prevent text selection during drag
      document.body.style.pointerEvents = 'none'; // Prevent interactions with elements below
    },
    [rightSidebarWidth],
  );

  const stopResizing = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
    document.body.style.pointerEvents = 'auto';
    localStorage.setItem(
      RIGHT_SIDEBAR_STORAGE_KEY,
      rightSidebarWidth.toString(),
    ); // Persist the new width
  }, [rightSidebarWidth]);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const deltaX = e.clientX - initialMouseX.current;
        // For resizing from right to left (handle on left edge of sidebar):
        // Moving mouse left (deltaX < 0) should increase width
        // Moving mouse right (deltaX > 0) should decrease width
        let newWidth = initialSidebarWidth.current - deltaX;

        // Apply min/max width constraints
        newWidth = Math.max(
          MIN_RIGHT_SIDEBAR_WIDTH,
          Math.min(MAX_RIGHT_SIDEBAR_WIDTH, newWidth),
        );
        setRightSidebarWidth(newWidth);
      }
    },
    [isResizing],
  );

  // Effect to add/remove global event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResizing);
    } else {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResizing);
    }
    // Cleanup function
    return () => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]); // Dependencies are crucial for useCallback

  return (
    <RightSidebarContext.Provider value={contextValue}>
      <div
        className="h-screen flex flex-col overflow-hidden"
        style={{ backgroundColor: theme.palette.background.default }}
      >
        <Navbar />
        {authLoading && (
          <Box
            sx={{
              width: '100%',
              position: 'sticky',
              top: 0,
              zIndex: 1100,
              flexShrink: 0,
            }}
          >
            <LinearProgress />
          </Box>
        )}
        {/* Main content area and optional right sidebar */}
        <div
          className="flex-grow w-full flex flex-row overflow-hidden" // New flex row container for main content + sidebar
          style={{
            height: `calc(100vh - ${NAVBAR_HEIGHT}px - ${FOOTER_HEIGHT}px)`,
          }}
        >
          <main
            className="flex-grow flex flex-col overflow-auto" // Main content area, takes available width
            style={{
              minWidth: 0, // Allow main content to shrink
              backgroundColor: theme.palette.background.default, // Background for the main content area
            }}
          >
            <Outlet />
          </main>
          {rightSidebarContent && (
            <>
              {/* Resizer handle for the right sidebar */}
              <div
                onMouseDown={startResizing}
                className="flex-shrink-0 cursor-ew-resize" // Tailwind utility for cursor
                style={{
                  width: SIDEBAR_RESIZER_WIDTH,
                  backgroundColor: theme.palette.divider, // Match theme divider color
                  zIndex: 10, // Ensure it's above other content if necessary
                }}
                title="Resize sidebar"
              />
              <aside
                className="flex-shrink-0"
                style={{
                  width: rightSidebarWidth,
                  backgroundColor: theme.palette.background.paper, // Sidebar background
                  borderLeft: `1px solid ${theme.palette.divider}`,
                  overflow: 'auto', // Allow sidebar content to scroll
                  display: 'flex', // Ensure sidebar content fills height
                  flexDirection: 'column',
                }}
              >
                {rightSidebarContent}
              </aside>
            </>
          )}
        </div>
      </div>
    </RightSidebarContext.Provider>
  );
};

export default Layout;
