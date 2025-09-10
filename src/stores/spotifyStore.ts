import { atom, map } from 'nanostores';
import { RepeatMode } from '@/types'; // Import RepeatMode
import {
  MediaFileResponseDto,
  PaginationPlaylistQueryDto,
  PlaylistResponseDto,
  Track,
  Playlist,
  PlaylistCreationRequest,
} from '@/types';

import {
  fetchMediaFiles as fetchMediaFilesApi,
  getFileStreamUrl,
} from '@/api/media';
import {
  createPlaylist as createPlaylistApi,
  fetchPlaylists as fetchPlaylistsApi,
} from '@/api/playlist';
import { mapMediaFileToTrack } from '@/utils/mediaUtils'; // Assuming a new utility for mapping

// Frontend-specific types are now defined in '@/types/spotify.ts' for better organization.
// The content of the Track and Playlist interfaces was moved from here.

export interface SpotifyStoreState {
  currentTrack: Track | null;
  currentPlaylist: Track[] | null; // The list of tracks currently being played from
  isPlaying: boolean;
  progress: number; // Current playback progress in seconds
  volume: number; // 0-100
  shuffle: boolean;
  repeat: RepeatMode; // 'off', 'context', 'track'
  loading: boolean;
  error: string | null;

  allAvailableMediaFiles: MediaFileResponseDto[];
  isFetchingMedia: boolean;
  fetchMediaError: string | null;

  playlists: Playlist[];
  isFetchingPlaylists: boolean;
  fetchPlaylistError: string | null;
}

export const spotifyStore = map<SpotifyStoreState>({
  currentTrack: null,
  currentPlaylist: null,
  isPlaying: false,
  progress: 0,
  volume: 50,
  shuffle: false,
  repeat: 'off',
  loading: false,
  error: null,

  allAvailableMediaFiles: [],
  isFetchingMedia: false,
  fetchMediaError: null,

  playlists: [],
  isFetchingPlaylists: false,
  fetchPlaylistError: null,
});

// Actions
export const togglePlayPause = () => {
  spotifyStore.set({
    ...spotifyStore.get(),
    isPlaying: !spotifyStore.get().isPlaying,
  });
};

export const playTrack = (
  mediaFile: MediaFileResponseDto,
  playlistTracks: Track[],
) => {
  const track = mapMediaFileToTrack(mediaFile);
  spotifyStore.set({
    ...spotifyStore.get(),
    currentTrack: track,
    currentPlaylist: playlistTracks,
    isPlaying: true,
    progress: 0,
    loading: true,
    error: null,
  });
};

export const setPlaybackProgress = (progress: number) => {
  spotifyStore.setKey('progress', progress);
};

export const setVolume = (volume: number) => {
  spotifyStore.set({
    ...spotifyStore.get(),
    volume,
  });
};

export const toggleShuffle = () => {
  spotifyStore.setKey('shuffle', !spotifyStore.get().shuffle);
};

export const toggleRepeat = () => {
  const currentRepeat = spotifyStore.get().repeat;
  let newRepeat: RepeatMode = 'off';
  if (currentRepeat === 'off') {
    newRepeat = 'context';
  } else if (currentRepeat === 'context') {
    newRepeat = 'track';
  } else {
    newRepeat = 'off';
  }
  spotifyStore.setKey('repeat', newRepeat);
};

export const nextTrack = () => {
  const { currentTrack, currentPlaylist, repeat, shuffle } = spotifyStore.get();
  if (!currentTrack || !currentPlaylist || currentPlaylist.length === 0) return;

  if (repeat === 'track') {
    // If repeating current track, just restart it
    const currentMediaFile = spotifyStore
      .get()
      .allAvailableMediaFiles.find((f) => f.id === currentTrack.mediaFileId);
    if (currentMediaFile) {
      playTrack(currentMediaFile, currentPlaylist);
    }
    return;
  }

  let nextIndex;
  if (shuffle) {
    nextIndex = Math.floor(Math.random() * currentPlaylist.length);
  } else {
    const currentIndex = currentPlaylist.findIndex(
      (t) => t.id === currentTrack.id,
    );
    nextIndex = currentIndex + 1;
  }

  if (nextIndex < currentPlaylist.length) {
    const nextMediaFile = spotifyStore
      .get()
      .allAvailableMediaFiles.find(
        (f) => f.id === currentPlaylist[nextIndex].mediaFileId,
      );
    if (nextMediaFile) {
      playTrack(nextMediaFile, currentPlaylist);
    }
  } else if (repeat === 'context') {
    // Loop back to the beginning of the playlist if repeating context
    const firstMediaFile = spotifyStore
      .get()
      .allAvailableMediaFiles.find(
        (f) => f.id === currentPlaylist[0].mediaFileId,
      );
    if (firstMediaFile) {
      playTrack(firstMediaFile, currentPlaylist);
    }
  } else {
    // Stop playback if no more tracks and not repeating
    spotifyStore.set({
      ...spotifyStore.get(),
      isPlaying: false,
      currentTrack: null,
      progress: 0,
    });
  }
};

