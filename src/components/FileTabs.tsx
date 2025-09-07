import React, { SyntheticEvent } from 'react';
import { useStore } from '@nanostores/react';
import {
  aiEditorStore,
  setOpenedFile,
  removeOpenedTab,
} from '@/stores/aiEditorStore';
import {
  Box,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  useTheme,
  Typography,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { getFileTypeIcon } from '@/constants/fileIcons';
import * as path from 'path-browserify';

interface FileTabsProps {
  // No specific props needed, all state comes from aiEditorStore
}

const FileTabs: React.FC<FileTabsProps> = () => {
  const { openedTabs, openedFile, isOpenedFileDirty } = useStore(aiEditorStore);
  const theme = useTheme();

  const activeTabIndex = openedTabs.indexOf(openedFile || '');

  const handleTabChange = (_event: SyntheticEvent, newValue: string) => {
    // newValue is the file path of the selected tab
    setOpenedFile(newValue);
  };

  const handleCloseTab = (event: React.MouseEvent, filePath: string) => {
    event.stopPropagation(); // Prevent tab from activating when close button is clicked
    removeOpenedTab(filePath);
  };

  if (openedTabs.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: theme.palette.divider,
        bgcolor: theme.palette.background.paper,
        flexShrink: 0, // Prevent shrinking
        overflowX: 'auto', // Allow horizontal scrolling for many tabs
        whiteSpace: 'nowrap', // Keep tabs on a single line
        scrollbarWidth: 'none', // Hide scrollbar for Firefox
        '&::-webkit-scrollbar': {
          display: 'none', // Hide scrollbar for Chrome, Safari, Edge
        },
      }}
    >
      <Tabs
        value={openedFile || false} // Use openedFile as the value for the active tab
        onChange={handleTabChange}
        aria-label="opened files tabs"
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          '& .MuiTabs-indicator': {
            backgroundColor: theme.palette.primary.main,
          },
          '& .MuiTab-root': {
            color: theme.palette.text.secondary,
            minHeight: '40px', // Standard tab height
            padding: '6px 12px',
            textTransform: 'none', // Keep text as is
            fontSize: '0.875rem',
            '&.Mui-selected': {
              color: theme.palette.text.primary,
              fontWeight: 'bold',
              backgroundColor: theme.palette.background.default, // Differentiate active tab background
            },
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          },
        }}
      >
        {openedTabs.map((filePath) => {
          const fileName = path.basename(filePath);
          const isDirty = openedFile === filePath && isOpenedFileDirty; // Only show dirty status for the currently active tab
          return (
            <Tab
              key={filePath}
              value={filePath}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ color: 'inherit' }}>
                    {getFileTypeIcon(fileName, 'file', false)}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'inherit',
                      fontWeight: 'inherit',
                      maxWidth: 150,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={fileName} // Full file name on hover
                  >
                    {fileName}
                  </Typography>
                  {isDirty && (
                    <Tooltip title="Unsaved changes">
                      <CircularProgress
                        size={10}
                        color="warning"
                        sx={{ ml: 0.5 }}
                      />
                    </Tooltip>
                  )}
                  <IconButton
                    size="small"
                    onClick={(e) => handleCloseTab(e, filePath)}
                    sx={{
                      ml: 0.5,
                      p: 0,
                      color: 'inherit',
                      '&:hover': {
                        color: theme.palette.error.main,
                      },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
            />
          );
        })}
      </Tabs>
    </Box>
  );
};

export default FileTabs;
