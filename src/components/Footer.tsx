import React, { useRef, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { isScreenRecordingStore } from '@/stores/recordingStore';
import { recordingApi } from '@/api/recording';
import { snackbarState, setSnackbarState } from '@/stores/snackbarStore';
import {
  currentRecordingIdStore,
  setIsScreenRecording,
} from '@/stores/recordingStore';
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
  setMediaElement, // New import
} from '@/stores/mediaStore';

const Footer = () => {
  const theme = useTheme();
  const isRecording = useStore(isScreenRecordingStore);
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
        setIsScreenRecording(true);
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
        setIsScreenRecording(false);
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

  // Effect to register the audio element with the store and manage source/loading
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Register the audio element with the store for global control
    setMediaElement(audio);

    if (currentTrack?.mediaUrl) {
      if (audio.src !== currentTrack.mediaUrl) {
        setLoading(true);
        audio.src = currentTrack.mediaUrl;
        audio.load(); // Load the new source
      }
    } else {
      audio.src = ''; // Clear source if no track
      setPlaying(false); // Explicitly stop if track is cleared
      setTrackDuration(0);
      setTrackProgress(0);
      setLoading(false);
    }

    // Cleanup: unregister the element
    return () => {
      setMediaElement(null);
    };
  }, [
    currentTrack,
    setMediaElement,
    setLoading,
    setPlaying,
    setTrackDuration,
    setTrackProgress,
  ]);

  // Removed the useEffect that previously handled play/pause based on isPlaying
  // This is now handled by the setPlaying action directly in mediaStore.ts

  // Event listeners for audio element to update nanostores (progress, duration, ended)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setTrackDuration(audio.duration);
      setLoading(false); // Finished loading metadata
      // IMPORTANT: Do NOT call audio.play() here. Playback is initiated by setPlaying from a user gesture.
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
  }, [loading, nextTrack, setTrackDuration, setTrackProgress]);

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
      <Box className="flex justify-center items-center">
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
    </Box>
  );
};

export default Footer;
