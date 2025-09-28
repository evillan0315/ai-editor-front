import React from 'react';
import { Dialog, DialogContent, Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VideoPlayer from '@/pages/spotify/VideoPlayer'; // Assuming this is how it imports the player

interface VideoModalProps {
  open: boolean;
  onClose: () => void;
  src: string;
  mediaElementRef?: React.MutableRefObject<HTMLVideoElement | HTMLImageElement | null>; // Make optional and accept HTMLImageElement
  autoplay: boolean;
  controls: boolean;
  muted: boolean;
  onPlayerReady?: (htmlMediaElement: HTMLVideoElement) => void; // Make optional as it's video-specific
  mediaType: 'video' | 'gif';
}

const VideoModal: React.FC<VideoModalProps> = ({
  open,
  onClose,
  src,
  mediaElementRef,
  autoplay,
  controls,
  muted,
  onPlayerReady,
  mediaType,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    onBackdropClick={() => {}} // Disable closing on outside click
    disableEscapeKeyDown={true} // Disable closing on Escape key press
    maxWidth="lg"
    fullWidth
    PaperProps={{
      sx: {
        bgcolor: 'transparent',
        boxShadow: 'none',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    }}
    sx={{
      '& .MuiDialog-container': {
        alignItems: 'center',
        justifyContent: 'center',
      },
      '& .MuiBackdrop-root': {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
      },
    }}
  >
    <DialogContent
      sx={{ p: 0, position: 'relative', width: '100%', height: '100%' }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {mediaType === 'video' ? (
          <VideoPlayer
            src={src}
            mediaElementRef={mediaElementRef as React.MutableRefObject<HTMLVideoElement | null>}
            autoplay={autoplay}
            controls={controls}
            loop={false}
            muted={muted}
            className="w-full h-full object-contain"
            onPlayerReady={onPlayerReady}
          />
        ) : (
          <img
            src={src}
            alt="Animated GIF"
            className="w-full h-full object-contain"
            ref={mediaElementRef as React.MutableRefObject<HTMLImageElement | null>}
            // GIFs autoplay by default, controls/muted are not applicable
          />
        )}

        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'white',
            bgcolor: 'rgba(0,0,0,0.5)',
            '&:hover': {
              bgcolor: 'rgba(0,0,0,0.7)',
            },
            zIndex: 100,
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
    </DialogContent>
  </Dialog>
);

export default VideoModal;
