import React, { useEffect } from 'react';
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
const FOOTER_HEIGHT = 30; // Estimated height for the footer

const Layout: React.FC = () => {
  const { loading: authLoading } = useStore(authStore);
  const theme = useTheme();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden" // Changed to h-screen and added overflow-hidden
      style={{ backgroundColor: theme.palette.background.default }}
    >
      <Navbar />
      {authLoading && (
        <Box sx={{ width: '100%', position: 'sticky', top: 0, zIndex: 1100 }}>
          <LinearProgress />
        </Box>
      )}
      <main
        className="flex-grow w-full flex flex-col overflow-auto"
        style={{
          height: `calc(100vh - ${NAVBAR_HEIGHT}px - ${FOOTER_HEIGHT}px)`,
        }}
      >
        <Outlet />
      </main>
      <footer
        className="w-full text-center text-sm py-1 sticky bottom-0 z-100"
        style={{
          height: `${FOOTER_HEIGHT}px`, // Explicit height for footer
          color: theme.palette.text.secondary,
          backgroundColor: theme.palette.background.paper,
          borderTop: `1px solid ${theme.palette.divider}`, // Added a top border for visual separation
        }}
      >
        © 2025 AI Editor. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;
