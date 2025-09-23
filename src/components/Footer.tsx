import React from 'react';
import { useStore } from '@nanostores/react';
import { isCurrentRecording } from '@/stores/recordingStore';
import { recordingApi } from '@/api/recording';
import { snackbarState, setSnackbarState } from '@/stores/snackbarStore';
import { currentRecordingIdStore } from '@/stores/recordingStore';
import { setIsRecording } from '@/stores/recordingStore';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import DynamicIcon from './DynamicIcon';

const Footer = () => {
  const theme = useTheme();
  const isRecording = useStore(isCurrentRecording);
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
      } else {
        notify('No recording in progress to stop.', 'warning');
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

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <IconButton
        color="inherit"
        aria-label="start recording"
        disabled={isRecording}
        onClick={handleStartRecording}
      >
        {/* <Videocam /> */}
        <DynamicIcon iconName="RecordIcon" />
      </IconButton>
      <IconButton
        color="inherit"
        aria-label="stop recording"
        disabled={!isRecording}
        onClick={handleStopRecording}
      >
        {/* <Stop /> */}
        <DynamicIcon iconName="StopIcon" />
      </IconButton>
      <IconButton
        color="inherit"
        aria-label="capture screenshot"
        onClick={handleCaptureScreenshot}
      >
        {/* <PhotoCamera /> */}
        <DynamicIcon iconName="ScreenshotIcon" />
      </IconButton>
    </Box>
  );
};

export default Footer;
