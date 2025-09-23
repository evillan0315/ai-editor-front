import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { themeStore } from '@/stores/themeStore';
import { useTheme } from '@mui/material';
import { IconButton, TextField, Paper, Box } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import MobileScreenShareIcon from '@mui/icons-material/MobileScreenShare';
import TabletIcon from '@mui/icons-material/Tablet';
import LaptopIcon from '@mui/icons-material/Laptop';
import HomeIcon from '@mui/icons-material/Home';
interface BrowserAppToolbarProps {
  onRefresh?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onUrlChange: (url: string) => void;
  onScreenSizeChange: (size: string) => void;
}

const BrowserAppToolbar: React.FC<BrowserAppToolbarProps> = ({
  onRefresh,
  onZoomIn,
  onZoomOut,
  onUrlChange,
  onScreenSizeChange,
}) => {
  const theme = useTheme();
  const { mode } = useStore(themeStore);
  const [url, setUrl] = useState<string>('');

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = event.target.value;
    setUrl(newUrl);
    onUrlChange(newUrl);
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
        <IconButton aria-label="refresh" onClick={onRefresh}>
          <HomeIcon />
        </IconButton>
        <TextField
          label="URL"
          variant="outlined"
          size="small"
          value={url}
          onChange={handleUrlChange}
          className="flex-grow"
        />
        <IconButton aria-label="refresh" onClick={onRefresh}>
          <RefreshIcon />
        </IconButton>
        <IconButton aria-label="zoom in" onClick={onZoomIn}>
          <ZoomInIcon />
        </IconButton>
        <IconButton aria-label="zoom out" onClick={onZoomOut}>
          <ZoomOutIcon />
        </IconButton>
        <IconButton
          aria-label="mobile view"
          onClick={() => onScreenSizeChange('mobile')}
        >
          <MobileScreenShareIcon />
        </IconButton>
        <IconButton
          aria-label="tablet view"
          onClick={() => onScreenSizeChange('tablet')}
        >
          <TabletIcon />
        </IconButton>
        <IconButton
          aria-label="desktop view"
          onClick={() => onScreenSizeChange('desktop')}
        >
          <LaptopIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default BrowserAppToolbar;
