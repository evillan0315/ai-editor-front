import React, { useEffect, useState, useCallback } from 'react';
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
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Avatar,
} from '@mui/material';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { useStore } from '@nanostores/react';
import {
  $spotifyStore,
  playTrack,
  fetchMediaForPurpose,
  isPlayingAtom,
  currentTrackAtom,
} from '@/stores/spotifyStore';
import AlbumIcon from '@mui/icons-material/Album';
import MovieIcon from '@mui/icons-material/Movie';
import { MediaFileResponseDto, FileType } from '@/types';
import { mapMediaFileToTrack } from '@/utils/mediaUtils';
import { showGlobalSnackbar } from '@/stores/aiEditorStore';
import AddMediaToPlaylistDialog from './components/AddMediaToPlaylistDialog'; // New Import
import MediaActionMenu from './components/MediaActionMenu'; // New Import
import { authStore } from '@/stores/authStore'; // For isLoggedIn

interface SpotifyHomePageProps {
  // No specific props for now, just static content
}

const SpotifyHomePage: React.FC<SpotifyHomePageProps> = () => {
  const theme = useTheme();
  const { isLoggedIn } = useStore(authStore); // Get login status
  const { allAvailableMediaFiles, isFetchingMedia, fetchMediaError } =
    useStore($spotifyStore);

  // Directly get isPlaying and currentTrack from their respective atoms
  const isPlaying = useStore(isPlayingAtom);
  const currentTrack = useStore(currentTrackAtom);

  // State for media action menu
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [openMenuMediaFile, setOpenMenuMediaFile] =
    useState<MediaFileResponseDto | null>(null);
  const isMenuOpen = Boolean(anchorEl);

  // State for "Add to Playlist" dialog
  const [isAddMediaToPlaylistDialogOpen, setIsAddMediaToPlaylistDialogOpen] =
    useState(false);
  const [mediaFileToAddToPlaylist, setMediaFileToAddToPlaylist] =
    useState<MediaFileResponseDto | null>(null);

  useEffect(() => {
    // Fetch media files when the component mounts if not already fetched
    // Use 'general' purpose to populate allAvailableMediaFiles, with reset: true
    if (allAvailableMediaFiles.length === 0 && !isFetchingMedia) {
      fetchMediaForPurpose({ page: 1, pageSize: 200 }, 'general', false); // Fetch a larger set for general use
    }
  }, [allAvailableMediaFiles.length, isFetchingMedia]);

  // Filter for audio files
  const playableAudioTracks: MediaFileResponseDto[] =
    allAvailableMediaFiles.filter((media) => media.fileType === FileType.AUDIO);

  // Filter for video files
  const playableVideoTracks: MediaFileResponseDto[] =
    allAvailableMediaFiles.filter((media) => media.fileType === FileType.VIDEO);

  // Deduplicate artists based on uploader name from metadata (only for audio for now)
  const uniqueArtists = React.useMemo(() => {
    const artistsMap = new Map<
      string,
      {
        id: string;
        name: string;
        image: string;
        topTrackMediaFile: MediaFileResponseDto;
      }
    >();
    playableAudioTracks.forEach((media) => {
      const uploader = media.metadata?.data?.uploader || 'Unknown Artist';
      if (!artistsMap.has(uploader)) {
        artistsMap.set(uploader, {
          id: media.createdById + uploader,
          name: uploader,
          image: media.metadata?.data?.thumbnail || '/default-artist.png',
          topTrackMediaFile: media,
        });
      }
      // Note: Currently, only audio files are considered for artists.
      // If video artists are needed, this logic should be extended.
    });
    return Array.from(artistsMap.values());
  }, [playableAudioTracks]);

  const handleOpenMediaActionsMenu = useCallback(
    (event: React.MouseEvent<HTMLElement>, mediaFile: MediaFileResponseDto) => {
      setAnchorEl(event.currentTarget);
      setOpenMenuMediaFile(mediaFile);
    },
    [],
  );

  const handleCloseMediaActionsMenu = useCallback(() => {
    setAnchorEl(null);
    setOpenMenuMediaFile(null);
  }, []);

  const handlePlayMedia = useCallback(
    (mediaFile: MediaFileResponseDto) => {
      const trackList =
        mediaFile.fileType === FileType.AUDIO
          ? playableAudioTracks.map(mapMediaFileToTrack)
          : playableVideoTracks.map(mapMediaFileToTrack);
      playTrack(mediaFile, trackList);
    },
    [playableAudioTracks, playableVideoTracks],
  );

  const handleAddToPlaylist = useCallback(
    (mediaFile: MediaFileResponseDto) => {
      setMediaFileToAddToPlaylist(mediaFile);
      setIsAddMediaToPlaylistDialogOpen(true);
      handleCloseMediaActionsMenu();
    },
    [handleCloseMediaActionsMenu],
  );

  const handleUpdateMedia = useCallback(
    (mediaFile: MediaFileResponseDto) => {
      showGlobalSnackbar(
        `Update metadata for "${mediaFile.name}" (Not Implemented)`,
        'info',
      );
      handleCloseMediaActionsMenu();
      // TODO: Implement a dialog/form for updating media metadata
    },
    [handleCloseMediaActionsMenu],
  );

  const handleDownloadMediaMetadata = useCallback(
    (mediaFile: MediaFileResponseDto) => {
      // Placeholder for actual metadata download API call
      showGlobalSnackbar(
        `Downloading metadata for "${mediaFile.name}" (Not Implemented)`,
        'info',
      );
      handleCloseMediaActionsMenu();
      // TODO: Implement actual API call to download metadata
    },
    [handleCloseMediaActionsMenu],
  );

  const handleDeleteMedia = useCallback(
    (mediaFile: MediaFileResponseDto) => {
      // Placeholder for actual media file deletion API call
      showGlobalSnackbar(
        `Deleting "${mediaFile.name}" (Not Implemented)`,
        'info',
      );
      handleCloseMediaActionsMenu();
      // TODO: Implement a confirmation dialog and actual API call for deletion
    },
    [handleCloseMediaActionsMenu],
  );

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

  const noPlayableMedia =
    playableAudioTracks.length === 0 && playableVideoTracks.length === 0;

  if (noPlayableMedia) {
    return (
      <Alert severity="info">
        No playable audio or video files found. Upload some via the AI Editor or
        backend.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Good evening
      </Typography>

      {/* Quick Picks / Recently Played Audio */}
      {playableAudioTracks.length > 0 && (
        <Box mb={4}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            Quick Picks (Audio)
          </Typography>
          <Grid container spacing={2}>
            {playableAudioTracks.slice(0, 4).map((mediaFile) => {
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
                          playableAudioTracks.map(mapMediaFileToTrack),
                        )
                      }
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {track.coverArt ? (
                          <CardMedia
                            component="img"
                            image={track.coverArt}
                            alt={track.title}
                            sx={{
                              width: 64,
                              height: 64,
                              flexShrink: 0,
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 64,
                              height: 64,
                              flexShrink: 0,
                              bgcolor: theme.palette.action.disabledBackground,
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              borderRadius: 1, // Match CardMedia's implicit rounded corners
                            }}
                          >
                            <AlbumIcon
                              sx={{
                                fontSize: '3rem', // Larger icon
                                color: theme.palette.text.secondary,
                              }}
                            />
                          </Box>
                        )}
                        <CardContent
                          sx={{ flexGrow: 1, p: 1, '&:last-child': { pb: 1 } }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 'bold',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2, // Truncate to 2 rows
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
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
        </Box>
      )}

      {/* All Available Audio Tracks - Converted to List View */}
      {playableAudioTracks.length > 0 && (
        <Box mb={4}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            All Available Audio Tracks
          </Typography>
          <List>
            {playableAudioTracks.map((mediaFile) => {
              const track = mapMediaFileToTrack(mediaFile);
              const isActive = currentTrack?.id === track.id && isPlaying;
              return (
                <ListItem
                  key={track.id}
                  secondaryAction={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        edge="end"
                        aria-label="play audio"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent ListItem's onClick from firing
                          handlePlayMedia(mediaFile);
                        }}
                        sx={{ color: theme.palette.primary.main, ml: 2 }}
                      >
                        <PlayArrowIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="more actions"
                        onClick={(e) =>
                          handleOpenMediaActionsMenu(e, mediaFile)
                        }
                        sx={{ ml: 1 }}
                      >
                        <MoreHorizIcon />
                      </IconButton>
                    </Box>
                  }
                  sx={{
                    bgcolor: theme.palette.background.paper,
                    borderRadius: 1,
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: theme.palette.action.hover },
                    border: isActive
                      ? `2px solid ${theme.palette.primary.main}`
                      : 'none',
                    color: theme.palette.text.primary,
                  }}
                  //onClick={() => handlePlayMedia(mediaFile)}
                >
                  <ListItemAvatar>
                    {track.coverArt ? (
                      <Avatar
                        variant="rounded"
                        src={track.coverArt}
                        sx={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <AlbumIcon
                        sx={{
                          width: 40,
                          height: 40,
                          color: theme.palette.text.secondary,
                        }}
                      />
                    )}
                  </ListItemAvatar>
                  <ListItemText
                    primary={track.title}
                    secondary={track.artist}
                    primaryTypographyProps={{ fontWeight: 'bold' }}
                    secondaryTypographyProps={{ color: 'text.secondary' }}
                  />
                </ListItem>
              );
            })}
          </List>
        </Box>
      )}

      {/* All Available Video Tracks */}
      {playableVideoTracks.length > 0 && (
        <Box mb={4}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            All Available Video Tracks
          </Typography>
          <Grid container spacing={3}>
            {playableVideoTracks.map((mediaFile) => {
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
                          playableVideoTracks.map(mapMediaFileToTrack),
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
                              aspectRatio: '16 / 9', // Aspect ratio for videos
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: '100%',
                              borderRadius: 1,
                              aspectRatio: '16 / 9',
                              bgcolor: theme.palette.action.disabledBackground,
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <MovieIcon
                              sx={{
                                fontSize: '4rem', // Larger icon
                                color: theme.palette.text.secondary,
                              }}
                            />
                          </Box>
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
                          sx={{
                            fontWeight: 'bold',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
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
        </Box>
      )}

      {/* Popular Artists */}
      {uniqueArtists.length > 0 && (
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 4, mb: 2 }}>
            Popular Artists (Audio)
          </Typography>
          <Grid container spacing={3}>
            {uniqueArtists.map((artist) => (
              <Grid item xs={12} sm={6} md={2} key={artist.id} component="div">
                <Card
                  sx={{
                    bgcolor: theme.palette.background.paper,
                    boxShadow: 'none',
                    borderRadius: '50%',
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
                        playableAudioTracks.map(mapMediaFileToTrack),
                      )
                    }
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        mb: 1,
                        width: '100%',
                        aspectRatio: '1 / 1',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        bgcolor: theme.palette.action.disabledBackground, // Added background for fallback
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
                            fontSize: '4rem', // Larger icon, fills the circular space better
                            color: theme.palette.text.secondary,
                            // Removed p: 2 as flexbox centering handles alignment
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
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 'bold' }}
                      >
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
      )}

      <MediaActionMenu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleCloseMediaActionsMenu}
        mediaFile={openMenuMediaFile}
        onPlay={handlePlayMedia}
        onAddToPlaylist={handleAddToPlaylist}
        onUpdate={handleUpdateMedia}
        onDownloadMetadata={handleDownloadMediaMetadata}
        onDelete={handleDeleteMedia}
      />

      <AddMediaToPlaylistDialog
        open={isAddMediaToPlaylistDialogOpen}
        onClose={() => setIsAddMediaToPlaylistDialogOpen(false)}
        mediaFile={mediaFileToAddToPlaylist}
        onShowSnackbar={showGlobalSnackbar}
        isLoggedIn={isLoggedIn}
      />
    </Box>
  );
};

export default SpotifyHomePage;
