import React, { SyntheticEvent } from 'react';
import { useStore } from '@nanostores/react';

import {
  Box,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  useTheme,
  Typography,
  CircularProgress,
  BoxProps,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseMultipleIcon from '@mui/icons-material/Close';
import { getFileTypeIcon } from '@/constants/fileIcons';

import { isTerminalVisible, setShowTerminal } from '@/stores/terminalStore';
import {
  fileStore,
  setOpenedFile,
  saveActiveFile,
  removeOpenedTab,
} from '@/stores/fileStore';
import * as path from 'path-browserify';

interface FileTabsProps extends BoxProps {}

const FileTabs: React.FC<FileTabsProps> = ({ sx, ...otherProps }) => {
  const {
    openedTabs,
    openedFile,
    discardActiveFileChanges,
    openedFileContent,
    isFetchingFileContent,
    isOpenedFileDirty,
    isSavingFileContent,
    snackbar, // Get global snackbar state
  } = useStore(fileStore);
  const theme = useTheme();
  const showTerminal = useStore(isTerminalVisible);
  const activeTabIndex = openedTabs.indexOf(openedFile || '');

  const handleTabChange = (_event: SyntheticEvent, newValue: string) => {
    // newValue is the file path of the selected tab
    setOpenedFile(newValue);
  };

  const handleCloseTab = (event: React.MouseEvent, filePath: string) => {
    event.stopPropagation(); // Prevent tab from activating when close button is clicked
    removeOpenedTab(filePath);
  };

  const handleCloseAllTabs = (event: React.MouseEvent) => {
    event.stopPropagation();
    openedTabs.forEach((filePath) => {
      removeOpenedTab(filePath);
    });
    //removeAllOpenedTabs();
  };

  const isDisabled = isSavingFileContent;

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
        display: 'flex', // Enable flexbox for positioning buttons
        alignItems: 'center', // Align items vertically in the center
        height: '48px', // Explicitly set height for consistency
        ...sx, // Merge the passed sx prop
      }}
      {...otherProps} // Pass any other props to the Box
    >
      <Tabs
        value={openedFile || false} // Use openedFile as the value for the active tab
        onChange={handleTabChange}
        aria-label="opened files tabs"
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          flexGrow: 1, // Allow tabs to grow
          maxWidth: 'calc(100% - 160px)', // Reserve space for buttons
          '& .MuiTabs-indicator': {
            backgroundColor: theme.palette.primary.main,
          },
          '& .MuiTab-root': {
            color: theme.palette.text.secondary,
            minHeight: '48px',
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
          const isActiveTab = openedFile === filePath;
          const isDirty = isActiveTab && isOpenedFileDirty; // Only show dirty status for the currently active tab
          return (
            <Tab
              key={filePath}
              value={filePath}
              label={
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
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
                    component="span"
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

      {openedFile && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            ml: 'auto',
            pr: 2,
          }}
        >
          {isOpenedFileDirty && (
            <Tooltip title="Discard unsaved changes">
              <span>
                <IconButton
                  disabled={isDisabled}
                  onClick={saveActiveFile}
                  size="small"
                  sx={{
                    color: theme.palette.error.main,
                    borderColor: theme.palette.error.light,
                    '&:hover': {
                      borderColor: theme.palette.error.dark,
                      bgcolor: theme.palette.error.light + '10',
                    },
                    minWidth: 0, // Allow button to shrink
                  }}
                >
                  <UndoIcon />
                </IconButton>
              </span>
            </Tooltip>
          )}

          <Tooltip title={'Save changes'}>
            <IconButton
              disabled={isDisabled || !isOpenedFileDirty}
              onClick={saveActiveFile}
              size="small"
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.text.primary,
                },
              }}
            >
              {isSavingFileContent ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <SaveIcon />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title={showTerminal ? 'Hide Terminal' : 'Show Terminal'}>
            <IconButton
              onClick={() => setShowTerminal(!showTerminal)}
              size="small"
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.text.primary,
                },
              }}
            >
              {showTerminal ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Close All Tabs">
            <IconButton
              onClick={handleCloseAllTabs}
              size="small"
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.text.primary,
                },
              }}
            >
              <CloseMultipleIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};

export default FileTabs;
