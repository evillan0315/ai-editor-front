import React, { useRef, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import MediaPlayer from '@/components/ui/player/MediaPlayer';
import {
  $mediaStore,
  isPlayingAtom,
  currentTrackAtom,
  volumeAtom,
  repeatModeAtom,
  progressAtom,
  durationAtom,
  bufferedAtom,
  setMediaElement,
  setPlaying,
  setTrackProgress,
  setTrackDuration,
  setBuffered,
  setVolume,
  setError,
  setLoading,
  nextTrack,
  isVideoModalOpenAtom,
} from '@/stores/mediaStore';
import { useStore } from '@nanostores/react';
import { FileType, BufferedRange } from '@/types/refactored/media';

const MediaError = {
  MEDIA_ERR_ABORTED: 1,
  MEDIA_ERR_NETWORK: 2,
  MEDIA_ERR_DECODE: 3,
  MEDIA_ERR_SRC_NOT_SUPPORTED: 4,
};

const MediaPlayerContainer: React.FC = () => {
  const internalMediaElementRef = useRef<HTMLMediaElement | null>(null);

  // State from mediaStore
  const currentTrack = useStore(currentTrackAtom);
  const isPlaying = useStore(isPlayingAtom);
  const volume = useStore(volumeAtom);
  const repeatMode = useStore(repeatModeAtom);
  const progress = useStore(progressAtom);
  const duration = useStore(durationAtom);
  const buffered = useStore(bufferedAtom);
  const isVideoModalOpen = useStore(isVideoModalOpenAtom);
  const { loading, error } = useStore($mediaStore);
  // Event handlers for the active media element, defined at the top level
  const handleTimeUpdate = useCallback(() => {
    const media = $mediaStore.get().mediaElement; // Use the globally registered media element
    if (media && currentTrack) {
      const newProgress = Math.floor(media.currentTime);
      if (Math.abs(newProgress - progress) > 0) {
        setTrackProgress(newProgress);
      }
      // Update duration if it's not set or significantly different (e.g., for streams)
      if (
        media.duration &&
        !isNaN(media.duration) &&
        Math.abs(media.duration - duration) > 1
      ) {
        setTrackDuration(Math.floor(media.duration));
      }
    }
  }, [currentTrack, progress, duration]);

  // Handle 'progress' event to update buffered ranges
  const handleProgress = useCallback(() => {
    const media = $mediaStore.get().mediaElement; // Use the globally registered media element
    if (media && media.buffered.length > 0) {
      const newBufferedRanges: BufferedRange[] = [];
      for (let i = 0; i < media.buffered.length; i++) {
        newBufferedRanges.push({
          start: media.buffered.start(i),
          end: media.buffered.end(i),
        });
      }
      // Only update if the ranges have actually changed to avoid unnecessary re-renders
      if (JSON.stringify(newBufferedRanges) !== JSON.stringify(buffered)) {
        setBuffered(newBufferedRanges);
      }
    } else if (buffered.length > 0) {
      // If no buffered ranges, clear them
      setBuffered([]);
    }
  }, [buffered]);

  const handleVolumeChange = useCallback(() => {
    const media = $mediaStore.get().mediaElement; // Use the globally registered media element
    if (media) {
      setVolume(Math.round(media.volume * 100));
    }
  }, []);

  const handleEnded = useCallback(() => {
    const media = $mediaStore.get().mediaElement; // Use the globally registered media element
    if (media) {
      setPlaying(false); // Ensure UI reflects paused state
      if (repeatMode === 'track') {
        media.currentTime = 0;
        media.play(); // Restart current track
        setPlaying(true); // Update store
      } else {
        nextTrack(); // Go to next track in queue
      }
    }
  }, [repeatMode]);

  const handlePlaying = useCallback(() => {
    setLoading(false);
    // setPlaying(true); // This is now controlled by the useEffect below
    setError(null);
  }, []);

  const handlePause = useCallback(() => {
    // setPlaying(false); // This is now controlled by the useEffect below
  }, []);

  const handleWaiting = useCallback(() => {
    setLoading(true);
  }, []);

  // Crucial for starting playback after media is ready
  const handleCanPlay = useCallback(() => {
    const media = $mediaStore.get().mediaElement; // Use the globally registered media element
    // If the store intends to play, and media is ready, call play()
    if (media && isPlaying && currentTrack) {
      media.play().catch((e) => {
        console.error('Playback failed on canplay (MediaPlayerContainer):', e);
        setError('Audio playback prevented. User interaction required.');
        setPlaying(false); // Pause the store if autoplay failed
      });
    }
  }, [isPlaying, currentTrack]);

  const handleError = useCallback((e: Event) => {
    const mediaTarget = e.target as HTMLMediaElement;
    const mediaError = mediaTarget.error;
    let errorMessage = 'Failed to play media. Please try another file.';

    if (mediaError) {
      switch (mediaError.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Media playback aborted by user.';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error: Media file could not be downloaded.';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = (
            'Media decoding error: The media file is corrupted or unsupported.'
          );
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Media format not supported by your browser.';
          break;
        default:
          errorMessage = `Media playback error (${mediaError.code}): ${mediaError.message || 'Unknown error'}.`;
          break;
      }
    }
    console.error('Media playback error details:', e, mediaError);
    setError(errorMessage);
    setLoading(false);
    setPlaying(false); // Ensure store reflects paused state on error
  }, []);

  // Effect to manage the internal media element and register it with the global store
  useEffect(() => {
    const media = internalMediaElementRef.current;
    // Only manage this internal element if a track is present and it's an AUDIO file.
    // Video files are managed by VideoModal when it's open, which sets the global mediaElement.
    if (currentTrack?.fileType === FileType.AUDIO && media) {
      setMediaElement(media);
      // Ensure volume is synced initially
      media.volume = volume / 100;
    } else if (media && $mediaStore.get().mediaElement === media) {
      // If this internal element was previously registered but is no longer the active one (e.g., video modal opened),
      // or if currentTrack became null, clear it from the store.
      setMediaElement(null);
    }

    // Event listeners are attached/detached based on whether this component's element is deemed active.
    // This ensures listeners only apply to the currently controlled media element.
    if (media && currentTrack?.fileType === FileType.AUDIO) {
      media.addEventListener('timeupdate', handleTimeUpdate);
      media.addEventListener('volumechange', handleVolumeChange);
      media.addEventListener('ended', handleEnded);
      media.addEventListener('playing', handlePlaying);
      media.addEventListener('pause', handlePause);
      media.addEventListener('waiting', handleWaiting);
      media.addEventListener('canplay', handleCanPlay);
      media.addEventListener('error', handleError);
      media.addEventListener('progress', handleProgress);
    }

    return () => {
      if (media) {
        media.removeEventListener('timeupdate', handleTimeUpdate);
        media.removeEventListener('volumechange', handleVolumeChange);
        media.removeEventListener('ended', handleEnded);
        media.removeEventListener('playing', handlePlaying);
        media.removeEventListener('pause', handlePause);
        media.removeEventListener('waiting', handleWaiting);
        media.removeEventListener('canplay', handleCanPlay);
        media.removeEventListener('error', handleError);
        media.removeEventListener('progress', handleProgress);
      }
    };
  }, [currentTrack?.fileType, internalMediaElementRef.current, volume,
      handleTimeUpdate, handleVolumeChange, handleEnded, handlePlaying,
      handlePause, handleWaiting, handleCanPlay, handleError, handleProgress,
  ]);

  // Effect to control play/pause based on the global isPlayingAtom state.
  // This handles user-initiated play/pause toggles or initial state sync.
  useEffect(() => {
    const media = $mediaStore.get().mediaElement;
    if (!media || isVideoModalOpen) return; // Do not control if media element is not available or video modal is open

    if (isPlaying) {
      if (media.paused && currentTrack) { // Only attempt to play if currently paused and a track is loaded
        media.play().catch((e) => {
          console.error('Autoplay failed from isPlaying useEffect (MediaPlayerContainer):', e);
          setError('Audio playback prevented. User interaction required.');
          setPlaying(false); // Reflect actual playback state if autoplay is blocked
        });
      }
    } else {
      if (!media.paused) {
        media.pause();
      }
    }
  }, [isPlaying, $mediaStore.get().mediaElement, currentTrack, isVideoModalOpen]);

  return (
    <Box className="flex justify-center items-center"> { /* Fixed height for consistency, removed sticky for parent control */ }
      {/* Only render an audio element within this container. Video is handled by VideoModal. */}
      {currentTrack?.fileType === FileType.AUDIO && currentTrack?.streamUrl ? (
        <audio
          ref={internalMediaElementRef}
          src={currentTrack.streamUrl}
          style={{ display: 'none' }}
          preload="metadata"
        />
      ) : null}

      <MediaPlayer
        mediaType={currentTrack?.fileType || FileType.AUDIO}
        mediaElementRef={internalMediaElementRef} // Still pass this, but MediaPlayer uses $mediaStore.get().mediaElement
      />
    </Box>
  );
};

export default MediaPlayerContainer;
