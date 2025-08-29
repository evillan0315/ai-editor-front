import React from 'react';
import { useStore } from '@nanostores/react';
import {
  aiEditorStore,
  toggleSelectedChange,
  setCurrentDiff,
  updateProposedChangeContent,
  setError,
} from '@/stores/aiEditorStore';
import { getGitDiff } from '@/api/llm';
import { FileChange, FileAction } from '@/types';
//import CodeMirrorEditor from './code-editor/CodeMirrorEditor';
import CodeMirror from '@uiw/react-codemirror';
import {
  Box,
  Typography,
  Button,
  Checkbox,
  Chip,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import * as path from 'path-browserify';
import { getRelativePath, getCodeMirrorLanguage } from '@/utils/index';
// Import getCodeMirrorLanguage
import { themeStore } from '@/stores/themeStore';

interface ProposedChangeCardProps {
  change: FileChange;
  index: number;
}

// Basic Diff Viewer Component (can be replaced with a more advanced library)
const DiffViewer: React.FC<{ diffContent: string; filePath: string }> = ({
  diffContent,
  filePath,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        mt: 2,
        p: 2,
        bgcolor: isDarkMode ? '#2d2d2d' : '#f0f0f0',
        borderRadius: 1,
        overflowX: 'auto',
        border: '1px solid ' + (isDarkMode ? '#444' : '#ccc'),
      }}
    >
      <Typography
        variant="subtitle2"
        gutterBottom
        sx={{ fontFamily: 'monospace', color: theme.palette.text.primary }}
      >
        Diff for: {filePath}
      </Typography>
      <pre
        style={{
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          color: isDarkMode ? '#e0e0e0' : '#333',
        }}
      >
        {diffContent}
      </pre>
    </Box>
  );
};

const getFileActionChipColor = (action: FileAction) => {
  switch (action) {
    case 'add':
      return 'success';
    case 'modify':
      return 'info';
    case 'delete':
      return 'error';
    case 'repair':
      return 'warning';
    case 'analyze':
      return 'primary';
    default:
      return 'default';
  }
};

const ProposedChangeCard: React.FC<ProposedChangeCardProps> = ({ change, index }) => {
  const {
    selectedChanges,
    currentDiff,
    diffFilePath,
    loading,
    applyingChanges,
    currentProjectPath,
  } = useStore(aiEditorStore);
  const theme = useTheme();
  const { mode } = useStore(themeStore);
  const handleShowDiff = async () => {
    if (!currentProjectPath) {
      setError('Project root is not set. Please load a project first.');
      return;
    }
    setError(null); // Clear previous error
    setCurrentDiff(null, null); // Clear previous diff before showing a new one

    try {
      let diffContent: string;
      const filePathToSend = getRelativePath(change.filePath, currentProjectPath);

      if (change.action === 'add') {
        diffContent = `--- /dev/null\n+++ a/${change.filePath}\n@@ -0,0 +1,${change.newContent?.split('\n').length || 1} @@\n${change.newContent
          ?.split('\n')
          .map((line) => `+${line}`)
          .join('\n')}`;
      } else {
        diffContent = await getGitDiff(filePathToSend, currentProjectPath);
      }

      setCurrentDiff(change.filePath, diffContent);
    } catch (err) {
      setError(
        `Failed to get diff for ${change.filePath}: ${err instanceof Error ? err.message : String(err)}`,
      );
      setCurrentDiff(change.filePath, `Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <Paper key={index} elevation={2} sx={{ p: 2, bgcolor: theme.palette.background.paper }}>
      <Accordion expanded={!!selectedChanges[change.filePath]}>
        <AccordionSummary
          component="div" // 👈 prevents <button> nesting
          expandIcon={<ExpandMoreIcon />}
          sx={{
            '& .MuiAccordionSummary-content': {
              alignItems: 'center',
            },
          }}
        >
          <Checkbox
            checked={!!selectedChanges[change.filePath]}
            onChange={(e) => {
              e.stopPropagation();
              toggleSelectedChange(change);
            }}
            disabled={loading || applyingChanges}
            onClick={(e) => e.stopPropagation()}
          />
          <Chip
            label={change.action.toUpperCase()}
            color={getFileActionChipColor(change.action)}
            size="small"
            sx={{ mr: 1 }}
          />
          <Typography
            variant="body1"
            sx={{
              fontFamily: 'monospace',
              flexGrow: 1,
              color: theme.palette.text.primary,
            }}
          >
            {currentProjectPath ? path.join(currentProjectPath, change.filePath) : change.filePath}
          </Typography>
          {(change.action === 'modify' || change.action === 'delete') && (
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleShowDiff();
              }}
              disabled={loading || applyingChanges}
              sx={{ ml: 1, whiteSpace: 'nowrap' }}
            >
              View Git Diff
            </Button>
          )}
        </AccordionSummary>
        <AccordionDetails
          sx={{
            flexDirection: 'column',
            display: 'flex',
            gap: 2,
          }}
        >
          {' '}
          {change.reason && (
            <Typography variant="body2" color="text.secondary" sx={{ pl: 0, mb: 0 }}>
              Reason: {change.reason}
            </Typography>
          )}
          {(change.action === 'add' ||
            change.action === 'modify' ||
            change.action === 'repair') && ( // ADD 'repair' here
            <Box sx={{ mt: 1 }}>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ color: theme.palette.text.primary }}
              >
                Proposed Content:
              </Typography>
              <CodeMirror
                value={change.newContent || ''}
                onChange={(value) => updateProposedChangeContent(change.filePath, value)}
                extensions={getCodeMirrorLanguage(change.filePath)}
                editable={!loading && !applyingChanges}
                theme={mode}
                minHeight="150px" // Provide a reasonable minimum height
                maxHeight="400px" // Limit maximum height to prevent one editor from taking too much space
              />
            </Box>
          )}
          {diffFilePath === change.filePath && currentDiff && (
            <DiffViewer diffContent={currentDiff} filePath={diffFilePath} />
          )}
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default ProposedChangeCard;
