import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  Tooltip,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { TerminalCommandResponse } from '@/types';

/**
 * Props for the OutputLogger component.
 */
interface OutputLoggerProps {
  title: string; // Title for the output section (e.g., "Build Output", "Git Command Output")
  output: TerminalCommandResponse | null; // The terminal command response to display
  error?: string | null; // General error message for the operation
  isLoading?: boolean; // Indicates if the operation generating this output is currently loading
  defaultExpanded?: boolean; // Whether the accordion should be expanded by default
  showCopyButton?: boolean; // Whether to show a copy-to-clipboard button for the output
  className?: string; // Optional CSS class for the root Box
}

/**
 * A reusable component to display terminal command outputs or API responses, results, and errors.
 * It uses an Accordion for collapsibility and styles output for readability.
 */
const OutputLogger: React.FC<OutputLoggerProps> = ({
  title,
  output,
  error,
  isLoading = false,
  defaultExpanded = false,
  showCopyButton = true,
  className,
}) => {
  const theme = useTheme();

  const hasOutput = output && (output.stdout || output.stderr);
  const isErrorOutput = output && output.exitCode !== 0;

  const handleCopyToClipboard = (textToCopy: string) => {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        // In a real app, you'd use a Snackbar here
        console.log('Output copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy output:', err);
      });
  };

  return (
    <Box className={className} sx={{ mt: 3 }}>
      <Accordion
        defaultExpanded={defaultExpanded}
        sx={{ bgcolor: theme.palette.background.paper }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}
          >
            {title}
          </Typography>
          {isLoading && (
            <CircularProgress size={16} color="inherit" sx={{ ml: 1 }} />
          )}
          {error && (
            <Alert severity="error" sx={{ ml: 2, py: 0, px: 1, maxHeight: 28 }}>
              Error
            </Alert>
          )}
          {output && output.exitCode !== 0 && (
            <Alert severity="error" sx={{ ml: 2, py: 0, px: 1, maxHeight: 28 }}>
              Failed (Exit Code: {output.exitCode})
            </Alert>
          )}
          {output && output.exitCode === 0 && (
            <Alert
              severity="success"
              sx={{ ml: 2, py: 0, px: 1, maxHeight: 28 }}
            >
              Success
            </Alert>
          )}
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {hasOutput ? (
            <Box
              sx={{
                position: 'relative',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                maxHeight: '300px',
                overflowY: 'auto',
                p: 1.5,
                bgcolor: theme.palette.background.default,
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
                color: theme.palette.text.primary,
              }}
            >
              {showCopyButton && (
                <Tooltip title="Copy output to clipboard">
                  <IconButton
                    size="small"
                    onClick={() =>
                      handleCopyToClipboard(
                        `${output?.stdout || ''}\n${output?.stderr || ''}`,
                      )
                    }
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 1,
                      color: theme.palette.text.secondary,
                      bgcolor: theme.palette.background.paper + 'A0', // Semi-transparent background
                      '&:hover': {
                        bgcolor: theme.palette.background.paper,
                      },
                    }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {output?.stdout && (
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{ margin: 0, color: theme.palette.text.primary }}
                >
                  {output.stdout}
                </Typography>
              )}
              {output?.stderr && (
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{ margin: 0, color: theme.palette.error.main }}
                >
                  {output.stderr}
                </Typography>
              )}
              {output?.exitCode !== undefined && (
                <Typography
                  variant="caption"
                  sx={{
                    mt: 1,
                    display: 'block',
                    color: theme.palette.text.secondary,
                  }}
                >
                  Exit Code: {output.exitCode}
                </Typography>
              )}
            </Box>
          ) : (
            !isLoading &&
            !error && (
              <Typography variant="body2" color="text.secondary">
                No output available.
              </Typography>
            )
          )}
          {isLoading && !hasOutput && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 100,
              }}
            >
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Loading output...
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default OutputLogger;
