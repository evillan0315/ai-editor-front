import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { authStore, loginSuccess, setError } from '@/stores/authStore';
import { API_BASE_URL } from '@/api';
import type { UserProfile } from '@/types/user'; // Corrected import path
import { Loading } from '@/components/Loading';
import { Box, Typography } from '@mui/material';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { error: authError } = useStore(authStore);

  useEffect(() => {
    const handleAuthCallback = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      const userJson = params.get('user');

      if (token && userJson) {
        try {
          const user: UserProfile = JSON.parse(decodeURIComponent(userJson));
          loginSuccess(user, token);
          navigate('/dashboard', { replace: true });
        } catch (err) {
          console.error('Failed to parse user data:', err);
          setError('Authentication failed: Invalid user data.');
          navigate('/login', { replace: true });
        }
      } else if (params.get('error')) {
        const errorMessage = params.get('error_description') || 'Authentication failed.';
        setError(errorMessage);
        navigate('/login', { replace: true });
      } else {
        setError('Authentication callback missing token or user data.');
        navigate('/login', { replace: true });
      }
    };

    handleAuthCallback();
  }, [location, navigate]);

  if (authError) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography color="error">Error: {authError}</Typography>
      </Box>
    );
  }

  return <Loading message="Authenticating..." />;
};

export default AuthCallback;
