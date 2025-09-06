import React from 'react';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';

const Loading: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
      }}
    >
      <CircularProgress size={60} sx={{ color: theme.palette.primary.main }} />
      <Typography variant="h6" sx={{ mt: 3, fontWeight: 'medium' }}>
        Loading...
      </Typography>
    </Box>
  );
};

export default Loading;
