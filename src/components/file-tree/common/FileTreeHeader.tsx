import React from 'react';
import {
  Box,
  IconButton,
  TextField,
  useTheme,
  Paper,
} from '@mui/material';
import { ArrowUpward as ArrowUpwardIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface FileTreeHeaderProps {
  projectRoot: string;
  isFetchingTree: boolean;
  searchTerm: string;
  onGoUpDirectory: () => void;
  onRefreshTree: () => void;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileTreeHeader: React.FC<FileTreeHeaderProps> = ({
  projectRoot,
  isFetchingTree,
  searchTerm,
  onGoUpDirectory,
  onRefreshTree,
  onSearchChange,
}) => {
  const theme = useTheme();

  const headerSx = {
    position: 'sticky',
    top: 0,
    left: 0,
    borderRadius: 0,
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    borderBottom: `1px solid ${theme.palette.divider}`,
    zIndex: 1,
    p: 0.5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: 0,
  };

  const textFieldSx = {
    width: '100%',
    maxWidth: '70%',
    mr: 0.5,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  };

  return (
    <Paper sx={headerSx}>
      <Box className="flex items-center gap-0">
        <IconButton
          onClick={onGoUpDirectory}
          disabled={projectRoot === '/'}
          size="small"
          sx={{ color: theme.palette.text.secondary, mr: 1 }}
        >
          <ArrowUpwardIcon fontSize="small" />
        </IconButton>
      </Box>
      <TextField
        size="small"
        placeholder="Search files..."
        value={searchTerm}
        onChange={onSearchChange}
        sx={textFieldSx}
      />
      <Box className="flex items-center gap-0">
        <IconButton
          onClick={onRefreshTree}
          disabled={isFetchingTree || !projectRoot}
          size="small"
          sx={{ color: theme.palette.text.secondary }}
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default FileTreeHeader;
