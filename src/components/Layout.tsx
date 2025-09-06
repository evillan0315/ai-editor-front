import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { checkAuthStatus } from '@/services/authService';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

const Layout: React.FC = () => {
  const { loading: authLoading } = useStore(authStore);
  const theme = useTheme();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: theme.palette.background.default }}
    >
      <Navbar />
      {authLoading && (
        <Box sx={{ width: '100%', position: 'sticky', top: 0, zIndex: 1100 }}>
          <LinearProgress />
        </Box>
      )}
      <main className="flex-grow w-full flex flex-col overflow-hidden">
        <Outlet />
      </main>
      <footer
        className="w-full mt-auto text-center text-sm py-4"
        style={{
          color: theme.palette.text.secondary,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        © 2025 AI Editor. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;
