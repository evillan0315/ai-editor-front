import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  useTheme,
  CardActionArea,
  CircularProgress,
  Alert,
} from '@mui/material';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import { useStore } from '@nanostores/react';
import {
  spotifyStore,
  playTrack,
  fetchAllMediaFiles,
} from '@/stores/spotifyStore';
import AlbumIcon from '@mui/icons-material/Album'; // Placeholder icon
import { MediaFileResponseDto } from '@/types';
import { mapMediaFileToTrack } from '@/utils/mediaUtils';

interface SpotifyHomePageProps {
  // No specific props for now, just static content
}

const SpotifyHomePage: React.FC<SpotifyHomePageProps> = () => {
  const theme = useTheme();
  const {
    allAvailableMediaFiles,
    isFetchingMedia,
    fetchMediaError,
    isPlaying,
    currentTrack,
  } = useStore(spotifyStore);

  useEffect(() => {
    // Fetch media files when the component mounts if not already fetched
    if (allAvailableMediaFiles.length === 0 && !isFetchingMedia) {
      fetchAllMediaFiles({ page: 1, pageSize: 50 }); // Fetch all for now, could add pagination later
    }
  }, [allAvailableMediaFiles.length, isFetchingMedia]);

  // Filter for only audio files or files with duration
  const playableTracks: MediaFileResponseDto[] = allAvailableMediaFiles.filter(
    (media) =>
      media.fileType === 'AUDIO' && (media.metadata?.data?.duration || 0) > 0,
  );

  // Deduplicate artists based on uploader name from metadata
  const uniqueArtists = React.useMemo(() => {
    const artistsMap = new Map<
      string,
      {
        id: string;
        name: string;
        image: string;
        topTrackMediaFile: MediaFileResponseDto; // Store the actual MediaFileResponseDto
      }
    >();
    playableTracks.forEach((media) => {
      const uploader = media.metadata?.data?.uploader || 'Unknown Artist';
      if (!artistsMap.has(uploader)) {
        artistsMap.set(uploader, {
          id: media.createdById + uploader, // Unique ID for artist
          name: uploader,
          image: media.metadata?.data?.thumbnail || '/default-artist.png', // Placeholder
          topTrackMediaFile: media, // Store the MediaFileResponseDto directly
        });
      }
    });
    return Array.from(artistsMap.values());
  }, [playableTracks]);

  if (isFetchingMedia) {
    return (
      <Box className="flex justify-center items-center h-full">
        <CircularProgress size={40} />
        <Typography
          variant="h6"
          sx={{ ml: 2, color: theme.palette.text.secondary }}
        >
          Loading media files...
        </Typography>
      </Box>
    );
  }

  if (fetchMediaError) {
    return (
      <Alert severity="error">Error loading media: {fetchMediaError}</Alert>
    );
  }

  if (playableTracks.length === 0) {
    return (
      <Alert severity="info">
        No playable audio files found. Upload some via the AI Editor or backend.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Good evening
      </Typography>

      {/* Quick Picks / Recently Played */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {playableTracks.slice(0, 4).map((mediaFile) => {
          const track = mapMediaFileToTrack(mediaFile);
          const isActive = currentTrack?.id === track.id && isPlaying;
          return (
            <Grid item xs={12} sm={6} md={3} key={track.id} component="div">
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
                  overflow: 'hidden',
                  border: isActive
                    ? `2px solid ${theme.palette.primary.main}`
                    : 'none',
                }}
              >
                <CardActionArea
                  onClick={() =>
                    playTrack(
                      mediaFile,
                      playableTracks.map(mapMediaFileToTrack),
                    )
                  }
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {track.coverArt ? (
                      <CardMedia
                        component="img"
                        image={track.coverArt}
                        alt={track.title}
                        sx={{ width: 64, height: 64, flexShrink: 0 }}
                      />
                    ) : (
                      <AlbumIcon
                        sx={{
                          width: 64,
                          height: 64,
                          flexShrink: 0,
                          color: theme.palette.text.secondary,
                          p: 1,
                        }}
                      />
                    )}
                    <CardContent
                      sx={{ flexGrow: 1, p: 1, '&:last-child': { pb: 1 } }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {track.title}
                      </Typography>
                    </CardContent>
                  </Box>
                  <PlayCircleFilledWhiteIcon
                    className="play-icon"
                    sx={{
                      position: 'absolute',
                      right: 8,
                      opacity: isActive ? 1 : 0,
                      fontSize: 40,
                      color: theme.palette.primary.main,
                      transition: 'opacity 0.2s',
                    }}
                  />
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* More like this */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        All Available Tracks
      </Typography>
      <Grid container spacing={3}>
        {playableTracks.map((mediaFile) => {
          const track = mapMediaFileToTrack(mediaFile);
          const isActive = currentTrack?.id === track.id && isPlaying;
          return (
            <Grid item xs={12} sm={6} md={2} key={track.id} component="div">
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
                <CardActionArea
                  onClick={() =>
                    playTrack(
                      mediaFile,
                      playableTracks.map(mapMediaFileToTrack),
                    )
                  }
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
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {track.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {track.artist}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Popular Artists */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 4, mb: 2 }}>
        Popular Artists
      </Typography>
      <Grid container spacing={3}>
        {uniqueArtists.map((artist) => (
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
              <CardActionArea
                onClick={() =>
                  playTrack(
                    artist.topTrackMediaFile,
                    playableTracks.map(mapMediaFileToTrack),
                  )
                }
              >
                <Box
                  sx={{
                    position: 'relative',
                    mb: 1,
                    width: '100%',
                    aspectRatio: '1 / 1',
                  }}
                >
                  {artist.image ? (
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
                  ) : (
                    <AlbumIcon
                      sx={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        color: theme.palette.text.secondary,
                        p: 2,
                      }}
                    />
                  )}
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
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SpotifyHomePage;
