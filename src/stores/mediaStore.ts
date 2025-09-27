// /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/project-board-front/src/stores/spotifyStore.ts

import { map } from 'nanostores';
import { showGlobalSnackbar } from './aiEditorStore';
import { persistentAtom, mapMediaFileToTrack } from '@/utils';
import {
  Track,
  Playlist,
  PaginationPlaylistQueryDto,
  UpdatePlaylistDto,
  AddRemoveMediaToPlaylistDto,
  MediaFileResponseDto,
  RepeatMode,
  PlaylistCreationRequest,
  PaginationMediaQueryDto,
  FileType,
  BufferedRange, // New: Import BufferedRange
} from '@/types/refactored/media';
import {
  fetchPlaylists,
  fetchPlaylistById,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addMediaToPlaylist,
  removeMediaFromPlaylist,
} from '@/api/playlist';
import {
  scanMediaDirectory,
  fetchMediaFiles,
  transcribeAudio,
  getTranscription,
  getSyncTranscription,
} from '@/api/media';
import { authStore } from './authStore'; // Import authStore for login check
import { TranscriptionResult, SyncTranscriptionResponse } from '@/types';

// --- Atoms (Non-persistent for transient playback state, persistent for user preferences) ---
// Playback state should NOT be persistent to avoid browser autoplay issues on refresh.
// However, the user explicitly requested these to be persistent.
export const isPlayingAtom = persistentAtom<boolean>(
  'media:isPlaying',
  false,
);
export const currentTrackAtom = persistentAtom<Track | null>(
  'media:currentTrack',
  null,
);
export const progressAtom = persistentAtom<number>('media:progress', 0);
export const durationAtom = persistentAtom<number>('media:duration', 0);
export const bufferedAtom = persistentAtom<BufferedRange[]>(
  'media:buffered',
  [],
); // New: Buffered ranges atom
export const isVideoModalOpenAtom = persistentAtom<boolean>(
  'media:isVideoModalOpen',
  false,
);

// User preferences are persistent
export const volumeAtom = persistentAtom<number>('media:volume', 70); // Persistent
export const repeatModeAtom = persistentAtom<RepeatMode>(
  'media:repeatMode',
  'off',
); // Persistent
export const shuffleAtom = persistentAtom<boolean>('media:shuffle', false); // Persistent


// --- Map Store (Non-persistent for shared playback state) ---
export const $mediaStore = map({
  loading: false,
  error: null as string | null,
  currentPlaylist: null as Playlist | null,
  playlists: [] as Playlist[],
});

// --- Global Actions (Stateless logic) ---

/**
 * Resets playback state to initial values.  Useful when unmounting media players or logging out.
 */
export function resetPlaybackState() {
  isPlayingAtom.set(false);
  currentTrackAtom.set(null);
  progressAtom.set(0);
  durationAtom.set(0);
  bufferedAtom.set([]);
  isVideoModalOpenAtom.set(false);
}

export const setLoading = (isLoading: boolean) => {
  $mediaStore.setKey('loading', isLoading);
};

export const setError = (message: string | null) => {
  $mediaStore.setKey('error', message);
};

export const setPlaying = (isPlaying: boolean) => {
  isPlayingAtom.set(isPlaying);
};

export const setTrackProgress = (progress: number) => {
  progressAtom.set(progress);
};

export const setTrackDuration = (duration: number) => {
  durationAtom.set(duration);
};

export const setBuffered = (buffered: BufferedRange[]) => {
  bufferedAtom.set(buffered);
};

export const setVolume = (volume: number) => {
  volumeAtom.set(volume);
};

export const setIsVideoModalOpen = (isOpen: boolean) => {
  isVideoModalOpenAtom.set(isOpen);
};

// Implement toggleShuffle and toggleRepeat actions, using the atoms directly
export const toggleShuffle = () => {
  shuffleAtom.set(!shuffleAtom.get());
};

export const toggleRepeat = () => {
  const currentMode = repeatModeAtom.get();
  let newMode: RepeatMode = 'off';

  switch (currentMode) {
    case 'off':
      newMode = 'context';
      break;
    case 'context':
      newMode = 'track';
      break;
    case 'track':
      newMode = 'off';
      break;
  }
n
  repeatModeAtom.set(newMode);
};

export const setCurrentTrack = (track: Track | null) => {
  currentTrackAtom.set(track);
};

export const clearError = () => {
  $mediaStore.setKey('error', null);
};

export const nextTrack = async () => {
  showGlobalSnackbar('Next Track', 'info');
};

export const previousTrack = async () => {
  showGlobalSnackbar('Previous Track', 'info');
};

export const addMediaToPlaylistAction = async (
  playlistId: string,
  mediaFileId: string,
) => {
  try {
    await addMediaToPlaylist({ playlistId, mediaFileId });
    showGlobalSnackbar('Media Added to Playlist', 'success');
  } catch (error: any) {
    showGlobalSnackbar(error.message, 'error');
  }
};

export const removeMediaFromPlaylistAction = async (
  playlistId: string,
  mediaFileId: string,
) => {
  try {
    await removeMediaFromPlaylist({ playlistId, mediaFileId });
    showGlobalSnackbar('Media Removed from Playlist', 'success');
  } catch (error: any) {
    showGlobalSnackbar(error.message, 'error');
  }
};

export const fetchPlaylistsAction = async (
  query?: PaginationPlaylistQueryDto,
) => {
  try {
    return await fetchPlaylists(query);
  } catch (error: any) {
    showGlobalSnackbar(error.message, 'error');
  }
};

export const fetchPlaylistByIdAction = async (id: string) => {
  try {
    return await fetchPlaylistById(id);
  } catch (error: any) {
    showGlobalSnackbar(error.message, 'error');
  }
};

export const createPlaylistAction = async (data: PlaylistCreationRequest) => {
  try {
    return await createPlaylist(data);
  } catch (error: any) {
    showGlobalSnackbar(error.message, 'error');
  }
};

export const updatePlaylistAction = async (
  id: string,
  data: UpdatePlaylistDto,
) => {
  try {
    return await updatePlaylist(id, data);
  } catch (error: any) {
    showGlobalSnackbar(error.message, 'error');
  }
};

export const deletePlaylistAction = async (id: string) => {
  try {
    return await deletePlaylist(id);
  } catch (error: any) {
    showGlobalSnackbar(error.message, 'error');
  }
};

export type MediaStoreType = typeof $mediaStore;
