import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  useTheme,
} from '@mui/material';
import FileTreeItem from './FileTreeItem';
import { useStore } from '@nanostores/react';
import {
  fileTreeStore,
  fetchInitialFiles, // Renamed from fetchFiles
  clearFileTree,
} from '@/stores/fileTreeStore';
import { aiEditorStore } from '@/stores/aiEditorStore';
import RefreshIcon from '@mui/icons-material/Refresh';
import FolderOpenIcon from '@mui/icons-material/FolderOpenOutlined';

interface FileTreeProps {
  projectRoot: string;
}

const FileTree: React.FC<FileTreeProps> = ({ projectRoot }) => {
  const { files: treeFiles, isFetchingTree, fetchTreeError } = useStore(fileTreeStore);
  const { scanPathsInput } = useStore(aiEditorStore);
  const theme = useTheme();

  useEffect(() => {
    if (projectRoot) {
      fetchInitialFiles(
        projectRoot,
        scanPathsInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      );
    }
    return () => {
      clearFileTree(); // Clear tree state when projectRoot changes or unmounts
    };
  }, [projectRoot, scanPathsInput]);

  const handleRefreshTree = () => {
    if (projectRoot) {
      // Force a fetch by ensuring the `fetchInitialFiles` logic considers it not fresh
      fetchInitialFiles(
        projectRoot,
        scanPathsInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      );
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        width: '300px',
        minWidth: '250px',
        maxWidth: '350px',
        height: '100%', // Adjust based on header/footer height
        overflowY: 'auto',
        p: 2,
        bgcolor: theme.palette.background.paper,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid',
        borderColor: theme.palette.divider,
        mr: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            color: theme.palette.text.primary,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <FolderOpenIcon sx={{ mr: 1 }} /> Project Files
        </Typography>
        <IconButton
          onClick={handleRefreshTree}
          disabled={isFetchingTree || !projectRoot}
          size="small"
          sx={{ color: theme.palette.text.secondary }}
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>

      {isFetchingTree ? (
        <Box className="flex justify-center items-center flex-grow">
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ ml: 2, color: theme.palette.text.secondary }}>
            Loading files...
          </Typography>
        </Box>
      ) : fetchTreeError ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {fetchTreeError}
        </Alert>
      ) : treeFiles.length === 0 && projectRoot ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No files found for project root: {projectRoot}. Check path and scan paths.
        </Alert>
      ) : (
        <Box className="flex-grow">
          {treeFiles.map((entry) => (
            <FileTreeItem key={entry.filePath} fileEntry={entry} projectRoot={projectRoot} />
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default FileTree;
