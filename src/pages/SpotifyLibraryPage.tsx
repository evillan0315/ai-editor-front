import React, { useEffect, useState, useCallback } from 'react';
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
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Tooltip,
  InputAdornment, // Added InputAdornment import
} from '@mui/material';
import {
  spotifyStore,
  playTrack,
  fetchAllMediaFiles,
  addExtractedMediaFile,
  fetchUserPlaylists,
  createUserPlaylist,
  // Removed Playlist, Track from here as they are now imported from '@/types'
} from '@/stores/spotifyStore';
import { useStore } from '@nanostores/react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import AlbumIcon from '@mui/icons-material/Album';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'; // New icon for extraction
import YouTubeIcon from '@mui/icons-material/YouTube'; // New icon for YouTube provider
import { aiEditorStore, showGlobalSnackbar } from '@/stores/aiEditorStore'; // Import global snackbar
import {
  MediaFileResponseDto,
  CreateMediaDto,
  AllowedMediaFormat,
  allowedMediaFormats,
  PlaylistCreationRequest, // Corrected import from CreatePlaylistPayload
  Playlist, // Imported from '@/types'
  Track, // Imported from '@/types'
} from '@/types';
import { extractMediaFromUrl } from '@/api/media'; // Import the new API function
import { authStore } from '@/stores/authStore'; // Import authStore for login check
import { mapMediaFileToTrack } from '@/utils/mediaUtils';

interface SpotifyLibraryPageProps {
  // No specific props for now
}

interface MediaExtractionFormDialogProps {
  open: boolean;
  onClose: () => void;
  onExtractSuccess: (mediaFile: MediaFileResponseDto) => void;
  onShowSnackbar: (
    message: string,
    severity: 'success' | 'error' | 'info',
  ) => void;
  isLoggedIn: boolean;
}

