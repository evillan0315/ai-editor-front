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
  MediaFileResponseDtoUrl,
  RepeatMode,
  PlaylistCreationRequest,
  PaginationMediaQueryDto,
  FileType,
  BufferedRange,
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
  getFileStreamUrl
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
export const currentTrackAtom = persistentAtom<MediaFileResponseDtoUrl | null>(
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
  allAvailableMediaFiles: [] as MediaFileResponseDto[],
  mediaElement: null as HTMLMediaElement | null, // Added to store direct media element reference
});

// --- Global Actions (Stateless logic) ---

/**
 * Registers the actual HTMLMediaElement (audio/video) with the store.
 * This allows store actions to directly control playback.
 */
export const setMediaElement = (element: HTMLMediaElement | null) => {
  $mediaStore.setKey('mediaElement', element);
};

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
  // Do not reset mediaElement here, it's managed by the component owning it.
}

export const setLoading = (isLoading: boolean) => {
  $mediaStore.setKey('loading', isLoading);
};

export const setError = (message: string | null) => {
  $mediaStore.setKey('error', message);
};

export const setPlaying = (isPlaying: boolean) => {
  isPlayingAtom.set(isPlaying);
  const mediaElement = $mediaStore.get().mediaElement;
  if (mediaElement) {
    if (isPlaying) {
      // Attempt to play, catch potential autoplay errors
      mediaElement.play().catch(e => {
        console.error("Autoplay failed:", e);
        isPlayingAtom.set(false); // Reflect actual playback state if autoplay is blocked
      });
    } else {
      mediaElement.pause();
    }
  }
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

  repeatModeAtom.set(newMode);
};

export const setCurrentTrack = (track: MediaFileResponseDto | null) => {
  const newTrack: MediaFileResponseDtoUrl = {
    ...track,
    streamUrl: getFileStreamUrl(track.path)
  }
  currentTrackAtom.set(newTrack);
};

export const clearError = () => {
  $mediaStore.setKey('error', null);
};

export const nextTrack = async () => {
  const shuffle = shuffleAtom.get();
  const allAvailableMediaFiles = $mediaStore.get().allAvailableMediaFiles;
  const currentTrack = currentTrackAtom.get();

  if (!currentTrack) {
    console.warn('No current track to go to next.');
    return;
  }

  if (shuffle) {
    // Logic for shuffled playback (simple random selection)
    if (allAvailableMediaFiles.length === 0) {
      console.warn('No tracks available to shuffle.');
      return;
    }

    const randomIndex = Math.floor(Math.random() * allAvailableMediaFiles.length);
    const nextTrack = allAvailableMediaFiles[randomIndex];
    setCurrentTrack(nextTrack);
    setPlaying(true); // Automatically play next track
  } else {
    // Logic for sequential playback
    const currentIndex = allAvailableMediaFiles.findIndex(
      (track) => track.id === currentTrack.id,
    );

    if (currentIndex === -1) {
      console.warn('Current track not found in allAvailableMediaFiles.');
      return;
    }

    const nextIndex = (currentIndex + 1) % allAvailableMediaFiles.length;
    const nextTrack = allAvailableMediaFiles[nextIndex];
    setCurrentTrack(nextTrack);
    setPlaying(true); // Automatically play next track
  }
};

export const previousTrack = async () => {
  const shuffle = shuffleAtom.get();
  const allAvailableMediaFiles = $mediaStore.get().allAvailableMediaFiles;
  const currentTrack = currentTrackAtom.get();

  if (!currentTrack) {
    console.warn('No current track to go to previous.');
    return;
  }

  if (shuffle) {
    // If shuffle is enabled, play a random track
    if (allAvailableMediaFiles.length === 0) {
      console.warn('No tracks available to shuffle.');
      return;
    }

    const randomIndex = Math.floor(Math.random() * allAvailableMediaFiles.length);
    const previousTrack = allAvailableMediaFiles[randomIndex];
    setCurrentTrack(previousTrack);
    setPlaying(true); // Automatically play previous track
  } else {
    // If shuffle is disabled, play the previous track in the sequence
    const currentIndex = allAvailableMediaFiles.findIndex(
      (track) => track.id === currentTrack.id,
    );

    if (currentIndex === -1) {
      console.warn('Current track not found in allAvailableMediaFiles.');
      return;
    }

    const previousIndex = (currentIndex - 1 + allAvailableMediaFiles.length) % allAvailableMediaFiles.length;
    const previousTrack = allAvailableMediaFiles[previousIndex];
    setCurrentTrack(previousTrack);
    setPlaying(true); // Automatically play previous track
  }
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

export const fetchingMediaFiles = async (query?: PaginationMediaQueryDto) => {
  $mediaStore.setKey('loading', true);
  try {
    const media = await fetchMediaFiles(query);
    $mediaStore.setKey('loading', false);

    if (media && media.items) {
      // Update the media store with the fetched media files
      $mediaStore.setKey('playlists', media.items as MediaFileResponseDto[]); // This seems incorrect, should be allAvailableMediaFiles
      $mediaStore.setKey('allAvailableMediaFiles', media.items);
      return media;
    } else {
      // If media or media.items is undefined, handle the case appropriately
      showGlobalSnackbar('Failed to fetch media files or empty media list', 'warning');
      $mediaStore.setKey('error', 'Failed to fetch media files or empty media list');
      return null;
    }
  } catch (error: any) {
    $mediaStore.setKey('loading', false);
    // Handle errors and display a snackbar
    showGlobalSnackbar(`Failed to fetch media files: ${error.message}`, 'error');
    $mediaStore.setKey('error', error.message);
    return null;
  }
};

export type MediaStoreType = typeof $mediaStore;
