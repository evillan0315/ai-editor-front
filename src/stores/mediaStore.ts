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
} from '@/types';
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
export const volumeAtom = persistentAtom<number>('spotify:volume', 70); // Persistent
export const repeatModeAtom = persistentAtom<RepeatMode>(
  'media:repeatMode',
  'off',
); // Persistent
export const shuffleAtom = persistentAtom<boolean>('spotify:shuffle', false); // Persistent


