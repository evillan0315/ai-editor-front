import React from 'react';
import {
  Box,
  IconButton,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  Shuffle,
  Repeat,
  RepeatOne,
} from '@mui/icons-material';
import { useStore } from '@nanostores/react';
import {
  isPlayingAtom,
  nextTrack,
  previousTrack,
  toggleShuffle,
  toggleRepeat,
  repeatModeAtom,
  shuffleAtom,
  $mediaStore,
  setPlaying,
} from '@/stores/mediaStore';

interface MediaPlayerControlsProps {
  // mediaElementRef is no longer directly used in this component after removing the progress slider.
  // All playback controls interact with the global media element via the mediaStore.
}

const MediaPlayerControls: React.FC<MediaPlayerControlsProps> = () => {
  const theme = useTheme();
  const { loading } = useStore($mediaStore);
  const isPlaying = useStore(isPlayingAtom);
  const shuffle = useStore(shuffleAtom);
  const repeatMode = useStore(repeatModeAtom);

  const handlePlayPause = () => {
    setPlaying(!isPlaying);
  };

  const handleNext = () => {
    nextTrack();
  };

  const handlePrevious = () => {
    previousTrack();
  };

  const $isLoading = loading;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flexGrow: 1,
        width: 'auto',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0, mt: 0 }}>
        <IconButton
          size="small"
          sx={{ color: theme.palette.text.primary }}
          onClick={toggleShuffle}
        >
          <Shuffle fontSize="small" color={shuffle ? 'primary' : 'inherit'} />
        </IconButton>
        <IconButton
          size="small"
          sx={{ color: theme.palette.text.primary }}
          onClick={handlePrevious}
        >
          <SkipPrevious fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={handlePlayPause}
          disabled={$isLoading}
          sx={{
            color: theme.palette.text.primary,
            bgcolor: theme.palette.primary.main,
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
            },
            borderRadius: '50%',

          }}
        >
          {$isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : isPlaying ? (
            <Pause fontSize="small" />
          ) : (
            <PlayArrow fontSize="small" />
          )}
        </IconButton>
        <IconButton
          size="small"
          sx={{ color: theme.palette.text.primary }}
          onClick={handleNext}
        >
          <SkipNext fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          sx={{ color: theme.palette.text.primary }}
          onClick={toggleRepeat}
        >
          {repeatMode === 'track' ? (
            <RepeatOne fontSize="small" color="primary" />
          ) : (
            <Repeat
              fontSize="small"
              color={repeatMode === 'context' ? 'primary' : 'inherit'}
            />
          )}
        </IconButton>
      </Box>
    </Box>
  );
};

export default MediaPlayerControls;
