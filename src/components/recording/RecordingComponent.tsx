import React, { useState, useEffect, useCallback, useRef } from 'react';
import { editRecordingStore } from '@/stores/recordingStore';
import {
  Snackbar,
  IconButton,
  Box,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button as MuiButton, // Alias to avoid conflict with custom Button component
  Typography,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  LinearProgress,
  TextField,
} from '@mui/material';
import Button from '@/components/ui/Button';
import Loading from '@/components/Loading';
import VideoModal from '@/components/VideoModal'; // Assuming this is how it imports the player
import {
  Close,
  CameraOutlined,
  Mic,
  PlayArrow,
  Stop,
  Videocam,
  PhotoCamera,
  MoreVert,
  Download,
  Delete,
  Gif,
  ScreenShare,
  Edit,
} from '@mui/icons-material';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import { recordingApi } from '@/api/recording';
import {
  PaginationRecordingQueryDto,
  RecordingResultDto,
  TranscodeToGifDto, // Import TranscodeToGifDto
  TranscodeToGifResult,
  UpdateRecordingDto,
} from '@/types';
import { useNavigate } from 'react-router-dom';
import path from 'path-browserify';
import { deleteMediaFile, getFileStreamUrl } from '@/api/media'; // Import media functions
import { currentRecordingIdStore } from '@/stores/recordingStore';

interface RecordingComponentProps {
  initialPage?: number;
  initialLimit?: number;
}

