import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { useSearchParams } from 'react-router-dom';
import {
  aiEditorStore,
  clearDiff,
  setOpenedFile,
  setLastLlmResponse,
  setRequestType,
  setInstruction,
  setUploadedFile,
} from '@/stores/aiEditorStore';
import { Box, Typography, Alert, Paper, useTheme } from '@mui/material';
import { FileTree } from '@/components/file-tree';
import PromptGenerator from '@/components/PromptGenerator';
import AiResponseDisplay from '@/components/AiResponseDisplay';
import OpenedFileViewer from '@/components/OpenedFileViewer';
import { RequestType } from '@/types';
import { APP_NAME } from '@/constants'; // Import APP_NAME

const AiEditorPage: React.FC = () => {
  const { error, currentProjectPath, lastLlmResponse } = useStore(aiEditorStore);
  const theme = useTheme();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Clear diff when project or response changes
    clearDiff();
    // Close any opened file when project or response changes
    setOpenedFile(null);
  }, [lastLlmResponse, currentProjectPath]);

  // Handle requestType from URL query parameters
  useEffect(() => {
    const requestTypeParam = searchParams.get('requestType');
    if (requestTypeParam && RequestType[requestTypeParam as keyof typeof RequestType]) {
      const newRequestType = RequestType[requestTypeParam as keyof typeof RequestType];
      // Only update if it's a new request type from the URL
      if (aiEditorStore.get().requestType !== newRequestType) {
        setRequestType(newRequestType);
        // Optionally clear the main instruction and uploaded files when a new generator is selected
        setInstruction('');
        setUploadedFile(null, null);
        setLastLlmResponse(null); // Clear previous AI response if coming from a different generator
      }
    }
    // If no requestType param, default to LLM_GENERATION
    if (!requestTypeParam && aiEditorStore.get().requestType !== RequestType.LLM_GENERATION) {
      setRequestType(RequestType.LLM_GENERATION);
    }
  }, [searchParams]);

  return (
    <Paper
      elevation={3}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%', // Take full height of parent <main>
        bgcolor: theme.palette.background.paper, // Main page background
        overflow: 'hidden', // Prevent page-level scrollbars unless absolutely necessary
        position: 'relative', // Establish positioning context for absolutely positioned children
      }}
    >
      {/* Top fixed content: Title, Description, Error */}
      <Box sx={{ p: { xs: 3, sm: 4 }, flexShrink: 0 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          className="!font-bold"
          sx={{ color: theme.palette.text.primary }}
        >
          {APP_NAME} Editor
        </Typography>
        <Typography variant="body1" color="text.secondary" className="mb-4">
          Provide instructions to the AI to generate or modify code in your project. Start by
          loading your project, and optionally browse files from the tree.
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Scrollable content area: FileTree and AI Response/Viewer */}
      <Box
        sx={{
          flexGrow: 1, // Takes all available space
          overflowY: 'auto', // Enables scrolling for this section
          display: 'flex',
          gap: 3, // Gap between file tree and content
          px: { xs: 3, sm: 4 }, // Horizontal padding for content, responsive
          pb: '350px', // Add padding at the bottom to ensure content isn't hidden behind the prompt generator
        }}
      >
        {currentProjectPath && <FileTree projectRoot={currentProjectPath} />}

        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            minHeight: 0, // Allow content to shrink if needed
          }}
        >
          {lastLlmResponse ? <AiResponseDisplay /> : <OpenedFileViewer />}
        </Box>
      </Box>

      {/* Sticky PromptGenerator at the bottom */}
      <Box
        sx={{
          position: 'absolute', // Position absolutely relative to the parent Paper
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100, // Ensure it's above scrollable content
          bgcolor: theme.palette.background.paper, // Match main page background
          borderTop: `1px solid ${theme.palette.divider}`, // Visual separator
          p: 2, // Internal padding for the PromptGenerator
        }}
      >
        <PromptGenerator />
      </Box>
    </Paper>
  );
};

export default AiEditorPage;
