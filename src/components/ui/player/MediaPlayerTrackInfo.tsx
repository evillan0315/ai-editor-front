import React, { useState, useEffect, useRef } from 'react';
import { Box, IconButton, Typography, useTheme, SxProps } from '@mui/material';
import { FavoriteBorder, Album, Movie } from '@mui/icons-material';
import { useStore } from '@nanostores/react';
import { currentTrackAtom } from '@/stores/mediaStore';
import { FileType } from '@/types/refactored/media';

interface MediaPlayerTrackInfoProps {
  mediaType: 'AUDIO' | 'VIDEO';
}

// Define the container styles outside the component for memoization
const trackInfoWrapperStyles: SxProps = {
  display: 'flex',
  alignItems: 'center',
  minWidth: 0, // Allow flex item to shrink
  width: '30%', // Target width, will be adjusted by flexbox in parent
  overflow: 'hidden', // Hide anything that completely overflows this section
  flexShrink: 0, // Prevent it from shrinking less than its content would allow without overflow
};

// Styles for the Box containing the title and artist
const titleAndArtistColumnStyles: SxProps = {
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1, // Allow it to take up available space
  minWidth: 0, // Crucial for flex items with text overflow to behave correctly
  mr: 1, // Margin to the right, before the favorite button
};

// Styles for the title wrapper (the viewport for marquee)
const titleMarqueeViewportStyles: SxProps = {
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  width: '100%', // Take full width of its parent (titleAndArtistColumn)
};

const MediaPlayerTrackInfo: React.FC<MediaPlayerTrackInfoProps> = ({
  mediaType,
}) => {
  const theme = useTheme();
  const currentTrack = useStore(currentTrackAtom);
  const titleRef = useRef<HTMLParagraphElement>(null); // Ref for the Typography element
  const [isTitleOverflowing, setIsTitleOverflowing] = useState(false);
  const [marqueeOffset, setMarqueeOffset] = useState(0);
  const [marqueeDuration, setMarqueeDuration] = useState('0s'); // Default duration, no animation

  useEffect(() => {
    const checkOverflow = () => {
      if (titleRef.current) {
        const { scrollWidth, clientWidth } = titleRef.current;
        const overflow = scrollWidth > clientWidth;
        setIsTitleOverflowing(overflow);

        if (overflow) {
          // Calculate offset: how much it needs to scroll to show the end.
          // This is a negative value to scroll left.
          setMarqueeOffset(-(scrollWidth - clientWidth));
          // Calculate duration based on distance, faster for longer text
          const baseSpeed = 25; // pixels per second
          const distanceAbs = Math.abs(scrollWidth - clientWidth);
          // Minimum 8 seconds, max 40 seconds, adjust speed (distance / baseSpeed)
          const calculatedDuration = Math.min(40, Math.max(8, distanceAbs / baseSpeed));
          setMarqueeDuration(`${calculatedDuration}s`);
        } else {
          // Reset if not overflowing
          setMarqueeOffset(0);
          setMarqueeDuration('0s'); // No animation
        }
      }
    };

    // Initial check and re-check on window resize and when currentTrack changes
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => {
      window.removeEventListener('resize', checkOverflow);
    };
  }, [currentTrack]); // Dependency on currentTrack to re-evaluate on track change

  // Styles for the scrolling typography
  const scrollingTitleStyles: SxProps = {
    fontWeight: 'bold',
    // whiteSpace: 'nowrap' is handled by the .track-title-text class
  };

  return (
    <Box sx={trackInfoWrapperStyles}>
      {currentTrack?.fileType === FileType.VIDEO ? (
        <Movie
          sx={{ fontSize: 40, mr: 1, color: theme.palette.text.secondary }}
        />
      ) : (
        <Album
          sx={{ fontSize: 40, mr: 1, color: theme.palette.text.secondary }}
        />
      )}
      <Box sx={titleAndArtistColumnStyles}>
        {/* Title container that acts as the viewport */} 
        <Box sx={titleMarqueeViewportStyles} className="track-title-wrapper">
          <Typography
            ref={titleRef}
            variant="body2"
            sx={scrollingTitleStyles}
            className={isTitleOverflowing ? 'track-title-text animate-marquee' : 'track-title-text'}
            // Dynamically set CSS variable for marquee-scroll animation
            style={{ '--marquee-offset': `${marqueeOffset}px`, animationDuration: marqueeDuration } as React.CSSProperties}
          >
            {currentTrack?.song?.title || 'Unknown Title'}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" noWrap>
          {currentTrack?.metadata?.[0]?.tags?.join(', ') || 'Unknown Artist'}
        </Typography>
      </Box>
      <IconButton
        size="small"
        sx={{ ml: 0, color: theme.palette.text.secondary, flexShrink: 0 }} // ml:0 for tight spacing, flexShrink: 0 to not shrink
        disabled
      >
        <FavoriteBorder fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default MediaPlayerTrackInfo;
