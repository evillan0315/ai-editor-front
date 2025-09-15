import React, { useRef, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { logStore, LogEntry, clearLogs } from '@/stores/logStore';
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
  Fab,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';


interface OutputLoggerProps {
  // No props needed anymore, it will read from the global logStore
}

/**
 * Returns an appropriate Material Icon based on the log entry's severity.
 * @param severity The severity of the log entry.
 */
const getSeverityIcon = (severity: LogEntry['severity']) => {
  switch (severity) {
    case 'error':
      return <ErrorOutlineOutlinedIcon fontSize="small" color="error" />;
    case 'warning':
      return <WarningAmberOutlinedIcon fontSize="small" color="warning" />;
    case 'success':
      return <CheckCircleOutlineOutlinedIcon fontSize="small" color="success" />;
    case 'debug':
      return <BugReportOutlinedIcon fontSize="small" color="info" />; // or a custom debug color
    case 'info':
    default:
      return <InfoOutlinedIcon fontSize="small" color="info" />;
  }
};

/**
 * A reusable component to display a stream of log entries from the global `logStore`.
 * Each log entry is displayed as an expandable accordion item.
 */
const OutputLogger: React.FC<OutputLoggerProps> = () => {
  const logs = useStore(logStore);
  const theme = useTheme();
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCopyToClipboard = (textToCopy: string) => {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        // In a real app, you'd use a Snackbar here
        // console.log('Log copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy log:', err);
      });
  };

  if (logs.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: theme.palette.text.secondary }}>
        <Typography variant="body2">No logs to display yet.</Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={logContainerRef}
      sx={{
        height: '100%',
        overflowY: 'auto',
        position: 'relative',
        p: 1, // Padding for the overall log box
        bgcolor: theme.palette.background.default,
      }}
    >
      {logs.map((log, index) => (
        <Accordion
          key={log.id}
          defaultExpanded={log.alwaysExpanded}
          sx={{
            mt: index === 0 ? 0 : 1, // Add margin-top for subsequent logs
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
              {getSeverityIcon(log.severity)}
              <Typography
                variant="subtitle2"
                sx={{
                  ml: 1,
                  fontWeight: 'bold',
                  flexShrink: 0,
                  color: theme.palette.text.primary,
                }}
              >
                [{log.timestamp}] {log.source}:
              </Typography>
              <Typography
                variant="body2"
                noWrap
                sx={{
                  ml: 1,
                  flexGrow: 1,
                  color: log.severity === 'error' ? theme.palette.error.main : theme.palette.text.primary,
                }}
              >
                {log.message}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 1 }}>
            {log.severity === 'error' && log.message && (
              <Alert severity="error" sx={{ mb: 1 }}>
                {log.message}
              </Alert>
            )}
            {log.details && (
              <Box
                sx={{
                  position: 'relative',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  p: 1.5,
                  bgcolor: theme.palette.background.default,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider}`,
                  color: theme.palette.text.primary,
                }}
              >
                <Tooltip title="Copy details to clipboard">
                  <IconButton
                    size="small"
                    onClick={() => handleCopyToClipboard(log.details || '')}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 1,
                      color: theme.palette.text.secondary,
                      bgcolor: theme.palette.background.paper + 'A0',
                      '&:hover': {
                        bgcolor: theme.palette.background.paper,
                      },
                    }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Typography variant="body2" component="pre" sx={{ margin: 0, color: theme.palette.text.primary }}>
                  {log.details}
                </Typography>
              </Box>
            )}
            {log.rawOutput && (
              <Box
                sx={{
                  position: 'relative',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  p: 1.5,
                  bgcolor: theme.palette.background.default,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider}`,
                  color: theme.palette.text.primary,
                  mt: log.details ? 1 : 0, // Add margin if details are also present
                }}
              >
                <Tooltip title="Copy raw output to clipboard">
                  <IconButton
                    size="small"
                    onClick={() =>
                      handleCopyToClipboard(
                        `${log.rawOutput?.stdout || ''}\n${log.rawOutput?.stderr || ''}`,
                      )
                    }
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 1,
                      color: theme.palette.text.secondary,
                      bgcolor: theme.palette.background.paper + 'A0',
                      '&:hover': {
                        bgcolor: theme.palette.background.paper,
                      },
                    }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {log.rawOutput.stdout && (
                  <Typography variant="body2" component="pre" sx={{ margin: 0, color: theme.palette.text.primary }}>
                    {log.rawOutput.stdout}
                  </Typography>
                )}
                {log.rawOutput.stderr && (
                  <Typography variant="body2" component="pre" sx={{ margin: 0, color: theme.palette.error.main }}>
                    {log.rawOutput.stderr}
                  </Typography>
                )}
                {log.rawOutput.exitCode !== undefined && (
                  <Typography variant="caption" sx={{ mt: 1, display: 'block', color: theme.palette.text.secondary }}>
                    Exit Code: {log.rawOutput.exitCode}
                  </Typography>
                )}
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
      <Fab
        size="small"
        color="secondary"
        aria-label="clear logs"
        onClick={clearLogs}
        sx={{ position: 'sticky', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}
      >
        <ClearAllIcon />
      </Fab>
    </Box>
  );
};

export default OutputLogger;
