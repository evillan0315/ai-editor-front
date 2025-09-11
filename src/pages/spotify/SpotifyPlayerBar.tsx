import React,
  {
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
  CircularProgress,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import RepeatIcon from '@mui/icons-material/Repeat';
import RepeatOneIcon from '@mui/icons-material/RepeatOne';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import AlbumIcon from '@mui/icons-material/Album';
import MovieIcon from '@mui/icons-material/Movie'; // New: Icon for video

import {
  $spotifyStore,
  togglePlayPause,
  setPlaybackProgress,
  setVolume,
  toggleShuffle,
  toggleRepeat,
  nextTrack,
  previousTrack,
  setLoading,
  setError,
} from '@/stores/spotifyStore';
import { RepeatMode, FileType } from '@/types/refactored/spotify'; // Import FileType

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
    repeatMode,
    loading,
    error,
  } = useStore($spotifyStore);

  const mediaElementRef = useRef<HTMLMediaElement | null>(null); // Unified ref for audio/video
  const [internalProgress, setInternalProgress] = useState(0);
  const [internalVolume, setInternalVolume] = useState(volume);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);

  // Initialize media element and attach event listeners
  useEffect(() => {
    const media = mediaElementRef.current;
    if (!media) return;

    media.volume = volume / 100;
    media.autoplay = false;

    const handleTimeUpdate = () => {
      if (!isSeeking && media && currentTrack) {
        const newProgress = Math.floor(media.currentTime);
        if (Math.abs(newProgress - progress) > 0) {
          setPlaybackProgress(newProgress);
          setInternalProgress(newProgress);
        }
      }
    };

    const handleVolumeChange = () => {
      if (media) {
        setVolume(Math.round(media.volume * 100));
        setIsMuted(media.muted);
      }
    };

    const handleEnded = () => {
      if (repeatMode === 'track') {
        media.currentTime = 0;
        media.play();
      } else {
        nextTrack();
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
      const mediaTarget = e.target as HTMLMediaElement;
      const mediaError = mediaTarget.error;
      let errorMessage = 'Failed to play media. Please try another file.';

      if (mediaError) {
        switch (mediaError.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Media playback aborted by user.';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error: Media file could not be downloaded.';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage =
              'Media decoding error: The media file is corrupted or unsupported.';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Media format not supported by your browser.';
            break;
          default:
            errorMessage = `Media playback error (${mediaError.code}): ${mediaError.message || 'Unknown error'}.`;
            break;
        }
      }
      console.error('Media playback error details:', e, mediaError);
      setError(errorMessage);
      setLoading(false);
    };

    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('volumechange', handleVolumeChange);
    media.addEventListener('ended', handleEnded);
    media.addEventListener('playing', handlePlaying);
    media.addEventListener('waiting', handleWaiting);
    media.addEventListener('error', handleError);

    return () => {
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('volumechange', handleVolumeChange);
      media.removeEventListener('ended', handleEnded);
      media.removeEventListener('playing', handlePlaying);
      media.removeEventListener('waiting', handleWaiting);
      media.removeEventListener('error', handleError);
    };
  }, [repeatMode, isSeeking, currentTrack, progress, volume]); // Added currentTrack, progress, volume to dependencies

  // Control playback based on isPlaying state
  useEffect(() => {
    const media = mediaElementRef.current;
    if (media) {
      console.log(media, 'useEffect playerBar');
      if (isPlaying) {
        media.play().catch((e) => {
          console.error('Playback failed:', e);
          setError('Playback prevented. User interaction required.');
          togglePlayPause(); // Pause the store if autoplay failed
        });
      } else {
        media.pause();
      }
    }
  }, [isPlaying]);

  // Update media element source when currentTrack changes
  useEffect(() => {
    const media = mediaElementRef.current;
    
    if (media && currentTrack?.mediaSrc) {
      setLoading(true);
      media.src = currentTrack.mediaSrc;
      media.play().catch((e) => {
        console.error('New track playback failed:', e);
        setError('Autoplay failed. Please click play manually.');
        setLoading(false);
      });
    } else if (media && !currentTrack) {
      media.pause();
      media.src = '';
      setPlaybackProgress(0);
      setInternalProgress(0);
      setLoading(false);
    }
  }, [currentTrack]);

  // Sync volume from store to media element
  useEffect(() => {
    if (mediaElementRef.current && mediaElementRef.current.volume * 100 !== volume) {
      mediaElementRef.current.volume = volume / 100;
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
    if (!currentTrack?.mediaSrc) {
      setError('No track selected to play.');
      return;
    }
    togglePlayPause();
  }, [currentTrack]);

  const handleVolumeSliderChange = useCallback(
    (_event: Event, newValue: number | number[]) => {
      const newVol = newValue as number;
      if (mediaElementRef.current) {
        mediaElementRef.current.volume = newVol / 100;
        if (newVol > 0 && mediaElementRef.current.muted) {
          mediaElementRef.current.muted = false;
        }
        if (newVol === 0 && !mediaElementRef.current.muted) {
          mediaElementRef.current.muted = true;
        }
      }
      setInternalVolume(newVol);
    },
    [],
  );

  const handleVolumeSliderChangeCommitted = useCallback(
    (_event: Event | SyntheticEvent, newValue: number | number[]) => {
      setVolume(newValue as number);
    },
    [],
  );

  const handleToggleMute = useCallback(() => {
    if (mediaElementRef.current) {
      mediaElementRef.current.muted = !mediaElementRef.current.muted;
      setIsMuted(mediaElementRef.current.muted);
      if (!mediaElementRef.current.muted && mediaElementRef.current.volume === 0) {
        mediaElementRef.current.volume = 0.5; // Default volume if unmuting from 0
        setVolume(50); // Sync store
      } else {
        setVolume(Math.round(mediaElementRef.current.volume * 100)); // Sync store
      }
    }
  }, []);

  const handleProgressSliderChange = useCallback(
    (_event: Event, newValue: number | number[]) => {
      setIsSeeking(true);
      setInternalProgress(newValue as number);
    },
    [],
  );

  const handleProgressSliderChangeCommitted = useCallback(
    (_event: Event | SyntheticEvent, newValue: number | number[]) => {
      const media = mediaElementRef.current;
      if (media && currentTrack) {
        media.currentTime = newValue as number;
        setPlaybackProgress(newValue as number);
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
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        color: theme.palette.text.primary,
        flexShrink: 0,
      }}
    >
      {/* Conditionally render audio or video element */}
      {currentTrack && currentTrack.mediaSrc && (
        <>{
        
          currentTrack.fileType === FileType.VIDEO ? (
            <video
              ref={mediaElementRef as React.RefObject<HTMLVideoElement>}
              //style={{ display: 'none' }} // Hidden video element
              preload="metadata"
            />
          ) : (
            <audio
              ref={mediaElementRef as React.RefObject<HTMLAudioElement>}
              style={{ display: 'none' }} // Hidden audio element
              preload="metadata"
            />
          )
        }</>
      )}

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
              objectFit: 'cover',
            }}
          />
        ) : currentTrack?.fileType === FileType.VIDEO ? (
          <MovieIcon
            sx={{ fontSize: 40, mr: 1, color: theme.palette.text.secondary }}
          />
        ) : (
          <AlbumIcon
            sx={{ fontSize: 40, mr: 1, color: theme.palette.text.secondary }}
          />
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {currentTrack?.name || currentTrack?.title || 'No track playing'}
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
          <FavoriteBorderIcon fontSize="small" />
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
            {repeatMode === 'track' ? (
              <RepeatOneIcon fontSize="small" color="primary" />
            ) : (
              <RepeatIcon
                fontSize="small"
                color={repeatMode === 'context' ? 'primary' : 'inherit'}
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
          disabled
        >
          {/* <FullscreenIcon /> */}
        </IconButton>
      </Box>
    </Box>
  );
};

export default SpotifyPlayerBar;
