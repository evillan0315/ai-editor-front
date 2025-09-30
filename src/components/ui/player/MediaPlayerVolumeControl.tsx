import React, { useState, useEffect, useCallback, SyntheticEvent } from 'react';
import { Box, IconButton, Slider, Typography, useTheme } from '@mui/material';
import { VolumeUp, VolumeOff, VolumeDown } from '@mui/icons-material';
import { useStore } from '@nanostores/react';
import {
  volumeAtom,
  setVolume,
  progressAtom,
  durationAtom,
  setTrackProgress,
  currentTrackAtom,
} from '@/stores/mediaStore';

interface MediaPlayerVolumeControlProps {
  mediaRef: React.RefObject<HTMLMediaElement>;
}

// Helper function to format time (moved from MediaPlayerControls)
const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const MediaPlayerVolumeControl: React.FC<MediaPlayerVolumeControlProps> = ({
  mediaRef,
}) => {
  const theme = useTheme();

  // State from global media store
  const volume = useStore(volumeAtom); // 0-100 percentage
  const trackProgress = useStore(progressAtom);
  const duration = useStore(durationAtom);
  const currentTrack = useStore(currentTrackAtom);

  // Local state for mute status and to remember volume before muting
  const [isMutedLocally, setIsMutedLocally] = useState(false);
  const [lastVolumeBeforeMute, setLastVolumeBeforeMute] = useState(50); // Default to 50% volume

  // Sync local mute state with media element on mount or when mediaRef changes
  useEffect(() => {
    if (mediaRef.current) {
      setIsMutedLocally(mediaRef.current.muted);
      // Initialize lastVolumeBeforeMute if mediaRef has a non-zero volume and it wasn't already muted
      if (!mediaRef.current.muted && mediaRef.current.volume > 0) {
        setLastVolumeBeforeMute(Math.round(mediaRef.current.volume * 100));
      }
    }
  }, [mediaRef.current]);

  // Effect to apply local mute state to the actual media element
  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.muted = isMutedLocally;
    }
  }, [isMutedLocally, mediaRef.current]);

  const handleVolumeChange = (_event: Event, newValue: number | number[]) => {
    const newVolume = typeof newValue === 'number' ? newVolume : 0;
    setVolume(newVolume); // Updates global store's volumeAtom and mediaElement.volume

    if (newVolume > 0 && isMutedLocally) {
      // If volume is increased from 0, implicitly unmute
      setIsMutedLocally(false);
    }
    if (newVolume > 0) {
      setLastVolumeBeforeMute(newVolume); // Keep track of the last non-zero volume
    }
  };

  const handleMuteToggle = () => {
    if (!mediaRef.current) return;

    if (isMutedLocally) {
      // If currently muted, unmute and restore last known volume
      setVolume(lastVolumeBeforeMute); // This will update volumeAtom and mediaElement.volume
      setIsMutedLocally(false); // Mark as unmuted locally
    } else {
      // If currently unmuted, save current volume and mute
      if (volume > 0) {
        setLastVolumeBeforeMute(volume); // Save current non-zero volume
      }
      setVolume(0); // Mute via store (sets volumeAtom to 0, updates mediaElement.volume)
      setIsMutedLocally(true); // Mark as muted locally
    }
  };

  const handleTrackTimeChange = (_event: Event, newValue: number | number[]) => {
    const newTime = typeof newValue === 'number' ? newValue : 0;
    if (mediaRef.current) {
      mediaRef.current.currentTime = newTime;
      setTrackProgress(newTime);
    }
  };

  const handleTrackTimeChangeCommitted = useCallback(
    (_event: Event | SyntheticEvent, newValue: number | number[]) => {
      const newTime = typeof newValue === 'number' ? newValue : 0;
      if (mediaRef.current) {
        mediaRef.current.currentTime = newTime;
        setTrackProgress(newTime);
      }
    },
    [mediaRef.current, setTrackProgress], // Depend on mediaRef.current for latest ref
  );

  const getVolumeIcon = () => {
    if (isMutedLocally || volume === 0) {
      return <VolumeOff />;
    } else if (volume < 50) {
      return <VolumeDown />;
    } else {
      return <VolumeUp />;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column', // Stack children vertically
        alignItems: 'center', // Center contents horizontally within the box
        justifyContent: 'flex-center', // Aligns box to the end of its parent's cross-axis
        minWidth: '180px',
        width: '30%', // Maintain original width, allowing internal elements to use 100%
      }}
    >
      {/* Track Progress Slider (positioned on top) */}
      <Box
        sx={{
          width: '100%', // Takes full width of parent MediaPlayerVolumeControl
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
          onChange={handleTrackTimeChange}
          onChangeCommitted={handleTrackTimeChangeCommitted}
          min={0}
          max={duration ?? 0}
          aria-label="Track progress"
          sx={{
            color: theme.palette.primary.main,
            height: 3,
            width: '100%',
            maxWidth: '80px',
            '& .MuiSlider-thumb': {
              width: 8,
              height: 8,
            },
          }}
          disabled={!currentTrack} // Disable if no track is loaded
        />
        <Typography variant="caption" color="text.secondary">
          {formatTime(duration)}
        </Typography>
      </Box>

      {/* Volume Controls (positioned below track progress) */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-center', // Keeps volume icon and slider right-aligned
          width: '100%', // Takes full width of parent MediaPlayerVolumeControl
        }}
      >
        <IconButton
          size="small"
          sx={{ color: theme.palette.text.primary }}
          onClick={handleMuteToggle}
        >
          {getVolumeIcon()}
        </IconButton>
        <Slider
          size="small"
          value={volume ?? 0} // Binds to global store's volume (0-100)
          onChange={handleVolumeChange}
          min={0}
          max={100}
          
          aria-label="Volume"
          sx={{
            width: '100%',
            maxWidth: '80px',
            color: theme.palette.primary.main,
            height: 3,
            '& .MuiSlider-thumb': {
              width: 8,
              height: 8,
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default MediaPlayerVolumeControl;
