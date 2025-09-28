import { MediaFileResponseDto, Track, FileType } from '@/types';
import { getFileStreamUrl } from '@/api/media';

/**
 * Maps a backend MediaFileResponseDto to a frontend Track interface.
 * This utility handles the conversion and generates the appropriate media source URL.
 */
export const mapMediaFileToTrack = (mediaFile: MediaFileResponseDto): Track => {
  console.log(mediaFile, 'mediaFile mapMediaFileToTrack');

  return {};
};
