import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Link as MuiLink } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { registerLocal } from '@/api/auth'; // Updated import to registerLocal
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { setLoading, authStore } from '@/stores/authStore'; // Import setLoading and authStore
import { showGlobalSnackbar } from '@/stores/snackbarStore'; // Import showGlobalSnackbar
import PageLayout from '@/components/layouts/PageLayout';
import { useStore } from '@nanostores/react';

function RegisterPage() {
  useAuthRedirect();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState(''); // Add username state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Use loading state from authStore
  const { loading: authLoading } = useStore(authStore);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      showGlobalSnackbar('Passwords do not match!', 'error');
      return;
    }
    setLoading(true); // Use setLoading from authStore
    try {
      await registerLocal({ email, password, username }); // Updated function call to registerLocal
      showGlobalSnackbar('Registration successful! Please log in.', 'success');
      navigate('/login');
    } catch (error: any) {
      console.error('Registration failed:', error);
      showGlobalSnackbar(
        error.response?.data?.message || 'Registration failed. Please try again.',
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
            onSubmit={handleRegister}
            className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md"
          >
            <Typography variant="h4" component="h1" gutterBottom className="text-center mb-6 text-gray-900 dark:text-white">
              Register
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
              label="Username"
              type="text"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
              className="mb-4"
            />
            <TextField
              label="Confirm Password"
              type="password"
              fullWidth
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              {authLoading ? 'Registering...' : 'Register'} {/* Use authLoading */}
            </Button>
            <Typography variant="body2" className="text-center text-gray-700 dark:text-gray-300">
              Already have an account?{' '}
              <MuiLink component={RouterLink} to="/login" className="text-blue-600 hover:underline">
                Login
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      }
    />
  );
}

export default RegisterPage;
