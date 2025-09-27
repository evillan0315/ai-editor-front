import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import {
  FavoriteBorder,
  Album,
  Movie,
} from '@mui/icons-material';

interface MediaPlayerTrackInfoProps {
  mediaType: 'AUDIO' | 'VIDEO';
}

const MediaPlayerTrackInfo: React.FC<MediaPlayerTrackInfoProps> = ({
  mediaType,
}) => {
  const theme = useTheme();
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [trackDuration, setTrackDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get the correct ref based on media type
  const mediaRef = currentTrack?.fileType === 'VIDEO' ? videoRef : audioRef;

  useEffect(() => {
    // Fetch track data when track changes
    const fetchData = async () => {
      try {
        // Replace with your actual API call to get track data
        const response = await Promise.resolve({/* your mock API response*/});
        setCurrentTrack(response);
      } catch (error) {
        console.error('Error fetching track data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const media = mediaRef?.current;
    if (media) {
      const handleMetadata = () => {
        setTrackDuration(media.duration);
      };

      const handleData = () => {
        setTrackDuration(media.duration);
      };
      media.addEventListener('loadedmetadata', handleMetadata);
      media.addEventListener('loadeddata', handleData);

      return () => {
        media.removeEventListener('loadedmetadata', handleMetadata);
        media.removeEventListener('loadeddata', handleData);
      };
    }
  }, [mediaRef]);
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: '30%',
        minWidth: '180px',
      }}
    >
      {currentTrack?.fileType === 'VIDEO' ? (
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
          {currentTrack?.title}
        </Typography>
        <Typography variant='caption' color='text.secondary'>
          {currentTrack?.artist}
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
  );
};

export default MediaPlayerTrackInfo;
