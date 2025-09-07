import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { useSearchParams } from 'react-router-dom';
import {
  aiEditorStore,
  clearDiff,
  setOpenedFile,
  setLastLlmResponse,
  setRequestType,
  setLlmOutputFormat, // New: Import setLlmOutputFormat
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
  LinearProgress, // Import LinearProgress
} from '@mui/material';
import { FileTree } from '@/components/file-tree';
import PromptGenerator from '@/components/PromptGenerator';
import AiResponseDisplay from '@/components/AiResponseDisplay';
import OpenedFileViewer from '@/components/OpenedFileViewer';
import { RequestType, LlmOutputFormat } from '@/types'; // Import LlmOutputFormat
import { APP_NAME } from '@/constants'; // Import APP_NAME
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FileTabs from '@/components/FileTabs'; // New: Import FileTabs

// Constants for layout.
const FILE_TREE_WIDTH = 300; // Fixed width for the file tree when visible
const CONTENT_HORIZONTAL_GAP = 0; // The gap between FileTree and Editor/Response
const MAIN_CONTENT_PX_PADDING = 0; // Padding around the main content area (top, right, bottom, left)
const FILE_TABS_HEIGHT = 41; // Approximate height of the new file tabs component

const AiEditorPage: React.FC = () => {
  const { error, currentProjectPath, lastLlmResponse, loading, applyingChanges, isBuilding } = // Add loading, applyingChanges, isBuilding
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
    const outputFormatParam = searchParams.get('output'); // New: Get output format

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
        setUploadedFile(null, null, null); // Reset uploaded file/mimeType
        setLastLlmResponse(null); // Clear previous AI response if coming from a different generator
        setOpenedFile(null); // Close any currently viewed file when switching generator types
      }
    }
    // If no requestType param, default to LLM_GENERATION
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
    if (
      !outputFormatParam &&
      aiEditorStore.get().llmOutputFormat !== LlmOutputFormat.YAML
    ) {
      setLlmOutputFormat(LlmOutputFormat.YAML);
    }
  }, [searchParams]);

  return (
    <Box // Root container for AiEditorPage, fills main area of Layout
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%', // Fills parent <main> in Layout (which has defined height)
        width: '100%',
        bgcolor: theme.palette.background.default, // Match page background
        color: theme.palette.text.primary,
        position: 'relative', // Establish a positioning context for absolute children
        overflow: 'hidden', // Prevent page-level scrollbars
      }}
    >
      {isAIGeneratingOrModifying && (
        <LinearProgress sx={{ width: '100%', position: 'sticky', top: 0, zIndex: 1200 }} />
      )}
      {/* Top section for title, description, and errors (flex-shrink-0) */}
      <Box sx={{ flexShrink: 0, p: 0, pb: 0 }}></Box>

      {/* Main content area: FileTree, Toggle Button, and Editor/Response/PromptGenerator */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row', // Horizontal layout for FileTree and Editor/Response stack
          flexGrow: 1, // Takes all available vertical space in this container
          width: '100%',
          minHeight: 0, // Crucial for flex children to correctly calculate 100% height and scroll
          p: MAIN_CONTENT_PX_PADDING, // Apply padding around this section

          position: 'relative', // For positioning of file tree and toggle button
          overflow: 'hidden', // Hide scrollbar of this box; children handle their own
        }}
      >
        {/* File Tree Section (Absolutely positioned and animated) */}
        <Box
          sx={{
            position: 'absolute', // Positioned relative to its parent main content box
            top: MAIN_CONTENT_PX_PADDING,
            bottom: MAIN_CONTENT_PX_PADDING,
            left: MAIN_CONTENT_PX_PADDING,
            width: showFileTree ? `${FILE_TREE_WIDTH}px` : '0px',
            transition: 'width 0.2s ease-in-out', // Smooth transition for width
            zIndex: 10, // Ensure it's above other content in its layer
            overflow: 'hidden', // Hide its own scrollbar, FileTree component manages it internally
            pointerEvents: showFileTree ? 'auto' : 'none', // Disable interaction when hidden
            display: 'flex', // Use flex to ensure FileTree fills its container
            flexDirection: 'column', // FileTree content itself is a column
          }}
        >
          {currentProjectPath && (
            <Box
              sx={{
                width: `${FILE_TREE_WIDTH}px`, // Ensure the FileTree component is always rendered at its full width internally
                height: '100%',
                flexShrink: 0,
              }}
            >
              <FileTree projectRoot={currentProjectPath} />
            </Box>
          )}
        </Box>

        {/* File Tree Toggle Button */}
        <IconButton
          onClick={() => setShowFileTree(!showFileTree)}
          sx={{
            position: 'absolute',
            top: `calc(${MAIN_CONTENT_PX_PADDING}px + 0px)`, // A bit of padding from the top edge of the main content box
            left: showFileTree
              ? `${MAIN_CONTENT_PX_PADDING + FILE_TREE_WIDTH + CONTENT_HORIZONTAL_GAP / 2}px`
              : `${MAIN_CONTENT_PX_PADDING}px`, // Position right of tree + half gap, or at left edge + main padding
            zIndex: 11, // Above file tree
            backgroundColor: theme.palette.background.paper,
            borderRadius: '0 8px 8px 0', // Rounded on right side
            border: `1px solid ${theme.palette.divider}`,
            borderLeft: 'none',
            p: '4px', // Smaller padding for a more compact button
            transition: 'left 0.2s ease-in-out, background-color 0.2s',
            boxShadow: theme.shadows[1], // Small shadow to make it pop
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

        {/* Editor/Response Section + PromptGenerator (Main flexible content area) */}
        <Box
          sx={{
            flexGrow: 1,
            height: '100%', // Take full height of parent flex container
            minWidth: 0, // Allow flex item to shrink
            display: 'flex',
            flexDirection: 'column', // Stack content vertically
            gap: MAIN_CONTENT_PX_PADDING, // Gap between editor/response and prompt generator
            // Shift content when file tree is visible. Account for file tree width and gap.
            marginLeft: showFileTree
              ? `${FILE_TREE_WIDTH + CONTENT_HORIZONTAL_GAP}px`
              : '0px',
            transition: 'margin-left 0.2s ease-in-out', // Smooth transition for margin
            p: 0, // Individual components will handle their own padding
          }}
        >
          {/* File Tabs */}
          <FileTabs />

          {/* Editor/Response Display (scrollable) */}
          <Box
            sx={{
              flexGrow: 1, // Takes all available space above the prompt generator
              minHeight: 0, // Crucial for inner scrollable content
              // AiResponseDisplay and OpenedFileViewer handle their own Paper/padding
            }}
          >
            {lastLlmResponse ? <AiResponseDisplay /> : <OpenedFileViewer />}
          </Box>

          {/* PromptGenerator (takes auto height) */}
          <Paper
            elevation={2} // Add elevation to the prompt generator container
            sx={{
              flexShrink: 0, // Prevent prompt generator from shrinking
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
