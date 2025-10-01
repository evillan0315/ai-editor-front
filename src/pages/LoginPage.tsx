import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Alert } from '@mui/material';
import { loginLocal } from '@/api/auth';
import { useStore } from '@nanostores/react';
import { authStore, setError } from '@/stores/authStore';
import type { UserProfile } from '@/types/user'; // Corrected import path
import { PageLayout } from '@/components/layouts/PageLayout';
import { PageHeader } from '@/components/layouts/PageHeader';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading, error: authError } = useStore(authStore);
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null); // Clear previous errors
    try {
      await loginLocal({ email, password });
      // If loginLocal resolves, it's a success
      navigate('/dashboard');
    } catch (error: unknown) {
      const errorMessage = (error instanceof Error) ? error.message : 'Login failed: An unknown error occurred.';
      setError(errorMessage);
    }
  };

  const buttonSx = {
    mt: 3,
    mb: 2,
    p: 1.5,
    borderRadius: 2,
    fontSize: '1.05rem',
    textTransform: 'none',
  };

  const socialButtonSx = {
    ...buttonSx,
    borderColor: 'divider',
    '&:hover': {
      borderColor: 'primary.main',
    },
  };

  const commonTextFieldProps = {
    fullWidth: true,
    margin: 'normal' as const,
    required: true,
    variant: 'outlined' as const,
    sx: { '.MuiOutlinedInput-root': { borderRadius: 2 } },
  };

  return (
    <PageLayout>
      <PageHeader title="Login" />
      <Box
        component="form"
        onSubmit={handleLogin}
        sx={{
          maxWidth: 400,
          mx: 'auto',
          p: 4,
          mt: 8,
          borderRadius: 4,
          boxShadow: 3,
          backgroundColor: 'background.paper',
        }}
      >
        <Typography variant="h5" component="h1" align="center" gutterBottom>
          Welcome Back
        </Typography>
        {authError && (
          <Alert severity="error" sx={{ mt: 2, mb: 2, borderRadius: 2 }}>
            {authError}
          </Alert>
        )}
        <TextField
          {...commonTextFieldProps}
          label="Email Address"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          {...commonTextFieldProps}
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          disabled={loading}
          sx={buttonSx}
        >
          {loading ? 'Logging In...' : 'Sign In'}
        </Button>
        <Typography align="center" sx={{ mt: 2, mb: 1 }}>
          Or login with
        </Typography>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<img src="/google-icon.svg" alt="Google" style={{ height: 20 }} />}
          sx={socialButtonSx}
          onClick={() => (window.location.href = `${API_BASE_URL}/auth/google`)}
          disabled={loading}
        >
          Google
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<img src="/github-icon.svg" alt="GitHub" style={{ height: 20 }} />}
          sx={{ ...socialButtonSx, mt: 1 }}
          onClick={() => (window.location.href = `${API_BASE_URL}/auth/github`)}
          disabled={loading}
        >
          GitHub
        </Button>
        <Box display="flex" justifyContent="space-between" mt={2}>
          <Link to="/register" style={{ textDecoration: 'none' }}>
            <Typography variant="body2" color="primary">
              Don't have an account? Sign Up
            </Typography>
          </Link>
          <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
            <Typography variant="body2" color="primary">
              Forgot password?
            </Typography>
          </Link>
        </Box>
      </Box>
    </PageLayout>
  );
};

export default LoginPage;
