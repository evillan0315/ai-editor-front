import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { aiEditorStore } from '@/stores/aiEditorStore';
import { addLog } from '@/stores/logStore';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PromptGenerator from '@/components/PromptGenerator';
import AiResponseDisplay from '@/components/AiResponseDisplay';
import OutputLogger from '@/components/OutputLogger';

// Constants for layout.
const PANEL_HEADER_HEIGHT = 48; // Consistent height for all collapsed panel headers (including internal padding)
const AI_OUTPUT_LOG_DEFAULT_HEIGHT = 170; // Default height for the AI Output Log section

/**
 * Consolidates the AI editor sidebar content, including the
 * AI Response Display, Prompt Generator, and the new global Output Logger.
 * Provides collapsible panels for better layout management.
 */
const AiSidebarContent: React.FC = () => {
  const { lastLlmResponse } = useStore(aiEditorStore); // lastLlmResponse might be used for logic, though not directly rendered here
  const theme = useTheme();
  const [showPromptGenerator, setShowPromptGenerator] = useState(true);
  const [showAiOutputLog, setShowAiOutputLog] = useState(true); // State for AI Output Log visibility
  const [showAiResponseDisplay, setShowAiResponseDisplay] = useState(true); // State for AI Response Display visib
  return (
    <Box
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        // Add gap between flex items and enable internal scrolling
        gap: theme.spacing(2), // Use theme spacing for consistent gaps between panels
        overflowY: 'auto', // Enable vertical scrolling for the sidebar content
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}
    >
      {/* Proposed Changes Panel (collapsible) - Stays at the top and expands */}
      <Paper
        elevation={3}
        sx={{
          flexShrink: 0,
          flexGrow: 1, // Allow this panel to grow and take available space
          p: 1, // Padding: 8px
          height: showAiResponseDisplay ? 'auto' : PANEL_HEADER_HEIGHT, // Auto-height when expanded, fixed when collapsed
          minHeight: PANEL_HEADER_HEIGHT, // Ensures it doesn't shrink below header size
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          position: 'relative',
          transition: 'height 0.2s ease-in-out', // Transition height for smooth collapse
          // mb: 2, // Removed, replaced by gap on parent Box
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, height: `${PANEL_HEADER_HEIGHT - 16}px` }}> {/* 48px (panel height) - 16px (2*padding) = 32px */}
          <Typography variant="subtitle1" sx={{ flexShrink: 0, fontWeight: 'bold' }}>
            Proposed Changes
          </Typography>
          <IconButton
            onClick={() => {
              setShowAiResponseDisplay(!showAiResponseDisplay);
              addLog('AI Sidebar', `Proposed Changes display ${showAiResponseDisplay ? 'collapsed' : 'expanded'}.`, 'debug');
            }}
            sx={{
              p: 0.5,
              color: theme.palette.text.secondary,
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              },
            }}
          >
            {showAiResponseDisplay ? (
              <ExpandLessIcon fontSize="small" />
            ) : (
              <ExpandMoreIcon fontSize="small" />
            )}
          </IconButton>
        </Box>
        {showAiResponseDisplay && ( // Conditionally render content
          <Box
            sx={{
              flexGrow: 1, // Takes remaining vertical space in the Paper
              minHeight: 0, // Allows it to shrink if needed
              borderRadius: 1,
              bgcolor: theme.palette.background.default,
              p: 1,
              overflow: 'auto', // Added scrollbar to AiResponseDisplay content area
            }}
          >
            <AiResponseDisplay />
          </Box>
        )}
      </Paper>

      {/* AI Output Log - Positioned above Prompt Generator, fixed height with scroll */}
      <Paper
        elevation={3}
        sx={{
          flexShrink: 0,
          p: 1,
          height: showAiOutputLog ? AI_OUTPUT_LOG_DEFAULT_HEIGHT : PANEL_HEADER_HEIGHT,
          minHeight: PANEL_HEADER_HEIGHT, // Ensures it doesn't shrink below header size
          overflow: 'hidden', // Hide overflow when collapsed (important for unmounted component)
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          position: 'relative',
          transition: 'height 0.2s ease-in-out',
          mb: 2, // Removed, replaced by gap on parent Box
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, height: `${PANEL_HEADER_HEIGHT - 16}px` }}>
          <Typography variant="subtitle1" sx={{ flexShrink: 0, fontWeight: 'bold' }}>
            AI Output Log
          </Typography>
          <IconButton
            onClick={() => {
              setShowAiOutputLog(!showAiOutputLog);
              addLog('AI Sidebar', `AI Output Log ${showAiOutputLog ? 'collapsed' : 'expanded'}.`, 'debug');
            }}
            sx={{
              p: 0.5,
              color: theme.palette.text.secondary,
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              },
            }}
          >
            {showAiOutputLog ? (
              <ExpandLessIcon fontSize="small" />
            ) : (
              <ExpandMoreIcon fontSize="small" />
            )}
          </IconButton>
        </Box>
        {showAiOutputLog && <OutputLogger />} {/* Conditionally render OutputLogger */}
      </Paper>

      {/* Prompt Generator Panel (collapsible) - Sticky to the bottom */}
      <Paper
        elevation={3}
        sx={{
          flexShrink: 0,
          p: 1,
          height: showPromptGenerator ? 'auto' : PANEL_HEADER_HEIGHT,
          minHeight: PANEL_HEADER_HEIGHT, // Ensures it doesn't shrink below header size
          overflow: 'auto', // Hide overflow when collapsed (important for unmounted component)
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          // Make it sticky to the bottom of the scrollable parent Box
          position: 'sticky',
          bottom: theme.spacing(2), // Align with the parent Box's bottom padding (p: 2)
          zIndex: theme.zIndex.speedDial, // Ensure it floats above other content when sticky
          transition: 'height 0.2s ease-in-out',
          marginTop: 'auto', // This pushes the panel to the bottom in a flex column layout when space is available
          // No mb here as it's the last element in the column and gap is used
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'end',
            justifyContent: 'space-between',
            mb: showPromptGenerator ? 1 : 0, // Add margin-bottom to header only when expanded to separate from content
            flexShrink: 0,
            height: `${PANEL_HEADER_HEIGHT - 16}px`,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Prompt Generator
          </Typography>
          <IconButton
            onClick={() => {
              setShowPromptGenerator(!showPromptGenerator);
              addLog('AI Sidebar', `Prompt Generator ${showPromptGenerator ? 'collapsed' : 'expanded'}.`, 'debug');
            }}
            sx={{
              p: 0.5,
              color: theme.palette.text.secondary,
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              },
            }}
          >
            {showPromptGenerator ? (
              <ExpandLessIcon fontSize="small" />
            ) : (
              <ExpandMoreIcon fontSize="small" />
            )}
          </IconButton>
        </Box>
        {/* Conditionally render PromptGenerator to save resources when hidden */}
        {showPromptGenerator && <PromptGenerator />}
      </Paper>
    </Box>
  );
};

export default AiSidebarContent;
