import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  SyntheticEvent,
} from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  Typography,
  Slider,
  IconButton,
  useTheme,
  CircularProgress, // Import CircularProgress for loading indicator
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff'; // New: for muted state
import ShuffleIcon from '@mui/icons-material/Shuffle';
import RepeatIcon from '@mui/icons-material/Repeat';
import RepeatOneIcon from '@mui/icons-material/RepeatOne'; // New: for repeat one track
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite'; // New: for liked songs
import AlbumIcon from '@mui/icons-material/Album'; // Placeholder for album art

import {
  spotifyStore,
  togglePlayPause,
  setPlaybackProgress,
  setVolume,
  toggleShuffle,
  toggleRepeat,
  nextTrack,
  previousTrack,
  setLoading,
  setError,
  Track, // New: Import Track interface
} from '@/stores/spotifyStore';
import { RepeatMode } from '@/types'; // Import RepeatMode

interface SpotifyPlayerBarProps {
  // No specific props, all state managed by spotifyStore
}

const SpotifyPlayerBar: React.FC<SpotifyPlayerBarProps> = () => {
  const theme = useTheme();
  const {
    currentTrack,
    isPlaying,
    progress,
    volume,
    shuffle,
    repeat,
    loading,
    error,
  } = useStore(spotifyStore);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [internalProgress, setInternalProgress] = useState(0); // For smoother UI updates
  const [internalVolume, setInternalVolume] = useState(volume);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false); // To prevent UI fighting audio.onTimeUpdate

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume / 100;
      audioRef.current.autoplay = false; // We control playback manually
    }

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      if (!isSeeking && audio && currentTrack) {
        const newProgress = Math.floor(audio.currentTime);
        // Only update if it's different enough to prevent excessive re-renders
        if (Math.abs(newProgress - progress) > 0) {
          setPlaybackProgress(newProgress);
          setInternalProgress(newProgress);
        }
      }
    };

    const handleVolumeChange = () => {
      if (audio) {
        setVolume(Math.round(audio.volume * 100));
        setIsMuted(audio.muted);
      }
    };

    const handleEnded = () => {
      if (repeat === 'track') {
        audio.currentTime = 0;
        audio.play();
      } else {
        nextTrack(); // Plays next track if available, or stops if not repeating context
      }
    };

    const handlePlaying = () => {
      setLoading(false);
      setError(null);
    };

    const handleWaiting = () => {
      setLoading(true);
    };

    const handleError = (e: Event) => {
      const audioTarget = e.target as HTMLAudioElement;
      const mediaError = audioTarget.error;
      let errorMessage = 'Failed to play audio. Please try another track.';

      if (mediaError) {
        switch (mediaError.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Audio playback aborted by user.';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error: Audio file could not be downloaded.';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage =
              'Audio decoding error: The audio file is corrupted or unsupported.';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Audio format not supported by your browser.';
            break;
          default:
            errorMessage = `Audio playback error (${mediaError.code}): ${mediaError.message || 'Unknown error'}.`;
            break;
        }
      }
      console.error('Audio playback error details:', e, mediaError);
      setError(errorMessage);
      setLoading(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('volumechange', handleVolumeChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('volumechange', handleVolumeChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('error', handleError);
    };
  }, [repeat]); // Add repeat to dependency array

  // Control playback based on isPlaying state
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.play().catch((e) => {
          console.error('Playback failed:', e);
          setError('Playback prevented. User interaction required.');
          togglePlayPause(); // Revert UI to paused
        });
      } else {
        audio.pause();
      }
    }
  }, [isPlaying]);

  // Update audio element source when currentTrack changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && currentTrack?.audioSrc) {
      setLoading(true);
      audio.src = currentTrack.audioSrc;
      // audio.load(); // Removed explicit audio.load(), setting src implicitly loads
      audio.play().catch((e) => {
        console.error('New track playback failed:', e);
        setError('Autoplay failed. Please click play manually.');
        setLoading(false);
        // Do not togglePlayPause here, let user manually play
      });
    } else if (audio && !currentTrack) {
      audio.pause();
      audio.src = '';
      setPlaybackProgress(0);
      setInternalProgress(0);
      setLoading(false);
    }
  }, [currentTrack]);

  // Sync volume from store to audio element
  useEffect(() => {
    if (audioRef.current && audioRef.current.volume * 100 !== volume) {
      audioRef.current.volume = volume / 100;
      if (volume > 0 && isMuted) setIsMuted(false);
      if (volume === 0 && !isMuted) setIsMuted(true);
    }
    setInternalVolume(volume);
  }, [volume, isMuted]);

  // Sync progress from store to internal state (for display)
  useEffect(() => {
    setInternalProgress(progress);
  }, [progress]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handlePlayPause = useCallback(() => {
    if (!currentTrack?.audioSrc) {
      setError('No track selected to play.');
      return;
    }
    togglePlayPause();
  }, [currentTrack]);

  const handleVolumeSliderChange = useCallback(
    (_event: Event, newValue: number | number[]) => {
      const newVol = newValue as number;
      if (audioRef.current) {
        audioRef.current.volume = newVol / 100;
        if (newVol > 0 && audioRef.current.muted)
          audioRef.current.muted = false;
        if (newVol === 0 && !audioRef.current.muted)
          audioRef.current.muted = true;
      }
      setInternalVolume(newVol); // Update local state immediately for responsiveness
    },
    [],
  );

  const handleVolumeSliderChangeCommitted = useCallback(
    (_event: Event | SyntheticEvent, newValue: number | number[]) => {
      setVolume(newValue as number); // Update store on commit
    },
    [],
  );

  const handleToggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(audioRef.current.muted);
      // Optionally, save the mute state or revert volume to previous if unmuting from 0
      if (!audioRef.current.muted && audioRef.current.volume === 0) {
        audioRef.current.volume = 0.5; // Default volume if unmuting from 0
      }
      setVolume(Math.round(audioRef.current.volume * 100)); // Sync store
    }
  }, []);

  const handleProgressSliderChange = useCallback(
    (_event: Event, newValue: number | number[]) => {
      setIsSeeking(true);
      setInternalProgress(newValue as number); // Update local state immediately for responsiveness
    },
    [],
  );

  const handleProgressSliderChangeCommitted = useCallback(
    (_event: Event | SyntheticEvent, newValue: number | number[]) => {
      const audio = audioRef.current;
      if (audio && currentTrack) {
        audio.currentTime = newValue as number;
        setPlaybackProgress(newValue as number); // Update store on commit
      }
      setIsSeeking(false);
    },
    [currentTrack],
  );

  return (
    <Box
      sx={{
        gridArea: 'player',
        bgcolor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
        height: '80px', // Fixed height for player bar
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        color: theme.palette.text.primary,
        flexShrink: 0, // Prevent shrinking
      }}
    >
      {error && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 80,
            left: 0,
            width: '100%',
            zIndex: 1,
            p: 1,
          }}
        >
          <Typography
            color="error"
            variant="caption"
            sx={{
              bgcolor: theme.palette.error.main + 'E0',
              p: 0.5,
              borderRadius: 1,
            }}
          >
            {error}
          </Typography>
        </Box>
      )}
      {/* Left section: Current Song Info */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '30%',
          minWidth: '180px',
        }}
      >
        {currentTrack?.coverArt ? (
          <img
            src={currentTrack.coverArt}
            alt={currentTrack.album}
            style={{
              width: 40,
              height: 40,
              marginRight: theme.spacing(1),
              borderRadius: 4,
            }}
          />
        ) : (
          <AlbumIcon
            sx={{ fontSize: 40, mr: 1, color: theme.palette.text.secondary }}
          />
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {currentTrack?.title || 'No track playing'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {currentTrack?.artist || 'Artist Name'}
          </Typography>
        </Box>
        <IconButton
          size="small"
          sx={{ ml: 2, color: theme.palette.text.secondary }}
          disabled={!currentTrack}
        >
          <FavoriteBorderIcon fontSize="small" />{' '}
          {/* TODO: Add logic for liked songs */}
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
            size="small"
            sx={{ color: theme.palette.text.primary }}
            onClick={toggleShuffle}
          >
            <ShuffleIcon
              fontSize="small"
              color={shuffle ? 'primary' : 'inherit'}
            />
          </IconButton>
          <IconButton
            size="small"
            sx={{ color: theme.palette.text.primary }}
            onClick={previousTrack}
            disabled={!currentTrack}
          >
            <SkipPreviousIcon />
          </IconButton>
          <IconButton
            size="large"
            onClick={handlePlayPause}
            disabled={!currentTrack || loading}
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
              <CircularProgress size={24} color="inherit" />
            ) : isPlaying ? (
              <PauseIcon fontSize="large" />
            ) : (
              <PlayArrowIcon fontSize="large" />
            )}
          </IconButton>
          <IconButton
            size="small"
            sx={{ color: theme.palette.text.primary }}
            onClick={nextTrack}
            disabled={!currentTrack}
          >
            <SkipNextIcon />
          </IconButton>
          <IconButton
            size="small"
            sx={{ color: theme.palette.text.primary }}
            onClick={toggleRepeat}
          >
            {repeat === 'track' ? (
              <RepeatOneIcon fontSize="small" color="primary" />
            ) : (
              <RepeatIcon
                fontSize="small"
                color={repeat === 'context' ? 'primary' : 'inherit'}
              />
            )}
          </IconButton>
        </Box>
        <Box
          sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Typography variant="caption" color="text.secondary">
            {formatTime(internalProgress)}
          </Typography>
          <Slider
            size="small"
            value={internalProgress}
            onChange={handleProgressSliderChange}
            onChangeCommitted={handleProgressSliderChangeCommitted}
            max={currentTrack?.duration || 0}
            aria-label="Track progress"
            sx={{
              color: theme.palette.primary.main,
              height: 4,
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: `0px 0px 0px 8px ${theme.palette.primary.main}40`,
                },
              },
              '& .MuiSlider-rail': {
                opacity: 0.28,
              },
            }}
            disabled={!currentTrack}
          />
          <Typography variant="caption" color="text.secondary">
            {formatTime(currentTrack?.duration || 0)}
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
          size="small"
          sx={{ color: theme.palette.text.primary }}
          onClick={handleToggleMute}
        >
          {isMuted || internalVolume === 0 ? (
            <VolumeOffIcon />
          ) : (
            <VolumeUpIcon />
          )}
        </IconButton>
        <Slider
          size="small"
          value={internalVolume}
          onChange={handleVolumeSliderChange}
          onChangeCommitted={handleVolumeSliderChangeCommitted}
          max={100}
          aria-label="Volume"
          sx={{
            width: 100,
            color: theme.palette.primary.main,
            height: 4,
            ml: 1,
            '& .MuiSlider-thumb': {
              width: 12,
              height: 12,
            },
          }}
        />
        <IconButton
          size="small"
          sx={{ ml: 2, color: theme.palette.text.primary }}
          disabled // Fullscreen not implemented
        >
          {/* <FullscreenIcon /> */}
        </IconButton>
      </Box>
    </Box>
  );
};

export default SpotifyPlayerBar;
