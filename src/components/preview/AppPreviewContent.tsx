import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { useStore } from '@nanostores/react';
import { appPreviewStore } from '@/stores/appPreviewStore';

interface AppPreviewContentProps {
  previewUrl: string | null;
  iframeRef: React.RefObject<HTMLIFrameElement | null>; // Corrected type to allow null
}

const AppPreviewContent: React.FC<AppPreviewContentProps> = ({
  previewUrl,
  iframeRef,
}) => {
  const { currentProjectRoot } = useStore(appPreviewStore);

  useEffect(() => {
    if (iframeRef.current && previewUrl) {
      iframeRef.current.src = previewUrl;
    }
  }, [previewUrl, iframeRef]);

  // Styles for the iframe wrapper
  const iframeWrapperSx = {
    flexGrow: 1,
    border: 'none',
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  // Conditional message if no preview URL is available
  if (!previewUrl) {
    return (
      <Box sx={iframeWrapperSx}>
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            color: 'text.secondary',
            backgroundColor: 'background.default',
            borderRadius: 2,
            boxShadow: 1,
          }}
        >
          No application preview URL configured or selected.
          <br />
          Please ensure `VITE_PREVIEW_APP_URL` is set in your `.env` file
          or set a project root with a valid `package.json` for a `build` script to be run.
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={iframeWrapperSx}>
      <iframe
        ref={iframeRef}
        title="App Preview"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          backgroundColor: 'white',
        }}
      />
    </Box>
  );
};

export default AppPreviewContent;
