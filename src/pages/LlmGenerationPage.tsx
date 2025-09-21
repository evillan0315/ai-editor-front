import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import LlmGenerationContent from '@/components/LlmGenerationContent';

// Import the same constant used in Layout so the height stays in sync
const NAVBAR_HEIGHT = 64; // matches Layout.tsx
const FOOTER_HEIGHT = 30; // only needed if you use the global footer

const LlmGenerationPage: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: '100%',
        // occupy full viewport height minus navbar (and footer if present)
        minHeight: `calc(100vh - ${NAVBAR_HEIGHT}px - ${FOOTER_HEIGHT}px)`,
        display: 'flex',
        flexDirection: 'column',
        m: 0,
        p: 0,
      }}
    >
      {/* Page title */}
      <Box
        sx={{
          px: 2,
          pt: 2,
          pb: 0, // no bottom padding
          m: 0, // no margin
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 'bold', mb: 0 }}
        >
          LLM Generation
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 0 }}>
          This page allows you to generate content using Large Language Models.
        </Typography>
      </Box>

      {/* Main content area fills remaining height below navbar */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          px: 2,
          pt: 2,
          pb: 0, // no bottom padding
          m: 0,
        }}
      >
        <LlmGenerationContent />
      </Box>
    </Box>
  );
};

export default LlmGenerationPage;
