import { map } from 'nanostores';
import { showGlobalSnackbar } from './aiEditorStore';
import {
  Track,
  Playlist,
  PaginationPlaylistQueryDto,
  CreatePlaylistApiDto,
  UpdatePlaylistDto,
  AddRemoveMediaToPlaylistDto,
  MediaScanRequestDto,
  MediaFileResponseDto,
  RepeatMode,
  PlaylistCreationRequest,
  PlaylistTrackResponseDto,
  PaginationMediaQueryDto,
  FileType, // NEW: Import FileType
} from '@/types/refactored/spotify';
import {
  fetchPlaylists,
  fetchPlaylistById,
  createPlaylist as apiCreatePlaylist,
  updatePlaylist,
  deletePlaylist,
  addMediaToPlaylist,
  removeMediaFromPlaylist,
} from '@/api/playlist';
import {
  scanMediaDirectory as apiScanMediaDirectory,
  fetchMediaFiles as apiFetchAllMediaFiles,
} from '@/api/media';
import { mapMediaFileToTrack } from '@/utils/mediaUtils';

// --- Store Interface ---
export interface SpotifyStore {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number; // 0-100 for slider
  progress: number; // Current playback position in seconds
  duration: number; // Total duration of the current track in seconds
  repeatMode: RepeatMode;
  shuffle: boolean;
  queue: Track[]; // Tracks to play next
  history: Track[]; // Tracks that have been played (for 'previous' functionality)
  currentPlaylist: Playlist | null;
  playlists: Playlist[];
  isLoadingPlaylists: boolean;
  playlistError: string | null;
  // New media related state
  allAvailableMediaFiles: MediaFileResponseDto[]; // All media files fetched from backend
  isFetchingMedia: boolean;
  fetchMediaError: string | null;
  // Media scan state
  mediaScanPath: string;
  isScanningMedia: boolean;
  mediaScanError: string | null;
  loading: boolean; // General loading state for player actions
  error: string | null; // General error state for player actions
}

// --- Initial State ---
export const $spotifyStore = map<SpotifyStore>({
  currentTrack: null,
  isPlaying: false,
  volume: 70,
  progress: 0,
  duration: 0,
  repeatMode: 'off',
  shuffle: false,
  queue: [],
  history: [],
  currentPlaylist: null,
  playlists: [],
  isLoadingPlaylists: false,
  playlistError: null,
  allAvailableMediaFiles: [],
  isFetchingMedia: false,
  fetchMediaError: null,
  mediaScanPath: '',
  isScanningMedia: false,
  mediaScanError: null,
  loading: false,
  error: null,
});

// --- Actions ---

export const setLoading = (isLoading: boolean) => {
  $spotifyStore.setKey('loading', isLoading);
};

export const setError = (message: string | null) => {
  $spotifyStore.setKey('error', message);
};

/**
 * Plays a specific track and optionally sets up a new queue/history.
 * @param mediaFile The MediaFileResponseDto to play.
 * @param contextTracks All tracks available in the current context (e.g., playlist, album, search results).
 */
export const playTrack = (
  mediaFile: MediaFileResponseDto,
  contextTracks: Track[],
) => {
  const trackToPlay = mapMediaFileToTrack(mediaFile);
  const state = $spotifyStore.get();

  // If playing the same track, just toggle play/pause
  if (state.currentTrack?.id === trackToPlay.id) {
    $spotifyStore.setKey('isPlaying', !state.isPlaying);
    return;
  }

  // Add current track to history before changing
  if (state.currentTrack) {
    $spotifyStore.setKey('history', [...state.history, state.currentTrack]);
  }

  // Set new current track and build a new queue
  const trackIndex = contextTracks.findIndex(
    (t) => t.id === trackToPlay.id,
  );
  let newQueue = [];
  if (trackIndex !== -1) {
    newQueue = contextTracks.slice(trackIndex + 1);
    if (state.shuffle) {
      newQueue = shuffleArray(newQueue);
    }
  }

  $spotifyStore.set({
    ...state,
    currentTrack: trackToPlay,
    isPlaying: true,
    progress: 0,
    duration: trackToPlay.duration || 0,
    queue: newQueue,
    error: null,
    loading: false,
  });
};

export const togglePlayPause = () => {
  $spotifyStore.setKey('isPlaying', !$spotifyStore.get().isPlaying);
};

export const setVolume = (volume: number) => {
  $spotifyStore.setKey('volume', volume);
};

export const setPlaybackProgress = (progress: number) => {
  $spotifyStore.setKey('progress', progress);
};

export const setDuration = (duration: number) => {
  $spotifyStore.setKey('duration', duration);
};

export const toggleShuffle = () => {
  const state = $spotifyStore.get();
  const newShuffle = !state.shuffle;
  let newQueue = [...state.queue];

  if (newShuffle) {
    newQueue = shuffleArray(newQueue);
  } else {
    // If unshuffling, try to restore original order or just keep current order
    // For simplicity, we'll just keep the current shuffled order if no original order is maintained
    // A more robust solution would require storing the 'unshuffled' queue.
  }
  $spotifyStore.set({ ...state, shuffle: newShuffle, queue: newQueue });
};

