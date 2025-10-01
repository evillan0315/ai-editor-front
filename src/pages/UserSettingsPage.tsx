import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { authStore, authActions } from '@/stores/authStore';
import { UserProfile } from '@/types/user'; // Moved from '@/types/auth'
import { Box, Typography, Paper, TextField, Button, CircularProgress, Alert } from '@mui/material';
import { PageLayout } from '@/components/layouts/PageLayout';
import { enqueueSnackbar } from 'notistack';

const UserSettingsPage: React.FC = () => {
  const { user, loading, error } = useStore(authStore);
  const [localUser, setLocalUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user && !loading && !error) {
      authActions.checkAuthStatus();
    } else if (user) {
      setLocalUser(user);
    }
  }, [user, loading, error]);

  const handleFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setLocalUser((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleSaveChanges = () => {
    if (localUser) {
      // This is a placeholder for actual save logic.
      // In a real application, you'd send `localUser` data to a backend API.
      console.log('Saving user settings:', localUser);
      enqueueSnackbar('Settings saved (simulated)!', { variant: 'success' });
      // After successful save, you might want to update the global authStore
      // authActions.setUser(localUser);
    } else {
      enqueueSnackbar('No user data to save.', { variant: 'warning' });
    }
  };

  if (loading) {
    return (
      <PageLayout title="Loading Settings...">
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
          <Alert severity="error">Failed to load user settings: {error}</Alert>
        </Box>
      </PageLayout>
    );
  }

  if (!user) {
    return (
      <PageLayout title="Not Logged In">
        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <Alert severity="info">Please log in to manage your settings.</Alert>
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="User Settings">
      <Box className="p-6 max-w-2xl mx-auto">
        <Paper elevation={3} className="p-6 flex flex-col space-y-4">
          <Typography variant="h4" component="h1" className="mb-4">
            Edit Profile
          </Typography>

          <TextField
            label="Name"
            name="name"
            value={localUser?.name || ''}
            onChange={handleFieldChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Username"
            name="username"
            value={localUser?.username || ''}
            onChange={handleFieldChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Email"
            name="email"
            value={localUser?.email || ''}
            onChange={handleFieldChange}
            fullWidth
            margin="normal"
            disabled // Email often not editable directly
          />
          <TextField
            label="Role"
            name="role"
            value={localUser?.role || ''}
            fullWidth
            margin="normal"
            disabled // Role typically set by admin
          />
          {localUser?.organization && (
            <TextField
              label="Organization"
              name="organization"
              value={localUser.organization}
              fullWidth
              margin="normal"
              disabled // Organization typically set by admin
            />
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveChanges}
            className="self-end"
          >
            Save Changes
          </Button>
        </Paper>
      </Box>
    </PageLayout>
  );
};

export default UserSettingsPage;
