import React, { useCallback } from 'react';
import { useStore } from '@nanostores/react';
import {
  isPlayingAtom,
  setPlaying,
  shuffleAtom,
  repeatModeAtom,
  toggleRepeat,
  toggleShuffle,
  setTrackProgress,
  durationAtom,
} from '@/stores/mediaStore';
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
import { currentTrackAtom } from '@/stores/mediaStore';
import { SyntheticEvent, useState, useRef, useEffect } from 'react';
interface MediaPlayerControlsProps {}

const MediaPlayerControls: React.FC<MediaPlayerControlsProps> = () => {
  const theme = useTheme();
  const isPlaying = useStore(isPlayingAtom);
  const shuffle = useStore(shuffleAtom);
  const repeatMode = useStore(repeatModeAtom);
  const duration = useStore(durationAtom);
  const [loading, setLoading] = useState(false);
  const currentTrack = useStore(currentTrackAtom);

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);

  const mediaRef = currentTrack?.fileType === 'VIDEO' ? videoRef : audioRef;

  useEffect(() => {
    const media = mediaRef?.current;
    if (media) {
      const handleMetadata = () => {
        setLoading(false);
        //setTrackDuration(media.duration);
      };

      const handleData = () => {
        //setTrackDuration(media.duration);
        setLoading(false);
      };

      const handleWaiting = () => {
        setLoading(true);
      };

      const handlePlaying = () => {
        setLoading(false);
      };

      const handleTimeUpdate = () => {
        if (!mediaRef.current) return;
        setTrackProgress(mediaRef.current.currentTime);
      };

      const handleEnded = () => {
        setPlaying(false);
        setTrackProgress(0);
      };

      media.addEventListener('loadedmetadata', handleMetadata);
      media.addEventListener('loadeddata', handleData);
      media.addEventListener('waiting', handleWaiting);
      media.addEventListener('playing', handlePlaying);
      media.addEventListener('timeupdate', handleTimeUpdate);
      media.addEventListener('ended', handleEnded);
      return () => {
        media.removeEventListener('loadedmetadata', handleMetadata);
        media.removeEventListener('loadeddata', handleData);
        media.removeEventListener('waiting', handleWaiting);
        media.removeEventListener('playing', handlePlaying);
        media.removeEventListener('timeupdate', handleTimeUpdate);
        media.removeEventListener('ended', handleEnded);
      };
    }
  }, [mediaRef]);

  // Play/Pause based on isPlaying state
  useEffect(() => {
    const media = mediaRef?.current;

    if (media) {
      if (isPlaying) {
        media.play().catch((error) => {
          console.error('Playback failed:', error);
          setPlaying(false);
        });
      } else {
        media.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  // Load media when currentTrack changes
  useEffect(() => {
    if (!currentTrack) {
      setCurrentSrc(null);
      return;
    }
    let mediaUrl = currentTrack.mediaSrc;
    if (mediaRef?.current && currentSrc !== mediaUrl) {
      setCurrentSrc(currentTrack.mediaSrc);
      mediaRef.current.load();
      if (isPlaying) {
        mediaRef.current.play();
      }
    }
  }, [currentTrack, isPlaying, currentSrc]);

  const handlePlayPause = () => {
    setPlaying(!isPlaying);
  };

  const handleNext = () => {};
  const handlePrevious = () => {};

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleTimeChange = (event: Event, newValue: number | number[]) => {
    const newTime = typeof newValue === 'number' ? newValue : 0;

    if (mediaRef?.current) {
      mediaRef.current.currentTime = newTime;
    }
  };

  const handleTimeChangeCommitted = useCallback(
    (_event: Event | SyntheticEvent, newValue: number | number[]) => {
      const media = mediaRef?.current;
      if (media) {
        media.currentTime = newValue as number;
        setTrackProgress(newValue as number);
      }
    },
    [],
  );
  return (
    <Box
      sx={{
        display: 'flex',
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
          disabled={loading}
          sx={{
            color: theme.palette.text.primary,
            bgcolor: theme.palette.primary.main,
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
            },
            borderRadius: '50%',
            width: 48,
            height: 48,
          }}
        >
          {loading ? (
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
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {/*  <Typography variant='caption' color='text.secondary'>
          {formatTime(internalProgress)}
        </Typography>
        <Slider
          size='small'
          value={internalProgress ?? 0}
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
          disabled={!currentSrc}
        />
        <Typography variant='caption' color='text.secondary'>
          {formatTime(duration)}
        </Typography> */}
      </Box>
    </Box>
  );
};

export default MediaPlayerControls;