import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@components/ui/Button';
import { Icon } from '@mdi/react';
import { Loading } from '@components/Loading';
import { Modal } from '@components/VideoModal';
import { useStore } from '@nanostores/react';
import { authStore } from '@stores/authStore';
import { recordingApi } from '@/api/recording';
import {
  PaginationRecordingQueryDto,
  RecordingResultDto,
} from '@/types';

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
  const [isCapturing, setIsCapturing] = useState(false);
  const [isStartingRecording, setIsStartingRecording] = useState(false);
  const [isStoppingRecording, setIsStoppingRecording] = useState(false);
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(true);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [currentRecordingPath, setCurrentRecordingPath] = useState<string | null>(null);
  const [currentRecordingStartedAt, setCurrentRecordingStartedAt] = useState<string | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<RecordingResultDto | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [totalRecordings, setTotalRecordings] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const $auth = useStore(authStore);
  const userId = $auth.user?.id;

  const fetchRecordings = useCallback(
    async (page: number, limit: number) => {
      setIsLoadingRecordings(true);
      try {
        if (!userId) {
          console.warn('User ID not found');
          return;
        }

        const params: PaginationRecordingQueryDto = { page, limit };
        const response = await recordingApi.getRecordings(params);

        setRecordings(response.items);
        setTotalRecordings(response.total);
        setTotalPages(Math.ceil(response.total / limit));
        setCurrentPage(response.page);
        setLimit(response.limit);
      } catch (error) {
        console.error('Error fetching recordings:', error);
      } finally {
        setIsLoadingRecordings(false);
      }
    },
    [userId],
  );

  const fetchRecordingStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      if (!userId) {
        console.warn('User ID not found');
        return;
      }
      const status = await recordingApi.recordingStatus();
      setIsRecording(status.isRecording);
      setCurrentRecordingPath(status.currentRecordingPath);
      setCurrentRecordingStartedAt(status.currentRecordingStartedAt || null);
    } catch (error) {
      console.error('Error fetching recording status:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchRecordings(currentPage, limit);
      fetchRecordingStatus();
    }
  }, [userId, currentPage, limit, fetchRecordings, fetchRecordingStatus]);

  const handleCaptureScreen = async () => {
    setIsCapturing(true);
    try {
      if (!userId) {
        console.warn('User ID not found');
        return;
      }
      await recordingApi.capture();
      await fetchRecordings(currentPage, limit);
      await fetchRecordingStatus();
    } catch (error) {
      console.error('Error capturing screen:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleStartRecording = async () => {
    setIsStartingRecording(true);
    try {
      if (!userId) {
        console.warn('User ID not found');
        return;
      }
      await recordingApi.startRecording();
      await fetchRecordingStatus();
    } catch (error) {
      console.error('Error starting recording:', error);
    } finally {
      setIsStartingRecording(false);
    }
  };

  const handleStopRecording = async () => {
    setIsStoppingRecording(true);
    try {
      if (!userId) {
        console.warn('User ID not found');
        return;
      }
      await recordingApi.stopRecording(currentRecordingPath || '');
      await fetchRecordings(currentPage, limit);
      await fetchRecordingStatus();
    } catch (error) {
      console.error('Error stopping recording:', error);
    } finally {
      setIsStoppingRecording(false);
    }
  };

  const handleDeleteRecording = async (id: string, path: string) => {
    if (window.confirm(`Are you sure you want to delete ${path}?`)) {
      try {
        // await recordingService.deleteRecording(id);
        await fetchRecordings(currentPage, limit);
      } catch (error) {
        console.error('Error deleting recording:', error);
      }
    }
  };

  const handleDownloadFile = async (filePath: string, fileName: string) => {
    try {
      // await recordingService.downloadFile(filePath, fileName);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleOpenMedia = (rec: RecordingResultDto) => {
    setSelectedMedia(rec);
    setIsMediaModalOpen(true);
  };

  const handleCloseMediaModal = () => {
    setIsMediaModalOpen(false);
    setSelectedMedia(null);
  };

  const getMediaUrl = (filePath: string) => {
    // return recordingService.getMediaUrl(filePath);
    return filePath; // temp fix
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

  return (
    <div className="p-4 bg-dark  min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Screen Recording & Capture</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Recording Controls */}
        <div className="bg-secondary p-4 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4">Controls</h2>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleCaptureScreen}
              disabled={
                isCapturing || isStartingRecording || isStoppingRecording
              }
              loading={isCapturing}
              variant="primary"
              size="lg"
              title="Capture Screenshot"
            >
              <Icon icon="mdi:camera-outline" className="mr-2" />
              {/* No text, icon only as per request */}
            </Button>

            {isRecording ? (
              <Button
                onClick={handleStopRecording}
                disabled={
                  isCapturing || isStartingRecording || isStoppingRecording
                }
                loading={isStoppingRecording}
                variant="error"
                size="lg"
                title="Stop Recording"
              >
                <Icon icon="mdi:stop" />
                {/* No text, icon only as per request */}
              </Button>
            ) : (
              <Button
                onClick={handleStartRecording}
                disabled={
                  isCapturing || isStartingRecording || isStoppingRecording
                }
                loading={isStartingRecording}
                variant="success"
                size="lg"
                title="Start Recording"
              >
                <Icon icon="mdi:record" />
                {/* No text, icon only as per request */}
              </Button>
            )}
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-secondary p-4 rounded-lg shadow-md border ">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          {isLoadingStatus ? (
            <Loading />
          ) : (
            <div>
              <p className="text-lg">
                Status:{' '}
                <span
                  className={`font-semibold ${isRecording ? 'text-green-400' : 'text-red-400'}`}
                >
                  {isRecording ? 'RECORDING' : 'Idle'}
                </span>
              </p>
              {currentRecordingPath && (
                <p className="text-sm mt-2">
                  File:{' '}
                  <span className="font-mono text-gray-300 break-all">
                    {currentRecordingPath.split('/').pop()}
                  </span>
                </p>
              )}
              {currentRecordingStartedAt && (
                <p className="text-sm">
                  Started At:{' '}
                  {new Date(currentRecordingStartedAt).toLocaleString()}
                </p>
              )}
              {!isRecording && (
                <p className="text-sm italic text-gray-400 mt-2">
                  No active recording. Click 'Start Recording' to begin.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recordings List */}
      <h2 className="text-lg my-3">Saved Recordings & Screenshots</h2>
      <div className="bg-dark rounded-lg shadow-md border">
        {isLoadingRecordings ? (
          <Loading />
        ) : recordings.length === 0 ? (
          <p className="text-gray-400">
            No recordings or screenshots saved yet.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-300 dark:divide-neutral-800">
                <thead className="bg-secondary">
                  <tr>
                    <th
                      scope="col"
                      className="px-2 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                    >
                      Size
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                    >
                      Created At
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {recordings.map((rec) => (
                    <tr key={rec.id} className="hover:bg-neutral-800">
                      <td className="px-2 py-3 whitespace-nowrap text-sm font-medium text-neutral-300 break-all flex items-center gap-2">
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
                              <Icon icon="mdi:play" />
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
                              <Icon icon="mdi:play" />
                            </Button>
                          )}
                        <span className="flex-grow">
                          {rec.path.split('/').pop()}
                        </span>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm">
                        <Icon
                          icon="mdi:circle"
                          className={`
                            w-3 h-3 rounded-full inline-block mr-2
                            ${
                              rec.status === 'finished' ||
                              rec.status === 'ready'
                                ? 'text-green-500' // Success
                                : rec.status === 'started'
                                  ? 'text-blue-500' // Info
                                  : 'text-red-500' // Error/Other
                            }
                          `}
                          title={rec.status}
                        />
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-neutral-400">
                        {rec.data?.fileSize &&
                        typeof rec.data.fileSize === 'number'
                          ? formatBytes(rec.data.fileSize)
                          : 'N/A'}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-neutral-400">
                        {new Date(rec.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
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
                            <Icon icon="mdi:download" />
                          </Button>
                          <Button
                            onClick={() =>
                              handleDeleteRecording(
                                rec.id,
                                rec.path.split('/').pop()!,
                              )
                            }
                            variant="error"
                            size="sm"
                            title="Delete"
                          >
                            <Icon icon="mdi:trash-can-outline" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-between p-2 border-t">
                <div className="flex-1 flex justify-between sm:justify-end">
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
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-center">
                  <p className="text-sm text-gray-400">
                    Page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
              </nav>
            )}
          </>
        )}
      </div>

      {/* Media Playback Modal */}
      <Modal
        isOpen={isMediaModalOpen}
        onClose={handleCloseMediaModal}
        title={
          selectedMedia
            ? `Opened: ${selectedMedia.path.split('/').pop()}`
            : 'Media Player'
        }
        size="lg" // Changed to fullscreen as per request for modal sizes
        className="bg-secondary flex flex-col" // Added flex flex-col for internal layout
      >
        {selectedMedia && (
          <div className="flex items-center justify-center bg-secondary rounded-md flex-grow">
            {selectedMedia.type === 'screenRecord' ? (
              <video
                controls
                src={getMediaUrl(selectedMedia.path)}
                className="w-full h-full object-contain"
                autoPlay
              >
                Your browser does not support the video tag.
              </video>
            ) : selectedMedia.type === 'screenShot' ? (
              <img
                src={getMediaUrl(selectedMedia.path)}
                alt={selectedMedia.path.split('/').pop()}
                className="w-full h-full object-contain"
              />
            ) : (
              <p className="text-gray-400">Unsupported media type.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RecordingComponent;
