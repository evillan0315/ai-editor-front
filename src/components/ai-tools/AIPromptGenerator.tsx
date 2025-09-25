// FilePath: src/components/AIPromptGenerator.tsx
// Title: AI System Prompt Generator Component (arrow-function version)
// Reason: Uses an explicitly typed arrow function for consistency with other functional components.

import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Typography,
} from '@mui/material';

interface AIPromptGeneratorProps {
  // no props yet; add here if needed later
}

const AIPromptGenerator: React.FC<AIPromptGeneratorProps> = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  const handleGenerate = () => {
    // Replace with actual AI call if required
    setGeneratedPrompt(`System Prompt:\n\n${prompt.trim()}`);
  };

  return (
    <Card sx={{ maxWidth: 600, margin: '2rem auto', p: 2 }}>
      <CardHeader title="AI System Prompt Generator" />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Enter system prompt"
            multiline
            minRows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            variant="outlined"
            fullWidth
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerate}
            disabled={!prompt.trim()}
          >
            Generate
          </Button>

          {generatedPrompt && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                backgroundColor: 'background.default',
              }}
            >
              <Typography variant="subtitle1" gutterBottom>
                Generated Prompt
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {generatedPrompt}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AIPromptGenerator;
