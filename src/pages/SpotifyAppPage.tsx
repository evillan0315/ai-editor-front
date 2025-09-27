import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, useTheme } from '@mui/material';
import SpotifySidebar from '@/pages/spotify/SpotifySidebar';
import SpotifyMainContent from '@/pages/spotify/SpotifyMainContent';
import SpotifyPlayerBar from '@/pages/spotify/SpotifyPlayerBar';
import VideoModal from '@/components/VideoModal';
import { useStore } from '@nanostores/react';
import {
  $spotifyStore,
  setPlaying,
  setTrackProgress,
  setTrackDuration,
  setVolume,
  setLoading,
  setError,
  nextTrack,
  isVideoModalOpenAtom,
  setIsVideoModalOpen,
  currentTrackAtom,
  isPlayingAtom,
  repeatModeAtom,
  progressAtom,
  durationAtom,
  volumeAtom,
  resetPlaybackState,
  bufferedAtom, // New: Import bufferedAtom
  setBuffered, // New: Import setBuffered
} from '@/stores/spotifyStore';
import { FileType, BufferedRange } from '@/types'; // New: Import BufferedRange

type SpotifyView = 'home' | 'search' | 'library' | 'settings';

const SpotifyAppPage: React.FC = () => {
  const theme = useTheme();
  const [currentView, setCurrentView] = useState<SpotifyView>('home');

  // Use individual atoms for frequently updated or persistent states
  const currentTrack = useStore(currentTrackAtom);
  const isPlaying = useStore(isPlayingAtom);
  const repeatMode = useStore(repeatModeAtom);
  const progress = useStore(progressAtom);
  const duration = useStore(durationAtom);
  const volume = useStore(volumeAtom);
  const isVideoModalOpen = useStore(isVideoModalOpenAtom);
  const buffered = useStore(bufferedAtom); // New: Get buffered ranges
  const { loading, error } = useStore($spotifyStore); // Keep general loading/error from map

  const mediaElementRef = useRef<HTMLMediaElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playerBarRef = useRef<HTMLDivElement | null>(null);

  // Callback for when the native HTML5 video element is ready (from VideoModal's VideoPlayer)
  const handleVideoPlayerReady = useCallback(
    (htmlMediaElement: HTMLVideoElement) => {
      mediaElementRef.current = htmlMediaElement;

      // If store says it should be playing, attempt to play
      if (isPlaying && htmlMediaElement) {
        htmlMediaElement.play().catch((e) => {
          console.error('HTML5 video playback failed on ready (modal):', e);
          setError('Video playback prevented. User interaction required.');
          setPlaying(false); // Update store
        });
      }
    },
    [isPlaying, setError, setPlaying],
  );

  // Callback to handle closing the video modal
  const handleVideoModalClose = useCallback(() => {
    const media = mediaElementRef.current;
    if (media) {
      media.pause(); // Pause video when modal closes
    }
    resetPlaybackState(); // New: Reset all playback related state
  }, [mediaElementRef]); // resetPlaybackState is now a global action, no need to include in dependency array.

  // Effect to manage which HTMLMediaElement is active (audio or video) and control modal visibility
  useEffect(() => {
    const audioMedia = audioRef.current;
    const videoMedia = mediaElementRef.current; // This ref will point to video element when modal is open

    if (currentTrack?.fileType === FileType.AUDIO) {
      mediaElementRef.current = audioMedia;
      if (videoMedia && isVideoModalOpenAtom.get()) {
        // If video was playing/modal open
        videoMedia.pause(); // Pause video if switching to audio
      }
      setIsVideoModalOpen(false); // Close video modal if switching to audio
    } else if (currentTrack?.fileType === FileType.VIDEO) {
      if (audioMedia && isPlayingAtom.get()) {
        // If audio was playing
        audioMedia.pause(); // Pause audio if switching to video
      }
      // For video, mediaElementRef.current will be set by handleVideoPlayerReady (from VideoModal)
      // We set it to null here temporarily, it will be populated by VideoPlayer in modal
      mediaElementRef.current = null;
      setIsVideoModalOpen(true); // Open video modal for video track
    } else {
      // No track selected or track removed
      if (audioMedia) audioMedia.pause();
      if (videoMedia && isVideoModalOpenAtom.get()) videoMedia.pause();
      mediaElementRef.current = null;
      setIsVideoModalOpen(false); // Close video modal if no track
      //resetPlaybackState(); // Reset all playback state if no track is active
    }
  }, [currentTrack?.fileType, setIsVideoModalOpen, audioRef, mediaElementRef]); // resetPlaybackState is now a global action, no need to include in dependency array.

  // Effect to handle setting media source and loading for the active media element
  useEffect(() => {
    const media = mediaElementRef.current;

    if (!media || !currentTrack?.mediaSrc) {
      // No track or source, ensure media is paused and cleared
      if (media) {
        media.pause();
        media.src = '';
      }
      setTrackProgress(0);
      setTrackDuration(0);
      setBuffered([]); // New: Clear buffered ranges
      setLoading(false);
      setPlaying(false); // Ensure store reflects paused state
      return;
    }

    // Only update src if it's different to prevent unnecessary reloads
    if (media.src !== currentTrack.mediaSrc) {
      setLoading(true);
      setPlaying(false); // Temporarily set playing to false while new media loads
      media.src = currentTrack.mediaSrc;
      media.load(); // Load new source
      setTrackProgress(0); // Reset progress for new track
      setBuffered([]); // New: Clear buffered ranges for new track
    }
    // Set initial duration if available and not already set, or if track changes
    if (currentTrack.duration) {
      setTrackDuration(currentTrack.duration);
    }
  }, [
    currentTrack,
    mediaElementRef.current,
    setTrackProgress,
    setTrackDuration,
    setLoading,
    setPlaying,
    setBuffered,
  ]); // Re-run when currentTrack or the active media element changes

  // Event handlers for the active media element, defined at the top level
  const handleTimeUpdate = useCallback(() => {
    const media = mediaElementRef.current;
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
  }, [
    currentTrack,
    progress,
    duration,
    mediaElementRef,
    setTrackProgress,
    setTrackDuration,
  ]);

  // New: Handle 'progress' event to update buffered ranges
  const handleProgress = useCallback(() => {
    const media = mediaElementRef.current;
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
  }, [mediaElementRef, buffered, setBuffered]);

  const handleVolumeChange = useCallback(() => {
    const media = mediaElementRef.current;
    if (media) {
      setVolume(Math.round(media.volume * 100));
    }
  }, [mediaElementRef, setVolume]);

  const handleEnded = useCallback(() => {
    const media = mediaElementRef.current;
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
  }, [repeatMode, setPlaying, nextTrack, mediaElementRef]);

  const handlePlaying = useCallback(() => {
    setLoading(false);
    setPlaying(true); // Media is actually playing
    setError(null);
  }, [setLoading, setPlaying, setError]);

  const handlePause = useCallback(() => {
    setPlaying(false); // Media is actually paused
  }, [setPlaying]);

  const handleWaiting = useCallback(() => {
    setLoading(true);
  }, [setLoading]);

  // Crucial for starting playback after media is ready
  const handleCanPlay = useCallback(() => {
    const media = mediaElementRef.current;
    // If the store intends to play, and media is ready, call play()
    // This is primarily for the audio element. Video playback is initiated in handleVideoPlayerReady.
    if (media && isPlaying && currentTrack?.fileType === FileType.AUDIO) {
      media.play().catch((e) => {
        console.error('Playback failed on canplay (audio):', e);
        setError('Audio playback prevented. User interaction required.');
        setPlaying(false); // Pause the store if autoplay failed
      });
    }
  }, [
    isPlaying,
    currentTrack?.fileType,
    mediaElementRef,
    setError,
    setPlaying,
  ]);

  const handleError = useCallback(
    (e: Event) => {
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
            errorMessage =
              'Media decoding error: The media file is corrupted or unsupported.';
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
    },
    [setError, setLoading, setPlaying],
  );

  // Effect to attach and detach event listeners for the active media element
  useEffect(() => {
    const media = mediaElementRef.current;
    if (!media) return;

    // Ensure volume is synced initially
    media.volume = volume / 100; // Use volume from the atom

    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('volumechange', handleVolumeChange);
    media.addEventListener('ended', handleEnded);
    media.addEventListener('playing', handlePlaying);
    media.addEventListener('pause', handlePause); // Listen for explicit pause
    media.addEventListener('waiting', handleWaiting);
    media.addEventListener('canplay', handleCanPlay); // This is key!
    media.addEventListener('error', handleError);
    media.addEventListener('progress', handleProgress); // New: Attach progress listener

    return () => {
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('volumechange', handleVolumeChange);
      media.removeEventListener('ended', handleEnded);
      media.removeEventListener('playing', handlePlaying);
      media.removeEventListener('pause', handlePause);
      media.removeEventListener('waiting', handleWaiting);
      media.removeEventListener('canplay', handleCanPlay);
      media.removeEventListener('error', handleError);
      media.removeEventListener('progress', handleProgress); // New: Detach progress listener
    };
  }, [
    mediaElementRef.current,
    handleTimeUpdate,
    handleVolumeChange,
    handleEnded,
    handlePlaying,
    handlePause,
    handleWaiting,
    handleCanPlay,
    handleError,
    handleProgress, // New: Add handleProgress to dependencies
    volume,
  ]); // Re-attach listeners if active media element or any callback changes

  // Control playback based on isPlaying state (from store)
  useEffect(() => {
    const media = mediaElementRef.current;

    if (!media || !currentTrack) return; // Ensure media element and track exist

    if (isPlaying) {
      // Only attempt to play if not already playing or paused
      if (media.paused) {
        media.play().catch((e) => {
          console.error('HTMLMediaElement.play() failed:', e);
          setError('Media playback prevented. User interaction required.');
          setPlaying(false);
        });
        setLoading(true); // Indicate loading while media prepares to play
      }
    } else {
      // Pause if not playing
      if (!media.paused) {
        media.pause();
      }
      setLoading(false);
    }
  }, [
    isPlaying,
    mediaElementRef.current,
    currentTrack,
    setLoading,
    setError,
    setPlaying,
  ]);

  // Set initial loading state when a new track is selected
  useEffect(() => {
    if (currentTrack) {
      setLoading(true); // Always set loading when a new track is selected
      setError(null); // Clear any previous errors
    } else {
      setLoading(false);
      setError(null);
    }
  }, [currentTrack, setLoading, setError]);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateAreas: `'sidebar main'
                          'player player'`,
        gridTemplateColumns: '250px 1fr',
        gridTemplateRows: '1fr auto',
        flexGrow: 1,
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <SpotifySidebar currentView={currentView} onSelectView={setCurrentView} />

      {/* Main Content, always visible, modal will overlay it */}
      <Box
        sx={{
          gridArea: 'main',
          bgcolor: theme.palette.background.default,
          overflowY: 'auto',
          p: 3,
        }}
      >
        <SpotifyMainContent currentView={currentView} />
      </Box>

      {/* Hidden audio element (always present) */}
      <audio ref={audioRef} style={{ display: 'none' }} preload="metadata" />

      {/* Video Modal - conditionally rendered */}
      {currentTrack?.fileType === FileType.VIDEO && currentTrack.mediaSrc && (
        <VideoModal
          open={isVideoModalOpen} // Now controlled by the store
          onClose={handleVideoModalClose}
          src={currentTrack.mediaSrc}
          mediaElementRef={mediaElementRef}
          autoplay={isPlaying} // Autoplay based on store's isPlaying
          controls={false}
          muted={false}
          onPlayerReady={handleVideoPlayerReady}
        />
      )}

      <SpotifyPlayerBar
        mediaRef={mediaElementRef}
        playerBarRef={playerBarRef}
      />
    </Box>
  );
};

// Define MediaError enum if it's not already defined
const MediaError = {
  MEDIA_ERR_ABORTED: 1,
  MEDIA_ERR_NETWORK: 2,
  MEDIA_ERR_DECODE: 3,
  MEDIA_ERR_SRC_NOT_SUPPORTED: 4,
};

export default SpotifyAppPage;
