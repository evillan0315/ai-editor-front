import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { isScreenRecordingStore } from '@/stores/recordingStore';
import { recordingApi } from '@/api/recording';
import { setSnackbarState } from '@/stores/snackbarStore';
import {
  currentRecordingIdStore,
  setIsScreenRecording,
} from '@/stores/recordingStore';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import DynamicIcon from './DynamicIcon';
import CustomDrawer from '@/components/Drawer/CustomDrawer';
import OutputLogger from '@/components/OutputLogger';
import MediaPlayerContainer from '@/components/media/MediaPlayerContainer'; // Import MediaPlayerContainer

const Footer = () => {
  const theme = useTheme();
  const isRecording = useStore(isScreenRecordingStore);
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);

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

  const handleOpenLogDrawer = () => {
    setLogDrawerOpen(true);
  };

  const handleCloseLogDrawer = () => {
    setLogDrawerOpen(false);
  };

  // Removed the useEffect that previously handled audioRef and media store updates
  // This is now managed entirely by MediaPlayerContainer.

  return (
    <> {/* Using a fragment here to wrap both elements for consistent rendering inside Layout's Paper */}
      {/* Top Section: Recording Controls & Output Logger Button */}
      <Box
        className="flex justify-between items-center w-full"
        sx={{
          bgcolor: theme.palette.background.paper,
          borderTop: `1px solid ${theme.palette.divider}`,
          minHeight: 40,
          zIndex: theme.zIndex.appBar + 1,
        }}
      >
        {/* Left Section: Recording Controls */}
        <Box className="flex justify-center items-center w-1/4">
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
        <Box className="flex justify-center items-center w-1/2 max-w-[600px]">
        <MediaPlayerContainer />
          </Box>


        {/* Right Section: Output Logger Button */}
        <Box className="flex justify-center items-end  w-1/4">
          <IconButton
            color="inherit"
            aria-label="open output logger"
            onClick={handleOpenLogDrawer}
          >
            <DynamicIcon iconName="CarbonTerminal" />
          </IconButton>
        </Box>
      </Box>

      

      {/* Output Logger Drawer (remains unchanged) */}
      <CustomDrawer
        open={logDrawerOpen}
        onClose={handleCloseLogDrawer}
        position="bottom"
        size="medium"
        title="Output Logger"
      >
        <OutputLogger />
      </CustomDrawer>
    </>
  );
};

export default Footer;
