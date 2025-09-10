import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { useSearchParams } from 'react-router-dom';
import {
  aiEditorStore,
  clearDiff,
  setOpenedFile,
  setLastLlmResponse,
  setRequestType,
  setLlmOutputFormat,
  setInstruction,
  setUploadedFile,
} from '@/stores/aiEditorStore';
import {
  Box,
  Typography,
  Alert, // Added for error display
  Paper,
  useTheme,
  IconButton,
  LinearProgress,
} from '@mui/material';
import { FileTree } from '@/components/file-tree';
import PromptGenerator from '@/components/PromptGenerator';
import AiResponseDisplay from '@/components/AiResponseDisplay';
import OpenedFileViewer from '@/components/OpenedFileViewer';
import { RequestType, LlmOutputFormat } from '@/types';
// import { APP_NAME } from '@/constants'; // Not used in the original component, keeping commented.
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronDownIcon from '@mui/icons-material/ExpandMore';
import ChevronUpIcon from '@mui/icons-material/ExpandLess';
import FileTabs from '@/components/FileTabs'; // Now used

// Constants for layout.
const FILE_TREE_WIDTH = 300; // Fixed width for the file tree when visible
const FILE_TABS_HEIGHT = 48; // Approximate height of the new file tabs component (can be theme-driven later)
const PROMPT_GENERATOR_HEIGHT_MIN = 60; // Minimum height for prompt generator when collapsed
const HEADER_HEIGHT = 0; // If you had a fixed header, define it here. Currently 0.

