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
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            LLM Generation Page
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This page allows you to generate content using Large Language
            Models.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', height: 'calc(100% - 60px)' }}>
          {/* Main content area */}
          <Box sx={{ flex: 1, mr: 4 }}>
            <Typography variant="h6">Main Content</Typography>
            <Typography>
              This is where the main content for LLM generation will go.
            </Typography>
          </Box>

          {/* Sidebar with LLM Generation Controls */}
          <Box sx={{ width: 300, flexShrink: 0 }}>
            <LlmGenerationContent />
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default LlmGenerationPage;
