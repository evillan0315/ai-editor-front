import React from 'react';
import { Box, Typography, CircularProgress, Alert, useTheme } from '@mui/material';

interface FileTreeStatusProps {
  isFetchingTree: boolean;
  fetchTreeError: string | null;
  treeFilesCount: number;
  projectRoot: string;
}

const FileTreeStatus: React.FC<FileTreeStatusProps> = ({
  isFetchingTree,
  fetchTreeError,
  treeFilesCount,
  projectRoot,
}) => {
  const theme = useTheme();

  if (isFetchingTree) {
    return (
      <Box className="flex justify-center items-center flex-grow">
        <CircularProgress size={24} />
        <Typography
          variant="body2"
          sx={{ ml: 2, color: theme.palette.text.secondary }}
        >
          Loading files...
        </Typography>
      </Box>
    );
  }

  if (fetchTreeError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {fetchTreeError}
      </Alert>
    );
  }

  if (treeFilesCount === 0 && projectRoot !== '/') {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No files found for project root: {projectRoot}. Check path.
      </Alert>
    );
  }

  return null; // No status to show, tree will render
};

export default FileTreeStatus;