const AiEditorPage: React.FC = () => {
  const {
    error,
    currentProjectPath,
    lastLlmResponse,
    loading,
    applyingChanges,
    isBuilding,
    openedFile, // Added to show the OpenedFileViewer when a file is open even without LLM response
  } = useStore(aiEditorStore);
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const [showFileTree, setShowFileTree] = useState(true);
  const [showPromptGenerator, setShowPromptGenerator] = useState(true);
  // New derived state for the loader
  const isAIGeneratingOrModifying = loading || applyingChanges || isBuilding;

  useEffect(() => {
    // Clear diff when project or response changes
    clearDiff();
  }, [lastLlmResponse, currentProjectPath]);

  // Handle requestType and llmOutputFormat from URL query parameters
  useEffect(() => {
    const requestTypeParam = searchParams.get('requestType');
    const outputFormatParam = searchParams.get('output');

    // Update RequestType from URL
    if (
      requestTypeParam &&
      RequestType[requestTypeParam as keyof typeof RequestType]
    ) {
      const newRequestType =
        RequestType[requestTypeParam as keyof typeof RequestType];
      if (aiEditorStore.get().requestType !== newRequestType) {
        setRequestType(newRequestType);
        // Clear related states when switching generator types via URL
        setInstruction('');
        setUploadedFile(null, null, null);
        setLastLlmResponse(null);
        setOpenedFile(null); // Close any currently viewed file when switching generator types
      }
    } else if (aiEditorStore.get().requestType !== RequestType.LLM_GENERATION) {
      // If no requestType param, default to LLM_GENERATION
      setRequestType(RequestType.LLM_GENERATION);
    }

    // Update LlmOutputFormat from URL
    if (
      outputFormatParam &&
      LlmOutputFormat[outputFormatParam as keyof typeof LlmOutputFormat]
    ) {
      const newLlmOutputFormat =
        LlmOutputFormat[outputFormatParam as keyof typeof LlmOutputFormat];
      if (aiEditorStore.get().llmOutputFormat !== newLlmOutputFormat) {
        setLlmOutputFormat(newLlmOutputFormat);
      }
    } else if (aiEditorStore.get().llmOutputFormat !== LlmOutputFormat.YAML) {
      // If no outputFormat param, default to YAML (matching store default)
      setLlmOutputFormat(LlmOutputFormat.YAML);
    }
  }, [searchParams]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh', // Use 100dvh for better mobile/browser toolbar handling
        width: '100%',
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        overflow: 'hidden', // Prevent outer scrollbars
      }}
    >
      {isAIGeneratingOrModifying && (
        <LinearProgress sx={{ width: '100%', flexShrink: 0, zIndex: 1200 }} />
      )}

      {error && (
        <Alert
          severity="error"
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1100,
            borderRadius: 0,
            flexShrink: 0,
          }}
        >
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}

      {/* Main content area: FileTree + Editor/Response + PromptGenerator */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          flexGrow: 1, // Allow this box to take up remaining vertical space
          width: '100%',
          minHeight: 0, // Crucial for flex containers
          position: 'relative', // For absolutely positioned elements inside if needed
        }}
      >
        {/* File Tree Panel */}
        <Box
          sx={{
            width: showFileTree ? FILE_TREE_WIDTH : 0,
            flexShrink: 0,
            overflow: 'hidden', // Hide content when collapsed
            transition: 'width 0.2s ease-in-out, border-right 0.2s ease-in-out',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: theme.palette.background.paper,
            borderRight: showFileTree
              ? `1px solid ${theme.palette.divider}`
              : 'none',
          }}
        >
          {currentProjectPath ? (
            <FileTree projectRoot={currentProjectPath} />
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No project opened.
              </Typography>
            </Box>
          )}
        </Box>

        {/* Main Editor/Response Area */}
        <Box
          sx={{
            flexGrow: 1,
            minWidth: 0, // Allow shrinking
            display: 'flex',
            flexDirection: 'column',
            position: 'relative', // For toggle buttons
            bgcolor: theme.palette.background.default,
          }}
        >
          {/* File Tree Toggle Button */}
          <IconButton
            onClick={() => setShowFileTree(!showFileTree)}
            sx={{
              position: 'absolute',
              top: 0, // Align with the top of the main content area
              left: 0,
              zIndex: 11,
              bgcolor: theme.palette.background.paper, // Match paper background for a floating effect
              borderRadius: '0 0 4px 0', // Rounded bottom-right corner
              borderRight: `1px solid ${theme.palette.divider}`,
              borderBottom: `1px solid ${theme.palette.divider}`,
              p: 0.5, // Smaller padding for icon button
              color: theme.palette.text.secondary,
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              },
            }}
          >
            {showFileTree ? (
              <ChevronLeftIcon fontSize="small" />
            ) : (
              <ChevronRightIcon fontSize="small" />
            )}
          </IconButton>

          {/* File Tabs */}
          <FileTabs sx={{ flexShrink: 0, height: FILE_TABS_HEIGHT }} />

          {/* AI Response Display / Opened File Viewer */}
          <Box
            sx={{
              flexGrow: 1,
              minHeight: 0, // Allow content to shrink vertically
              overflow: 'auto', // Enable scrolling for the editor/response area
              bgcolor: theme.palette.background.default,
            }}
          >
            {lastLlmResponse ? <AiResponseDisplay /> : <OpenedFileViewer />}
          </Box>

          {/* Prompt Generator Panel */}
          <Paper
            elevation={3}
            sx={{
              flexShrink: 0,
              p: showPromptGenerator ? 2 : 0, // Only apply padding when expanded
              height: showPromptGenerator
                ? 'auto'
                : PROMPT_GENERATOR_HEIGHT_MIN,
              overflow: 'hidden', // Hide content when collapsed
              bgcolor: theme.palette.background.paper,
              borderTop: `1px solid ${theme.palette.divider}`,
              borderRadius: 0, // Sharp corners
              position: 'relative', // For toggle button
              transition: 'height 0.2s ease-in-out, padding 0.2s ease-in-out',
            }}
          >
            {/* Prompt Generator Toggle Button */}
            <IconButton
              onClick={() => setShowPromptGenerator(!showPromptGenerator)}
              sx={{
                position: 'absolute',
                top: -1, // Adjust to sit on the border
                right: theme.spacing(2), // Align with padding
                zIndex: 12,
                bgcolor: theme.palette.background.paper,
                borderRadius: '4px 4px 0 0', // Rounded top corners
                border: `1px solid ${theme.palette.divider}`,
                borderBottom: 'none',
                p: 0.5, // Smaller padding
                color: theme.palette.text.secondary,
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                },
              }}
            >
              {showPromptGenerator ? (
                <ChevronDownIcon fontSize="small" />
              ) : (
                <ChevronUpIcon fontSize="small" />
              )}
            </IconButton>
            {/* Conditionally render PromptGenerator to save resources when hidden */}
            {showPromptGenerator && <PromptGenerator />}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default AiEditorPage;
