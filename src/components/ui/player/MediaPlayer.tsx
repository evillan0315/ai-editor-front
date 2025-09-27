import React from 'react';
import { Box, useTheme } from '@mui/material';
import MediaPlayerControls from './MediaPlayerControls';
import MediaPlayerTrackInfo from './MediaPlayerTrackInfo';
import MediaPlayerVolumeControl from './MediaPlayerVolumeControl';

interface MediaPlayerProps {
  mediaType: 'AUDIO' | 'VIDEO';
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({ mediaType }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        bgcolor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
        height: '80px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        color: theme.palette.text.primary,
        flexShrink: 0,
        zIndex: 11,
      }}
    >
      <MediaPlayerTrackInfo mediaType={mediaType} />
      <MediaPlayerControls />
      <MediaPlayerVolumeControl />
    </Box>
  );
};

export default MediaPlayer;