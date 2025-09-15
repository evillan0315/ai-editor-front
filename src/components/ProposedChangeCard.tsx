import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  aiEditorStore,
  toggleSelectedChange,
  setCurrentDiff,
  updateProposedChangeContent,
  updateProposedChangePath,
  setError, // Still used for immediate UI feedback
} from '@/stores/aiEditorStore';
import { addLog } from '@/stores/logStore'; // NEW: Import addLog
import { getGitDiff } from '@/api/llm';
import { FileChange, FileAction } from '@/types';
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
  IconButton,
  TextField,
  InputAdornment,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import * as path from 'path-browserify';
import {
  getRelativePath,
  getCodeMirrorLanguage,
  createCodeMirrorTheme,
} from '@/utils/index'; // Import createCodeMirrorTheme
import { themeStore } from '@/stores/themeStore';

interface ProposedChangeCardProps {
  change: FileChange;
  index: number;
}

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

/**
 * Displays an individual proposed file change from the AI.
 * Provides options to select/deselect the change, view a git diff,
 * and edit the proposed file path or content. Logs relevant actions to `logStore`.
 */
const ProposedChangeCard: React.FC<ProposedChangeCardProps> = ({
  change,
  index,
}) => {
  const {
    selectedChanges,
    currentDiff,
    diffFilePath,
    loading,
    applyingChanges,
    currentProjectPath,
  } = useStore(aiEditorStore);
  const muiTheme = useTheme(); // Get MUI theme
  const { mode } = useStore(themeStore);

  const [isEditingFilePath, setIsEditingFilePath] = useState(false);
  const [editedFilePath, setEditedFilePath] = useState(change.filePath);

  // Update editedFilePath if the actual change.filePath from store changes
  useEffect(() => {
    if (!isEditingFilePath) {
      setEditedFilePath(change.filePath);
    }
  }, [change.filePath, isEditingFilePath]);

  const handleShowDiff = async () => {
    if (!currentProjectPath) {
      const msg = 'Project root is not set. Please load a project first.';
      setError(msg); // For immediate UI feedback
      addLog('Proposed Change Card', msg, 'error', undefined, undefined, true);
      return;
    }
    setError(null); // Clear previous error
    setCurrentDiff(null, null); // Clear previous diff before showing a new one
    addLog('Proposed Change Card', `Fetching git diff for ${change.filePath}...`, 'info');

    try {
      let diffContent: string;
      const filePathToSend = getRelativePath(
        change.filePath,
        currentProjectPath,
      );

      if (change.action === 'add') {
        diffContent = `--- /dev/null\n+++ a/${filePathToSend}\n@@ -0,0 +1,${change.newContent?.split('\n').length || 1} @@\n${change.newContent
          ?.split('\n')
          .map((line) => `+${line}`)
          .join('\n')}`;
      } else {
        // For modify, delete, and repair actions, fetch the actual git diff
        diffContent = await getGitDiff(filePathToSend, currentProjectPath);
      }

      setCurrentDiff(change.filePath, diffContent); // This also logs it via aiEditorStore's setCurrentDiff
      addLog('Proposed Change Card', `Git diff loaded successfully for ${change.filePath}.`, 'success');
    } catch (err) {
      const errorMsg = `Failed to get diff for ${change.filePath}: ${err instanceof Error ? err.message : String(err)}`;
      setError(errorMsg); // For immediate UI feedback
      setCurrentDiff(
        change.filePath,
        `Error: ${err instanceof Error ? err.message : String(err)}`,
      );
      addLog('Proposed Change Card', errorMsg, 'error', String(err), undefined, true);
    }
  };

  const handleSaveFilePath = () => {
    if (editedFilePath !== change.filePath) {
      // Dispatch action to update the store, this logs internally
      updateProposedChangePath(change.filePath, editedFilePath);
    }
    setIsEditingFilePath(false);
  };

  const handleCancelEditFilePath = () => {
    setEditedFilePath(change.filePath); // Revert to original
    setIsEditingFilePath(false);
    addLog('Proposed Change Card', `Cancelled file path edit for ${change.filePath}.`, 'info');
  };

  const handleKeyDownOnInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveFilePath();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEditFilePath();
    }
  };

  const commonDisabled = loading || applyingChanges;

  return (
    <Paper
      key={index}
      elevation={2}
      sx={{ p: 2, bgcolor: muiTheme.palette.background.paper }}
    >
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
              toggleSelectedChange(change); // This logs internally
            }}
            disabled={commonDisabled}
            onClick={(e) => e.stopPropagation()}
          />
          <Chip
            label={change.action.toUpperCase()}
            color={getFileActionChipColor(change.action)}
            size="small"
            sx={{ mr: 1 }}
          />
          {isEditingFilePath ? (
            <TextField
              variant="outlined"
              size="small"
              value={editedFilePath}
              onChange={(e) => setEditedFilePath(e.target.value)}
              onBlur={handleSaveFilePath}
              onKeyDown={handleKeyDownOnInput}
              disabled={commonDisabled}
              autoFocus
              fullWidth
              sx={{
                flexGrow: 1,
                mr: 1,
                '& .MuiOutlinedInput-root': { paddingRight: '0 !important' },
              }}
              InputProps={{
                style: {
                  color: muiTheme.palette.text.primary,
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={handleSaveFilePath}
                      disabled={commonDisabled}
                    >
                      <SaveIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={handleCancelEditFilePath}
                      disabled={commonDisabled}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          ) : (
            <Typography
              variant="body1"
              sx={{
                fontFamily: 'monospace',
                flexGrow: 1,
                color: muiTheme.palette.text.primary,
                mr: 1,
              }}
            >
              {currentProjectPath
                ? path.join(currentProjectPath, change.filePath)
                : change.filePath}
            </Typography>
          )}
          {!isEditingFilePath && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation(); // Prevent accordion collapse
                setIsEditingFilePath(true);
                addLog('Proposed Change Card', `Started editing file path for: ${change.filePath}`, 'debug');
              }}
              disabled={commonDisabled}
              sx={{ color: muiTheme.palette.text.secondary }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}

          {(change.action === 'modify' ||
            change.action === 'delete' ||
            change.action === 'repair') && (
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleShowDiff();
              }}
              disabled={commonDisabled}
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
            overflowY: 'auto', // Added overflowY: 'auto' here
          }}
        >
          {' '}
          {change.reason && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ pl: 0, mb: 0 }}
            >
              Reason: {change.reason}
            </Typography>
          )}
          {(change.action === 'add' ||
            change.action === 'modify' ||
            change.action === 'repair') && (
            <Box sx={{ mt: 1 }}>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ color: muiTheme.palette.text.primary }}
              >
                Proposed Content:
              </Typography>
              <CodeMirror
                value={change.newContent || ''}
                onChange={(value) =>
                  updateProposedChangeContent(change.filePath, value) // This logs internally
                }
                extensions={[
                  getCodeMirrorLanguage(change.filePath),
                  createCodeMirrorTheme(muiTheme), // Add custom theme here
                ]}
                editable={!commonDisabled}
                theme={mode}
                minHeight="150px"
                maxHeight="400px"
              />
            </Box>
          )}
          {diffFilePath === change.filePath && currentDiff && (
            <Box
              sx={{
                mt: 2,
                p: 0,
                bgcolor: muiTheme.palette.background.default,
                borderRadius: 1,
                overflow: 'hidden',
                border: '1px solid ' + muiTheme.palette.divider,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontFamily: 'monospace',
                  color: muiTheme.palette.text.primary,
                  bgcolor: muiTheme.palette.action.hover,
                  p: 1,
                  borderBottom: '1px solid ' + muiTheme.palette.divider,
                }}
              >
                Git Diff for: {diffFilePath}
              </Typography>
              <CodeMirror
                value={currentDiff || ''}
                extensions={[
                  getCodeMirrorLanguage('', true),
                  createCodeMirrorTheme(muiTheme, true), // Add custom theme here, with diff view flag
                ]}
                editable={false}
                theme={mode}
                minHeight="200px"
                maxHeight="500px"
                style={{ fontSize: '0.85rem' }}
              />
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default ProposedChangeCard;
