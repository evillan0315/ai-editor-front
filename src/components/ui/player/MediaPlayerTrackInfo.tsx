import React, { useCallback, SyntheticEvent } from 'react';
import { Box, IconButton, Typography, useTheme, SxProps, Slider } from '@mui/material';
import { FavoriteBorder, Album, Movie } from '@mui/icons-material';
import { useStore } from '@nanostores/react';
import {
  currentTrackAtom,
  progressAtom,
  durationAtom,
  setTrackProgress,
  $mediaStore,
} from '@/stores/mediaStore';
import { FileType } from '@/types/refactored/media';

// Define styles outside the component for memoization and clean JSX
const trackInfoWrapperStyles: SxProps = {
  display: 'flex',
  alignItems: 'center',
  minWidth: 0,
  width: '30%',
  overflow: 'hidden',
  flexShrink: 0,
};

const titleAndArtistColumnStyles: SxProps = {
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  minWidth: 0,
  mr: 1,
};

const progressContainerStyles: SxProps = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  width: '100%',
  mt: 0, // Small margin-top to separate from title
};

const progressSliderStyles = (theme: any) => ({ // Access theme properties
  color: theme.palette.primary.main,
  height: 3,
  '& .MuiSlider-thumb': {
    width: 8,
    height: 8,
  },
});

// Helper function to format time
const formatTime = (time: number): string => {
  if (isNaN(time) || time === Infinity) return '0:00'; // Handle invalid time
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

// Removed mediaType prop as it's now derived from currentTrack
const MediaPlayerTrackInfo: React.FC = () => {
  const theme = useTheme();
  const currentTrack = useStore(currentTrackAtom);
  const trackProgress = useStore(progressAtom);
  const duration = useStore(durationAtom);
  const { mediaElement } = useStore($mediaStore);

  const titleText = currentTrack?.song?.title || currentTrack?.video?.title || 'Unknown Title';
  const artistText = currentTrack?.metadata?.[0]?.tags?.join(', ') || 'Unknown Artist';

  const handleTrackTimeChange = useCallback((_event: Event, newValue: number | number[]) => {
    const newTime = typeof newValue === 'number' ? newValue : 0;
    if (mediaElement) {
      mediaElement.currentTime = newTime;
      setTrackProgress(newTime); // Update store immediately for visual feedback
    }
  }, [mediaElement, setTrackProgress]);

  const handleTrackTimeChangeCommitted = useCallback(
    (_event: Event | SyntheticEvent, newValue: number | number[]) => {
      const newTime = typeof newValue === 'number' ? newValue : 0;
      if (mediaElement) {
        mediaElement.currentTime = newTime;
        setTrackProgress(newTime); // Ensure store is updated after commit
      }
    },
    [mediaElement, setTrackProgress],
  );

  const isPlayerDisabled = !currentTrack || !mediaElement; // Disable if no track or media element

  return (
    <Box sx={trackInfoWrapperStyles}>
      {/*currentTrack?.fileType === FileType.VIDEO ? (
        <Movie sx={{ fontSize: 30, mr: 1, color: theme.palette.text.secondary }} />
      ) : (
        <Album sx={{ fontSize: 30, mr: 1, color: theme.palette.text.secondary }} />
      )*/}
      <Box sx={titleAndArtistColumnStyles}>
        
        <Typography
          variant="body2"
          sx={{
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          noWrap
        >
          {titleText}
        </Typography>
       

        {/* Progress Slider */}
        <Box sx={progressContainerStyles}>
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
            sx={progressSliderStyles(theme)}
            disabled={isPlayerDisabled}
          />
          <Typography variant="caption" color="text.secondary">
            {formatTime(duration)}
          </Typography>
        </Box>
      </Box>
      <IconButton
        size="small"
        sx={{ ml: 0, color: theme.palette.text.secondary, flexShrink: 0 }}
        disabled
      >
        <FavoriteBorder fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default MediaPlayerTrackInfo;
