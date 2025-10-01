import React, { useEffect, useRef } from 'react';
import { Box, Container } from '@mui/material';
import BrowserAppToolbar from '@/components/preview/BrowserAppToolbar';
import AppPreviewContent from '@/components/preview/AppPreviewContent';
import { useStore } from '@nanostores/react';
import { appPreviewStore } from '@/stores/appPreviewStore';

// No longer needed as proxy setting is managed by appPreviewStore
// interface PreviewAppPageProps {
//   proxyServer?: boolean;
// }

const PreviewAppPage: React.FC = () => { // Removed props
  const { currentUrl, screenSize } = useStore(appPreviewStore);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize currentUrl in the store if it's empty, using the environment variable
  useEffect(() => {
    if (!currentUrl && import.meta.env.VITE_PREVIEW_APP_URL) {
      appPreviewStore.setKey('currentUrl', import.meta.env.VITE_PREVIEW_APP_URL);
    }
  }, [currentUrl]);

  const handleUrlChange = (newUrl: string) => {
    appPreviewStore.setKey('currentUrl', newUrl);
  };

  const handleScreenSizeChange = (size: 'mobile' | 'tablet' | 'desktop') => {
    appPreviewStore.setKey('screenSize', size);
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.location.reload();
    }
  };

  const handleGoBack = () => { // New handler for back navigation
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.history.back();
    }
  };

  const handleResetToDefault = () => {
    appPreviewStore.setKey('currentUrl', import.meta.env.VITE_PREVIEW_APP_URL || '');
  };

  return (
    <Container
      maxWidth={false}
      sx={{ py: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}
    >
      <Box className="flex flex-col items-center justify-center">
        <BrowserAppToolbar
          onUrlChange={handleUrlChange}
          onScreenSizeChange={handleScreenSizeChange}
          onRefresh={handleRefresh}
          onGoBack={handleGoBack} // Pass new handler
          onResetToDefault={handleResetToDefault}
        />
      </Box>

      <AppPreviewContent
        currentUrl={currentUrl}
        screenSize={screenSize}
        iframeRef={iframeRef} // Pass ref to AppPreviewContent
        // proxyServer prop removed, now handled by store directly in AppPreviewContent
      />
    </Container>
  );
};

export default PreviewAppPage;
