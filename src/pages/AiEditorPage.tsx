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
  Alert,
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
import { APP_NAME } from '@/constants';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FileTabs from '@/components/FileTabs';

// Constants for layout.
const FILE_TREE_WIDTH = 300; // Fixed width for the file tree when visible
const CONTENT_HORIZONTAL_GAP = 0; // The gap between FileTree and Editor/Response
const MAIN_CONTENT_PX_PADDING = 0; // Padding around the main content area (top, right, bottom, left)
const FILE_TABS_HEIGHT = 41; // Approximate height of the new file tabs component

const AiEditorPage: React.FC = () => {
  const { error, currentProjectPath, lastLlmResponse, loading, applyingChanges, isBuilding } =
    useStore(aiEditorStore);
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const [showFileTree, setShowFileTree] = useState(true);

  // New derived state for the loader
  const isAIGeneratingOrModifying = loading || applyingChanges || isBuilding;

  useEffect(() => {
    // Clear diff when project or response changes
    clearDiff();
    // Clear the opened file *content* and its dirty state, but not necessarily close the tab.
    // The tabs are managed independently now.
    // setOpenedFile(null); // This would also remove from openedTabs, let the tabs component manage if a file is explicitly closed.
  }, [lastLlmResponse, currentProjectPath]);

  // Handle requestType and llmOutputFormat from URL query parameters
  useEffect(() => {
    const requestTypeParam = searchParams.get('requestType');
    const outputFormatParam = searchParams.get('output');

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
        setUploadedFile(null, null, null);
        setLastLlmResponse(null); // Clear previous AI response if coming from a different generator
        setOpenedFile(null); // Close any currently viewed file when switching generator types
      }
    }
    // If no requestType param, default to LLM_GENERATION
    // This check also prevents unnecessary store updates if it's already LLM_GENERATION.
    if (
      !requestTypeParam &&
      aiEditorStore.get().requestType !== RequestType.LLM_GENERATION
    ) {
      setRequestType(RequestType.LLM_GENERATION);
    }

    // New: Handle outputFormat from URL parameter
    if (
      outputFormatParam &&
      LlmOutputFormat[outputFormatParam as keyof typeof LlmOutputFormat]
    ) {
      const newLlmOutputFormat =
        LlmOutputFormat[outputFormatParam as keyof typeof LlmOutputFormat];
      if (aiEditorStore.get().llmOutputFormat !== newLlmOutputFormat) {
        setLlmOutputFormat(newLlmOutputFormat);
      }
    }
    // If no outputFormat param, default to YAML (matching store default)
    // This check also prevents unnecessary store updates if it's already YAML.
    if (
      !outputFormatParam &&
      aiEditorStore.get().llmOutputFormat !== LlmOutputFormat.YAML
    ) {
      setLlmOutputFormat(LlmOutputFormat.YAML);
    }
  }, [searchParams]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {isAIGeneratingOrModifying && (
        <LinearProgress sx={{ width: '100%', position: 'sticky', top: 0, zIndex: 1200 }} />
      )}
      <Box sx={{ flexShrink: 0, p: 0, pb: 0 }}></Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          flexGrow: 1,
          width: '100%',
          minHeight: 0,
          p: MAIN_CONTENT_PX_PADDING,

          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: MAIN_CONTENT_PX_PADDING,
            bottom: MAIN_CONTENT_PX_PADDING,
            left: MAIN_CONTENT_PX_PADDING,
            width: showFileTree ? `${FILE_TREE_WIDTH}px` : '0px',
            transition: 'width 0.2s ease-in-out',
            zIndex: 10,
            overflow: 'hidden',
            pointerEvents: showFileTree ? 'auto' : 'none',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {currentProjectPath && (
            <Box
              sx={{
                width: `${FILE_TREE_WIDTH}px`,
                height: '100%',
                flexShrink: 0,
              }}
            >
              <FileTree projectRoot={currentProjectPath} />
            </Box>
          )}
        </Box>

        <IconButton
          onClick={() => setShowFileTree(!showFileTree)}
          sx={{
            position: 'absolute',
            top: `calc(${MAIN_CONTENT_PX_PADDING}px + 0px)`,
            left: showFileTree
              ? `${MAIN_CONTENT_PX_PADDING + FILE_TREE_WIDTH + CONTENT_HORIZONTAL_GAP / 2}px`
              : `${MAIN_CONTENT_PX_PADDING}px`,
            zIndex: 11,
            backgroundColor: theme.palette.background.paper,
            borderRadius: '0 8px 8px 0',
            border: `1px solid ${theme.palette.divider}`,
            borderLeft: 'none',
            p: '4px',
            transition: 'left 0.2s ease-in-out, background-color 0.2s',
            boxShadow: theme.shadows[1],
            color: theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          {showFileTree ? (
            <ChevronLeftIcon fontSize="small" />
          ) : (
            <ChevronRightIcon fontSize="small" />
          )}
        </IconButton>

        <Box
          sx={{
            flexGrow: 1,
            height: '100%',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: MAIN_CONTENT_PX_PADDING,
            marginLeft: showFileTree
              ? `${FILE_TREE_WIDTH + CONTENT_HORIZONTAL_GAP}px`
              : '0px',
            transition: 'margin-left 0.2s ease-in-out',
            p: 0,
          }}
        >
          <FileTabs />

          <Box
            sx={{
              flexGrow: 1,
              minHeight: 0,
            }}
          >
            {lastLlmResponse ? <AiResponseDisplay /> : <OpenedFileViewer />}
          </Box>

          <Paper
            elevation={2}
            sx={{
              flexShrink: 0,
              p: 2,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <PromptGenerator />
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default AiEditorPage;
