import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Alert } from '@mui/material';
import { registerLocal } from '@/api/auth';
import { useStore } from '@nanostores/react';
import { authStore, setError } from '@/stores/authStore';
import { PageLayout } from '@/components/layouts/PageLayout';
import { PageHeader } from '@/components/layouts/PageHeader';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading, error: authError } = useStore(authStore);
  const navigate = useNavigate();

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null); // Clear previous errors
    try {
      await registerLocal({ name, email, password });
      // If registerLocal resolves, it's a success
      navigate('/dashboard');
    } catch (error: unknown) {
      const errorMessage = (error instanceof Error) ? error.message : 'Registration failed: An unknown error occurred.';
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

  const commonTextFieldProps = {
    fullWidth: true,
    margin: 'normal' as const,
    required: true,
    variant: 'outlined' as const,
    sx: { '.MuiOutlinedInput-root': { borderRadius: 2 } },
  };

  return (
    <PageLayout>
      <PageHeader title="Register" />
      <Box
        component="form"
        onSubmit={handleRegister}
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
          Create Your Account
        </Typography>
        {authError && (
          <Alert severity="error" sx={{ mt: 2, mb: 2, borderRadius: 2 }}>
            {authError}
          </Alert>
        )}
        <TextField
          {...commonTextFieldProps}
          label="Full Name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
          autoComplete="new-password"
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
          {loading ? 'Registering...' : 'Sign Up'}
        </Button>
        <Box display="flex" justifyContent="center" mt={2}>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Typography variant="body2" color="primary">
              Already have an account? Sign In
            </Typography>
          </Link>
        </Box>
      </Box>
    </PageLayout>
  );
};

export default RegisterPage;