const RecordingComponent: React.FC<RecordingComponentProps> = ({
  initialPage = 1,
  initialLimit = 5,
}) => {
  const [recordings, setRecordings] = useState<RecordingResultDto[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>(
    'success',
  );
  const navigate = useNavigate();
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideoSrc, setSelectedVideoSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [currentRecordingPath, setCurrentRecordingPath] = useState<
    string | null
  >(null);
  const [currentRecordingStartedAt, setCurrentRecordingStartedAt] = useState<
    string | null
  >(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [selectedMedia, setSelectedMedia] = useState<RecordingResultDto | null>(
    null,
  );
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  const $currentRecordingId = useStore(currentRecordingIdStore);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<RecordingResultDto | null>(null);
  const [editedRecordingData, setEditedRecordingData] = useState<UpdateRecordingDto>({
    data: {},
  });

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' = 'success',
  ) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (
    event: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };
  useEffect(() => {
    if ($currentRecordingId) {
      setIsRecording(true);
    }
  }, [$currentRecordingId]);
  useEffect(() => {
    loadRecordings();
  }, [currentPage, limit]);

  const loadRecordingStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const status = await recordingApi.recordingStatus();
      setIsRecording(status.isRecording);
      setCurrentRecordingPath(status.path || null);
      setCurrentRecordingStartedAt(status.startedAt || null);
    } catch (error) {
      console.error('Error loading recording status:', error);
      showSnackbar(`Error loading recording status: ${error}`, 'error');
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const loadRecordings = async () => {
    setIsLoadingRecordings(true);
    try {
      const recordingFiles = await recordingApi.getRecordings({
        page: currentPage,
        limit: limit,
      });
      setRecordings(recordingFiles.items);
      setTotalPages(recordingFiles.totalPages || 1);
    } catch (error) {
      console.error('Error loading recordings:', error);
      showSnackbar(`Error loading recordings: ${error}`, 'error');
    } finally {
      setIsLoadingRecordings(false);
    }
  };

  const handleStartRecording = async () => {
    setIsLoadingStatus(true);
    try {
      const recordingData = await recordingApi.startRecording();
      console.log(recordingData, 'recordingData');
      currentRecordingIdStore.set(recordingData.id);
      setIsRecording(true);
      showSnackbar('Recording started successfully!', 'success');
      //loadRecordingStatus();
    } catch (error) {
      console.error('Error starting recording:', error);
      showSnackbar(`Error starting recording: ${error}`, 'error');
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleStopRecording = async (recording?: RecordingResultDto) => {
    setIsLoadingStatus(true);
    try {
      if (recording && recording.id) {
        const recordingData =
          await recordingApi.stopRecording(recording.id);
        if (recordingData) {
          showSnackbar('Recording stopped successfully!', 'success');
          if ($currentRecordingId) currentRecordingIdStore.set(null);
          await loadRecordings(); // Reload recordings after stopping
          await loadRecordingStatus();
        }
      } else if ($currentRecordingId) {
        const recordingData =
          await recordingApi.stopRecording($currentRecordingId);
        if (recordingData) {
          setIsRecording(false);
          showSnackbar('Recording stopped successfully!', 'success');
          currentRecordingIdStore.set(null);
          await loadRecordings(); // Reload recordings after stopping
          await loadRecordingStatus();
        }
      } else {
        showSnackbar('No recording in progress to stop.', 'warning');
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      showSnackbar(`Error stopping recording: ${error}`, 'error');
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleCaptureScreenshot = async () => {
    setIsCapturing(true);
    try {
      await recordingApi.capture();
      showSnackbar('Screenshot captured successfully!', 'success');
      loadRecordings();
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      showSnackbar(`Error capturing screenshot: ${error}`, 'error');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleConvertToGif = async (recording: RecordingResultDto) => {
    setIsLoadingStatus(true);
    try {
      console.log(recording);
      const transcodeDto: TranscodeToGifDto = {
        inputFilename: path.basename(recording.path),
        fps: 15, // You can adjust these values
        width: 720,
        loop: 0,
      };

      const convertToGif = await recordingApi.convertToGif(transcodeDto);

      showSnackbar(
        `Converted ${transcodeDto.inputFilename} to GIF...`,
        'success',
      );

      // Update recording data with animatedGif path
      const updatedRecordingData = {
        ...recording.data,
        animatedGif: convertToGif.fullPath,
      };

      await recordingApi.updateRecording(recording.id, {
        data: updatedRecordingData,
      });

      loadRecordings(); // Reload recordings after converting
    } catch (error) {
      console.error('Error converting to GIF:', error);
      showSnackbar(
        `Error converting ${recording.path} to GIF: ${error}`,
        'error',
      );
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleDeleteRecording = async (recording: RecordingResultDto) => {
    setIsLoadingStatus(true);
    try {
      await recordingApi.deleteRecording(recording.id);
      showSnackbar('Recording deleted successfully!', 'success');
      loadRecordings();
    } catch (error) {
      console.error('Error deleting recording:', error);
      showSnackbar(`Error deleting recording: ${error}`, 'error');
    } finally {
      setIsLoadingStatus(false);
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

  const getMediaUrl = (filePath: string) => {
    const videoUrl = getFileStreamUrl(filePath);
    return videoUrl; // temp fix
  };

  const formatBytes = (bytes: number, decimals: number = 2) => {
    if (!+bytes) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleOpenMedia = (recording: RecordingResultDto) => {
    setSelectedMedia(recording);
    setIsMediaModalOpen(true);
  };

  const handleCloseMediaModal = () => {
    setIsMediaModalOpen(false);
    setSelectedMedia(null);
  };

  const handleDownloadFile = async (filePath: string, fileName: string) => {
    setIsLoadingStatus(true);
    try {
      const response = await fetch(getFileStreamUrl(filePath));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showSnackbar('Download started successfully!', 'success');
    } catch (error) {
      console.error('Error downloading file:', error);
      showSnackbar(`Error downloading file: ${error}`, 'error');
    } finally {
      setIsLoadingStatus(false);
    }
  };
  const handleEditRecording = (recording: RecordingResultDto) => {
    setSelectedRecording(recording);
    setEditedRecordingData({
      data: recording.data,
    });
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedRecording(null);
    setEditedRecordingData({
      data: {},
    });
  };

  const handleUpdateRecording = async () => {
    setIsLoadingStatus(true);
    try {
      if (selectedRecording) {
        await recordingApi.updateRecording(selectedRecording.id, editedRecordingData);
        showSnackbar('Recording updated successfully!', 'success');
        loadRecordings();
      }
    } catch (error) {
      console.error('Error updating recording:', error);
      showSnackbar(`Error updating recording: ${error}`, 'error');
    } finally {
      setIsLoadingStatus(false);
      handleCloseEditDialog();
    }
  };

  const handleDataChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setEditedRecordingData((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        [name]: value,
      },
    }));
  };

  return (
    <>
      {isLoadingStatus && (
        <LinearProgress
          sx={{ width: '100%', flexShrink: 0, zIndex: 1200 }}
        />
      )}

      <Box className="p-4 bg-dark min-h-screen">
        <Typography
          variant="h5"
          component="h1"
          className="text-2xl font-bold mb-6"
        >
          Screen Recording & Capture
        </Typography>

        <Box className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Recording Controls */}
          <Paper
            elevation={3}
            className="bg-secondary p-4 rounded-lg shadow-md border"
          >
            <Typography variant="h6" className="text-xl font-semibold mb-4">
              Controls
            </Typography>
            <Box className="flex items-center gap-4">
              <Box>
                <IconButton
                  color="primary"
                  aria-label="start recording"
                  disabled={isRecording}
                  onClick={handleStartRecording}
                >
                  <Videocam />
                </IconButton>
                <IconButton
                  color="secondary"
                  aria-label="stop recording"
                  disabled={!isRecording}
                  onClick={handleStopRecording}
                >
                  <Stop />
                </IconButton>
                <IconButton
                  color="info"
                  aria-label="capture screenshot"
                  disabled={isCapturing}
                  onClick={handleCaptureScreenshot}
                >
                  {isCapturing ? (
                    <CircularProgress size="small" />
                  ) : (
                    <PhotoCamera />
                  )}
                </IconButton>
              </Box>
            </Box>
          </Paper>

          {/* Current Status */}
          <Paper
            elevation={3}
            className="bg-secondary p-4 rounded-lg shadow-md border"
          >
            <Typography variant="h6" className="text-xl font-semibold mb-4">
              Current Status
            </Typography>
            {isLoadingStatus ? (
              <CircularProgress />
            ) : (
              <div>
                <Typography variant="body1" className="text-lg">
                  Status:{' '}
                  <span
                    className={`font-semibold ${
                      isRecording ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {isRecording ? 'RECORDING' : 'Idle'}
                  </span>
                </Typography>
                {currentRecordingPath && (
                  <Typography variant="body2" className="text-sm mt-2">
                    File:{' '}
                    <span className="font-mono text-gray-300 break-all">
                      {currentRecordingPath.split('/').pop()}
                    </span>
                  </Typography>
                )}
                {currentRecordingStartedAt && (
                  <Typography variant="body2" className="text-sm">
                    Started At:{' '}
                    {new Date(currentRecordingStartedAt).toLocaleString()}
                  </Typography>
                )}
                {!isRecording && (
                  <Typography
                    variant="body2"
                    className="text-sm italic text-gray-400 mt-2"
                  >
                    No active recording. Click 'Start Recording' to begin.
                  </Typography>
                )}
              </div>
            )}
          </Paper>
        </Box>

        {/* Recordings List */}
        <Typography variant="h6" className="text-lg my-3">
          Saved Recordings & Screenshots
        </Typography>
        <Paper elevation={3} className="bg-dark rounded-lg shadow-md border">
          {isLoadingRecordings ? (
            <LinearProgress
              sx={{ width: '100%', flexShrink: 0, zIndex: 1200 }}
            />
          ) : recordings.length === 0 ? (
            <Typography variant="body1" className="text-gray-400">
              No recordings or screenshots saved yet.
            </Typography>
          ) : (
            <>
              <TableContainer className="overflow-x-auto">
                <Table className="min-w-full divide-y divide-neutral-300 dark:divide-neutral-800">
                  <TableHead className="bg-secondary">
                    <TableRow>
                      <TableCell className="px-2 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Name
                      </TableCell>
                      <TableCell className="px-2 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </TableCell>
                      <TableCell className="px-2 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Size
                      </TableCell>
                      <TableCell className="px-2 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Created At
                      </TableCell>
                      <TableCell className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody className="divide-y divide-neutral-800">
                    {recordings.map((rec) => (
                      <TableRow key={rec.id} className="hover:bg-neutral-800">
                        <TableCell className="px-2 py-3 whitespace-nowrap text-sm font-medium text-neutral-300 break-all flex items-center gap-2">
                          {rec.type === 'screenRecord' &&
                            (rec.status === 'finished' ||
                              rec.status === 'ready') && (
                              <Button
                                onClick={() => handleOpenMedia(rec)}
                                variant="primary"
                                size="sm"
                                title="Play Recording"
                                className="flex-shrink-0"
                              >
                                <PlayArrow />
                              </Button>
                            )}
                          {rec.type === 'screenRecord' &&
                            rec.status === 'recording' && (
                              <Button
                                onClick={() => handleStopRecording(rec)}
                                variant="primary"
                                size="sm"
                                title="Stop Recording"
                                className="flex-shrink-0"
                              >
                                <Stop />
                              </Button>
                            )}
                          {rec.type === 'screenShot' &&
                            (rec.status === 'finished' ||
                              rec.status === 'ready') && (
                              <Button
                                onClick={() => handleOpenMedia(rec)}
                                variant="primary"
                                size="sm"
                                title="View Screenshot"
                                className="flex-shrink-0"
                              >
                                <PhotoCamera />
                              </Button>
                            )}
                          {rec.type === 'screenRecord' && <ScreenShare />}
                          {rec.type === 'screenShot' && <CameraOutlined />}
                          <span className="flex-grow">
                            {rec.path.split('/').pop()}
                          </span>
                        </TableCell>
                        <TableCell className="px-2 py-3 whitespace-nowrap text-sm">
                          {/* Status Indicator (replace with a visual cue if desired) */}
                          {rec.status}
                        </TableCell>
                        <TableCell className="px-2 py-3 whitespace-nowrap text-sm text-neutral-400">
                          {rec.data?.fileSize &&
                          typeof rec.data.fileSize === 'number'
                            ? formatBytes(rec.data.fileSize)
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="px-2 py-3 whitespace-nowrap text-sm text-neutral-400">
                          {new Date(rec.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="px-2 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <Box className="flex justify-end space-x-2">
                            {rec.type === 'screenRecord' &&
                              !rec.data?.animatedGif && (
                                <Button
                                  onClick={() => handleConvertToGif(rec)}
                                  variant="secondary"
                                  size="sm"
                                  title="Convert to GIF"
                                >
                                  <Gif />
                                </Button>
                              )}
                            {rec.data?.animatedGif && (
                              <Button
                                onClick={() =>
                                  handleOpenMedia({
                                    ...rec,
                                    path: rec.data.animatedGif!,
                                    type: 'animatedGif',
                                  })
                                }
                                variant="secondary"
                                size="sm"
                                title="View Animated GIF"
                              >
                                <Gif />
                              </Button>
                            )}
                            <Button
                              onClick={() =>
                                handleDownloadFile(
                                  rec.path,
                                  rec.path.split('/').pop()!,
                                )
                              }
                              variant="secondary"
                              size="sm"
                              title="Download"
                            >
                              <Download />
                            </Button>
                             <Button
                              onClick={() => handleEditRecording(rec)}
                              variant="secondary"
                              size="sm"
                              title="Edit"
                            >
                              <Edit />
                            </Button>
                            <Button
                              onClick={() => handleDeleteRecording(rec)}
                              variant="error"
                              size="sm"
                              title="Delete"
                            >
                              <Delete />
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <Box className="flex items-center justify-between p-2 border-t">
                  <Box className="flex-1 flex justify-between sm:justify-end">
                    <Button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      variant="secondary"
                      size="sm"
                      className="mr-2"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      variant="secondary"
                      size="sm"
                    >
                      Next
                    </Button>
                  </Box>
                  <Box className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-center">
                    <Typography
                      variant="body2"
                      className="text-sm text-gray-400"
                    >
                      Page <span className="font-medium">{currentPage}</span> of{' '}
                      <span className="font-medium">{totalPages}</span>
                    </Typography>
                  </Box>
                </Box>
              )}
            </>
          )}
        </Paper>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>

        <Dialog
          open={isMediaModalOpen}
          onClose={handleCloseMediaModal}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>{selectedMedia?.path.split('/').pop()}</DialogTitle>
          <DialogContent>
            {selectedMedia && (
              <Box className="flex items-center justify-center bg-secondary rounded-md flex-grow">
                {selectedMedia.type === 'screenRecord' ? (
                  <video
                    src={getMediaUrl(selectedMedia.path)}
                    autoPlay={true}
                    controls={true}
                  ></video>
                ) : selectedMedia.type === 'screenShot' ? (
                  <img
                    src={getMediaUrl(selectedMedia.path)}
                    alt={selectedMedia.path.split('/').pop()}
                    className="w-full h-auto object-contain rounded-md"
                  />
                ) : selectedMedia.type === 'animatedGif' ? (
                  <img
                    src={getMediaUrl(selectedMedia.path)}
                    alt={selectedMedia.path.split('/').pop()}
                    className="w-full h-auto object-contain rounded-md"
                  />
                ) : (
                  <Typography variant="body1" className="text-gray-400">
                    Unsupported media type.
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
        </Dialog>
        {/* Edit Recording Dialog */}
        <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} fullWidth maxWidth="sm">
          <DialogTitle>Edit Recording Data</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="duration"
              name="duration"
              label="Duration"
              type="number"
              fullWidth
              value={editedRecordingData.data?.duration || ''}
              onChange={handleDataChange}
            />
            <TextField
              margin="dense"
              id="fileSize"
              name="fileSize"
              label="File Size"
              type="number"
              fullWidth
              value={editedRecordingData.data?.fileSize || ''}
              onChange={handleDataChange}
            />
          </DialogContent>
          <Box className="flex justify-end p-4">
            <Button onClick={handleCloseEditDialog} variant="secondary" className="mr-2">Cancel</Button>
            <Button onClick={handleUpdateRecording} variant="primary">Update</Button>
          </Box>
        </Dialog>
      </Box>
    </>
  );
};

export default RecordingComponent;
