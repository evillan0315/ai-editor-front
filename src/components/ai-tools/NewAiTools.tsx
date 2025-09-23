import React from 'react';
import { Box, Typography } from '@mui/material';

interface NewAiToolsProps {}

const NewAiTools: React.FC<NewAiToolsProps> = () => {
  return (
    <Box>
      <Typography variant='h4'>New AI Tools</Typography>
      <Typography variant='body1'>
        This section will house new AI tools, similar to the Gemini Live Studio chat.
      </Typography>
    </Box>
  );
};

export default NewAiTools;
