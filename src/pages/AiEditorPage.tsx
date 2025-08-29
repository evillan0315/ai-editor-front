import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  aiEditorStore,
  clearDiff,
  setOpenedFile,
  setLastLlmResponse,
} from '@/stores/aiEditorStore';
import { Box, Typography, Alert, Paper, Container, useTheme } from '@mui/material';
import { FileTree } from '@/components/file-tree';
import PromptGenerator from '@/components/PromptGenerator';
import AiResponseDisplay from '@/components/AiResponseDisplay';
import OpenedFileViewer from '@/components/OpenedFileViewer';

const AiEditorPage: React.FC = () => {
  const { error, currentProjectPath, lastLlmResponse } = useStore(aiEditorStore);

  const theme = useTheme();

  useEffect(() => {
    // Clear diff when project or response changes
    clearDiff();
    // Close any opened file when project or response changes
    setOpenedFile(null);
  }, [lastLlmResponse, currentProjectPath]);

  return (
    <Container
      maxWidth="xl"
      className="p-6 sm:p-8 flex flex-col flex-grow min-h-full container-fluid overflow-auto h-[100vh-120px]"
    >
      <Paper
        elevation={3}
        className="mb-8 flex-grow flex flex-col min-h-0 p-6"
        sx={{ bgcolor: theme.palette.background.paper }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          className="!font-bold"
          sx={{ color: theme.palette.text.primary }}
        >
          AI Code Editor
        </Typography>
        <Typography variant="body1" color="text.secondary" className="mb-4">
          Provide instructions to the AI to generate or modify code in your project. Start by
          loading your project, and optionally browse files from the tree.
        </Typography>

        <PromptGenerator />

        {/* General error display (can be set by PromptGenerator or other actions) */}
        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        <Box className="flex gap-4 mt-6 flex-grow min-h-0">
          {/* File Tree Column */}
          <FileTree projectRoot={currentProjectPath || ''} />

          {/* AI Editor & File Content Column */}
          <Box className="flex-grow flex flex-col gap-4 min-h-0 max-h-[calc(100vh-280px)] overflow-auto">
            {/* Opened File Content Editor (conditionally rendered) */}
            {!lastLlmResponse && <OpenedFileViewer />}

            {/* AI Proposed Changes Display */}
            <AiResponseDisplay />
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default AiEditorPage;
