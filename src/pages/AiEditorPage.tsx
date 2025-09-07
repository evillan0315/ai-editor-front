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
  const { error, currentProjectPath, lastLlmResponse } =
    useStore(aiEditorStore);
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
    if (
      requestTypeParam &&
      RequestType[requestTypeParam as keyof typeof RequestType]
    ) {
      const newRequestType =
        RequestType[requestTypeParam as keyof typeof RequestType];
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
    if (
      !requestTypeParam &&
      aiEditorStore.get().requestType !== RequestType.LLM_GENERATION
    ) {
      setRequestType(RequestType.LLM_GENERATION);
    }
  }, [searchParams]);

  return (
    <Box>
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
          Provide instructions to the AI to generate or modify code in your
          project. Start by loading your project, and optionally browse files
          from the tree.
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Scrollable content area: FileTree and AI Response/Viewer */}
      <Box className="flex items-start justiify-between min-h-0 w-full px-4">
        {currentProjectPath && <FileTree projectRoot={currentProjectPath} />}

        {lastLlmResponse ? <AiResponseDisplay /> : <OpenedFileViewer />}
      </Box>

      {/* Sticky PromptGenerator at the bottom */}
      <Box
        className="h-auto fixed bottom-10 w-full p-6 mx-auto z-100" // Removed Tailwind border classes
        sx={{
          borderTop: 1,
          borderColor: theme.palette.divider,
          bgcolor: theme.palette.background.default,
        }}
      >
        <PromptGenerator />
      </Box>
    </Box>
  );
};

export default AiEditorPage;
