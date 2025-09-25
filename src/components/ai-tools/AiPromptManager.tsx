import React, { useState, useCallback } from 'react';
import { Box, TextField, Typography, IconButton, Tooltip, useTheme, CircularProgress } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

interface AiPromptManagerProps {
  onPromptSubmit: (prompt: string) => void;
  loading: boolean;
}

const AiPromptManager: React.FC<AiPromptManagerProps> = ({ onPromptSubmit, loading }) => {
  const theme = useTheme();
  const [prompt, setPrompt] = useState<string>('');

  const handleGenerate = useCallback(() => {
    onPromptSubmit(prompt);
  }, [prompt, onPromptSubmit]);

  return (
    <Box className="flex flex-col gap-2 w-full relative">
      <Box
        position="relative"
        className="mt-2 px-2 pr-12 overflow-auto max-h-[100px] items-end h-full"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleGenerate();
          }
        }}
      >
        <Box className="mb-0">
          <TextField
            multiline
            fullWidth
            placeholder="Type your system prompt..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            variant="standard"
            InputProps={{ disableUnderline: true }}
            className="mb-2 border-0"
            sx={{
              p: 0,
              '& .css-1asjr57-MuiFormControl-root-MuiTextField-root': {
                backgroundColor: `${theme.palette.background.default}  !important`,
              },
            }}
          />
        </Box>
      </Box>
      <Box
        className="absolute top-2 right-0 flex items-center"
        sx={{ paddingRight: theme.spacing(1) }}
      >
        <Tooltip title="Generate with System Prompt">
          <IconButton
            color="success"
            onClick={handleGenerate}
            disabled={loading || !prompt}
          >
            {loading ? <CircularProgress size={16} /> : <SendIcon />}
          </IconButton>
        </Tooltip>
      </Box>
      {loading && (
        <Box className="mt-2 flex items-center">
          <CircularProgress size={20} className="mr-1" />
          <Typography variant="body2">Generating...</Typography>
        </Box>
      )}
    </Box>
  );
};

export default AiPromptManager;
