import React from 'react';
import { Box, Typography, TextField, useTheme, IconButton } from '@mui/material';
import {
  ArrowUpward as ArrowUpwardIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/layouts/PageHeader';
import GlobalActionButton, {
  type GlobalAction,
} from '@/components/ui/GlobalActionButton';

interface FileTreeHeaderProps {
  projectRoot: string;
  isFetchingTree: boolean;
  searchTerm: string;
  onGoUpDirectory: () => void;
  onRefreshTree: () => void;
  onAddFileFolder: (type: 'file' | 'folder') => void;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileTreeHeader: React.FC<FileTreeHeaderProps> = ({
  projectRoot,
  isFetchingTree,
  searchTerm,
  onGoUpDirectory,
  onRefreshTree,
  onAddFileFolder,
  onSearchChange,
}) => {
  const theme = useTheme();

  // Create the title element for PageHeader, including the "Go Up" button and search TextField
  const pageHeaderTitle = (
    <Box className="flex items-center gap-1 w-full ">
      <IconButton
        onClick={onGoUpDirectory}
        disabled={projectRoot === '/'}
        size="small"
        sx={{ color: theme.palette.text.secondary, p: 0.5 }}
      >
        <ArrowUpwardIcon fontSize="small" />
      </IconButton>
      <TextField
        size="small"
        placeholder="Search files..."
        value={searchTerm}
        onChange={onSearchChange}
        className="flex-grow"
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          '& .MuiOutlinedInput-root': {
            padding: '4px 8px',
            '& fieldset': { border: 'none' },
            '&:hover fieldset': { border: 'none' },
            '&.Mui-focused fieldset': { border: 'none' },
          },
          '& .MuiInputBase-input': {
            padding: '0',
          },
        }}
      />
    </Box>
  );

  // Create the actions array for PageHeader
  const pageHeaderActions: GlobalAction[] = [
    {
      id: 'refresh-tree',
      icon: RefreshIcon,
      label: 'Refresh File Tree',
      action: onRefreshTree,
      disabled: isFetchingTree || !projectRoot,
    },
    {
      id: 'add-tree',
      icon: AddIcon,
      label: 'Add Folder/File',
      action: onAddFileFolder,
      disabled: isFetchingTree || !projectRoot,
    },
  ];

  return (
    
    <PageHeader
      title={pageHeaderTitle}
      actions={pageHeaderActions}
      sticky // Keep sticky behavior
      sx={{px:1}}
    />
  );
};

export default FileTreeHeader;
