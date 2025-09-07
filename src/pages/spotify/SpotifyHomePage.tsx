import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  useTheme,
} from '@mui/material';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';

interface SpotifyHomePageProps {
  // No specific props for now, just static content
}

const SpotifyHomePage: React.FC<SpotifyHomePageProps> = () => {
  const theme = useTheme();

  const mockAlbums = [
    {
      id: 1,
      title: "Today's Top Hits",
      artist: 'Various Artists',
      cover:
        'https://misc.scdn.co/uri-v2/local/default/user-default/prid_r-000000-A.jpg',
    },
    {
      id: 2,
      title: 'RapCaviar',
      artist: 'Various Artists',
      cover:
        'https://misc.scdn.co/uri-v2/local/default/user-default/prid_r-000000-A.jpg',
    },
    {
      id: 3,
      title: 'All Out 00s',
      artist: 'Various Artists',
      cover:
        'https://misc.scdn.co/uri-v2/local/default/user-default/prid_r-000000-A.jpg',
    },
    {
      id: 4,
      title: 'Rock Anthems',
      artist: 'Various Artists',
      cover:
        'https://misc.scdn.co/uri-v2/local/default/user-default/prid_r-000000-A.jpg',
    },
    {
      id: 5,
      title: 'Peaceful Piano',
      artist: 'Various Artists',
      cover:
        'https://misc.scdn.co/uri-v2/local/default/user-default/prid_r-000000-A.jpg',
    },
    {
      id: 6,
      title: 'Chill Hits',
      artist: 'Various Artists',
      cover:
        'https://misc.scdn.co/uri-v2/local/default/user-default/prid_r-000000-A.jpg',
    },
  ];

  const mockArtists = [
    {
      id: 101,
      name: 'Artist A',
      image:
        'https://misc.scdn.co/uri-v2/local/default/user-default/prid_r-000000-A.jpg',
    },
    {
      id: 102,
      name: 'Artist B',
      image:
        'https://misc.scdn.co/uri-v2/local/default/user-default/prid_r-000000-A.jpg',
    },
    {
      id: 103,
      name: 'Artist C',
      image:
        'https://misc.scdn.co/uri-v2/local/default/user-default/prid_r-000000-A.jpg',
    },
    {
      id: 104,
      name: 'Artist D',
      image:
        'https://misc.scdn.co/uri-v2/local/default/user-default/prid_r-000000-A.jpg',
    },
    {
      id: 105,
      name: 'Artist E',
      image:
        'https://misc.scdn.co/uri-v2/local/default/user-default/prid_r-000000-A.jpg',
    },
    {
      id: 106,
      name: 'Artist F',
      image:
        'https://misc.scdn.co/uri-v2/local/default/user-default/prid_r-000000-A.jpg',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Good evening
      </Typography>

      {/* Quick Picks / Recently Played */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {mockAlbums.slice(0, 4).map((album) => (
          <Grid item xs={12} sm={6} md={3} key={album.id} component="div">
            <Card
              sx={{
                display: 'flex',
                alignItems: 'center',
                bgcolor: theme.palette.background.paper,
                boxShadow: 'none',
                borderRadius: 1,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                  '& .play-icon': {
                    opacity: 1,
                  },
                },
                position: 'relative',
                overflow: 'hidden', // Ensure play icon doesn't overflow
              }}
            >
              <CardMedia
                component="img"
                image={album.cover}
                alt={album.title}
                sx={{ width: 64, height: 64, flexShrink: 0 }}
              />
              <CardContent
                sx={{ flexGrow: 1, p: 1, '&:last-child': { pb: 1 } }}
              >
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {album.title}
                </Typography>
              </CardContent>
              <PlayCircleFilledWhiteIcon
                className="play-icon"
                sx={{
                  position: 'absolute',
                  right: 8,
                  opacity: 0,
                  fontSize: 40,
                  color: theme.palette.primary.main,
                  transition: 'opacity 0.2s',
                }}
              />
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* More like this */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        Made for you
      </Typography>
      <Grid container spacing={3}>
        {mockAlbums.map((album) => (
          <Grid item xs={12} sm={6} md={2} key={album.id} component="div">
            <Card
              sx={{
                bgcolor: theme.palette.background.paper,
                boxShadow: 'none',
                borderRadius: 1,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                  '& .play-icon-card': {
                    opacity: 1,
                  },
                },
                p: 2,
                position: 'relative',
              }}
            >
              <Box sx={{ position: 'relative', mb: 1 }}>
                <CardMedia
                  component="img"
                  image={album.cover}
                  alt={album.title}
                  sx={{ width: '100%', borderRadius: 1, aspectRatio: '1 / 1' }}
                />
                <PlayCircleFilledWhiteIcon
                  className="play-icon-card"
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    opacity: 0,
                    fontSize: 48,
                    color: theme.palette.primary.main,
                    transition: 'opacity 0.2s',
                  }}
                />
              </Box>
              <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {album.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {album.artist}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Popular Artists */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 4, mb: 2 }}>
        Popular Artists
      </Typography>
      <Grid container spacing={3}>
        {mockArtists.map((artist) => (
          <Grid item xs={12} sm={6} md={2} key={artist.id} component="div">
            <Card
              sx={{
                bgcolor: theme.palette.background.paper,
                boxShadow: 'none',
                borderRadius: '50%', // Circular card for artists
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                  '& .play-icon-artist': {
                    opacity: 1,
                  },
                },
                p: 2,
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  mb: 1,
                  width: '100%',
                  aspectRatio: '1 / 1',
                }}
              >
                <CardMedia
                  component="img"
                  image={artist.image}
                  alt={artist.name}
                  sx={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
                <PlayCircleFilledWhiteIcon
                  className="play-icon-artist"
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    opacity: 0,
                    fontSize: 48,
                    color: theme.palette.primary.main,
                    transition: 'opacity 0.2s',
                  }}
                />
              </Box>
              <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {artist.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Artist
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SpotifyHomePage;
