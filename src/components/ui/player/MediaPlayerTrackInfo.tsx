import React, { useState, useEffect, useRef } from 'react';
import { Box, IconButton, Typography, useTheme, SxProps } from '@mui/material';
import { FavoriteBorder, Album, Movie } from '@mui/icons-material';
import { useStore } from '@nanostores/react';
import { currentTrackAtom } from '@/stores/mediaStore';
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

// Viewport for the marquee effect, hides overflowing content
const marqueeViewportStyles: SxProps = {
  overflow: 'hidden',
  width: '100%',
  position: 'relative',
};

const MediaPlayerTrackInfo: React.FC = () => {
  const theme = useTheme();
  const currentTrack = useStore(currentTrackAtom);

  // Refs for measuring dimensions
  const titleViewportRef = useRef<HTMLDivElement>(null); // Ref for the Box acting as the visible area
  const titleMeasurementRef = useRef<HTMLSpanElement>(null); // Ref for a span to measure single title width

  const [isOverflowing, setIsOverflowing] = useState(false);
  const [marqueeDuration, setMarqueeDuration] = useState('0s');
  const [scrollDistancePx, setScrollDistancePx] = useState(0);

  const titleText = currentTrack?.song?.title || 'Unknown Title';
  const artistText = currentTrack?.metadata?.[0]?.tags?.join(', ') || 'Unknown Artist';

  useEffect(() => {
    const checkOverflow = () => {
      if (titleViewportRef.current && titleMeasurementRef.current) {
        const viewportWidth = titleViewportRef.current.clientWidth;

        // Get the actual rendered width of the single title span
        const contentNaturalWidth = titleMeasurementRef.current.offsetWidth;

        const overflow = contentNaturalWidth > viewportWidth;
        setIsOverflowing(overflow);

        if (overflow) {
          const speedFactor = 30; // Pixels per second for scrolling speed
          const gapWidth = 32; // Equivalent to '2em' in px, for the space between duplicated titles

          // The animation should scroll one full instance of the title + the gap, meaning the total distance the 'container' of the duplicated text needs to move.
          const distanceToScroll = contentNaturalWidth + gapWidth;
          const duration = distanceToScroll / speedFactor;

          setScrollDistancePx(-distanceToScroll); // Negative value for leftward scroll
          setMarqueeDuration(`${duration}s`);
        } else {
          setScrollDistancePx(0);
          setMarqueeDuration('0s');
        }
      }
    };

    // Use a ResizeObserver on the viewport to detect size changes
    let resizeObserver: ResizeObserver | null = null;
    if (titleViewportRef.current) {
      resizeObserver = new ResizeObserver(checkOverflow);
      resizeObserver.observe(titleViewportRef.current);
    }
    
    // Initial check when component mounts or titleText changes
    checkOverflow();

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [titleText]); // Re-evaluate when title string changes

  return (
    <Box sx={trackInfoWrapperStyles}>
      {currentTrack?.fileType === FileType.VIDEO ? (
        <Movie sx={{ fontSize: 40, mr: 1, color: theme.palette.text.secondary }} />
      ) : (
        <Album sx={{ fontSize: 40, mr: 1, color: theme.palette.text.secondary }} />
      )}
      <Box sx={titleAndArtistColumnStyles}>
        {/* Viewport for the marquee effect */}
        <Box ref={titleViewportRef} sx={marqueeViewportStyles}>
          {/* The actual scrolling content, contains one or two titles */}
          <Typography
            variant="body2"
            sx={{
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              display: 'inline-block',
              willChange: 'transform',
              // Dynamic CSS variables for animation
              '--marquee-scroll-distance': `${scrollDistancePx}px`,
              animation: isOverflowing 
                ? `marquee-seamless ${marqueeDuration} linear infinite` 
                : 'none',
              animationPlayState: isOverflowing ? 'running' : 'paused', // Pause when not overflowing
            }}
            key={currentTrack?.id || 'no-track'} // Force re-render/re-animation on track change
          >
            {/* This span measures the natural width of a single title. It is part of the flow. */}
            <span ref={titleMeasurementRef}>
              {titleText}
            </span>
            {isOverflowing && (
              // Duplicating text for a seamless loop, only if overflowing
              <span style={{ marginLeft: '2em' }}>
                {titleText}
              </span>
            )}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" noWrap>
          {artistText}
        </Typography>
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
