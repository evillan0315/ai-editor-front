import React from 'react';
import { Box, useTheme } from '@mui/material';
import MediaPlayerControls from './MediaPlayerControls';
import MediaPlayerTrackInfo from './MediaPlayerTrackInfo';
import MediaPlayerVolumeControl from './MediaPlayerVolumeControl';
import { MediaFileResponseDtoUrl, FileType } from '@/types/refactored/media';
import { useStore } from '@nanostores/react';
import {
  isPlayingAtom,
  currentTrackAtom,
  setPlaying,
  nextTrack,
  previousTrack,
} from '@/stores/mediaStore';

interface MediaPlayerProps {
  mediaType: FileType.AUDIO | FileType.VIDEO;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({ mediaType }) => {
  const theme = useTheme();
  const isPlaying = useStore(isPlayingAtom);
  const currentTrack = useStore(currentTrackAtom);

  const handlePlayPause = () => {
    setPlaying(!isPlaying);
  };

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
      <MediaPlayerControls
        isPlaying={isPlaying}
        currentTrack={currentTrack}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
      <MediaPlayerVolumeControl />
    </Box>
  );
};

export default MediaPlayer;
