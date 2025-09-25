import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import AiPromptManager from './AiPromptManager';

interface NewAiToolsProps {}

const NewAiTools: React.FC<NewAiToolsProps> = () => {
  const [loading, setLoading] = useState(false);

  const handlePromptSubmit = (prompt: string) => {
    setLoading(true);
    console.log('System Prompt submitted:', prompt);
    // TODO: Integrate with actual API call to use the system prompt
    setTimeout(() => {
      setLoading(false);
    }, 1000);
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
