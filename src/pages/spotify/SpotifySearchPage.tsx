import React from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  useTheme,
  CardMedia,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useStore } from '@nanostores/react';
import { spotifyStore, playTrack } from '@/stores/spotifyStore';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import AlbumIcon from '@mui/icons-material/Album';
import { mapMediaFileToTrack } from '@/utils/mediaUtils';

interface SpotifySearchPageProps {
  // No specific props for now
}

const SpotifySearchPage: React.FC<SpotifySearchPageProps> = () => {
  const theme = useTheme();
  const { allAvailableMediaFiles, isPlaying, currentTrack } =
    useStore(spotifyStore);
  const [searchTerm, setSearchTerm] = React.useState('');

  const playableTracks = allAvailableMediaFiles.filter(
    (media) =>
      media.fileType === 'AUDIO' && (media.metadata?.data?.duration || 0) > 0,
  );

  const filteredTracks = React.useMemo(() => {
    if (!searchTerm) return playableTracks;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return playableTracks.filter(
      (media) =>
        media.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        media.metadata?.data?.title
          ?.toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        media.metadata?.data?.uploader
          ?.toLowerCase()
          .includes(lowerCaseSearchTerm),
    );
  }, [searchTerm, playableTracks]);

  const mockGenres = [
    { id: 1, name: 'Pop', color: '#8d6e63' }, // Brown
    { id: 2, name: 'Hip Hop', color: '#4a148c' }, // Purple
    { id: 3, name: 'Rock', color: '#b71c1c' }, // Red
    { id: 4, name: 'Jazz', color: '#1b5e20' }, // Green
    { id: 5, name: 'Electronic', color: '#006064' }, // Teal
    { id: 6, name: 'Classical', color: '#311b92' }, // Dark Purple
    { id: 7, name: 'R&B', color: '#f57f17' }, // Amber
    { id: 8, name: 'Country', color: '#bf360c' }, // Deep Orange
    { id: 9, name: 'Indie', color: '#2e7d32' }, // Dark Green
    { id: 10, name: 'Metal', color: '#424242' }, // Grey
    { id: 11, name: 'Blues', color: '#5d4037' }, // Brown
    { id: 12, name: 'Folk', color: '#880e4f' }, // Pink
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Search
      </Typography>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="What do you want to listen to?"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          sx: {
            borderRadius: '500px', // Pill shape
            bgcolor: theme.palette.background.paper,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'transparent', // Hide border by default
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main, // Show border on hover
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main, // Show border on focus
            },
          },
        }}
        sx={{ mb: 4 }}
      />

      {searchTerm ? (
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            Search Results
          </Typography>
          <Grid container spacing={3}>
            {filteredTracks.length > 0 ? (
              filteredTracks.map((mediaFile) => {
                const track = mapMediaFileToTrack(mediaFile);
                const isActive = currentTrack?.id === track.id && isPlaying;
                return (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={2}
                    key={track.id}
                    component="div"
                  >
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
                        border: isActive
                          ? `2px solid ${theme.palette.primary.main}`
                          : 'none',
                      }}
                    >
                      <Box sx={{ position: 'relative', mb: 1 }}>
                        {track.coverArt ? (
                          <CardMedia
                            component="img"
                            image={track.coverArt}
                            alt={track.title}
                            sx={{
                              width: '100%',
                              borderRadius: 1,
                              aspectRatio: '1 / 1',
                            }}
                          />
                        ) : (
                          <AlbumIcon
                            sx={{
                              width: '100%',
                              borderRadius: 1,
                              aspectRatio: '1 / 1',
                              color: theme.palette.text.secondary,
                              p: 2,
                            }}
                          />
                        )}
                        <PlayCircleFilledWhiteIcon
                          className="play-icon-card"
                          sx={{
                            position: 'absolute',
                            bottom: 8,
                            right: 8,
                            opacity: isActive ? 1 : 0,
                            fontSize: 48,
                            color: theme.palette.primary.main,
                            transition: 'opacity 0.2s',
                          }}
                        />
                      </Box>
                      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 'bold' }}
                        >
                          {track.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {track.artist}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })
            ) : (
              <Box sx={{ p: 2, width: '100%' }}>
                <Alert severity="info">
                  No tracks found matching "{searchTerm}".
                </Alert>
              </Box>
            )}
          </Grid>
        </Box>
      ) : (
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            Browse all
          </Typography>

          <Grid container spacing={2}>
            {mockGenres.map((genre) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={3}
                lg={2}
                key={genre.id}
                component="div"
              >
                <Card
                  sx={{
                    height: 120,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'flex-end',
                    p: 2,
                    cursor: 'pointer',
                    position: 'relative',
                    bgcolor: genre.color, // Use dynamic color
                    color: 'white', // Text color for contrast
                    boxShadow: theme.shadows[3],
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.03)',
                    },
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {genre.name}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default SpotifySearchPage;
