import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { themeStore } from '@/stores/themeStore';
import { useTheme } from '@mui/material';
import { IconButton, TextField, Paper, Box, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ZoomInIcon from '@mui/icons-material/ZoomIn'; // Not implemented yet but kept for future expansion
import ZoomOutIcon from '@mui/icons-material/ZoomOut'; // Not implemented yet but kept for future expansion
import MobileScreenShareIcon from '@mui/icons-material/MobileScreenShare';
import TabletIcon from '@mui/icons-material/Tablet';
import LaptopIcon from '@mui/icons-material/Laptop';
import HomeIcon from '@mui/icons-material/Home';
import { appPreviewStore } from '@/stores/appPreviewStore';

interface BrowserAppToolbarProps {
  onRefresh?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onUrlChange: (url: string) => void;
  onScreenSizeChange: (size: 'mobile' | 'tablet' | 'desktop') => void;
  onResetToDefault: () => void;
}

const BrowserAppToolbar: React.FC<BrowserAppToolbarProps> = ({
  onRefresh,
  onZoomIn,
  onZoomOut,
  onUrlChange,
  onScreenSizeChange,
  onResetToDefault,
}) => {
  const theme = useTheme();
  const { currentUrl, screenSize } = useStore(appPreviewStore);
  const [internalUrl, setInternalUrl] = useState(currentUrl);

  useEffect(() => {
    setInternalUrl(currentUrl);
  }, [currentUrl]);

  const handleInternalUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInternalUrl(event.target.value);
  };

  const handleUrlSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedUrl = internalUrl.trim();
    if (trimmedUrl && isValidUrl(trimmedUrl)) {
      onUrlChange(trimmedUrl);
    } else {
      // Optionally, show an error message for invalid URL
      console.error('Invalid URL:', trimmedUrl);
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const getScreenSizeButtonColor = (size: 'mobile' | 'tablet' | 'desktop') => {
    return screenSize === size ? 'primary' : 'inherit';
  };

  return (
    <Paper
      elevation={2}
      className="p-2 w-full rounded-0"
      sx={{
        borderRadius: '6px 6px 0 0px',
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        border: `1px solid ${theme.palette.divider}`,
        borderBottom: 0,
        marginBottom: `1px`,
      }}
    >
      <Box className="flex items-center gap-2 w-full">
        <Tooltip title="Reset URL to default"><IconButton aria-label="reset url" onClick={onResetToDefault}>
          <HomeIcon />
        </IconButton></Tooltip>
        <form onSubmit={handleUrlSubmit} className="flex-grow">
          <TextField
            label="URL"
            variant="outlined"
            size="small"
            value={internalUrl}
            onChange={handleInternalUrlChange}
            onBlur={() => onUrlChange(internalUrl.trim())}
            className="w-full"
            error={!!internalUrl && !isValidUrl(internalUrl)}
            helperText={!!internalUrl && !isValidUrl(internalUrl) ? 'Invalid URL format' : ''}
          />
        </form>
        <Tooltip title="Refresh iframe"><IconButton aria-label="refresh" onClick={onRefresh}>
          <RefreshIcon />
        </IconButton></Tooltip>
        {/* Zoom functionality not implemented yet */}
        {/* <IconButton aria-label="zoom in" onClick={onZoomIn}>
          <ZoomInIcon />
        </IconButton>
        <IconButton aria-label="zoom out" onClick={onZoomOut}>
          <ZoomOutIcon />
        </IconButton> */}
        <Tooltip title="Mobile view"><IconButton
          aria-label="mobile view"
          onClick={() => onScreenSizeChange('mobile')}
          color={getScreenSizeButtonColor('mobile')}
        >
          <MobileScreenShareIcon />
        </IconButton></Tooltip>
        <Tooltip title="Tablet view"><IconButton
          aria-label="tablet view"
          onClick={() => onScreenSizeChange('tablet')}
          color={getScreenSizeButtonColor('tablet')}
        >
          <TabletIcon />
        </IconButton></Tooltip>
        <Tooltip title="Desktop view"><IconButton
          aria-label="desktop view"
          onClick={() => onScreenSizeChange('desktop')}
          color={getScreenSizeButtonColor('desktop')}
        >
          <LaptopIcon />
        </IconButton></Tooltip>
      </Box>
    </Paper>
  );
};

export default BrowserAppToolbar;
