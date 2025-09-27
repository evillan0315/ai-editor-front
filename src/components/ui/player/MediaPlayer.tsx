import React, { useEffect } from 'react';
import { Box, useTheme } from '@mui/material';
import MediaPlayerControls from './MediaPlayerControls';
import MediaPlayerTrackInfo from './MediaPlayerTrackInfo';
import MediaPlayerVolumeControl from './MediaPlayerVolumeControl';
import { MediaFileResponseDtoUrl, FileType } from '@/types/refactored/media';



interface MediaPlayerProps {
  mediaFile: MediaFileResponseDtoUrl;
  mediaType: FileType.AUDIO | FileType.VIDEO;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({ mediaFile, mediaType }) => {
  const theme = useTheme();
    // Set initial loading state when a new track is selected
  useEffect(() => {
    if (mediaFile) {
      console.log(mediaFile, 'mediaFile MediaPlayer');
    } else {

    }
  }, [mediaFile]);
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
      <MediaPlayerControls mediaFile={mediaFile}/>
      <MediaPlayerVolumeControl />
    </Box>
  );
};

export default MediaPlayer;
