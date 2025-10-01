import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Link as MuiLink } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { loginUser } from '@/api/auth';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { snackbarStore } from '@/stores/snackbarStore';
import PageLayout from '@/components/layouts/PageLayout';

function LoginPage() {
  useAuthRedirect();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await loginUser({ email, password });
      snackbarStore.setSnackbar({ message: 'Login successful!', severity: 'success' });
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login failed:', error);
      snackbarStore.setSnackbar({
        message: error.response?.data?.message || 'Login failed. Please check your credentials.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      body={ // Content passed as body prop to PageLayout
        <Box className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
          <Box
            component="form"
            onSubmit={handleLogin}
            className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md"
          >
            <Typography variant="h4" component="h1" gutterBottom className="text-center mb-6 text-gray-900 dark:text-white">
              Login
            </Typography>
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mb-4"
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mb-6"
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              className="mb-4"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            <Typography variant="body2" className="text-center text-gray-700 dark:text-gray-300">
              Don't have an account?{' '}
              <MuiLink component={RouterLink} to="/register" className="text-blue-600 hover:underline">
                Register
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      }
    />
  );
}

export default LoginPage;
