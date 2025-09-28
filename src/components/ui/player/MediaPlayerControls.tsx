import React, { useCallback, useState, SyntheticEvent, useEffect } from 'react';
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
  Shuffle,
  Repeat,
  RepeatOne,
} from '@mui/icons-material';
import { MediaFileResponseDtoUrl } from '@/types/refactored/media';
import { useStore } from '@nanostores/react';
import {
  isPlayingAtom,
  progressAtom,
  durationAtom,
  setTrackProgress,
  setTrackDuration,
  setLoading,
  nextTrack,
  previousTrack,
  toggleShuffle,
  toggleRepeat,
  repeatModeAtom,
  shuffleAtom,
  currentTrackAtom,
  $mediaStore,
  setPlaying
} from '@/stores/mediaStore';

interface MediaPlayerControlsProps {
  mediaElementRef: React.RefObject<HTMLMediaElement>;
}

const MediaPlayerControls: React.FC<MediaPlayerControlsProps> = ({
  mediaElementRef
}) => {
  const theme = useTheme();
  const { loading } = useStore($mediaStore);
  const isPlaying = useStore(isPlayingAtom);
  const trackProgress = useStore(progressAtom);
  const duration = useStore(durationAtom);
  const currentTrack = useStore(currentTrackAtom);
  const shuffle = useStore(shuffleAtom);
  const repeatMode = useStore(repeatModeAtom);
  const [isSeeking, setIsSeeking] = useState(false);

  useEffect(() => {
    if (mediaElementRef.current && isPlaying) {
      mediaElementRef.current.play().catch(e => {
        console.error("Autoplay failed:", e);
      });
    } else if (mediaElementRef.current && !isPlaying) {
      mediaElementRef.current.pause();
    }
  }, [isPlaying, mediaElementRef]);

  const handlePlayPause = () => {
    if (mediaElementRef.current) {
      if (isPlaying) {
        mediaElementRef.current.pause();
        setPlaying(false)
      } else {
        mediaElementRef.current.play();
        setPlaying(true)
      }
    }
  };

  const handleNext = () => {
    nextTrack();
  };

  const handlePrevious = () => {
    previousTrack();
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
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

  const $isLoading = loading;

  return (
    <Box
      sx={{ display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flexGrow: 1,
        maxWidth: '600px',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <IconButton
          size='small'
          sx={{ color: theme.palette.text.primary }}
          onClick={toggleShuffle}
        >
          <Shuffle fontSize='small' color={shuffle ? 'primary' : 'inherit'} />
        </IconButton>
        <IconButton
          size='small'
          sx={{ color: theme.palette.text.primary }}
          onClick={handlePrevious}
        >
          <SkipPrevious fontSize='small' />
        </IconButton>
        <IconButton
          size='large'
          onClick={handlePlayPause}
          disabled={$isLoading}
          sx={
            {
            color: theme.palette.text.primary,
            bgcolor: theme.palette.primary.main,
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
            },
            borderRadius: '50%',
            width: 48,
            height: 48,
          }
          }
        >
          {$isLoading ? (
            <CircularProgress size={24} color='inherit' />
          ) : isPlaying ? (
            <Pause fontSize='large' />
          ) : (
            <PlayArrow fontSize='large' />
          )}
        </IconButton>
        <IconButton
          size='small'
          sx={{ color: theme.palette.text.primary }}
          onClick={handleNext}
        >
          <SkipNext fontSize='small' />
        </IconButton>
        <IconButton
          size='small'
          sx={{ color: theme.palette.text.primary }}
          onClick={toggleRepeat}
        >
          {repeatMode === 'track' ? (
            <RepeatOne fontSize='small' color='primary' />
          ) : (
            <Repeat
              fontSize='small'
              color={repeatMode === 'context' ? 'primary' : 'inherit'}
            />
          )}
        </IconButton>
      </Box>
      <Box
        sx={{ width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography variant='caption' color='text.secondary'>
          {formatTime(trackProgress)}
        </Typography>
        <Slider
          size='small'
          value={trackProgress ?? 0}
          onChange={handleTimeChange}
          onChangeCommitted={handleTimeChangeCommitted}
          min={0}
          max={duration ?? 0}
          aria-label='Track progress'
          sx={{
            color: theme.palette.primary.main,
            height: 4,
            width: '100%',
            '& .MuiSlider-thumb': {
              width: 12,
              height: 12,
            },
          }}
          disabled={!currentTrack}
        />
        <Typography variant='caption' color='text.secondary'>
          {formatTime(duration)}
        </Typography>
      </Box>
    </Box>
  );
};

export default MediaPlayerControls;