export const previousTrack = () => {
  const { currentTrack, currentPlaylist } = spotifyStore.get();
  if (!currentTrack || !currentPlaylist || currentPlaylist.length === 0) return;

  const currentIndex = currentPlaylist.findIndex(
    (t) => t.id === currentTrack.id,
  );
  const previousIndex = currentIndex - 1;

  if (previousIndex >= 0) {
    const prevMediaFile = spotifyStore
      .get()
      .allAvailableMediaFiles.find(
        (f) => f.id === currentPlaylist[previousIndex].mediaFileId,
      );
    if (prevMediaFile) {
      playTrack(prevMediaFile, currentPlaylist);
    }
  } else {
    // Optionally loop to the end or just stay at the beginning
    const lastMediaFile = spotifyStore
      .get()
      .allAvailableMediaFiles.find(
        (f) => f.id === currentPlaylist[currentPlaylist.length - 1].mediaFileId,
      );
    if (lastMediaFile) {
      playTrack(lastMediaFile, currentPlaylist);
    }
  }
};

export const setLoading = (status: boolean) => {
  spotifyStore.setKey('loading', status);
};

export const setError = (message: string | null) => {
  spotifyStore.setKey('error', message);
};

export const fetchAllMediaFiles = async (query?: {
  page?: number;
  pageSize?: number;
}) => {
  spotifyStore.setKey('isFetchingMedia', true);
  spotifyStore.setKey('fetchMediaError', null);
  try {
    const response = await fetchMediaFilesApi(query);

    let items: MediaFileResponseDto[] = [];
    if (Array.isArray(response)) {
      items = response; // Direct array from API (should not happen with paginated endpoint)
    } else if (Array.isArray(response?.items)) {
      items = response.items;
    }

    const mediaFilesWithSrc = items.map((file) => ({
      ...file,
      // The 'audioSrc' property is not part of MediaFileResponseDto from the API
      // It is a frontend-specific derived property for playback.
      // Ensure MediaFileResponseDto doesn't strictly expect 'audioSrc'
    }));

    spotifyStore.setKey('allAvailableMediaFiles', mediaFilesWithSrc);
  } catch (error: any) {
    spotifyStore.setKey(
      'fetchMediaError',
      error.message || 'Failed to fetch media files',
    );
  } finally {
    spotifyStore.setKey('isFetchingMedia', false);
  }
};

export const addExtractedMediaFile = (mediaFile: MediaFileResponseDto) => {
  const mediaFileWithSrc = {
    ...mediaFile,
    audioSrc: getFileStreamUrl(mediaFile.id), // Add audioSrc for local consumption
  };
  spotifyStore.set({
    ...spotifyStore.get(),
    allAvailableMediaFiles: [
      ...spotifyStore.get().allAvailableMediaFiles,
      mediaFileWithSrc,
    ],
  });
};

export const fetchUserPlaylists = async (
  query?: PaginationPlaylistQueryDto,
) => {
  spotifyStore.setKey('isFetchingPlaylists', true);
  spotifyStore.setKey('fetchPlaylistError', null);
  try {
    const response = await fetchPlaylistsApi(query);

    let items: PlaylistResponseDto[] = [];
    if (Array.isArray(response)) {
      items = response; // Direct array from API (should not happen with paginated endpoint)
    } else if (Array.isArray(response?.items)) {
      items = response.items;
    }

    const mappedPlaylists: Playlist[] = items.map((p) => {
      // Ensure p.tracks is an array before mapping
      const mappedTracks: Track[] = (p.tracks || [])
        .filter((playlistTrack) => playlistTrack.file) // Ensure file exists within playlistTrack
        .map((playlistTrack) => mapMediaFileToTrack(playlistTrack.file)); // Map the nested file to a frontend Track

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        isPublic: p.isPublic,
        cover:
          mappedTracks.length > 0
            ? mappedTracks[0].coverArt
            : '/default-playlist.png',
        tracks: mappedTracks,
        trackCount: p.trackCount,
      };
    });
    spotifyStore.setKey('playlists', mappedPlaylists);
  } catch (error: any) {
    spotifyStore.setKey(
      'fetchPlaylistError',
      error.message || 'Failed to fetch playlists',
    );
  } finally {
    spotifyStore.setKey('isFetchingPlaylists', false);
  }
};

/**
 * Creates a new playlist and optionally adds initial media files.
 * This function orchestrates calls to the API to handle the two-step process.
 */
export const createUserPlaylist = async (
  payload: PlaylistCreationRequest,
): Promise<PlaylistResponseDto> => {
  spotifyStore.setKey('isFetchingPlaylists', true);
  spotifyStore.setKey('fetchPlaylistError', null);
  try {
    const newPlaylistResponse = await createPlaylistApi(payload); // `createPlaylistApi` now handles mediaFileIds
    // After creation and adding media (if any), refetch to ensure store consistency
    await fetchUserPlaylists();
    return newPlaylistResponse;
  } catch (error: any) {
    spotifyStore.setKey(
      'fetchPlaylistError',
      error.message || 'Failed to create playlist',
    );
    throw error;
  } finally {
    spotifyStore.setKey('isFetchingPlaylists', false);
  }
};

// Removed the local `mapMediaFileToTrack` function declaration because it is imported from `utils/mediaUtils.ts`.
