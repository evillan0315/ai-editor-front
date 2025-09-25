import React, { useState } from 'react';
import { Box, TextField, Button } from '@mui/material';
import { generateText } from '@/api/ai';

interface AiPromptGeneratorBodyProps {
  // Define any props here
}

const AiPromptGeneratorBody: React.FC<AiPromptGeneratorBodyProps> = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [result, setResult] = useState<string>('');



  return (
    <Box className="p-4 flex flex-col">
      
    </Box>
  );
};

export default AiPromptGeneratorBody;