export const toggleRepeat = () => {
  const currentMode = $spotifyStore.get().repeatMode;
  const newMode: RepeatMode =
    currentMode === 'off'
      ? 'context'
      : currentMode === 'context'
        ? 'track'
        : 'off';
  $spotifyStore.setKey('repeatMode', newMode);
};

export const nextTrack = () => {
  const state = $spotifyStore.get();
  if (state.repeatMode === 'track' && state.currentTrack) {
    // If repeating current track, just restart it
    $spotifyStore.setKey('progress', 0);
    $spotifyStore.setKey('isPlaying', true);
    return;
  }

  if (state.queue.length > 0) {
    const [next, ...rest] = state.queue;
    if (state.currentTrack) {
      $spotifyStore.setKey('history', [...state.history, state.currentTrack]);
    }
    $spotifyStore.set({
      ...state,
      currentTrack: next,
      queue: rest,
      progress: 0,
      isPlaying: true,
      duration: next.duration || 0,
    });
  } else if (state.repeatMode === 'context' && state.currentPlaylist) {
    // If queue is empty but repeating context, restart from the beginning of the current playlist
    const firstTrack = state.currentPlaylist.tracks[0];
    if (firstTrack) {
      $spotifyStore.set({
        ...state,
        currentTrack: firstTrack,
        queue: shuffleArray(state.currentPlaylist.tracks.slice(1)),
        history: [],
        progress: 0,
        isPlaying: true,
        duration: firstTrack.duration || 0,
      });
    } else {
      // No tracks in playlist, stop playing
      $spotifyStore.setKey('isPlaying', false);
      $spotifyStore.setKey('currentTrack', null);
    }
  } else {
    // No more tracks and not repeating, stop playing
    $spotifyStore.setKey('isPlaying', false);
    $spotifyStore.setKey('currentTrack', null);
  }
};

export const previousTrack = () => {
  const state = $spotifyStore.get();
  if (state.history.length > 0) {
    const previous = state.history[state.history.length - 1];
    const newHistory = state.history.slice(0, -1);
    if (state.currentTrack) {
      $spotifyStore.setKey('queue', [state.currentTrack, ...state.queue]);
    }
    $spotifyStore.set({
      ...state,
      currentTrack: previous,
      history: newHistory,
      progress: 0,
      isPlaying: true,
      duration: previous.duration || 0,
    });
  } else {
    // If no history, restart current track
    if (state.currentTrack) {
      $spotifyStore.setKey('progress', 0);
      $spotifyStore.setKey('isPlaying', true);
    } else {
      $spotifyStore.setKey('isPlaying', false);
    }
  }
};

// Helper for shuffling arrays
const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// --- Media File Actions ---

export const fetchAllMediaFiles = async (
  query?: PaginationMediaQueryDto,
) => {
  $spotifyStore.setKey('isFetchingMedia', true);
  $spotifyStore.setKey('fetchMediaError', null);
  try {
    const result = await apiFetchAllMediaFiles(query);
    $spotifyStore.setKey('allAvailableMediaFiles', result.items);
  } catch (error: any) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load media files.';
    $spotifyStore.setKey('fetchMediaError', errorMessage);
    showGlobalSnackbar(`Error loading media files: ${errorMessage}`, 'error');
  } finally {
    $spotifyStore.setKey('isFetchingMedia', false);
  }
};

export const addExtractedMediaFile = (mediaFile: MediaFileResponseDto) => {
  const currentFiles = $spotifyStore.get().allAvailableMediaFiles;
  // Check if the file already exists to prevent duplicates
  if (!currentFiles.some((file) => file.id === mediaFile.id)) {
    $spotifyStore.setKey('allAvailableMediaFiles', [
      ...currentFiles,
      mediaFile,
    ]);
  }
};

// --- Playlist Actions ---

export const fetchUserPlaylists = async (
  query?: PaginationPlaylistQueryDto,
) => {
  $spotifyStore.setKey('isLoadingPlaylists', true);
  $spotifyStore.setKey('playlistError', null);
  try {
    const result = await fetchPlaylists(query);
    // Transform backend PlaylistResponseDto to frontend Playlist interface
    const transformedPlaylists: Playlist[] = result.items.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      isPublic: p.isPublic,
      cover:
        p.playlistMediaFiles?.[0]?.file?.metadata?.data?.thumbnail ||
        (p.playlistMediaFiles?.[0]?.file?.fileType === FileType.VIDEO ? '/default-video-cover.png' : '/default-album-art.png'), // Dynamic default cover
      tracks: p.playlistMediaFiles
        .filter((pt) => pt.file) // Ensure file exists before mapping
        .map((pt) => mapMediaFileToTrack(pt.file)),
      trackCount: p.trackCount || p.playlistMediaFiles.length,
    }));
    $spotifyStore.setKey('playlists', transformedPlaylists);
  } catch (error: any) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load playlists.';
    $spotifyStore.setKey('playlistError', errorMessage);
    showGlobalSnackbar(`Error loading playlists: ${errorMessage}`, 'error');
  } finally {
    $spotifyStore.setKey('isLoadingPlaylists', false);
  }
};

