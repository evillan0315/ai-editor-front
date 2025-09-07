import React from 'react';
import {
  Box,
  Typography,
  Slider,
  IconButton,
  useTheme,
  LinearProgress,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import RepeatIcon from '@mui/icons-material/Repeat';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import AlbumIcon from '@mui/icons-material/Album'; // Placeholder for album art

interface SpotifyPlayerBarProps {
  // Add props for current track, playback state, etc. later
}

const SpotifyPlayerBar: React.FC<SpotifyPlayerBarProps> = () => {
  const theme = useTheme();
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [volume, setVolume] = React.useState(50);
  const [progress, setProgress] = React.useState(30); // 0-100

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleVolumeChange = (_event: Event, newValue: number | number[]) =>
    setVolume(newValue as number);
  const handleProgressChange = (_event: Event, newValue: number | number[]) =>
    setProgress(newValue as number);

  return (
    <Box
      sx={{
        gridArea: 'player',
        bgcolor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
        height: '80px', // Fixed height for player bar
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        color: theme.palette.text.primary,
        flexShrink: 0, // Prevent shrinking
      }}
    >
      {/* Left section: Current Song Info */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '30%',
          minWidth: '180px',
        }}
      >
        <AlbumIcon
          sx={{ fontSize: 40, mr: 1, color: theme.palette.text.secondary }}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Song Title Placeholder
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Artist Name
          </Typography>
        </Box>
        <IconButton
          size="small"
          sx={{ ml: 2, color: theme.palette.text.secondary }}
        >
          <FavoriteBorderIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Middle section: Playback Controls and Progress */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flexGrow: 1,
          maxWidth: '600px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <IconButton size="small" sx={{ color: theme.palette.text.primary }}>
            <ShuffleIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ color: theme.palette.text.primary }}>
            <SkipPreviousIcon />
          </IconButton>
          <IconButton
            size="large"
            onClick={handlePlayPause}
            sx={{
              color: theme.palette.text.primary,
              bgcolor: theme.palette.primary.main,
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              },
              borderRadius: '50%',
              width: 48,
              height: 48,
            }}
          >
            {isPlaying ? (
              <PauseIcon fontSize="large" />
            ) : (
              <PlayArrowIcon fontSize="large" />
            )}
          </IconButton>
          <IconButton size="small" sx={{ color: theme.palette.text.primary }}>
            <SkipNextIcon />
          </IconButton>
          <IconButton size="small" sx={{ color: theme.palette.text.primary }}>
            <RepeatIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box
          sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Typography variant="caption" color="text.secondary">
            0:00
          </Typography>
          <Slider
            size="small"
            value={progress}
            onChange={handleProgressChange}
            sx={{
              color: theme.palette.primary.main,
              height: 4,
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: `0px 0px 0px 8px ${theme.palette.primary.main}40`,
                },
              },
              '& .MuiSlider-rail': {
                opacity: 0.28,
              },
            }}
          />
          <Typography variant="caption" color="text.secondary">
            3:45
          </Typography>
        </Box>
      </Box>

      {/* Right section: Volume and other controls */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '30%',
          justifyContent: 'flex-end',
          minWidth: '180px',
        }}
      >
        <IconButton size="small" sx={{ color: theme.palette.text.primary }}>
          <VolumeUpIcon />
        </IconButton>
        <Slider
          size="small"
          value={volume}
          onChange={handleVolumeChange}
          sx={{
            width: 100,
            color: theme.palette.primary.main,
            height: 4,
            ml: 1,
            '& .MuiSlider-thumb': {
              width: 12,
              height: 12,
            },
          }}
        />
        <IconButton
          size="small"
          sx={{ ml: 2, color: theme.palette.text.primary }}
        >
          <FullscreenIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default SpotifyPlayerBar;
