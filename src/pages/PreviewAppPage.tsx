import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  useTheme,
  Alert,
  CircularProgress,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { APP_NAME } from '@/constants';

interface PreviewAppPageProps {
  // No specific props needed, URL is from environment variables
}

const PreviewAppPage: React.FC<PreviewAppPageProps> = () => {
  const theme = useTheme();
  const [loadingIframe, setLoadingIframe] = useState(true);
  const [iframeError, setIframeError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const previewAppUrl = import.meta.env.VITE_PREVIEW_APP_URL;

  useEffect(() => {
    if (previewAppUrl) {
      setLoadingIframe(true);
      setIframeError(null);
    } else {
      setIframeError(
        'VITE_PREVIEW_APP_URL is not configured in your environment variables.',
      );
      setLoadingIframe(false);
    }
  }, [previewAppUrl]);

  const handleIframeLoad = () => {
    setLoadingIframe(false);
    try {
      // Attempt to access contentDocument to check for load errors within the iframe
      // This can trigger CORS errors if the iframe content is from a different origin
      if (iframeRef.current?.contentDocument) {
        console.log('Iframe loaded successfully.');
      } else {
        console.warn(
          'Iframe loaded, but contentDocument is inaccessible (likely CORS or no content).',
        );
      }
    } catch (e: any) {
      console.error('Error accessing iframe content (likely CORS issue):', e);
      setIframeError(
        `Failed to access iframe content: ${e.message || 'Possible Cross-Origin Restriction (CORS).'}`,
      );
    }
  };

  const handleIframeError = () => {
    setLoadingIframe(false);
    setIframeError(
      'Failed to load the preview application. Check the URL and server status.',
    );
  };

  return (
    <Container
      maxWidth={false}
      sx={{ py: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          flexGrow: 1,
          // minHeight: 'calc(100vh - 120px)', // Adjust based on Navbar/Footer height
        }}
      >
        <VisibilityIcon
          sx={{ fontSize: 60, color: theme.palette.primary.main }}
        />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Preview Built Application
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          align="center"
          sx={{ mb: 2 }}
        >
          This component embeds a built frontend application from a configured
          URL (<code>VITE_PREVIEW_APP_URL</code>).
        </Typography>

        {!previewAppUrl ? (
          <Alert severity="error" sx={{ width: '100%', maxWidth: 600 }}>
            <strong>Configuration Error:</strong>{' '}
            <code>VITE_PREVIEW_APP_URL</code> is not defined. Please set this
            environment variable to the URL where your built application is
            served.
          </Alert>
        ) : (
          <Box
            sx={{
              width: '100%',
              flexGrow: 1,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {loadingIframe && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: theme.palette.background.default,
                  zIndex: 10,
                }}
              >
                <CircularProgress size={40} />
                <Typography
                  variant="h6"
                  sx={{ mt: 2, color: theme.palette.text.secondary }}
                >
                  Loading preview from {previewAppUrl}...
                </Typography>
              </Box>
            )}
            {iframeError && (
              <Alert
                severity="error"
                sx={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  right: 16,
                  zIndex: 11,
                }}
              >
                <strong>Error:</strong> {iframeError}
                <br />
                Please ensure the URL (<code>{previewAppUrl}</code>) is correct
                and the application is running.
              </Alert>
            )}
            <iframe
              ref={iframeRef}
              src={previewAppUrl}
              title={`${APP_NAME} Preview`}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: loadingIframe ? 'none' : 'block', // Hide iframe until loaded
              }}
              allow="geolocation; microphone; camera"
            />
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default PreviewAppPage;
