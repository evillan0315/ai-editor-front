import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { llmStore } from '@/stores/llmStore';
import { Box, Paper, useTheme } from '@mui/material';
import PromptGenerator from '@/components/code-generator/PromptGenerator';
import { CodeGeneratorMain } from '@/components/code-generator/CodeGeneratorMain';

// Constants for layout.
const PANEL_HEADER_HEIGHT = 48; // Consistent height for all collapsed panel headers (including internal padding)
const AI_OUTPUT_LOG_DEFAULT_HEIGHT = 170; // Default height for the AI Output Log section

/**
 * Placeholder for LLM Generation sidebar content.
 */
const LlmGenerationContent: React.FC = () => {
  const { lastLlmResponse } = useStore(llmStore);
  const theme = useTheme();
  const [showOptions, setShowOptions] = useState(true);
  const [showAiOutputLog, setShowAiOutputLog] = useState(true);
  const [showAiResponseDisplay, setShowAiResponseDisplay] = useState(true);
  const [showPromptGenerator, setShowPromptGenerator] = useState(true);

  return (
    <Box className="flex flex-col h-full px-4 w-full">
      {/* Main content grows and pushes PromptGenerator to bottom */}
      <Box className="flex flex-col flex-1 w-full">
        <Paper
          elevation={3}
          className="w-full mb-4"
          sx={{
            p: 2,
            bgcolor: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`,
            borderRadius: 5,
          }}
        >
          <CodeGeneratorMain data={lastLlmResponse} />
        </Paper>
      </Box>

      {/* PromptGenerator fixed at bottom of parent */}
      <Paper
        elevation={3}
        sx={{
          flexShrink: 0,
          p: 2,
          bgcolor: theme.palette.background.paper,
          borderTop: `1px solid ${theme.palette.divider}`,
          borderRadius: 5,
        }}
      >
        <PromptGenerator />
      </Paper>
    </Box>
  );
};

export default LlmGenerationContent;
