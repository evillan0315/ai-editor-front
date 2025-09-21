import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import { checkAuthStatus } from '@/services/authService';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import { llmStore } from '@/stores/llmStore';
import { isRightSidebarVisible, isLeftSidebarVisible } from '@/stores/uiStore';
import Navbar from './Navbar';
import {
  RightSidebarContent,
  LeftSidebarContent,
} from '@/components/SidebarContent';

const NAVBAR_HEIGHT = 64;
const FOOTER_HEIGHT = 30;

const RIGHT_SIDEBAR_STORAGE_KEY = 'rightSidebarWidth';
const LEFT_SIDEBAR_STORAGE_KEY = 'leftSidebarWidth';

const DEFAULT_SIDEBAR_WIDTH = 300;
const MIN_SIDEBAR_WIDTH = 300;
const MAX_SIDEBAR_WIDTH = 1000;
const SIDEBAR_RESIZER_WIDTH = 4;

interface LayoutProps {
  footer?: React.ReactNode | null;
}

const Layout: React.FC<LayoutProps> = ({ footer }) => {
  const { loading: authLoading } = useStore(authStore);
  const { loading: llmLoading, isBuilding } = useStore(llmStore);
  
  const theme = useTheme();
  const layoutLoader = authLoading || llmLoading || isBuilding;
  const $isRightSidebarVisible = useStore(isRightSidebarVisible);
  const $isLeftSidebarVisible = useStore(isLeftSidebarVisible);

  // Sidebar widths (persisted)
  const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(() => {
    const stored = localStorage.getItem(RIGHT_SIDEBAR_STORAGE_KEY);
    return stored ? parseInt(stored, 10) : DEFAULT_SIDEBAR_WIDTH;
  });

  const [leftSidebarWidth, setLeftSidebarWidth] = useState<number>(() => {
    const stored = localStorage.getItem(LEFT_SIDEBAR_STORAGE_KEY);
    return stored ? parseInt(stored, 10) : DEFAULT_SIDEBAR_WIDTH;
  });

  // Resizing state
  const [isResizing, setIsResizing] = useState<null | 'left' | 'right'>(null);
  const initialMouseX = useRef(0);
  const initialSidebarWidth = useRef(0);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  /** Start resizing a sidebar */
  const startResizing = useCallback(
    (side: 'left' | 'right') => (e: React.MouseEvent) => {
      setIsResizing(side);
      initialMouseX.current = e.clientX;
      initialSidebarWidth.current =
        side === 'left' ? leftSidebarWidth : rightSidebarWidth;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      document.body.style.pointerEvents = 'none';
    },
    [leftSidebarWidth, rightSidebarWidth],
  );

  const stopResizing = useCallback(() => {
    if (isResizing) {
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      document.body.style.pointerEvents = 'auto';
      if (isResizing === 'left') {
        localStorage.setItem(
          LEFT_SIDEBAR_STORAGE_KEY,
          leftSidebarWidth.toString(),
        );
      } else {
        localStorage.setItem(
          RIGHT_SIDEBAR_STORAGE_KEY,
          rightSidebarWidth.toString(),
        );
      }
      setIsResizing(null);
    }
  }, [isResizing, leftSidebarWidth, rightSidebarWidth]);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const deltaX = e.clientX - initialMouseX.current;
      if (isResizing === 'left') {
        let newWidth = initialSidebarWidth.current + deltaX;
        newWidth = Math.max(
          MIN_SIDEBAR_WIDTH,
          Math.min(MAX_SIDEBAR_WIDTH, newWidth),
        );
        setLeftSidebarWidth(newWidth);
      } else {
        let newWidth = initialSidebarWidth.current - deltaX;
        newWidth = Math.max(
          MIN_SIDEBAR_WIDTH,
          Math.min(MAX_SIDEBAR_WIDTH, newWidth),
        );
        setRightSidebarWidth(newWidth);
      }
    },
    [isResizing],
  );

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResizing);
    } else {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  return (
    <Box
      className="h-screen flex flex-col overflow-hidden"
      sx={{ backgroundColor: theme.palette.background.default }}
    >
      <Navbar />

      {layoutLoader && (
        <Box className="w-full sticky top-0 z-[1100] flex-shrink-0">
          <LinearProgress />
        </Box>
      )}

      {/* Main content + optional sidebars */}
      <Box
        className="flex-grow w-full flex flex-row overflow-hidden"
        sx={{ height: `calc(100vh - ${NAVBAR_HEIGHT}px - ${FOOTER_HEIGHT}px)` }}
      >
        {/* Left sidebar */}
        {$isLeftSidebarVisible && (
          <>
            <Box
              className="flex-shrink-0 overflow-auto flex flex-col border-r"
              sx={{
                width: leftSidebarWidth,
                backgroundColor: theme.palette.background.paper,
                borderColor: theme.palette.divider,
              }}
            >
              <LeftSidebarContent />
            </Box>
            {/* Draggable resizer */}
            <Box
              onMouseDown={startResizing('left')}
              className="flex-shrink-0 cursor-ew-resize z-10"
              sx={{
                width: SIDEBAR_RESIZER_WIDTH,
                backgroundColor: theme.palette.divider,
                transition: 'background-color 0.2s ease',
        
                '&:hover': {
                  backgroundColor: theme.palette.primary.main,
                },
              }}
              title="Resize sidebar"
            />
          </>
        )}

        {/* Main Outlet content */}
        <Box
          className="flex-grow flex flex-col overflow-auto min-w-0"
          sx={{ backgroundColor: theme.palette.background.default }}
        >
          <Outlet />
        </Box>

        {/* Right sidebar */}
        {$isRightSidebarVisible && (
          <>
            {/* Draggable resizer */}
            <Box
              onMouseDown={startResizing('right')}
              className="flex-shrink-0 cursor-ew-resize z-10"
              sx={{
                width: SIDEBAR_RESIZER_WIDTH,
                backgroundColor: theme.palette.divider,
                transition: 'background-color 0.2s ease',
                '&:hover': {
                  backgroundColor: theme.palette.primary.main,
                },
              }}
              title="Resize sidebar"
            />
            <Box
              className="flex-shrink-0 overflow-auto flex flex-col border-l pb-8"
              sx={{
                width: rightSidebarWidth,
                backgroundColor: theme.palette.background.paper,
                borderColor: theme.palette.divider,
              }}
            >
              <RightSidebarContent />
            </Box>
          </>
        )}
      </Box>

      {/* Sticky footer */}
      {footer && (
        <Box
          className="fixed bottom-0 z-[1300] w-full flex justify-center items-center border-t"
          sx={{
            height: FOOTER_HEIGHT,
            backgroundColor: theme.palette.background.paper,
            borderColor: theme.palette.divider,
          }}
        >
          {footer}
        </Box>
      )}
    </Box>
  );
};

export default Layout;