export const loadPlaylistDetails = async (playlistId: string) => {
  $spotifyStore.setKey('isLoadingPlaylists', true);
  $spotifyStore.setKey('playlistError', null);
  try {
    const p = await fetchPlaylistById(playlistId);
    const transformedPlaylist: Playlist = {
      id: p.id,
      name: p.name,
      description: p.description,
      isPublic: p.isPublic,
      cover:
        p.playlistMediaFiles?.[0]?.file?.metadata?.data?.thumbnail ||
        (p.playlistMediaFiles?.[0]?.file?.fileType === FileType.VIDEO ? '/default-video-cover.png' : '/default-album-art.png'), // Dynamic default cover
      tracks: p.playlistMediaFiles
        .filter((pt) => pt.file) // Ensure file exists before mapping
        .map((pt) => mapMediaFileToTrack(pt.file)),
      trackCount: p.trackCount || p.playlistMediaFiles.length,
    };
    $spotifyStore.setKey('currentPlaylist', transformedPlaylist);
  } catch (error: any) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load playlist details.';
    $spotifyStore.setKey('playlistError', errorMessage);
    showGlobalSnackbar(`Error loading playlist details: ${errorMessage}`, 'error');
  } finally {
    $spotifyStore.setKey('isLoadingPlaylists', false);
  }
};

/**
 * Creates a new playlist. This action accepts a frontend-friendly DTO.
 */
export const createUserPlaylist = async (
  payload: PlaylistCreationRequest,
) => {
  try {
    const newPlaylist = await apiCreatePlaylist(payload);
    showGlobalSnackbar(
      `Playlist "${newPlaylist.name}" created successfully!`,
      'success',
    );
    fetchUserPlaylists();
    return newPlaylist;
  } catch (error: any) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create playlist.';
    showGlobalSnackbar(`Error creating playlist: ${errorMessage}`, 'error');
    throw error;
  }
};

export const updateExistingPlaylist = async (
  playlistId: string,
  dto: UpdatePlaylistDto,
) => {
  try {
    const updatedPlaylist = await updatePlaylist(playlistId, dto);
    showGlobalSnackbar(
      `Playlist "${updatedPlaylist.name}" updated successfully!`,
      'success',
    );
    fetchUserPlaylists();
    if ($spotifyStore.get().currentPlaylist?.id === playlistId) {
      loadPlaylistDetails(playlistId);
    }
    return updatedPlaylist;
  } catch (error: any) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update playlist.';
    showGlobalSnackbar(`Error updating playlist: ${errorMessage}`, 'error');
    throw error;
  }
};

export const removePlaylist = async (playlistId: string) => {
  try {
    await deletePlaylist(playlistId);
    showGlobalSnackbar('Playlist deleted successfully!', 'success');
    fetchUserPlaylists();
    if ($spotifyStore.get().currentPlaylist?.id === playlistId) {
      $spotifyStore.setKey('currentPlaylist', null);
    }
  } catch (error: any) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to delete playlist.';
    showGlobalSnackbar(`Error deleting playlist: ${errorMessage}`, 'error');
    throw error;
  }
};

export const addMediaToSpecificPlaylist = async (
  playlistId: string,
  dto: AddRemoveMediaToPlaylistDto,
) => {
  try {
    await addMediaToPlaylist(playlistId, dto);
    showGlobalSnackbar('Media added to playlist successfully!', 'success');
    loadPlaylistDetails(playlistId);
  } catch (error: any) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to add media to playlist.';
    showGlobalSnackbar(`Error adding media: ${errorMessage}`, 'error');
    throw error;
  }
};

export const removeMediaFromSpecificPlaylist = async (
  playlistId: string,
  mediaFileId: string,
) => {
  try {
    await removeMediaFromPlaylist(playlistId, { mediaFileId });
    showGlobalSnackbar(
      'Media removed from playlist successfully!',
      'success',
    );
    loadPlaylistDetails(playlistId);
  } catch (error: any) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to remove media from playlist.';
    showGlobalSnackbar(`Error removing media: ${errorMessage}`, 'error');
    throw error;
  }
};

// New media scan actions
export const setMediaScanPath = (path: string) => {
  $spotifyStore.setKey('mediaScanPath', path);
};

export const triggerMediaScan = async (directoryPath: string) => {
  $spotifyStore.setKey('isScanningMedia', true);
  $spotifyStore.setKey('mediaScanError', null);
  try {
    const dto: MediaScanRequestDto = { directoryPath };
    const response = await apiScanMediaDirectory(dto);
    if (!response.success) {
      throw new Error(response.message || 'Failed to scan directory.');
    }
    showGlobalSnackbar(
      `Scan successful! Found ${response.scannedFilesCount} new media files.`,
      'success',
    );
    // After a successful scan, refresh the list of all available media
    await fetchAllMediaFiles({page:1,pageSize:10});
  } catch (error: any) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    $spotifyStore.setKey('mediaScanError', errorMessage);
    showGlobalSnackbar(`Error scanning directory: ${errorMessage}`, 'error');
  } finally {
    $spotifyStore.setKey('isScanningMedia', false);
  }
};
