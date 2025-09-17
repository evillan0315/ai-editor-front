import React, { useState, useEffect, useRef } from 'react';
import { Container, Typography, Box, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction, Menu, MenuItem } from '@mui/material';
import { PlayArrow, Stop, Videocam, PhotoCamera, MoreVert } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
// import { fetchMediaFiles } from '@/api/media';
import { deleteMediaFile } from '@/api/media';
import {PaginationMediaQueryDto, MediaFileResponseDto} from '@/types'
import { scanMediaDirectory } from '@/api/media';
import {recordingApi} from '@/api/recording'

import {mediaApi, getFileStreamUrl} from '@/api/media'
import { Snackbar } from '@mui/material';
import { Alert } from '@mui/material';
import { PaginationRecordingQueryDto, RecordingResultDto, TranscodeToGifDto } from '@/types/recording';
import VideoModal from '@/components/VideoModal';
import path from 'path-browserify';


interface RecordingItemProps {
  recording: RecordingResultDto;
  onConvertToGif: (recording: RecordingResultDto) => void;
  onDelete: (recording: RecordingResultDto) => void;
  onPlay: (recording: RecordingResultDto) => void;
}

const RecordingItem: React.FC<RecordingItemProps> = ({ recording, onDelete, onConvertToGif, onPlay }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <ListItem button key={recording.id}>
      <ListItemText primary={recording.path} secondary={`Created: ${new Date(recording.createdAt).toLocaleString()}`} />
      <ListItemSecondaryAction>
           <IconButton edge="end" aria-label="play" onClick={() => onPlay(recording)}>
              <PlayArrow />
            </IconButton>
        <IconButton aria-label="settings" onClick={handleClick}>
          <MoreVert />
        </IconButton>
        <Menu
          id="recording-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': 'basic-button',
          }}
        >
          <MenuItem onClick={() => {onConvertToGif(recording); handleClose();}}>Convert to GIF</MenuItem>
          <MenuItem onClick={() => {onDelete(recording); handleClose();}}>Delete</MenuItem>
        </Menu>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

const RecordingPage: React.FC = () => {
  const [recordings, setRecordings] = useState<RecordingResultDto[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const navigate = useNavigate();
    const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideoSrc, setSelectedVideoSrc] = useState<string | null>(null);
   const videoRef = useRef<HTMLVideoElement | null>(null);

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };



  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      // const mediaFiles = await fetchMediaFiles();
      // setRecordings(mediaFiles.items);
      const recordingFiles = await recordingApi.getRecordings();
      setRecordings(recordingFiles.items);
    } catch (error) {
      console.error("Error loading recordings:", error);
      showSnackbar(`Error loading recordings: ${error}`, 'error');
    }
  };

  const handleStartRecording = async () => {
    try {
      const recordingData = await recordingApi.startRecording();
      
      setIsRecording(true);
      showSnackbar('Recording started successfully!', 'success');
    } catch (error) {
      console.error('Error starting recording:', error);
      showSnackbar(`Error starting recording: ${error}`, 'error');
    }
  };

  const handleStopRecording = async () => {
    try {
      //Todo get the id from the store instead of hardcoding
      // const recordingData = await recordingApi.stopRecording('666fa59a-9c33-477f-9f70-e5b55966401d');

       const getStatus = await recordingApi.recordingStatus();
       const recordingData = await recordingApi.stopRecording(getStatus.id);
      setIsRecording(false);
      showSnackbar('Recording stopped successfully!', 'success');
      loadRecordings(); // Reload recordings after stopping
    } catch (error) {
      console.error('Error stopping recording:', error);
      showSnackbar(`Error stopping recording: ${error}`, 'error');
    }
  };

  const handleCaptureScreenshot = async () => {
    try {
      await recordingApi.capture();
      showSnackbar('Screenshot captured successfully!', 'success');
      loadRecordings(); // Reload recordings after capturing screenshot
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      showSnackbar(`Error capturing screenshot: ${error}`, 'error');
    }
  };

  const handleConvertToGif = async (recording: RecordingResultDto) => {
    try {
      console.log(recording)
      const transcodeDto: TranscodeToGifDto = {
        inputFilename: path.basename(recording.path),
        fps: 15,  // You can adjust these values
        width: 720,
        loop: 0
      };
      await recordingApi.convertToGif(transcodeDto);
      showSnackbar(`Converted ${transcodeDto.inputFilename} to GIF...`, 'success');
      loadRecordings(); // Reload recordings after converting
      // showSnackbar(`Converting to GIF is not fully implemented.`, 'success');
    } catch (error) {
      console.error('Error converting to GIF:', error);
      showSnackbar(`Error converting ${recording.path} to GIF: ${error}`, 'error');
    }
  };

  const handleDeleteRecording = async (recording: RecordingResultDto) => {
    try {
          await deleteMediaFile(recording.id);
          showSnackbar('Recording deleted successfully!', 'success');
          loadRecordings();
        } catch (error) {
          console.error('Error deleting recording:', error);
          showSnackbar(`Error deleting recording: ${error}`, 'error');
        }
  };
   const handlePlayRecording = (recording: RecordingResultDto) => {
    const videoUrl = getFileStreamUrl(recording.path);
    setSelectedVideoSrc(videoUrl);
    setVideoModalOpen(true);
  };

  const handleCloseVideoModal = () => {
    setVideoModalOpen(false);
    setSelectedVideoSrc(null);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Screen Recordings
        </Typography>
        <Box sx={{ mb: 2 }}>
          <IconButton color="primary" aria-label="start recording" disabled={isRecording} onClick={handleStartRecording}>
            <Videocam />
          </IconButton>
          <IconButton color="secondary" aria-label="stop recording" disabled={!isRecording} onClick={handleStopRecording}>
            <Stop />
          </IconButton>
          <IconButton color="info" aria-label="capture screenshot" onClick={handleCaptureScreenshot}>
            <PhotoCamera />
          </IconButton>
        </Box>
        <List sx={{ width: '100%' }}>
          {recordings.map((recording) => (
            <RecordingItem
              key={recording.id}
              recording={recording}
              onConvertToGif={handleConvertToGif}
              onDelete={handleDeleteRecording}
                onPlay={handlePlayRecording}
            />
          ))}
        </List>
      </Box>
        <VideoModal
          open={videoModalOpen}
          onClose={handleCloseVideoModal}
          src={selectedVideoSrc || ''}
          mediaElementRef={videoRef}
          autoplay={true}
          controls={true}
          muted={false}
          onPlayerReady={() => {}}
        />
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RecordingPage;
