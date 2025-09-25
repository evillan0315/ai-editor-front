import React, { useState, ReactNode } from 'react';
import {
  Drawer,
  Box,
  IconButton,
  Typography,
  useTheme,
  Slide,
  Zoom,
  Dialog,
  DialogContent,
  AppBar,
  Toolbar,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useStore } from '@nanostores/react';
import { themeStore } from '@/stores/themeStore';

// Define the types for the drawer
interface CustomDrawerProps {
  open: boolean;
  onClose: () => void;
  position: 'left' | 'right' | 'top' | 'bottom';
  size: 'normal' | 'medium' | 'large' | 'fullscreen';
  hasBackdrop?: boolean;
  closeOnEscape?: boolean;
  stickyHeader?: ReactNode;
  stickyFooter?: ReactNode;
  children: ReactNode;
  title?: string;
}

const drawerWidthPercentage: Record<CustomDrawerProps['size'], number> = {
  normal: 1 / 3,
  medium: 1 / 2,
  large: 3 / 4,
  fullscreen: 1,
};

// Drawer component
const CustomDrawer: React.FC<CustomDrawerProps> = ({
  open,
  onClose,
  position,
  size = 'normal',
  hasBackdrop = true,
  closeOnEscape = true,
  stickyHeader,
  stickyFooter,
  children,
  title,
}) => {
  const theme = useTheme();
  const { mode } = useStore(themeStore);
  const drawerWidth = `${drawerWidthPercentage[size] * 100}%`;
  const isFullScreen = size === 'fullscreen';

  // Styles for the drawer based on the position
  const drawerPaperStyle = {
    ...(position === 'left' || position === 'right'
      ? { width: isFullScreen ? '100%' : drawerWidth }
      : { height: isFullScreen ? '100%' : drawerWidth }),
    bgcolor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    overflow: 'auto',
  };

  const backdrop = hasBackdrop ? 'static' : undefined;
  const closeOnKey = closeOnEscape ? undefined : 'escapeKeyDown';

  const container = isFullScreen ? Dialog : Slide;

  return (
    <Drawer
      anchor={position}
      open={open}
      onClose={onClose}
      ModalProps={{ backdrop: backdrop, disableEscapeKeyDown: closeOnKey }}
      PaperProps={{ sx: drawerPaperStyle }}
    >
      {isFullScreen ? (
        <DialogContent>
          <AppBar sx={{ position: 'relative' }}>
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                onClick={onClose}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                {title}
              </Typography>
            </Toolbar>
          </AppBar>
          <Box sx={{ p: 2 }}>{children}</Box>
        </DialogContent>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          {stickyHeader && (
            <Box
              sx={{
                p: 2,
                bgcolor: theme.palette.background.default,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              {stickyHeader}
            </Box>
          )}
          <Paper
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              p: 2,
            }}
          >
            {children}
          </Paper>
          {stickyFooter && (
            <Box
              sx={{
                p: 2,
                bgcolor: theme.palette.background.default,
                borderTop: `1px solid ${theme.palette.divider}`,
              }}
            >
              {stickyFooter}
            </Box>
          )}
        </Box>
      )}
    </Drawer>
  );
};

export default CustomDrawer;
