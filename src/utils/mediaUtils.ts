import { MediaFileResponseDto, Track, FileType } from '@/types';
import { getFileStreamUrl } from '@/api/media';

/**
 * Maps a backend MediaFileResponseDto to a frontend Track interface.
 * This utility handles the conversion and generates the appropriate media source URL.
 */
export const mapMediaFileToTrack = (mediaFile: MediaFileResponseDto): Track => {
  const metadata = mediaFile.metadata?.data;
  return {
    id: mediaFile.id,
    mediaFileId: mediaFile.id,
    title: metadata?.title || mediaFile.name || 'Unknown Title',
    artist: metadata?.uploader || 'Unknown Artist',
    album: 'Unknown Album', // Assuming no album info from current metadata
    coverArt: metadata?.thumbnail || (mediaFile.fileType === FileType.VIDEO ? '/default-video-cover.png' : '/default-album-art.png'), // Dynamic default cover
    duration: metadata?.duration || 0,
    mediaSrc: getFileStreamUrl(mediaFile.path),
    fileType: mediaFile.fileType,
    mimeType: mediaFile.mimeType,
    size: mediaFile.size,
    provider: mediaFile?.provider || 'local',
    url: mediaFile?.url || '',
    createdAt: mediaFile.createdAt,
    updatedAt: mediaFile.updatedAt,
    createdById: mediaFile.createdById,
    folderId: mediaFile.folderId,
    content: mediaFile.content,
  };
};
