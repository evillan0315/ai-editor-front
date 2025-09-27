import React, { useState, useRef, useEffect, useCallback, SyntheticEvent } from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  IconButton,
  Slider,
  Typography,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  VolumeUp,
  VolumeOff,
  VolumeDown,
  Shuffle,
  Repeat,
  RepeatOne,
  FavoriteBorder,
  Album,
  Movie,
} from '@mui/icons-material';
import { MediaPlayerType } from '@/types/refactored/media';
import {
  $mediaStore,
  setPlaying,
  setVolume,
  setTrackProgress,
  isPlayingAtom,
  volumeAtom,
  progressAtom,
  durationAtom,
  shuffleAtom,
  repeatModeAtom,
} from '@/stores/mediaStore';

// Define types for props
interface MediaPlayerProps {
  src: string; // Audio/Video source URL
  type: MediaPlayerType; // Media type
  onNext?: () => void; // Optional callback for next track
  onPrevious?: () => void; // Optional callback for previous track
  onEnded?: () => void; // Optional callback for when the media ends
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({
  src,
  type,
  onNext,
  onPrevious,
  onEnded,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isPlaying = useStore(isPlayingAtom);
  const volume = useStore(volumeAtom);
  const progress = useStore(progressAtom);
  const duration = useStore(durationAtom);
  const shuffle = useStore(shuffleAtom);
  const repeatMode = useStore(repeatModeAtom);

  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [internalVolume, setInternalVolume] = useState(volume);
  const [isSeeking, setIsSeeking] = useState(false);
  const [internalProgress, setInternalProgress] = useState(progress);
  const [loading, setLoading] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Determine whether it's currently a video or audio player
  const isVideo = type === 'VIDEO';
  const isAudio = type === 'AUDIO';
  // Get the correct ref based on media type
  const mediaRef = isVideo ? videoRef : audioRef;

  // Load media metadata on initial mount and source change
  useEffect(() => {
    const media = mediaRef.current;
    if (media) {
      const handleMetadata = () => {
        setLoading(false);
        setDuration(media.duration);
      };

      const handleData = () => {
        setDuration(media.duration);
        setLoading(false);
      };

      const handleWaiting = () => {
        setLoading(true);
      };

      const handlePlaying = () => {
        setLoading(false);
      };

      media.addEventListener('loadedmetadata', handleMetadata);
      media.addEventListener('loadeddata', handleData);
      media.addEventListener('waiting', handleWaiting);
      media.addEventListener('playing', handlePlaying);
      media.addEventListener('ended', handleEnded);

      return () => {
        media.removeEventListener('loadedmetadata', handleMetadata);
        media.removeEventListener('loadeddata', handleData);
        media.removeEventListener('waiting', handleWaiting);
        media.removeEventListener('playing', handlePlaying);
        media.removeEventListener('ended', handleEnded);
      };
    }
  }, [src, isVideo]);

  // Play/Pause based on isPlaying state
  useEffect(() => {
    const media = mediaRef.current;
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
  }, [isPlaying, isVideo]);

  // Handler functions
  const handlePlayPause = () => {
    setPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
      setTrackProgress(0); // Reset current time when moving to the next media
    }
  };

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
      setTrackProgress(0); // Reset current time when moving to the previous media
    }
  };

  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    const newVolume = typeof newValue === 'number' ? newValue : 0;
    setInternalVolume(newVolume);

    if (mediaRef.current) {
      mediaRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const handleVolumeChangeCommitted = useCallback(
    (_event: Event | SyntheticEvent, newValue: number | number[]) => {
      setVolume(newValue as number);
    },
    [],
  );

  const handleMute = () => {
    setIsMuted(!isMuted);
    if (mediaRef.current) {
      mediaRef.current.muted = !isMuted;
    }
  };

  const handleTimeChange = (event: Event, newValue: number | number[]) => {
    const newTime = typeof newValue === 'number' ? newValue : 0;
    setInternalProgress(newTime);

    if (mediaRef.current) {
      mediaRef.current.currentTime = newTime;
    }
  };

  const handleTimeChangeCommitted = useCallback(
    (_event: Event | SyntheticEvent, newValue: number | number[]) => {
      const media = mediaRef.current;
      if (media) {
        media.currentTime = newValue as number;
        setTrackProgress(newValue as number);
      }
      setIsSeeking(false);
    },
    [mediaRef],
  );

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setTrackProgress(mediaRef.current.currentTime);
    }
  };

  const handleEnded = useCallback(() => {
    setPlaying(false);
    setTrackProgress(0);
    if (onEnded) {
      onEnded();
    }
  }, [onEnded]);

  // Volume Icon
  const getVolumeIcon = () => {
    if (isMuted || internalVolume === 0) {
      return <VolumeOff />;
    } else if (internalVolume < 0.5) {
      return <VolumeDown />;
    } else {
      return <VolumeUp />;
    }
  };

  // Format time for display
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <Box
      sx={{
        // Main Container
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
        zIndex: 11, // Ensure player bar is above video overlay
      }}
    >
      {/* Left section: Current Song Info */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '30%',
          minWidth: '180px',
        }}
      >
        {type === 'VIDEO' ? (
          <Movie
            sx={{ fontSize: 40, mr: 1, color: theme.palette.text.secondary }}
          />
        ) : (
          <Album
            sx={{ fontSize: 40, mr: 1, color: theme.palette.text.secondary }}
          />
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
            {type} - track title
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            Artist Name
          </Typography>
        </Box>
        <IconButton
          size='small'
          sx={{ ml: 2, color: theme.palette.text.secondary }}
          disabled
        >
          <FavoriteBorder fontSize='small' />
        </IconButton>
      </Box>

      {/* Middle section: Playback Controls and Progress */}
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
            onClick={() => toggleShuffle}
          >
            <Shuffle fontSize='small' color={shuffle ? 'primary' : 'inherit'} />
          </IconButton>
          <IconButton
            size='small'
            sx={{ color: theme.palette.text.primary }}
            onClick={handlePrevious}
            disabled={!onPrevious}
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
            disabled={!onNext}
          >
            <SkipNext fontSize='small' />
          </IconButton>
          <IconButton
            size='small'
            sx={{ color: theme.palette.text.primary }}
            onClick={() =>{
            }}
          >
            {repeatMode === 'track' ? (
              <RepeatOne fontSize='small' color='primary' />
            ) : (
              <Repeat fontSize='small' color={repeatMode === 'context' ? 'primary' : 'inherit'} />
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
          <Typography variant='caption' color='text.secondary'>
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
            disabled={!src}
          />
          <Typography variant='caption' color='text.secondary'>
            {formatTime(duration)}
          </Typography>
        </Box>
      </Box>

      {/* Right section: Volume and other controls */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '30%',
          justifyContent: 'flex-end',
          minWidth: '180px',
        }}
      >
        <IconButton
          size='small'
          sx={{ color: theme.palette.text.primary }}
          onClick={handleMute}
        >
          {isMuted || internalVolume === 0 ? (
            <VolumeOff />
          ) : (
            <VolumeUp />
          )}
        </IconButton>
        <Slider
          size='small'
          value={internalVolume * 100 ?? 0}
          onChange={handleVolumeChange}
          onChangeCommitted={handleVolumeChangeCommitted}
          min={0}
          max={100}
          aria-label='Volume'
          sx={{
            width: 100,
            color: theme.palette.primary.main,
            height: 4,
            '& .MuiSlider-thumb': {
              width: 12,
              height: 12,
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default MediaPlayer;
