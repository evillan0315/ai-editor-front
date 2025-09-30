import React from 'react';
import { Box } from '@mui/material';
import MediaPlayer from '@/components/ui/player/MediaPlayer';
import { FileType, MediaFileResponseDtoUrl } from '@/types';

interface MediaPlayerContainerProps {
  mediaElementRef: React.RefObject<HTMLMediaElement | null>;
  currentTrack: MediaFileResponseDtoUrl | null;
}

const MediaPlayerContainer: React.FC<MediaPlayerContainerProps> = ({
  mediaElementRef,
  currentTrack,
}) => {
  return (
    <Box className="flex sticky bottom-0 justify-center items-center">
      {currentTrack?.fileType === FileType.AUDIO ? (
        <audio
          ref={mediaElementRef}
          src={currentTrack?.streamUrl}
          style={{ display: 'none' }}
          preload="metadata"
        />
      ) : currentTrack?.fileType === FileType.VIDEO ? (
        <video
          ref={mediaElementRef}
          src={currentTrack?.streamUrl}
          style={{ display: 'none' }}
          preload="metadata"
        />
      ) : null}

      <MediaPlayer
        mediaType={currentTrack?.fileType || FileType.AUDIO}
        mediaElementRef={mediaElementRef}
      />
    </Box>
  );
};

export default MediaPlayerContainer;
