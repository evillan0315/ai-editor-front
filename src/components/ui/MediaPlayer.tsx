import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  IconButton,
  Slider,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  VolumeUp,
  VolumeDown,
  VolumeOff,
  Fullscreen, // Add Fullscreen Icon
  FullscreenExit // Add FullscreenExit Icon
} from '@mui/icons-material';
import { MediaPlayerType } from '@/types/refactored/media'
// Define types for props
interface MediaPlayerProps {
  src: string; // Audio/Video source URL
  type: MediaPlayerType; // Media type
  onNext?: () => void; // Optional callback for next track
  onPrevious?: () => void; // Optional callback for previous track
  onEnded?: () => void; // Optional callback for when the media ends
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({ src, type, onNext, onPrevious, onEnded }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
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
        setDuration(media.duration);
      };

      const handleData = () => {
          setDuration(media.duration);
      };

      media.addEventListener('loadedmetadata', handleMetadata);
      media.addEventListener('loadeddata', handleData);
      media.addEventListener('ended', handleEnded);

      return () => {
        media.removeEventListener('loadedmetadata', handleMetadata);
        media.removeEventListener('loadeddata', handleData);
        media.removeEventListener('ended', handleEnded);
      };
    }
  }, [src, isVideo]);

  // Play/Pause based on isPlaying state
  useEffect(() => {
    const media = mediaRef.current;
    if (media) {
      if (isPlaying) {
        media.play().catch(error => {
          console.error("Playback failed:", error);
          setIsPlaying(false);
        });
      } else {
        media.pause();
      }
    }
  }, [isPlaying, isVideo]);

  // Handler functions
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
      setCurrentTime(0); // Reset current time when moving to the next media
    }
  };

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
      setCurrentTime(0); // Reset current time when moving to the previous media
    }
  };

  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    const newVolume = typeof newValue === 'number' ? newValue : 0;
    setVolume(newVolume);
    if (mediaRef.current) {
      mediaRef.current.volume = newVolume;
    }
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
    if (mediaRef.current) {
      mediaRef.current.muted = !isMuted;
    }
  };

  const handleTimeChange = (event: Event, newValue: number | number[]) => {
    const newTime = typeof newValue === 'number' ? newValue : 0;
    setCurrentTime(newTime);
    if (mediaRef.current) {
      mediaRef.current.currentTime = newTime;
    }
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (onEnded) {
      onEnded();
    }
  }, [onEnded]);

  // Volume Icon
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeOff />; 
    } else if (volume < 0.5) {
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

  // Function to handle fullscreen toggle
  const handleFullscreen = () => {
    if (mediaRef.current) {
      if (!isFullscreen) {
        if (mediaRef.current.requestFullscreen) {
          mediaRef.current.requestFullscreen();
        } else if ((mediaRef.current as any).mozRequestFullScreen) { /* Firefox */
          (mediaRef.current as any).mozRequestFullScreen();
        } else if ((mediaRef.current as any).webkitRequestFullscreen) { /* Chrome, Safari and Opera */
          (mediaRef.current as any).webkitRequestFullscreen();
        } else if ((mediaRef.current as any).msRequestFullscreen) { /* IE/Edge */
          (mediaRef.current as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).mozCancelFullScreen) { /* Firefox */
          (document as any).mozCancelFullScreen();
        } else if ((document as any).webkitExitFullscreen) { /* Chrome, Safari and Opera */
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) { /* IE/Edge */
          (document as any).msExitFullscreen();
        }
      }

      setIsFullscreen(!isFullscreen);
    }
  };

  return (
    <Box sx={{ // Main Container
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 2,
      bgcolor: 'background.paper',
      borderRadius: 1,
      width: isMobile ? '100%' : '400px',
    }}>
      {isVideo ? (
        <video
          ref={videoRef}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          style={{ width: '100%', maxHeight: '300px' }}
        />
      ) : (
        <audio
          ref={audioRef}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          style={{ width: '100%' }}
        />
      )}

      {/* Media Controls */}
      <Box sx={{// Control Container
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}>

        <IconButton aria-label="previous" onClick={handlePrevious} disabled={!onPrevious}>
          <SkipPrevious />
        </IconButton>
        <IconButton aria-label="play/pause" onClick={handlePlayPause}>
          {isPlaying ? <Pause /> : <PlayArrow />}
        </IconButton>
        <IconButton aria-label="next" onClick={handleNext} disabled={!onNext}>
          <SkipNext />
        </IconButton>
        {isVideo && (
          <IconButton aria-label="fullscreen" onClick={handleFullscreen}>
            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        )}
      </Box>

      {/* Track Progress */}
      <Box sx={{ // Progress Container
         width: '100%',
         display: 'flex',
         alignItems: 'center',
       }}>
        <Typography variant="body2" sx={{ width: '40px', textAlign: 'right', mr: 1 }}>
          {formatTime(currentTime)}
        </Typography>
        <Slider
          aria-label="time-progress"
          value={currentTime}
          min={0}
          max={duration}
          onChange={handleTimeChange}
          sx={{ flexGrow: 1, height: 4 }} // Adjust height here
        />
        <Typography variant="body2" sx={{ width: '40px', textAlign: 'left', ml: 1 }}>
          {formatTime(duration)}
        </Typography>
      </Box>

      {/* Volume Controls */}
      <Box sx={{ // Volume Container
        width: '100%',
        display: 'flex',
        alignItems: 'center',
      }}>
        <IconButton aria-label="mute/unmute" onClick={handleMute}>
          {getVolumeIcon()}
        </IconButton>
        <Slider
          aria-label="volume"
          value={volume}
          min={0}
          max={1}
          step={0.01}
          onChange={handleVolumeChange}
          sx={{ width: '88%' }}
        />
      </Box>
    </Box>
  );
};

export default MediaPlayer;