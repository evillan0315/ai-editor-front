import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, useTheme } from '@mui/material';
import SpotifySidebar from '@/pages/spotify/SpotifySidebar';
import SpotifyMainContent from '@/pages/spotify/SpotifyMainContent';
import SpotifyPlayerBar from '@/pages/spotify/SpotifyPlayerBar';
import VideoPlayer from '@/pages/spotify/VideoPlayer'; // New import
import { useStore } from '@nanostores/react';
import { $spotifyStore, togglePlayPause, setPlaybackProgress, setVolume, setLoading, setError, nextTrack } from '@/stores/spotifyStore';
import { FileType } from '@/types/refactored/spotify';

type SpotifyView = 'home' | 'search' | 'library' | 'settings';

const SpotifyAppPage: React.FC = () => {
  const theme = useTheme();
  const [currentView, setCurrentView] = useState<SpotifyView>('home');
  const { currentTrack, isPlaying, repeatMode } = useStore($spotifyStore);

  const mediaElementRef = useRef<HTMLMediaElement | null>(null); // Unified ref for the active media element
  const audioRef = useRef<HTMLAudioElement | null>(null); // Ref for the hidden audio element
  const playerBarRef = useRef<HTMLDivElement | null>(null); // Corrected to allow null
  const [videoPlayerHeight, setVideoPlayerHeight] = useState('0px');
  const [isMainContentVisible, setIsMainContentVisible] = useState(true);

  const calculateAndSetVideoPlayerHeight = useCallback(() => {
    if (playerBarRef.current) {
      const playerBarHeight = playerBarRef.current.offsetHeight;
      const screenHeight = window.innerHeight;
      // Subtract the player bar height from the total screen height
      const calculatedHeight = screenHeight - playerBarHeight;
      setVideoPlayerHeight(`${calculatedHeight}px`);
    }
  }, []);

  useEffect(() => {
    calculateAndSetVideoPlayerHeight();
    window.addEventListener('resize', calculateAndSetVideoPlayerHeight);
    return () => {
      window.removeEventListener('resize', calculateAndSetVideoPlayerHeight);
    };
  }, [calculateAndSetVideoPlayerHeight]);

  // Effect to manage which HTMLMediaElement is active (audio or video)
  useEffect(() => {
    if (currentTrack?.fileType === FileType.AUDIO) {
      mediaElementRef.current = audioRef.current;
      setIsMainContentVisible(true); // Always show main content for audio
    } else if (currentTrack?.fileType === FileType.VIDEO) {
      // The VideoPlayer component will update mediaElementRef.current directly
      // when its internal video element is ready.
      // We set it to null here temporarily, it will be populated by VideoPlayer
      mediaElementRef.current = null;
      setIsMainContentVisible(false); // Hide main content if video is playing
    } else {
      mediaElementRef.current = null;
      setIsMainContentVisible(true);
    }
    // If mediaElementRef.current changes, its event listeners will be re-attached by the next effect.
  }, [currentTrack?.fileType]);

  // Event listeners for the active media element
  useEffect(() => {
    const media = mediaElementRef.current;
    if (!media || !currentTrack) return;

    // Ensure volume is synced initially
    media.volume = $spotifyStore.get().volume / 100;

    const handleTimeUpdate = () => {
      if (media && currentTrack) {
        const newProgress = Math.floor(media.currentTime);
        if (Math.abs(newProgress - $spotifyStore.get().progress) > 0) {
          setPlaybackProgress(newProgress);
        }
      }
    };

    const handleVolumeChange = () => {
      if (media) {
        setVolume(Math.round(media.volume * 100));
      }
    };

    const handleEnded = () => {
      if (repeatMode === 'track') {
        media.currentTime = 0;
        media.play();
      } else {
        nextTrack();
      }
    };

    const handlePlaying = () => {
      setLoading(false);
      setError(null);
    };

    const handleWaiting = () => {
      setLoading(true);
    };

    const handleError = (e: Event) => {
      const mediaTarget = e.target as HTMLMediaElement;
      const mediaError = mediaTarget.error;
      let errorMessage = 'Failed to play media. Please try another file.';

      if (mediaError) {
        switch (mediaError.code) {
          case MediaError.MEDIA_ERR_ABORTED: errorMessage = 'Media playback aborted by user.'; break;
          case MediaError.MEDIA_ERR_NETWORK: errorMessage = 'Network error: Media file could not be downloaded.'; break;
          case MediaError.MEDIA_ERR_DECODE: errorMessage = 'Media decoding error: The media file is corrupted or unsupported.'; break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: errorMessage = 'Media format not supported by your browser.'; break;
          default: errorMessage = `Media playback error (${mediaError.code}): ${mediaError.message || 'Unknown error'}.`; break;
        }
      }
      console.error('Media playback error details:', e, mediaError);
      setError(errorMessage);
      setLoading(false);
    };

    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('volumechange', handleVolumeChange);
    media.addEventListener('ended', handleEnded);
    media.addEventListener('playing', handlePlaying);
    media.addEventListener('waiting', handleWaiting);
    media.addEventListener('error', handleError);

    return () => {
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('volumechange', handleVolumeChange);
      media.removeEventListener('ended', handleEnded);
      media.removeEventListener('playing', handlePlaying);
      media.removeEventListener('waiting', handleWaiting);
      media.removeEventListener('error', handleError);
    };
  }, [mediaElementRef.current, currentTrack, repeatMode]); // Re-attach listeners if media element or track changes

  // Control playback based on isPlaying state
  useEffect(() => {
    const media = mediaElementRef.current;
    if (media) {
      if (isPlaying) {
        media.play().catch((e) => {
          console.error('Playback failed:', e);
          setError('Playback prevented. User interaction required.');
          togglePlayPause(); // Pause the store if autoplay failed
        });
      } else {
        media.pause();
      }
    }
  }, [isPlaying, mediaElementRef.current]);

  // Update media element source when currentTrack changes
  useEffect(() => {
    const media = mediaElementRef.current;
    if (media && currentTrack?.mediaSrc) {
      if (media.src !== currentTrack.mediaSrc) {
        setLoading(true);
        media.src = currentTrack.mediaSrc;
        media.load(); // Load new source
        // media.play() will be called by the isPlaying effect if isPlaying is true
      } else if (isPlaying) {
        // If same track and already playing, ensure it keeps playing (e.g., after seeking)
        media.play().catch((e) => {
          console.error('Existing track playback failed:', e);
          setError('Playback prevented. User interaction required.');
          togglePlayPause(); // Pause the store if autoplay failed
        });
      }
    } else if (media && !currentTrack) {
      media.pause();
      media.src = '';
      setPlaybackProgress(0);
      setLoading(false);
    }
  }, [currentTrack, mediaElementRef.current, isPlaying]);


  const videoJsOptions = {
    autoplay: false, // Controlled by isPlaying state
    controls: false, // We use custom controls in SpotifyPlayerBar
    responsive: true,
    fluid: true,
    sources: currentTrack?.fileType === FileType.VIDEO && currentTrack.mediaSrc ? [{
      src: currentTrack.mediaSrc,
      type: currentTrack.mimeType || 'video/mp4' // Use actual mimeType if available
    }] : []
  };

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
        position: 'relative', // Needed for absolute positioning of video
      }}
    >
      <SpotifySidebar currentView={currentView} onSelectView={setCurrentView} />

      {currentTrack?.fileType === FileType.VIDEO && currentTrack.mediaSrc && (
  <Box
    sx={{
      gridArea: "main",
      position: "absolute",
      top: 0,
      left: 250,
      width: `calc(100% - 250px)`,
      height: videoPlayerHeight,
      bgcolor: "black",
      zIndex: 10,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <VideoPlayer
      src={currentTrack.mediaSrc}
      mediaElementRef={mediaElementRef}
      options={videoJsOptions}
    />
  </Box>
)}

      {/* Main Content, hidden if video is playing in overlay */}
      <Box
        sx={{
          gridArea: 'main',
          display: isMainContentVisible ? 'block' : 'none', // Hide if video overlay is active
          bgcolor: theme.palette.background.default,
          overflowY: 'auto',
          p: 3,
        }}
      >
        <SpotifyMainContent currentView={currentView} />
      </Box>

      {/* Hidden audio element (always present) */}
      <audio ref={audioRef} style={{ display: 'none' }} preload="metadata" />

      <SpotifyPlayerBar mediaRef={mediaElementRef} playerBarRef={playerBarRef} />
    </Box>
  );
};

export default SpotifyAppPage;
