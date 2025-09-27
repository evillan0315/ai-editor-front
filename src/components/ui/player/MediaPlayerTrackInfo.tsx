import React from 'react';
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
import { useStore } from '@nanostores/react';
import { currentTrackAtom } from '@/stores/mediaStore';

interface MediaPlayerTrackInfoProps {
  mediaType: 'AUDIO' | 'VIDEO';
}

const MediaPlayerTrackInfo: React.FC<MediaPlayerTrackInfoProps> = ({ mediaType }) => {
  const theme = useTheme();
  const currentTrack = useStore(currentTrackAtom);

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
          {currentTrack?.song?.title}
        </Typography>
        <Typography variant='caption' color='text.secondary'>
          {currentTrack?.metadata?.[0]?.tags?.join(', ')}
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
