import React from 'react';
import { Box, useTheme, Paper } from '@mui/material';
import MediaPlayerControls from './MediaPlayerControls';
import MediaPlayerTrackInfo from './MediaPlayerTrackInfo';
import MediaPlayerVolumeControl from './MediaPlayerVolumeControl';
import { MediaFileResponseDtoUrl, FileType } from '@/types/refactored/media';
import { useStore } from '@nanostores/react';
import {
  isPlayingAtom,
  currentTrackAtom,
  // setPlaying, // Removed, handled by store now
  nextTrack,
  previousTrack,
} from '@/stores/mediaStore';

interface MediaPlayerProps {
  mediaType: FileType.AUDIO | FileType.VIDEO;
  mediaElementRef: React.RefObject<HTMLMediaElement>;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({
  mediaType,
  mediaElementRef,
}) => {
  const theme = useTheme();
  const isPlaying = useStore(isPlayingAtom);
  const currentTrack = useStore(currentTrackAtom);

  // handlePlayPause is now handled by MediaPlayerControls directly calling setPlaying in mediaStore
  const handleNext = () => {
    nextTrack();
  };

  const handlePrevious = () => {
    previousTrack();
  };

  return (
    <Box
      sx={{
        bgcolor: theme.palette.background.paper,
        borderTop: theme.palette.divider,
        height: '49px',
        maxWidth: '600px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: theme.palette.text.primary,
        flexShrink: 0,
        zIndex: 11,
        width: '100%',
        px: 4,
      }}
    >
      <MediaPlayerTrackInfo mediaType={mediaType} />
      <MediaPlayerControls />
      <MediaPlayerVolumeControl />
    </Box>
  );
};

export default MediaPlayer;
