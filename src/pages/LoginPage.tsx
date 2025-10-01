import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Link as MuiLink } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { loginLocal } from '@/api/auth'; // Updated import to loginLocal
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { authStore, setLoading, loginSuccess } from '@/stores/authStore'; // Import from authStore
import { showGlobalSnackbar } from '@/stores/snackbarStore'; // Import showGlobalSnackbar
import PageLayout from '@/components/layouts/PageLayout';
import { useStore } from '@nanostores/react';

function LoginPage() {
  useAuthRedirect();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Use loading state from authStore
  const { loading: authLoading } = useStore(authStore);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true); // Use setLoading from authStore
    try {
      const authResponse = await loginLocal({ email, password }); // Updated function call to loginLocal
      loginSuccess(authResponse.user, authResponse.access_token); // Update authStore on success, use access_token
      showGlobalSnackbar('Login successful!', 'success');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login failed:', error);
      showGlobalSnackbar(
        error.response?.data?.message || 'Login failed. Please check your credentials.',
        'error',
      );
    } finally {
      setLoading(false); // Use setLoading from authStore
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
              disabled={authLoading} // Use authLoading from authStore
              className="mb-4"
            >
              {authLoading ? 'Logging in...' : 'Login'} {/* Use authLoading */}
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
