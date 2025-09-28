import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Slider, useTheme } from '@mui/material';
import { VolumeUp, VolumeOff, VolumeDown } from '@mui/icons-material';

interface MediaPlayerVolumeControlProps {
  mediaRef: React.RefObject<HTMLMediaElement>;
}

const MediaPlayerVolumeControl: React.FC<MediaPlayerVolumeControlProps> = ({
  mediaRef,
}) => {
  const theme = useTheme();
  const [volume, setVolume] = useState(1);

  const [isMuted, setIsMuted] = useState(false);
  const [internalVolume, setInternalVolume] = useState(volume);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  //const mediaRef = useRef<HTMLMediaElement>(null);

  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.volume = internalVolume;
      mediaRef.current.muted = isMuted;
    }
  }, [isMuted, internalVolume]);

  const handleVolumeChange = (_event: Event, newValue: number | number[]) => {
    const newVolume = typeof newValue === 'number' ? newValue : 0;
    setInternalVolume(newVolume / 100);
    setVolume(newVolume);

    if (mediaRef.current) {
      mediaRef.current.volume = newVolume / 100;
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
        justifyContent: 'flex-end',
        minWidth: '180px',
        width: '30%',
      }}
    >
      <IconButton
        size="small"
        sx={{ color: theme.palette.text.primary }}
        onClick={handleMute}
      >
        {isMuted || internalVolume === 0 ? <VolumeOff /> : <VolumeUp />}
      </IconButton>
      <Slider
        size="small"
        value={internalVolume * 100 ?? 0}
        onChange={handleVolumeChange}
        min={0}
        max={100}
        aria-label="Volume"
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
