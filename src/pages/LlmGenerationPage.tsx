import React from 'react';
import { Box, Typography, Container, Paper, useTheme } from '@mui/material';
import LlmGenerationContent from '@/components/LlmGenerationContent';

const LlmGenerationPage: React.FC = () => {
  const theme = useTheme();

  return (
    <Container maxWidth="lg" sx={{ py: 4, display: 'flex', height: '100%' }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          width: '100%',
          height: '100%',
          display: 'flex', // Use flex to center the content
          flexDirection: 'column', // Stack items vertically
          alignItems: 'center', // Horizontally center items
          justifyContent: 'flex-start', // Align items to the top
        }}
      >
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            LLM Generation Page
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This page allows you to generate content using Large Language
            Models.
          </Typography>
        </Box>

        {/* Sidebar with LLM Generation Controls - Takes full width */}
        <Box sx={{ width: '100%', flexShrink: 0 }}>
          <LlmGenerationContent />
        </Box>
      </Paper>
    </Container>
  );
};

export default LlmGenerationPage;
