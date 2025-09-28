import React, { useCallback, SyntheticEvent } from 'react';
import {
  Box,
  IconButton,
  Slider,
  Typography,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
} from '@mui/icons-material';
import { useStore } from '@nanostores/react';
import {
  isPlayingAtom,
  progressAtom,
  durationAtom,
  setTrackProgress,
  nextTrack,
  previousTrack,
  currentTrackAtom,
  $mediaStore,
  setPlaying,
} from '@/stores/mediaStore';

interface MiniMediaPlayerControlsProps {
  mediaElementRef: React.RefObject<HTMLAudioElement>;
}

const formatTime = (time: number): string => {
  if (isNaN(time) || time === Infinity) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const MiniMediaPlayerControls: React.FC<MiniMediaPlayerControlsProps> = ({
  mediaElementRef,
}) => {
  const theme = useTheme();
  const { loading } = useStore($mediaStore);
  const isPlaying = useStore(isPlayingAtom);
  const trackProgress = useStore(progressAtom);
  const duration = useStore(durationAtom);
  const currentTrack = useStore(currentTrackAtom);

  const handlePlayPause = () => {
    if (mediaElementRef.current) {
      if (isPlaying) {
        mediaElementRef.current.pause();
        setPlaying(false);
      } else {
        mediaElementRef.current.play().catch(e => {
          console.error('Playback failed:', e);
          setPlaying(false);
        });
        setPlaying(true);
      }
    }
  };

  const handleNext = () => {
    nextTrack();
  };

  const handlePrevious = () => {
    previousTrack();
  };

  const handleTimeChange = (event: Event, newValue: number | number[]) => {
    const newTime = typeof newValue === 'number' ? newValue : 0;
    if (mediaElementRef?.current) {
      mediaElementRef.current.currentTime = newTime;
      setTrackProgress(newTime);
    }
  };

  const handleTimeChangeCommitted = useCallback(
    (_event: Event | SyntheticEvent, newValue: number | number[]) => {
      const newTime = typeof newValue === 'number' ? newValue : 0;
      if (mediaElementRef?.current) {
        mediaElementRef.current.currentTime = newTime;
        setTrackProgress(newTime);
      }
    },
    [mediaElementRef, setTrackProgress],
  );

  const isPlayerDisabled = !currentTrack || loading;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flexGrow: 1,
        width: '100%',
        color: theme.palette.text.primary,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0 }}>
        <IconButton
          size="small"
          sx={{ color: 'inherit' }}
          onClick={handlePrevious}
          disabled={isPlayerDisabled}
        >
          <SkipPrevious fontSize="small" />
        </IconButton>
        <IconButton
          size="large"
          onClick={handlePlayPause}
          disabled={isPlayerDisabled}
          sx={{
            color: theme.palette.text.primary,
            bgcolor: theme.palette.primary.main,
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
            },
            borderRadius: '50%',
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : isPlaying ? (
            <Pause fontSize="medium" />
          ) : (
            <PlayArrow fontSize="medium" />
          )}
        </IconButton>
        <IconButton
          size="small"
          sx={{ color: 'inherit' }}
          onClick={handleNext}
          disabled={isPlayerDisabled}
        >
          <SkipNext fontSize="small" />
        </IconButton>
        <Box
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {formatTime(trackProgress)}
        </Typography>
        <Slider
          size="small"
          value={trackProgress ?? 0}
          onChange={handleTimeChange}
          onChangeCommitted={handleTimeChangeCommitted}
          min={0}
          max={duration ?? 0}
          aria-label="Track progress"
          sx={{
            color: theme.palette.primary.main,
            height: 4,
            width: '100%',
            '& .MuiSlider-thumb': {
              width: 10,
              height: 10,
            },
          }}
          disabled={isPlayerDisabled}
        />
        <Typography variant="caption" color="text.secondary">
          {formatTime(duration)}
        </Typography>
      </Box>
      </Box>
      
    </Box>
  );
};

export default MiniMediaPlayerControls;
