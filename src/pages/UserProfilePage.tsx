import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { authStore, authActions } from '@/stores/authStore';
import { UserProfile } from '@/types/user'; // Moved from '@/types/auth'
import { Box, Typography, Paper, Avatar, CircularProgress, Alert } from '@mui/material';
import { PageLayout } from '@/components/layouts/PageLayout';

const UserProfilePage: React.FC = () => {
  const { user, loading, error } = useStore(authStore);

  useEffect(() => {
    if (!user && !loading && !error) {
      authActions.checkAuthStatus();
    }
  }, [user, loading, error]);

  if (loading) {
    return (
      <PageLayout title="Loading Profile...">
        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <CircularProgress />
        </Box>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Error">
        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <Alert severity="error">Failed to load user profile: {error}</Alert>
        </Box>
      </PageLayout>
    );
  }

  if (!user) {
    return (
      <PageLayout title="Not Logged In">
        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <Alert severity="info">Please log in to view your profile.</Alert>
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="User Profile">
      <Box className="p-6 max-w-2xl mx-auto">
        <Paper elevation={3} className="p-6 flex flex-col items-center space-y-4">
          {user.image && <Avatar src={user.image} alt={user.name} sx={{ width: 100, height: 100 }} />}
          <Typography variant="h4" component="h1" className="text-center">
            {user.name || user.email || 'User'}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {user.username && `@${user.username}`}
          </Typography>
          <Box className="w-full space-y-2 text-center">
            <Typography variant="body1">
              <strong>Email:</strong> {user.email}
            </Typography>
            {user.provider && (
              <Typography variant="body1">
                <strong>Provider:</strong> {user.provider}
              </Typography>
            )}
            {user.role && (
              <Typography variant="body1">
                <strong>Role:</strong> {user.role}
              </Typography>
            )}
            {user.organization && (
              <Typography variant="body1">
                <strong>Organization:</strong> {user.organization}
              </Typography>
            )}
            {/* Add more profile fields as needed */}
          </Box>
        </Paper>
      </Box>
    </PageLayout>
  );
};

export default UserProfilePage;
