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
  $mediaStore, // Import the global media store
} from '@/stores/mediaStore';

// Helper function to format time
const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const MediaPlayerVolumeControl: React.FC = () => { // Removed mediaRef prop
  const theme = useTheme();

  // State from global media store
  const globalVolume = useStore(volumeAtom); // 0-100 percentage
  const trackProgress = useStore(progressAtom);
  const duration = useStore(durationAtom);
  const currentTrack = useStore(currentTrackAtom);
  const { mediaElement } = useStore($mediaStore); // Access mediaElement from global store

  // Local state for mute status and to remember volume before muting
  const [isMutedLocally, setIsMutedLocally] = useState(false);
  const [lastVolumeBeforeMute, setLastVolumeBeforeMute] = useState(70); // Default to 70% volume, matches initial volumeAtom
  const [showVolumeSlider, setShowVolumeSlider] = useState(false); // State to toggle slider visibility

  // Sync local mute state with media element on mount or when mediaElement changes
  useEffect(() => {
    if (mediaElement) {
      setIsMutedLocally(mediaElement.muted);
      // Initialize lastVolumeBeforeMute if mediaElement has a non-zero volume and it wasn't already muted
      if (!mediaElement.muted && mediaElement.volume > 0) {
        setLastVolumeBeforeMute(Math.round(mediaElement.volume * 100));
      } else if (mediaElement.muted) {
        setLastVolumeBeforeMute(globalVolume > 0 ? globalVolume : 70); // If muted, remember actual set volume or default
      }
    }
  }, [mediaElement, globalVolume]);

  // Effect to apply local mute state to the actual media element
  // This is now largely redundant as setVolume handles mediaElement.volume, and toggleMute
  // directly sets volume to 0 or lastVolumeBeforeMute, which then syncs mediaElement.volume.
  // It's kept for direct control over `mediaElement.muted` property if needed for other reasons.
  useEffect(() => {
    if (mediaElement) {
      mediaElement.muted = isMutedLocally;
    }
  }, [isMutedLocally, mediaElement]);

  const handleVolumeChange = useCallback((_event: Event, newValue: number | number[]) => {
    const newVolume = typeof newValue === 'number' ? newValue : 0;
    setVolume(newVolume); // Updates global store's volumeAtom and mediaElement.volume

    if (newVolume > 0 && isMutedLocally) {
      setIsMutedLocally(false); // If volume is increased from 0, implicitly unmute
    }
    if (newVolume > 0) {
      setLastVolumeBeforeMute(newVolume); // Keep track of the last non-zero volume
    }
  }, [isMutedLocally, setVolume]);

  const toggleMute = useCallback(() => { // Renamed from handleMuteToggle
    if (!mediaElement) return;

    if (isMutedLocally) {
      // If currently muted, unmute and restore last known volume
      setVolume(lastVolumeBeforeMute); // This will update volumeAtom and mediaElement.volume
      setIsMutedLocally(false); // Mark as unmuted locally
    } else {
      // If currently unmuted, save current volume and mute
      if (globalVolume > 0) {
        setLastVolumeBeforeMute(globalVolume); // Save current non-zero volume from store
      }
      setVolume(0); // Mute via store (sets volumeAtom to 0, updates mediaElement.volume)
      setIsMutedLocally(true); // Mark as muted locally
    }
  }, [isMutedLocally, mediaElement, lastVolumeBeforeMute, globalVolume, setVolume]);

  const toggleVolumeSliderVisibility = useCallback(() => {
    setShowVolumeSlider((prev) => !prev);
  }, []);

  const handleTrackTimeChange = useCallback((_event: Event, newValue: number | number[]) => {
    const newTime = typeof newValue === 'number' ? newValue : 0;
    if (mediaElement) {
      mediaElement.currentTime = newTime;
      setTrackProgress(newTime);
    }
  }, [mediaElement, setTrackProgress]);

  const handleTrackTimeChangeCommitted = useCallback(
    (_event: Event | SyntheticEvent, newValue: number | number[]) => {
      const newTime = typeof newValue === 'number' ? newValue : 0;
      if (mediaElement) {
        mediaElement.currentTime = newTime;
        setTrackProgress(newTime);
      }
    },
    [mediaElement, setTrackProgress],
  );

  const getVolumeIcon = () => {
    if (isMutedLocally || globalVolume === 0) {
      return <VolumeOff  />;
    } else if (globalVolume < 50) {
      return <VolumeDown  />;
    } else {
      return <VolumeUp  />;
    }
  };

  const verticalSliderContainerSx = {
    position: 'absolute',
    bottom: '50px', // Position above the volume icon
    left: '50%',
    transform: 'translateX(-50%)',
    display: showVolumeSlider ? 'flex' : 'none',
    flexDirection: 'column',
    alignItems: 'center',
    bgcolor: theme.palette.background.paper,
    p: 1,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[3],
    zIndex: theme.zIndex.tooltip, // Ensure it's above other elements
    gap: 1,
    height: '120px', // Height of the slider area
  };

  const volumeSliderSx = {
    color: theme.palette.primary.main,
    '& .MuiSlider-track': {
      width: '3px', // Thinner track
    },
    '& .MuiSlider-rail': {
      width: '3px', // Thinner rail
    },
    '& .MuiSlider-thumb': {
      width: '10px',
      height: '10px',
      transition: '0.2s',
      '&:hover, &.Mui-focusVisible': {
        boxShadow: `0px 0px 0px 8px ${theme.palette.action.hover}`, // Adjust hover effect
      },
      '&.Mui-active': {
        width: '12px',
        height: '12px',
      },
    },
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row', // Main container remains row to place track progress and volume controls side-by-side
        alignItems: 'center',
        justifyContent: 'flex-end',
        flexGrow: 1,
        minWidth: '180px',
        width: 'auto',
        position: 'relative', // For positioning the absolute volume slider
      }}
    >
      {/* Volume Controls (icon + vertical slider) */}
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <IconButton
          size="medium"
          sx={{ color: theme.palette.text.primary }}
          onClick={toggleVolumeSliderVisibility} // Single click to toggle slider visibility
          onDoubleClick={toggleMute} // Double click to toggle mute
        >
          {getVolumeIcon()}
        </IconButton>

        {/* Vertical Volume Slider (conditionally rendered and absolutely positioned) */}
        <Box sx={verticalSliderContainerSx}>
          <Slider
            size="small"
            value={globalVolume ?? 0}
            onChange={handleVolumeChange}
            min={0}
            max={100}
            orientation="vertical" // Make it vertical
            aria-label="Volume"
            sx={volumeSliderSx}
            // `height` of the slider itself
            style={{ height: '100px' }} // Explicitly set height for vertical orientation
          />
        </Box>
      </Box>
      {/* Track Progress Slider (horizontal, remains as is) */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexGrow: 1, // Allows track progress to take available space
          mr: 2, // Margin right to separate from volume control
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

      
    </Box>
  );
};

export default MediaPlayerVolumeControl;
