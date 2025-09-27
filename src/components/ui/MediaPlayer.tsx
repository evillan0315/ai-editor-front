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
} from '@mui/icons-material';

// Define types for props
interface MediaPlayerProps {
  src: string; // Audio source URL
  onNext?: () => void; // Optional callback for next track
  onPrevious?: () => void; // Optional callback for previous track
  onEnded?: () => void; // Optional callback for when the audio ends
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({ src, onNext, onPrevious, onEnded }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Load audio metadata on initial mount
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleMetadata = () => {
        setDuration(audio.duration);
      };

      audio.addEventListener('loadedmetadata', handleMetadata);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('loadedmetadata', handleMetadata);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [src]);

  // Play/Pause based on isPlaying state
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.error("Playback failed:", error);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Handler functions
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
      setCurrentTime(0); // Reset current time when moving to the next track
    }
  };

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
      setCurrentTime(0); // Reset current time when moving to the previous track
    }
  };

  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    const newVolume = typeof newValue === 'number' ? newValue : 0;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const handleTimeChange = (event: Event, newValue: number | number[]) => {
    const newTime = typeof newValue === 'number' ? newValue : 0;
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
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

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 2,
      bgcolor: 'background.paper',
      borderRadius: 1,
      width: isMobile ? '100%' : '400px',
    }}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
      />

      {/* Media Controls */}
      <Box sx={{
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
      </Box>

      {/* Track Progress */}
      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
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
      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
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
