import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import AiPromptManager from './AiPromptManager';
import { generateText } from '@/api/ai';
import { GenerateTextDto } from '@/types/ai';
import { setError } from '@/stores/errorStore';
import { showGlobalSnackbar } from '@/stores/aiEditorStore';

interface NewAiToolsProps {}

const NewAiTools: React.FC<NewAiToolsProps> = () => {
  const [loading, setLoading] = useState(false);

  const handlePromptSubmit = async (prompt: string) => {
    setLoading(true);
    try {
      const data: GenerateTextDto = { prompt };
      const response = await generateText(data);
      console.log('AI Response:', response);
      showGlobalSnackbar(response, 'success');
    } catch (error: any) {
      console.error('Error generating text:', error);
      setError(error.message || 'Failed to generate text.');
      showGlobalSnackbar(error.message || 'Failed to generate text.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant='h4'>New AI Tools</Typography>
      <Typography variant='body1'>
        This section will house new AI tools, similar to the Gemini Live Studio chat.
      </Typography>
      <AiPromptManager onPromptSubmit={handlePromptSubmit} loading={loading} />
    </Box>
  );
};

export default NewAiTools;
