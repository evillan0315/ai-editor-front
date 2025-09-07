import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  aiEditorStore,
  clearDiff,
  setOpenedFile,
  setLastLlmResponse,
} from '@/stores/aiEditorStore';
import { Box, Typography, Alert, Paper, useTheme } from '@mui/material';
import PromptGenerator from '@/components/PromptGenerator';
import AiResponseDisplay from '@/components/AiResponseDisplay';
import OpenedFileViewer from '@/components/OpenedFileViewer';
import { FileTree } from '@/components/file-tree'; // New import

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
    // The main content area now directly fills the 'main' section of Layout.
    // Removed Container and its height calculation.
    <Paper
      elevation={3}
      // Adjusted classNames: Removed 'mb-8' and Container-specific classes like 'container-fluid h-[100vh-120px]'.
      // Added 'w-full' to ensure it takes full width, and 'p-6 sm:p-8' for desired padding.
      className="w-full p-6 sm:p-8 flex-grow flex flex-col min-h-0"
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
        Provide instructions to the AI to generate or modify code in your project. Start by loading
        your project, and optionally browse files from the tree.
      </Typography>

      {/* General error display (can be set by PromptGenerator or other actions) */}
      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}

      <PromptGenerator />

      <Box className="flex gap-4 mt-6 flex-grow min-h-0">
        {/* File Tree Column - now rendered conditionally */}
        {currentProjectPath && <FileTree projectRoot={currentProjectPath} />}

        {/* AI Editor & File Content Column */}
        <Box className="flex-grow flex flex-col gap-4 min-h-0 overflow-auto">
          {/* Conditionally render AiResponseDisplay or OpenedFileViewer based on lastLlmResponse */}
          {lastLlmResponse ? <AiResponseDisplay /> : <OpenedFileViewer />}
        </Box>
      </Box>
    </Paper>
  );
};

export default AiEditorPage;
