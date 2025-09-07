import React from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
  Divider,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import AddBoxIcon from '@mui/icons-material/AddBox';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RssFeedIcon from '@mui/icons-material/RssFeed'; // For Podcasts
import LightbulbIcon from '@mui/icons-material/Lightbulb'; // For Discover

interface SpotifySidebarProps {
  currentView: 'home' | 'search' | 'library';
  onSelectView: (view: 'home' | 'search' | 'library') => void;
}
const SpotifySidebar: React.FC<SpotifySidebarProps> = ({
  currentView,
  onSelectView,
}) => {
  const theme = useTheme();

  const primaryNavItems = [
    { text: 'Home', icon: HomeIcon, view: 'home' as const },
    { text: 'Search', icon: SearchIcon, view: 'search' as const },
    { text: 'Your Library', icon: LibraryMusicIcon, view: 'library' as const },
  ];

  const secondaryNavItems = [
    { text: 'Create Playlist', icon: AddBoxIcon },
    { text: 'Liked Songs', icon: FavoriteIcon },
    { text: 'Your Episodes', icon: RssFeedIcon }, // Placeholder for podcasts/episodes
    { text: 'Discover', icon: LightbulbIcon },
  ];

  const playlistItems = [
    'My Top Hits',
    'Workout Mix',
    'Chill Vibes',
    'Focus Music',
    'Road Trip Anthems',
    'Acoustic Covers',
    '90s Throwback',
    'Electronic Dreams',
    'Jazz Essentials',
    'Classical Study',
  ];

  return (
    <Box
      sx={{
        gridArea: 'sidebar',
        bgcolor: theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        pb: 2, // Padding bottom for scrollable content
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          🎵 AI Music
        </Typography>
      </Box>

      <List component="nav" sx={{ mb: 2 }}>
        {primaryNavItems.map((item) => (
          <ListItemButton
            key={item.text}
            selected={currentView === item.view}
            onClick={() => onSelectView(item.view)}
            sx={{
              py: 1,
              px: 2,
              '&.Mui-selected': {
                bgcolor: theme.palette.action.selected,
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                },
              },
              color: theme.palette.text.primary, // Ensure text color is consistent
              '& .MuiListItemIcon-root': {
                // Target icon color within selected state
                color: 'inherit',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
              <item.icon />
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{ fontWeight: 'bold' }}
            />
          </ListItemButton>
        ))}
      </List>

      <Divider
        variant="middle"
        sx={{ my: 1, borderColor: theme.palette.divider }}
      />

      <List component="nav">
        {secondaryNavItems.map((item) => (
          <ListItemButton
            key={item.text}
            sx={{ py: 1, px: 2, color: theme.palette.text.primary }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
              <item.icon />
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>

      <Divider
        variant="middle"
        sx={{ my: 1, borderColor: theme.palette.divider }}
      />

      <Box sx={{ mt: 2, px: 2 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 'bold',
            mb: 1,
            textTransform: 'uppercase',
            color: theme.palette.text.secondary,
          }}
        >
          Playlists
        </Typography>
        <List dense>
          {playlistItems.map((playlist, index) => (
            <ListItemButton
              key={index}
              sx={{ py: 0.5, px: 1, color: theme.palette.text.primary }}
            >
              <ListItemText primary={playlist} />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default SpotifySidebar;
