import React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  useTheme
} from '@mui/material';
import AIPromptGenerator from '@/components/ai-tools/AIPromptGenerator';

const AIChatPage: React.FC = () => {
  const theme = useTheme();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          AI Chat
        </Typography>
        <Typography variant="body1" paragraph>
          Talk to the AI and generate code!
        </Typography>
        <Box mt={3}>
          <AIPromptGenerator />
        </Box>
      </Paper>
    </Container>
  );
};

export default AIChatPage;