const MediaExtractionFormDialog: React.FC<MediaExtractionFormDialogProps> = ({
  open,
  onClose,
  onExtractSuccess,
  onShowSnackbar,
  isLoggedIn,
}) => {
  const theme = useTheme();
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<AllowedMediaFormat>('webm');
  const [provider, setProvider] = useState('');
  const [cookieAccess, setCookieAccess] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      // Reset form fields when dialog closes
      setUrl('');
      setFormat('webm');
      setProvider('');
      setCookieAccess(false);
      setExtractError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      onShowSnackbar('You must be logged in to extract media.', 'error');
      return;
    }
    if (!url.trim()) {
      setExtractError('URL is required.');
      return;
    }

    setIsExtracting(true);
    setExtractError(null);

    const dto: CreateMediaDto = {
      url: url.trim(),
      format,
      provider: provider.trim() || undefined,
      cookieAccess,
    };

    try {
      const extractedFile = await extractMediaFromUrl(dto);
      onExtractSuccess(extractedFile);
      onShowSnackbar(
        `Successfully extracted: ${extractedFile.name}`,
        'success',
      );
      onClose();
    } catch (err: any) {
      const message = err.message || 'Failed to extract media.';
      setExtractError(message);
      onShowSnackbar(`Extraction failed: ${message}`, 'error');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pr: 1,
        }}
      >
        <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
          Extract Audio/Video from URL
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: theme.palette.text.secondary }}
        >
          <AddIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        {extractError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {extractError}
          </Alert>
        )}
        <TextField
          autoFocus
          margin="dense"
          id="url"
          label="Media URL (e.g., YouTube link)"
          type="url"
          fullWidth
          variant="outlined"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isExtracting}
          sx={{ mt: 2 }}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            style: { color: theme.palette.text.primary },
            startAdornment: (
              <InputAdornment position="start">
                <YouTubeIcon sx={{ color: theme.palette.error.main }} />
              </InputAdornment>
            ),
          }}
        />

        <FormControl
          fullWidth
          margin="dense"
          sx={{ mt: 2 }}
          disabled={isExtracting}
        >
          <InputLabel id="format-label">Format</InputLabel>
          <Select
            labelId="format-label"
            id="format"
            value={format}
            label="Format"
            onChange={(e) => setFormat(e.target.value as AllowedMediaFormat)}
            sx={{ color: theme.palette.text.primary }}
            inputProps={{ sx: { color: theme.palette.text.primary } }}
          >
            {allowedMediaFormats.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt.toUpperCase()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          margin="dense"
          id="provider"
          label="Provider (e.g., youtube, vimeo)"
          type="text"
          fullWidth
          variant="outlined"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          disabled={isExtracting}
          sx={{ mt: 2 }}
          InputLabelProps={{ shrink: true }}
          InputProps={{ style: { color: theme.palette.text.primary } }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={cookieAccess}
              onChange={(e) => setCookieAccess(e.target.checked)}
              name="cookieAccess"
              color="primary"
              disabled={isExtracting}
            />
          }
          label={
            <Tooltip title="Enable if the media requires authentication cookies (e.g., private content on supported sites).">
              <Typography variant="body2" color="text.secondary">
                Cookie Access
              </Typography>
            </Tooltip>
          }
          sx={{ mt: 2, '& .MuiFormControlLabel-label': { ml: 1 } }}
        />
      </DialogContent>
      <DialogActions
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          p: 2,
          justifyContent: 'flex-end',
        }}
      >
        <Button onClick={onClose} disabled={isExtracting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={isExtracting || !url.trim()}
          startIcon={isExtracting && <CircularProgress size={20} />}
        >
          Extract
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface CreatePlaylistFormDialogProps {
  open: boolean;
  onClose: () => void;
  onShowSnackbar: (
    message: string,
    severity: 'success' | 'error' | 'info',
  ) => void;
  isLoggedIn: boolean;
  allAvailableMediaFiles: MediaFileResponseDto[]; // Pass for initial track selection (optional for now)
}

const CreatePlaylistFormDialog: React.FC<CreatePlaylistFormDialogProps> = ({
  open,
  onClose,
  onShowSnackbar,
  isLoggedIn,
  allAvailableMediaFiles,
}) => {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [selectedMediaFileIds, setSelectedMediaFileIds] = useState<string[]>(
    [],
  );
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      // Reset form fields when dialog closes
      setName('');
      setDescription('');
      setIsPublic(false);
      setSelectedMediaFileIds([]);
      setCreateError(null);
    }
  }, [open]);

  const handleCreatePlaylist = async () => {
    if (!isLoggedIn) {
      onShowSnackbar('You must be logged in to create a playlist.', 'error');
      return;
    }
    if (!name.trim()) {
      setCreateError('Playlist name is required.');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    const payload: PlaylistCreationRequest = {
      // Corrected type here
      name: name.trim(),
      description: description.trim() || undefined,
      isPublic,
      mediaFileIds:
        selectedMediaFileIds.length > 0 ? selectedMediaFileIds : undefined,
    };

    try {
      await createUserPlaylist(payload);
      onShowSnackbar(`Playlist "${name}" created successfully!`, 'success');
      onClose();
    } catch (err: any) {
      const message = err.message || 'Failed to create playlist.';
      setCreateError(message);
      onShowSnackbar(`Playlist creation failed: ${message}`, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const availableTracks = allAvailableMediaFiles
    .filter(
      (media) =>
        media.fileType === 'AUDIO' && (media.metadata?.data?.duration || 0) > 0,
    )
    .map(mapMediaFileToTrack);

  const handleMediaSelectionChange = (
    event: React.ChangeEvent<{ value: unknown }>,
  ) => {
    setSelectedMediaFileIds(event.target.value as string[]);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pr: 1,
        }}
      >
        <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
          Create New Playlist
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: theme.palette.text.secondary }}
        >
          <AddIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        {createError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {createError}
          </Alert>
        )}
        <TextField
          autoFocus
          margin="dense"
          id="playlist-name"
          label="Playlist Name"
          type="text"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isCreating}
          sx={{ mt: 2 }}
          InputLabelProps={{ shrink: true }}
          InputProps={{ style: { color: theme.palette.text.primary } }}
          error={!!createError && !name.trim()}
          helperText={
            !!createError && !name.trim() ? 'Playlist name is required' : ''
          }
        />
        <TextField
          margin="dense"
          id="playlist-description"
          label="Description"
          type="text"
          fullWidth
          variant="outlined"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isCreating}
          sx={{ mt: 2 }}
          InputLabelProps={{ shrink: true }}
          InputProps={{ style: { color: theme.palette.text.primary } }}
          multiline
          rows={2}
        />
        <FormControlLabel
          control={
            <Switch
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              name="isPublic"
              color="primary"
              disabled={isCreating}
            />
          }
          label={
            <Tooltip title="Make this playlist visible to others.">
              <Typography variant="body2" color="text.secondary">
                Public Playlist
              </Typography>
            </Tooltip>
          }
          sx={{ mt: 2, '& .MuiFormControlLabel-label': { ml: 1 } }}
        />

        {availableTracks.length > 0 && (
          <FormControl
            fullWidth
            margin="dense"
            sx={{ mt: 2 }}
            disabled={isCreating}
          >
            <InputLabel id="select-media-label">
              Add Tracks (Optional)
            </InputLabel>
            <Select
              labelId="select-media-label"
              id="select-media"
              multiple
              value={selectedMediaFileIds}
              onChange={handleMediaSelectionChange}
              inputProps={{ sx: { color: theme.palette.text.primary } }}
              renderValue={(selected) =>
                (selected as string[])
                  .map(
                    (id) =>
                      availableTracks.find((track) => track.mediaFileId === id)
                        ?.title || id,
                  )
                  .join(', ')
              }
            >
              {availableTracks.map((track) => (
                <MenuItem key={track.mediaFileId} value={track.mediaFileId}>
                  {track.title} - {track.artist}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          p: 2,
          justifyContent: 'flex-end',
        }}
      >
        <Button onClick={onClose} disabled={isCreating}>
          Cancel
        </Button>
        <Button
          onClick={handleCreatePlaylist}
          color="primary"
          variant="contained"
          disabled={isCreating || !name.trim()}
          startIcon={isCreating && <CircularProgress size={20} />}
        >
          Create Playlist
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SpotifyLibraryPage: React.FC<SpotifyLibraryPageProps> = () => {
  const theme = useTheme();
  const { isLoggedIn } = useStore(authStore);
  const [value, setValue] = React.useState(0); // For Tabs
  const {
    allAvailableMediaFiles,
    isFetchingMedia,
    fetchMediaError,
    playlists,
    isFetchingPlaylists,
    fetchPlaylistError,
    currentTrack,
    isPlaying,
  } = useStore(spotifyStore);

  const [isExtractFormOpen, setIsExtractFormOpen] = useState(false);
  const [isCreatePlaylistFormOpen, setIsCreatePlaylistFormOpen] =
    useState(false);

  // Removed local snackbar state and `CustomSnackbar` import/component
  // Now using the global snackbar provided by `aiEditorStore`
  const showSnackbar = useCallback(
    (message: string, severity: 'success' | 'error' | 'info') => {
      showGlobalSnackbar(message, severity);
    },
    [],
  );

  useEffect(() => {
    if (isLoggedIn) {
      fetchAllMediaFiles({ page: 1, pageSize: 50 });
      fetchUserPlaylists();
    } else {
      spotifyStore.setKey('allAvailableMediaFiles', []);
      spotifyStore.setKey('playlists', []);
    }
  }, [isLoggedIn]);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleExtractSuccess = useCallback(
    (mediaFile: MediaFileResponseDto) => {
      addExtractedMediaFile(mediaFile);
      // Optionally, navigate to the extracted file or show it prominently
    },
    [],
  );

  // Filter for only audio files or files with duration
  const playableTracks: MediaFileResponseDto[] = allAvailableMediaFiles.filter(
    (media) =>
      media.fileType === 'AUDIO' && (media.metadata?.data?.duration || 0) > 0,
  );

  // Create a simplified 'All Tracks' playlist from the fetched media files
  const allTracksPlaylist: Playlist = React.useMemo(() => {
    return {
      id: 'all_tracks',
      name: 'All Tracks',
      description: 'All available audio files',
      isPublic: false,
      cover: '/default-playlist.png',
      tracks: playableTracks.map(mapMediaFileToTrack),
      trackCount: playableTracks.length,
    };
  }, [playableTracks]);

  // Deduplicate artists based on uploader name from metadata
  const uniqueArtists = React.useMemo(() => {
    const artistsMap = new Map<
      string,
      {
        id: string;
        name: string;
        avatar: string;
        topTrackMediaFile: MediaFileResponseDto; // Store the actual MediaFileResponseDto
      }
    >();
    playableTracks.forEach((media) => {
      const uploader = media.metadata?.data?.uploader || 'Unknown Artist';
      if (!artistsMap.has(uploader)) {
        artistsMap.set(uploader, {
          id: media.createdById + uploader, // Unique ID for artist
          name: uploader,
          avatar: media.metadata?.data?.thumbnail || '/default-artist.png', // Placeholder
          topTrackMediaFile: media, // Store the MediaFileResponseDto directly
        });
      }
    });
    return Array.from(artistsMap.values());
  }, [playableTracks]);

  const handlePlayPlaylistTrack = (track: Track, playlistTracks: Track[]) => {
    const mediaFileToPlay =
      playableTracks.find((m) => m.id === track.mediaFileId) ||
      playableTracks[0];
    if (mediaFileToPlay) {
      playTrack(mediaFileToPlay, playlistTracks);
    }
  };

  const handlePlayArtistTopTrack = (track: Track) => {
    const mediaFileToPlay =
      playableTracks.find((m) => m.id === track.mediaFileId) ||
      playableTracks[0];
    if (mediaFileToPlay) {
      playTrack(mediaFileToPlay, [track]);
    }
  };

  if (!isLoggedIn) {
    return (
      <Box className="flex justify-center items-center h-full">
        <Alert severity="warning">
          Please log in to manage and play your media library.
        </Alert>
      </Box>
    );
  }

  if (isFetchingMedia || isFetchingPlaylists) {
    return (
      <Box className="flex justify-center items-center h-full">
        <CircularProgress size={40} />
        <Typography
          variant="h6"
          sx={{ ml: 2, color: theme.palette.text.secondary }}
        >
          Loading library...
        </Typography>
      </Box>
    );
  }

  if (fetchMediaError || fetchPlaylistError) {
    return (
      <Alert severity="error">
        Error loading library: {fetchMediaError || fetchPlaylistError}
      </Alert>
    );
  }

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
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<CloudDownloadIcon />}
            onClick={() => setIsExtractFormOpen(true)}
            sx={{
              bgcolor: theme.palette.info.main,
              '&:hover': { bgcolor: theme.palette.info.dark },
              color: theme.palette.info.contrastText,
              borderRadius: '500px',
            }}
            disabled={!isLoggedIn}
          >
            Extract Media
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsCreatePlaylistFormOpen(true)}
            sx={{
              bgcolor: theme.palette.primary.main,
              '&:hover': { bgcolor: theme.palette.primary.dark },
              color: theme.palette.primary.contrastText,
              borderRadius: '500px',
            }}
            disabled={!isLoggedIn}
          >
            New Playlist
          </Button>
        </Box>
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
        <Tab label="Albums" disabled />{' '}
        {/* Albums and Podcasts tabs disabled for now */}
        <Tab label="Podcasts" disabled />
      </Tabs>

      {/* Content based on selected tab */}
      {value === 0 && ( // Playlists
        <List>
          {/* Displaying 'All Tracks' as the primary playlist */}
          {allTracksPlaylist.tracks.length === 0 && playlists.length === 0 ? (
            <Alert severity="info">
              No playlists or playable audio files found in your library. Use
              the "Extract Media" or "New Playlist" button to add some.
            </Alert>
          ) : (
            <>
              {/* All Tracks Playlist */}
              {allTracksPlaylist.tracks.length > 0 && (
                <ListItem
                  key={allTracksPlaylist.id}
                  secondaryAction={
                    allTracksPlaylist.tracks.length > 0 ? (
                      <IconButton
                        edge="end"
                        aria-label="play"
                        onClick={() =>
                          handlePlayPlaylistTrack(
                            allTracksPlaylist.tracks[0],
                            allTracksPlaylist.tracks,
                          )
                        }
                        sx={{ color: theme.palette.primary.main, ml: 2 }}
                      >
                        <PlayArrowIcon />
                      </IconButton>
                    ) : (
                      <IconButton edge="end" aria-label="options">
                        <MoreVertIcon />
                      </IconButton>
                    )
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
                    {allTracksPlaylist.cover ? (
                      <Avatar variant="rounded" src={allTracksPlaylist.cover} />
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
                    primary={allTracksPlaylist.name}
                    secondary={`${allTracksPlaylist.trackCount} songs`}
                    primaryTypographyProps={{ fontWeight: 'bold' }}
                    secondaryTypographyProps={{ color: 'text.secondary' }}
                  />
                </ListItem>
              )}

              {/* User-created Playlists */}
              {playlists.map((playlist) => {
                const isActive =
                  currentTrack &&
                  playlist.tracks.some((t) => t.id === currentTrack.id) &&
                  isPlaying;
                return (
                  <ListItem
                    key={playlist.id}
                    secondaryAction={
                      playlist.tracks.length > 0 ? (
                        <IconButton
                          edge="end"
                          aria-label="play"
                          onClick={() =>
                            handlePlayPlaylistTrack(
                              playlist.tracks[0],
                              playlist.tracks,
                            )
                          }
                          sx={{ color: theme.palette.primary.main, ml: 2 }}
                        >
                          <PlayArrowIcon />
                        </IconButton>
                      ) : (
                        <IconButton edge="end" aria-label="options">
                          <MoreVertIcon />
                        </IconButton>
                      )
                    }
                    sx={{
                      bgcolor: theme.palette.background.paper,
                      borderRadius: 1,
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: theme.palette.action.hover,
                      },
                      border: isActive
                        ? `2px solid ${theme.palette.primary.main}`
                        : 'none',
                      color: theme.palette.text.primary,
                    }}
                  >
                    <ListItemAvatar>
                      {playlist.cover ? (
                        <Avatar variant="rounded" src={playlist.cover} />
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
                      primary={playlist.name}
                      secondary={
                        playlist.description || `${playlist.trackCount} songs`
                      }
                      primaryTypographyProps={{ fontWeight: 'bold' }}
                      secondaryTypographyProps={{ color: 'text.secondary' }}
                    />
                  </ListItem>
                );
              })}
            </>
          )}
        </List>
      )}

      {value === 1 && ( // Artists
        <List>
          {uniqueArtists.length === 0 ? (
            <Alert severity="info">No artists found in your library.</Alert>
          ) : (
            uniqueArtists.map((artist) => {
              const isActive =
                currentTrack?.artist === artist.name && isPlaying;
              return (
                <ListItem
                  key={artist.id}
                  secondaryAction={
                    artist.topTrackMediaFile ? (
                      <IconButton
                        edge="end"
                        aria-label="play"
                        onClick={() =>
                          handlePlayArtistTopTrack(
                            mapMediaFileToTrack(artist.topTrackMediaFile),
                          )
                        }
                        sx={{ color: theme.palette.primary.main, ml: 2 }}
                      >
                        <PlayArrowIcon />
                      </IconButton>
                    ) : (
                      <IconButton edge="end" aria-label="options">
                        <MoreVertIcon />
                      </IconButton>
                    )
                  }
                  sx={{
                    bgcolor: theme.palette.background.paper,
                    borderRadius: 1,
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: theme.palette.action.hover,
                    },
                    border: isActive
                      ? `2px solid ${theme.palette.primary.main}`
                      : 'none',
                    color: theme.palette.text.primary,
                  }}
                >
                  <ListItemAvatar>
                    {artist.avatar ? (
                      <Avatar
                        src={artist.avatar}
                        sx={{ width: 60, height: 60 }}
                      />
                    ) : (
                      <AlbumIcon
                        sx={{
                          width: 60,
                          height: 60,
                          color: theme.palette.text.secondary,
                        }}
                      />
                    )}
                  </ListItemAvatar>
                  <ListItemText
                    primary={artist.name}
                    secondary="Artist"
                    primaryTypographyProps={{ fontWeight: 'bold' }}
                    secondaryTypographyProps={{ color: 'text.secondary' }}
                  />
                </ListItem>
              );
            })
          )}
        </List>
      )}
      {/* Additional tabs (Albums, Podcasts) can be implemented similarly */}

      <MediaExtractionFormDialog
        open={isExtractFormOpen}
        onClose={() => setIsExtractFormOpen(false)}
        onExtractSuccess={handleExtractSuccess}
        onShowSnackbar={showGlobalSnackbar} // Use global snackbar
        isLoggedIn={isLoggedIn}
      />

      <CreatePlaylistFormDialog
        open={isCreatePlaylistFormOpen}
        onClose={() => setIsCreatePlaylistFormOpen(false)}
        onShowSnackbar={showGlobalSnackbar} // Use global snackbar
        isLoggedIn={isLoggedIn}
        allAvailableMediaFiles={playableTracks}
      />
      {/* CustomSnackbar component is no longer needed as showGlobalSnackbar is used */}
    </Box>
  );
};

export default SpotifyLibraryPage;
