import React, { useState, useEffect, useRef } from 'react';
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
  Button,
  Typography,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  LinearProgress,
  TextField,
  useTheme,
} from '@mui/material';

// Assuming this is how it imports the player
import {
  CameraOutlined,
  PlayArrow,
  Stop,
  Videocam,
  PhotoCamera,
  Download,
  Delete,
  Gif,
  ScreenShare,
  Edit,
} from '@mui/icons-material';
import { useStore } from '@nanostores/react';
import { recordingApi } from '@/api/recording';
import {
  RecordingResultDto,
  TranscodeToGifDto,
  UpdateRecordingDto,
} from '@/types';
import { useNavigate } from 'react-router-dom';
import path from 'path-browserify';
import { getFileStreamUrl } from '@/api/media'; // Import media functions
import {
  currentRecordingIdStore,
  isCurrentRecording,
} from '@/stores/recordingStore';

interface RecordingComponentProps {
  initialPage?: number;
  initialLimit?: number;
}

type SnackbarSeverity = 'success' | 'error' | 'warning';

const RecordingComponent: React.FC<RecordingComponentProps> = ({
  initialPage = 1,
  initialLimit = 5,
}) => {
  const theme = useTheme();
  const [recordings, setRecordings] = useState<RecordingResultDto[]>([]);
  // const [isRecording, setIsRecording] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] =
    useState<SnackbarSeverity>('success');
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
  const $isCurrentRecording = useStore(isCurrentRecording);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRecording, setSelectedRecording] =
    useState<RecordingResultDto | null>(null);
  const [editedRecordingData, setEditedRecordingData] =
    useState<UpdateRecordingDto>({
      data: {},
    });

  const showSnackbar = (
    message: string,
    severity: SnackbarSeverity = 'success',
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
  // useEffect(() => {
  //   if ($currentRecordingId) {
  //     setIsRecording(true);
  //   }
  // }, [$currentRecordingId]);
  useEffect(() => {
    loadRecordings();
  }, [currentPage, limit]);

  const loadRecordingStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const status = await recordingApi.recordingStatus();
      //setIsRecording(status.isRecording);
      currentRecordingIdStore.set(status.isRecording);
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
      //setIsRecording(true);
      isCurrentRecording.set(true);
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
        const recordingData = await recordingApi.stopRecording(recording.id);
        if (recordingData) {
          showSnackbar('Recording stopped successfully!', 'success');
          if ($currentRecordingId) currentRecordingIdStore.set(null);
          isCurrentRecording.set(false);
          await loadRecordings(); // Reload recordings after stopping
          await loadRecordingStatus();
        }
      } else if ($currentRecordingId) {
        const recordingData =
          await recordingApi.stopRecording($currentRecordingId);
        if (recordingData) {
          //setIsRecording(false);
          isCurrentRecording.set(false);
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
        await recordingApi.updateRecording(
          selectedRecording.id,
          editedRecordingData,
        );
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
        <LinearProgress sx={{ width: '100%', flexShrink: 0, zIndex: 1200 }} />
      )}

      <Box
        className="p-4"
        sx={{ minHeight: '100vh', bgcolor: theme.palette.background.default }}
      >
        <Typography
          variant="h5"
          component="h1"
          sx={{
            fontSize: '2rem',
            fontWeight: 'bold',
            mb: 6,
            color: theme.palette.text.primary,
          }}
        >
          Screen Recording & Capture
        </Typography>

        <Box className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Recording Controls */}
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: '0.5rem',
              boxShadow: theme.shadows[3],
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.background.paper,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontSize: '1.25rem',
                fontWeight: 'semibold',
                mb: 4,
                color: theme.palette.text.primary,
              }}
            >
              Controls
            </Typography>
            <Box className="flex items-center gap-4">
              <Box>
                <IconButton
                  aria-label="start recording"
                  disabled={$isCurrentRecording}
                  onClick={handleStartRecording}
                >
                  <Videocam />
                </IconButton>
                <IconButton
                  aria-label="stop recording"
                  disabled={!$isCurrentRecording}
                  onClick={handleStopRecording}
                >
                  <Stop />
                </IconButton>
                <IconButton
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
            sx={{
              p: 4,
              borderRadius: '0.5rem',
              boxShadow: theme.shadows[3],
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.background.paper,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontSize: '1.25rem',
                fontWeight: 'semibold',
                mb: 4,
                color: theme.palette.text.primary,
              }}
            >
              Current Status
            </Typography>
            {isLoadingStatus ? (
              <CircularProgress />
            ) : (
              <div>
                <Typography
                  variant="body1"
                  sx={{ fontSize: '1rem', color: theme.palette.text.primary }}
                >
                  Status:{' '}
                  <span
                    className={`font-semibold ${
                      $isCurrentRecording ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {$isCurrentRecording ? 'RECORDING' : 'Idle'}
                  </span>
                </Typography>
                {currentRecordingPath && (
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.875rem',
                      mt: 2,
                      color: theme.palette.text.secondary,
                    }}
                  >
                    File:{' '}
                    <span className="font-mono text-gray-300 break-all">
                      {currentRecordingPath.split('/').pop()}
                    </span>
                  </Typography>
                )}
                {currentRecordingStartedAt && (
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.875rem',
                      color: theme.palette.text.secondary,
                    }}
                  >
                    Started At:{' '}
                    {new Date(currentRecordingStartedAt).toLocaleString()}
                  </Typography>
                )}
                {!$isCurrentRecording && (
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.875rem',
                      fontStyle: 'italic',
                      color: theme.palette.text.disabled,
                      mt: 2,
                    }}
                  >
                    No active recording. Click 'Start Recording' to begin.
                  </Typography>
                )}
              </div>
            )}
          </Paper>
        </Box>

        {/* Recordings List */}
        <Typography
          variant="h6"
          sx={{ fontSize: '1rem', my: 3, color: theme.palette.text.primary }}
        >
          Saved Recordings & Screenshots
        </Typography>
        <Paper
          elevation={3}
          sx={{
            borderRadius: '0.5rem',
            boxShadow: theme.shadows[3],
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
          }}
        >
          {isLoadingRecordings ? (
            <LinearProgress
              sx={{ width: '100%', flexShrink: 0, zIndex: 1200 }}
            />
          ) : recordings.length === 0 ? (
            <Typography
              variant="body1"
              sx={{ color: theme.palette.text.disabled }}
            >
              No recordings or screenshots saved yet.
            </Typography>
          ) : (
            <>
              <TableContainer className="overflow-x-auto">
                <Table className="min-w-full divide-y divide-neutral-300 dark:divide-neutral-800">
                  <TableHead sx={{ bgcolor: theme.palette.background.paper }}>
                    <TableRow>
                      <TableCell
                        sx={{
                          px: 2,
                          py: 3,
                          textAlign: 'left',
                          fontSize: '0.75rem',
                          fontWeight: 'medium',
                          color: theme.palette.text.disabled,
                          textTransform: 'uppercase',
                          letterSpacing: 1,
                        }}
                      >
                        Name
                      </TableCell>
                      <TableCell
                        sx={{
                          px: 2,
                          py: 3,
                          textAlign: 'left',
                          fontSize: '0.75rem',
                          fontWeight: 'medium',
                          color: theme.palette.text.disabled,
                          textTransform: 'uppercase',
                          letterSpacing: 1,
                        }}
                      >
                        Status
                      </TableCell>
                      <TableCell
                        sx={{
                          px: 2,
                          py: 3,
                          textAlign: 'left',
                          fontSize: '0.75rem',
                          fontWeight: 'medium',
                          color: theme.palette.text.disabled,
                          textTransform: 'uppercase',
                          letterSpacing: 1,
                        }}
                      >
                        Size
                      </TableCell>
                      <TableCell
                        sx={{
                          px: 2,
                          py: 3,
                          textAlign: 'left',
                          fontSize: '0.75rem',
                          fontWeight: 'medium',
                          color: theme.palette.text.disabled,
                          textTransform: 'uppercase',
                          letterSpacing: 1,
                        }}
                      >
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
                        <TableCell
                          sx={{
                            px: 2,
                            py: 3,
                            whiteSpace: 'nowrap',
                            fontSize: '0.875rem',
                            fontWeight: 'medium',
                            color: theme.palette.text.primary,
                            wordBreak: 'break-all',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                          }}
                        >
                          {rec.type === 'screenRecord' &&
                            (rec.status === 'finished' ||
                              rec.status === 'ready') && (
                              <IconButton
                                color="primary"
                                aria-label="Play recording"
                                onClick={() => handleOpenMedia(rec)}
                                title="Play Recording"
                                className="flex-shrink-0"
                              >
                                <PlayArrow />
                              </IconButton>
                            )}
                          {rec.type === 'screenRecord' &&
                            rec.status === 'recording' && (
                              <IconButton
                                onClick={() => handleStopRecording(rec)}
                                color="primary"
                                title="Stop Recording"
                                className="flex-shrink-0"
                              >
                                <Stop />
                              </IconButton>
                            )}
                          {rec.type === 'screenShot' &&
                            (rec.status === 'finished' ||
                              rec.status === 'ready') && (
                              <IconButton
                                onClick={() => handleOpenMedia(rec)}
                                color="primary"
                                title="View Screenshot"
                                className="flex-shrink-0"
                              >
                                <PhotoCamera />
                              </IconButton>
                            )}
                          {rec.type === 'screenRecord' && <ScreenShare />}
                          {rec.type === 'screenShot' && <CameraOutlined />}
                          <span className="flex-grow">
                            {rec.path.split('/').pop()}
                          </span>
                        </TableCell>
                        <TableCell
                          sx={{
                            px: 2,
                            py: 3,
                            whiteSpace: 'nowrap',
                            fontSize: '0.875rem',
                            color: theme.palette.text.primary,
                          }}
                        >
                          {/* Status Indicator (replace with a visual cue if desired) */}
                          {rec.status}
                        </TableCell>
                        <TableCell
                          sx={{
                            px: 2,
                            py: 3,
                            whiteSpace: 'nowrap',
                            fontSize: '0.875rem',
                            color: theme.palette.text.secondary,
                          }}
                        >
                          {rec.data?.fileSize &&
                          typeof rec.data.fileSize === 'number'
                            ? formatBytes(rec.data.fileSize)
                            : 'N/A'}
                        </TableCell>
                        <TableCell
                          sx={{
                            px: 2,
                            py: 3,
                            whiteSpace: 'nowrap',
                            fontSize: '0.875rem',
                            color: theme.palette.text.secondary,
                          }}
                        >
                          {new Date(rec.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="px-2 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <Box className="flex justify-end space-x-2">
                            {rec.type === 'screenRecord' &&
                              !rec.data?.animatedGif && (
                                <IconButton
                                  onClick={() => handleConvertToGif(rec)}
                                  color="secondary"
                                  title="Convert to GIF"
                                >
                                  <Gif />
                                </IconButton>
                              )}
                            {rec.data?.animatedGif && (
                              <IconButton
                                onClick={() =>
                                  handleOpenMedia({
                                    ...rec,
                                    path: rec.data.animatedGif!,
                                    type: 'animatedGif',
                                  })
                                }
                                color="secondary"
                                title="View Animated GIF"
                              >
                                <Gif />
                              </IconButton>
                            )}
                            <IconButton
                              onClick={() =>
                                handleDownloadFile(
                                  rec.path,
                                  rec.path.split('/').pop()!,
                                )
                              }
                              color="secondary"
                              title="Download"
                            >
                              <Download />
                            </IconButton>
                            <IconButton
                              onClick={() => handleEditRecording(rec)}
                              color="secondary"
                              title="Edit"
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              onClick={() => handleDeleteRecording(rec)}
                              title="Delete"
                            >
                              <Delete />
                            </IconButton>
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
                      className="mr-2"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </Box>
                  <Box className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-center">
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.875rem',
                        color: theme.palette.text.secondary,
                      }}
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
          PaperProps={{
            style: {
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
            },
          }}
        >
          <DialogTitle sx={{ color: theme.palette.text.primary }}>
            {selectedMedia?.path.split('/').pop()}
          </DialogTitle>
          <DialogContent>
            {selectedMedia && (
              <Box
                className="flex items-center justify-center flex-grow"
                sx={{
                  bgcolor: theme.palette.background.paper,
                  borderRadius: '0.5rem',
                }}
              >
                {selectedMedia.type === 'screenRecord' ? (
                  <video
                    src={getMediaUrl(selectedMedia.path)}
                    autoPlay={true}
                    controls={true}
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                  ></video>
                ) : selectedMedia.type === 'screenShot' ? (
                  <img
                    src={getMediaUrl(selectedMedia.path)}
                    alt={selectedMedia.path.split('/').pop()}
                    className="w-full h-auto object-contain rounded-md"
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                  />
                ) : selectedMedia.type === 'animatedGif' ? (
                  <img
                    src={getMediaUrl(selectedMedia.path)}
                    alt={selectedMedia.path.split('/').pop()}
                    className="w-full h-auto object-contain rounded-md"
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                  />
                ) : (
                  <Typography
                    variant="body1"
                    sx={{ color: theme.palette.text.disabled }}
                  >
                    Unsupported media type.
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
        </Dialog>
        {/* Edit Recording Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={handleCloseEditDialog}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            style: {
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
            },
          }}
        >
          <DialogTitle sx={{ color: theme.palette.text.primary }}>
            Edit Recording Data
          </DialogTitle>
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
              InputProps={{ style: { color: theme.palette.text.primary } }}
              InputLabelProps={{
                style: { color: theme.palette.text.secondary },
              }}
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
              InputProps={{ style: { color: theme.palette.text.primary } }}
              InputLabelProps={{
                style: { color: theme.palette.text.secondary },
              }}
            />
          </DialogContent>
          <Box className="flex justify-end p-4">
            <Button
              onClick={handleCloseEditDialog}
              variant="outlined"
              color="secondary"
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRecording}
              variant="contained"
              color="primary"
            >
              Update
            </Button>
          </Box>
        </Dialog>
      </Box>
    </>
  );
};

export default RecordingComponent;
