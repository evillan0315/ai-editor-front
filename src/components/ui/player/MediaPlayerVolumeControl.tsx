import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { volumeAtom, setVolume } from '@/stores/mediaStore';
import {
  Box,
  IconButton,
  Slider,
  useTheme,
} from '@mui/material';
import {
  VolumeUp,
  VolumeOff,
  VolumeDown,
} from '@mui/icons-material';

interface MediaPlayerVolumeControlProps {}

const MediaPlayerVolumeControl: React.FC<MediaPlayerVolumeControlProps> = () => {
  const theme = useTheme();
  const volume = useStore(volumeAtom);

  const [isMuted, setIsMuted] = useState(false);
  const [internalVolume, setInternalVolume] = useState(volume);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const currentTrack = useStore(volumeAtom);
  // Handler functions
  const mediaRef = React.useRef<HTMLMediaElement>(null);

  const handleVolumeChange = (_event: Event, newValue: number | number[]) => {
    const newVolume = typeof newValue === 'number' ? newValue : 0;
    setInternalVolume(newVolume);
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

  const getVolumeIcon = () => {
    if (isMuted || internalVolume === 0) {
      return <VolumeOff />;
    } else if (internalVolume < 0.5) {
      return <VolumeDown />;
    } else {
      return <VolumeUp />;
    }
  };

  return (
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
        size='small'
        sx={{ color: theme.palette.text.primary }}
        onClick={handleMute}
      >
        {isMuted || internalVolume === 0 ? <VolumeOff /> : <VolumeUp />}
      </IconButton>
      <Slider
        size='small'
        value={internalVolume * 100 ?? 0}
        onChange={handleVolumeChange}
        min={0}
        max={100}
        aria-label='Volume'
        sx={{
          width: 100,
          color: theme.palette.primary.main,
          height: 4,
          '& .MuiSlider-thumb': {
            width: 12,
            height: 12,
          },
        }}
      />
    </Box>
  );
};

export default MediaPlayerVolumeControl;