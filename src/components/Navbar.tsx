import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import { handleLogout } from '@/services/authService';
import ThemeToggle from './ThemeToggle'; // Import ThemeToggle

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import AccountCircle from '@mui/icons-material/AccountCircle';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';

const Navbar: React.FC = () => {
  const { isLoggedIn, user, loading } = useStore(authStore);
  const navigate = useNavigate();
  const theme = useTheme(); // Get current MUI theme

  const onLogout = async () => {
    await handleLogout();
    navigate('/login');
  };

  return (
    <AppBar
      position="static"
      sx={{
        bgcolor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar className="flex justify-between items-center mx-auto w-full px-4 sm:px-6 lg:px-8">
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            textDecoration: 'none',
            color: theme.palette.text.primary,
            fontWeight: 'bold',
          }}
        >
          AI Editor
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ThemeToggle /> {/* Add ThemeToggle here */}
          {loading ? (
            <CircularProgress
              size={24}
              sx={{ color: theme.palette.text.primary }}
            />
          ) : isLoggedIn ? (
            <>
              <AccountCircle sx={{ color: theme.palette.text.primary }} />
              <Typography
                variant="body1"
                sx={{
                  display: { xs: 'none', sm: 'block' },
                  color: theme.palette.text.primary,
                }}
              >
                {user?.name || user?.email || 'User'}
              </Typography>
              <Button
                color="inherit"
                onClick={onLogout}
                sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}
              >
                Logout
              </Button>
            </>
          ) : (
            <Button
              color="inherit"
              component={Link}
              to="/login"
              sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
