import { MediaFileResponseDto } from '@/types';
import { Track } from '@/stores/spotifyStore';
import { getFileStreamUrl } from '@/api/media';

/**
 * Maps a backend MediaFileResponseDto to a frontend Track interface.
 * This utility helps standardize the structure of playable tracks in the UI,
 * enriching them with derived properties like `audioSrc` and `coverArt`.
 * @param mediaFile The MediaFileResponseDto received from the backend.
 * @returns A Track object suitable for frontend playback.
 */
export const mapMediaFileToTrack = (mediaFile: MediaFileResponseDto): Track => {
  const metadata = mediaFile.metadata?.data as
    | {
        title?: string;
        duration?: number;
        uploader?: string;
        thumbnail?: string;
      }
    | undefined;

  const title = metadata?.title || mediaFile.name.replace(/\.[^/.]+$/, ''); // Remove extension
  const artist = metadata?.uploader || 'Unknown Artist';
  const album = metadata?.title || 'Unknown Album'; // Use title as album if album not available
  const coverArt = metadata?.thumbnail || '/default-album-art.png';
  const audioSrc = getFileStreamUrl(mediaFile.id);
  const duration = metadata?.duration || 0;

  return {
    id: mediaFile.id,
    title,
    artist,
    album,
    coverArt,
    audioSrc,
    duration,
    mediaFileId: mediaFile.id, // Keep a reference to the original media file ID
  };
};
