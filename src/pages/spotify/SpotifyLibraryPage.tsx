import React from 'react';
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  useTheme,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
} from '@mui/material';
import { Link } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow'; // Or other play icon
import MoreVertIcon from '@mui/icons-material/MoreVert'; // For options menu

interface SpotifyLibraryPageProps {
  // No specific props for now
}

const SpotifyLibraryPage: React.FC<SpotifyLibraryPageProps> = () => {
  const theme = useTheme();
  const [value, setValue] = React.useState(0); // For Tabs

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const mockPlaylists = [
    {
      id: 1,
      name: 'My Daily Mix 1',
      description: 'Music for your morning routine',
      cover:
        'https://misc.scdn.co/uri-v2/local/default/user-default/prid_r-000000-A.jpg',
      type: 'Playlist',
    },
    {
      id: 2,
      name: 'Focus Flow',
      description: 'Instrumental beats for concentration',
      cover:
        'https://misc.scdn.co/uri-v2/local/default/user-default/prid_r-000000-A.jpg',
      type: 'Playlist',
    },
    {
      id: 3,
      name: 'Liked Songs',
      description: 'Your favorite tracks',
      cover:
        'https://misc.scdn.co/uri-v2/local/default/user-default/prid_r-000000-A.jpg',
      type: 'Playlist',
    },
    {
      id: 4,
      name: 'Podcast: The Daily',
      description: 'News from The New York Times',
      cover:
        'https://misc.scdn.co/uri-v2/local/default/user-default/prid_r-000000-A.jpg',
      type: 'Podcast',
    },
  ];

  const mockArtists = [
    {
      id: 1,
      name: 'The Weeknd',
      avatar:
        'https://misc.scdn.co/uri-v2/local/default/user-default/prid_r-000000-A.jpg',
    },
    {
      id: 2,
      name: 'Dua Lipa',
      avatar:
        'https://misc.scdn.co/uri-v2/local/default/user-default/prid_r-000000-A.jpg',
    },
    {
      id: 3,
      name: 'Billie Eilish',
      avatar:
        'https://misc.scdn.co/uri-v2/local/default/user-default/prid_r-000000-A.jpg',
    },
  ];

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Your Library
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            bgcolor: theme.palette.primary.main,
            '&:hover': { bgcolor: theme.palette.primary.dark },
            color: theme.palette.primary.contrastText,
            borderRadius: '500px', // Pill shape
          }}
        >
          New Playlist
        </Button>
      </Box>

      <Tabs
        value={value}
        onChange={handleChange}
        aria-label="library tabs"
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 3,
          borderBottom: `1px solid ${theme.palette.divider}`,
          '& .MuiTabs-indicator': {
            bgcolor: theme.palette.primary.main,
          },
          '& .MuiTab-root': {
            color: theme.palette.text.secondary,
            '&.Mui-selected': {
              color: theme.palette.text.primary,
              fontWeight: 'bold',
            },
          },
        }}
      >
        <Tab label="Playlists" />
        <Tab label="Artists" />
        <Tab label="Albums" />
        <Tab label="Podcasts" />
      </Tabs>

      {/* Content based on selected tab */}
      {value === 0 && ( // Playlists
        <List>
          {mockPlaylists.map((item) => (
            <ListItem
              key={item.id}
              secondaryAction={
                <IconButton edge="end" aria-label="options">
                  <MoreVertIcon />
                </IconButton>
              }
              sx={{
                bgcolor: theme.palette.background.paper,
                borderRadius: 1,
                mb: 1,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                },
                color: theme.palette.text.primary,
              }}
            >
              <ListItemAvatar>
                <Avatar
                  variant={item.type === 'Playlist' ? 'rounded' : 'circular'}
                  src={item.cover}
                />
              </ListItemAvatar>
              <ListItemText
                primary={item.name}
                secondary={item.description}
                primaryTypographyProps={{ fontWeight: 'bold' }}
                secondaryTypographyProps={{ color: 'text.secondary' }}
              />
              <IconButton sx={{ color: theme.palette.primary.main, ml: 2 }}>
                <PlayArrowIcon />
              </IconButton>
            </ListItem>
          ))}
        </List>
      )}

      {value === 1 && ( // Artists
        <List>
          {mockArtists.map((artist) => (
            <ListItem
              key={artist.id}
              secondaryAction={
                <IconButton edge="end" aria-label="options">
                  <MoreVertIcon />
                </IconButton>
              }
              sx={{
                bgcolor: theme.palette.background.paper,
                borderRadius: 1,
                mb: 1,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                },
                color: theme.palette.text.primary,
              }}
            >
              <ListItemAvatar>
                <Avatar src={artist.avatar} sx={{ width: 60, height: 60 }} />
              </ListItemAvatar>
              <ListItemText
                primary={artist.name}
                secondary="Artist"
                primaryTypographyProps={{ fontWeight: 'bold' }}
                secondaryTypographyProps={{ color: 'text.secondary' }}
              />
            </ListItem>
          ))}
        </List>
      )}
      {/* Additional tabs (Albums, Podcasts) can be implemented similarly */}
    </Box>
  );
};

export default SpotifyLibraryPage;
