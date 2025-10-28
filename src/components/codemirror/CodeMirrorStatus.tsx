import React, { useState } from 'react';
import { Box, Typography, useTheme, Button, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { useStore } from '@nanostores/react';
import { themeStore } from '@/stores/themeStore';
import { Diagnostic } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';

interface CodeMirrorStatusProps {
  languageName: string;
  line: number;
  column: number;
  filePath?: string;
  lintIssuesCount: number;
  buildErrorMessage: string | null;
  diagnostics: Diagnostic[];
  editorViewInstance: EditorView | null;
  onGoToLine?: (line: number) => void; // NEW: Callback to navigate to a specific line
}

const CodeMirrorStatus: React.FC<CodeMirrorStatusProps> = ({
  languageName,
  line,
  column,
  filePath,
  lintIssuesCount,
  buildErrorMessage,
  diagnostics,
  editorViewInstance,
  onGoToLine,
}) => {
  const muiTheme = useTheme();
  const { mode } = useStore(themeStore);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Function to handle clicking an issue item
  const handleIssueClick = (diagnostic: Diagnostic) => {
    const lineNumber = getLineNumber(diagnostic.from);
    if (lineNumber !== null && onGoToLine) {
      onGoToLine(lineNumber);
    }
    handleClose();
  };

  // Extract filename if filePath is provided
  const filename = filePath ? filePath.split('/').pop() || 'No file open' : 'No file open';
  const lintStatusText = lintIssuesCount > 0 ? `Issues: ${lintIssuesCount}` : 'No issues';

  // Define general status item styles
  const sxStatusItem = {
    color: muiTheme.palette.text.secondary,
    fontSize: '0.75rem',
    px: 1,
    display: 'flex',
    alignItems: 'center',
  };

  // Menu specific styles
  const sxMenuPaper = {
    maxHeight: 250,
    minWidth: 250,
    maxWidth: 400,
    mt: 0.5,
    backgroundColor: muiTheme.palette.background.default,
    border: `1px solid ${muiTheme.palette.divider}`,
  };

  const sxMenuItem = {
    p: 1,
    '&:hover': {
      backgroundColor: muiTheme.palette.action.hover,
    },
  };

  const getLineNumber = (from: number) => {
    if (!editorViewInstance) return null;
    try {
      return editorViewInstance.state.doc.lineAt(from).number;
    } catch {
      return null;
    }
  };

  return (
    <Box
      className="flex items-center justify-between px-2 py-1 h-8"
      sx={{
        backgroundColor: muiTheme.palette.background.paper,
        borderTop: `1px solid ${muiTheme.palette.divider}`,
      }}
    >
      <Box className="flex items-center">
        <Typography sx={{ ...sxStatusItem, borderRight: `1px solid ${muiTheme.palette.divider}` }}>
          File: {filename}
        </Typography>
        <Typography sx={{ ...sxStatusItem, borderRight: `1px solid ${muiTheme.palette.divider}` }}>
          Language: {languageName}
        </Typography>
        <Typography sx={sxStatusItem}>
          Ln {line}, Col {column}
        </Typography>
      </Box>

      <Box className="flex items-center">
        {buildErrorMessage && (
          <Typography
            sx={{
              ...sxStatusItem,
              color: muiTheme.palette.error.main,
              fontWeight: 'bold',
              ...(lintIssuesCount > 0 ? { borderRight: `1px solid ${muiTheme.palette.divider}` } : {}),
            }}
          >
            Build Error: {buildErrorMessage}
          </Typography>
        )}

        <Button
          variant="text"
          size="small"
          color={lintIssuesCount > 0 ? 'warning' : 'inherit'}
          startIcon={
            lintIssuesCount > 0 ? (
              <WarningAmberOutlinedIcon fontSize="small" />
            ) : (
              <CheckCircleOutlineOutlinedIcon fontSize="small" />
            )
          }
          onClick={handleClick}
          aria-controls={open ? 'lint-issues-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          sx={{
            ...sxStatusItem,
            border: 'none',
            '&:hover': {
              backgroundColor: 'transparent',
              textDecoration: 'underline',
            },
            p: 0,
            minWidth: 'unset',
            color: lintIssuesCount > 0 ? muiTheme.palette.warning.main : muiTheme.palette.text.secondary,
          }}
        >
          {lintStatusText}
        </Button>
        <Menu
          id="lint-issues-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': 'lint-issues-button',
          }}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          PaperProps={{ sx: sxMenuPaper }}
        >
          {diagnostics.length === 0 ? (
            <MenuItem onClick={handleClose} sx={sxMenuItem}>
              <ListItemText primary="No issues found." />
            </MenuItem>
          ) : (
            diagnostics.map((diagnostic, index) => {
              const lineNumber = getLineNumber(diagnostic.from);
              return (
                <MenuItem key={index} onClick={() => handleIssueClick(diagnostic)} sx={sxMenuItem}>
                  <ListItemIcon>
                    {diagnostic.severity === 'error' && <ErrorOutlineOutlinedIcon fontSize="small" color="error" />}
                    {diagnostic.severity === 'warning' && <WarningAmberOutlinedIcon fontSize="small" color="warning" />}
                    {diagnostic.severity === 'info' && <InfoOutlinedIcon fontSize="small" color="info" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={diagnostic.message}
                    secondary={lineNumber !== null ? `Line ${lineNumber}` : undefined}
                    primaryTypographyProps={{ sx: { fontSize: '0.875rem' } }}
                    secondaryTypographyProps={{ sx: { fontSize: '0.75rem', color: muiTheme.palette.text.secondary } }}
                  />
                </MenuItem>
              );
            })
          )}
        </Menu>
      </Box>
    </Box>
  );
};

export default CodeMirrorStatus;
