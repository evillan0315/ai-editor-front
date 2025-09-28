import React, { useRef, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { isCurrentRecording } from '@/stores/recordingStore';
import { recordingApi } from '@/api/recording';
import { snackbarState, setSnackbarState } from '@/stores/snackbarStore';
import { currentRecordingIdStore, setIsRecording } from '@/stores/recordingStore';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import DynamicIcon from './DynamicIcon';
import MiniMediaPlayerControls from '@/components/ui/player/MiniMediaPlayerControls';
import {
  currentTrackAtom,
  isPlayingAtom,
  setPlaying,
  setTrackDuration,
  setTrackProgress,
  nextTrack,
  setLoading,
  $mediaStore,
} from '@/stores/mediaStore';

const Footer = () => {
  const theme = useTheme();
  const isRecording = useStore(isCurrentRecording);
  const currentTrack = useStore(currentTrackAtom);
  const isPlaying = useStore(isPlayingAtom);
  const { loading } = useStore($mediaStore);
  const audioRef = useRef<HTMLAudioElement>(null);

  const notify = (
    message: string,
    severity: 'success' | 'info' | 'warning' | 'error',
  ) => {
    setSnackbarState({ open: true, message, severity });
  };

  const handleStartRecording = async () => {
    try {
      const recordingData = await recordingApi.startRecording();
      if (recordingData?.id) {
        currentRecordingIdStore.set(recordingData.id);
        setIsRecording(true);
        notify('Recording started successfully!', 'success');
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      notify(`Error starting recording: ${error}`, 'error');
    }
  };

  const handleStopRecording = async () => {
    try {
      if (currentRecordingIdStore.get()) {
        await recordingApi.stopRecording(currentRecordingIdStore.get());
        currentRecordingIdStore.set(null);
        setIsRecording(false);
        notify('Recording stopped successfully!', 'success');
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      notify(`Error stopping recording: ${error}`, 'error');
    }
  };

  const handleCaptureScreenshot = async () => {
    try {
      await recordingApi.capture();
      notify('Screenshot captured successfully!', 'success');
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      notify(`Error capturing screenshot: ${error}`, 'error');
    }
  };

  // Effect to manage audio element source and loading state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack?.mediaUrl) {
      if (audio.src !== currentTrack.mediaUrl) {
        setLoading(true);
        audio.src = currentTrack.mediaUrl;
        audio.load(); // Load the new source
      }
    } else {
      audio.src = ''; // Clear source if no track
      setPlaying(false);
      setTrackDuration(0);
      setTrackProgress(0);
      setLoading(false);
    }
  }, [currentTrack, setPlaying, setTrackDuration, setTrackProgress, setLoading]);

  // Effect to play/pause based on global isPlaying state, guarded by loading state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    // Only attempt to play if not currently loading AND isPlaying is true
    if (isPlaying && audio.paused && !loading) {
      audio.play().catch(e => {
        console.error('Autoplay failed:', e);
        // If autoplay fails (e.g., not initiated by user gesture), reflect actual state
        setPlaying(false);
      });
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [isPlaying, currentTrack, loading, setPlaying]); // Added 'loading' to dependencies

  // Event listeners for audio element to update nanostores
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setTrackDuration(audio.duration);
      setLoading(false); // Finished loading metadata
      if (isPlaying && audio.paused) {
        // This `play()` call might still fail due to autoplay policies if no user gesture has occurred.
        // The `catch` block correctly handles this by setting `isPlaying` to `false`.
        audio.play().catch(e => {
          console.error('Autoplay on metadata load failed:', e);
          setPlaying(false);
        });
      }
    };

    const handleTimeUpdate = () => {
      if (!audio.seeking && !loading) {
        setTrackProgress(audio.currentTime);
      }
    };

    const handleEnded = () => {
      nextTrack();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isPlaying, loading, nextTrack, setPlaying, setTrackDuration, setTrackProgress, setLoading]);

  return (
    <Box
      className="flex justify-between items-center w-full"
      sx={{
        bgcolor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
        minHeight: 40,
        zIndex: theme.zIndex.appBar + 1, // Ensure footer is above other content
      }}
    >
      {/* Left Section: Recording Controls */}
      <Box  className="flex justify-center items-center">
        <IconButton
          color="inherit"
          aria-label="start recording"
          disabled={isRecording}
          onClick={handleStartRecording}
        >
          <DynamicIcon iconName="RecordIcon" />
        </IconButton>
        <IconButton
          color="inherit"
          aria-label="stop recording"
          disabled={!isRecording}
          onClick={handleStopRecording}
        >
          <DynamicIcon iconName="StopIcon" />
        </IconButton>
        <IconButton
          color="inherit"
          aria-label="capture screenshot"
          onClick={handleCaptureScreenshot}
        >
          <DynamicIcon iconName="ScreenshotIcon" />
        </IconButton>
      </Box>

      <Box sx={{ minWidth: 100 }} />
      {/* Center Section: Mini Media Player Controls */}
      <Box className="flex justify-center items-center">
        <MiniMediaPlayerControls mediaElementRef={audioRef} />
      </Box>

      

      {/* Hidden Audio Element for Playback Control */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </Box>
  );
};

export default Footer;
