import React, { useState } from 'react';
import { Box, TextField, Button } from '@mui/material';
import { generateText } from '@/api/ai';
import { useHandleMessages } from '@/hooks/useHandleMessages';

interface AiPromptGeneratorBodyProps {
  // Define any props here
}

const AiPromptGeneratorBody: React.FC<AiPromptGeneratorBodyProps> = () => {
  const [prompt, setPrompt] = useState<string>('');
  const { messages, sendMessage, loading, error } = useHandleMessages();

  const handleSendMessage = async () => {
    if (prompt.trim()) {
      await sendMessage(prompt.trim());
      setPrompt('');
    }
  };

  return (
    <Box className="p-4 flex flex-col">
      
      {error && <Box color="error.main">Error: {error}</Box>}
      {messages.length > 0 && (
        <Box mt={2}>
          {messages.map((message, index) => (
            <Box key={index} mt={1}>
              <strong>{message.role === 'user' ? 'You:' : 'AI:'}</strong>
              <Box ml={1}>{message.text}</Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default AiPromptGeneratorBody;
