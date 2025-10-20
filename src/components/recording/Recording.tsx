import { useEffect, useCallback, useRef } from 'react';
import { Box, LinearProgress } from '@mui/material';
import { RecordingControls } from './RecordingControls';
import { RecordingStatus } from './RecordingStatus';
import { RecordingsTable } from './RecordingsTable';
import { RecordingsPagination } from './RecordingsPagination';
import { RecordingSearchBar } from './RecordingSearchBar';
import { RecordingInfoDrawer } from './RecordingInfoDrawer';
import { RecordingSettingsDialog } from './RecordingSettingsDialog';
import {
  isScreenRecordingStore,
  currentRecordingIdStore,
  setIsScreenRecording,
  isCameraRecordingStore,
  currentCameraRecordingIdStore,
  setIsCameraRecording,
  recorderSettingsStore,
  recordingsListStore,
  totalRecordingsStore,
  recordingsPageStore,
  recordingsRowsPerPageStore,
  recordingsSortByStore,
  recordingsSortOrderStore,
  recordingsSearchQueryStore,
  recordingDrawerOpenStore,
  selectedRecordingStore,
  editableRecordingStore,
  recordingTypeFilterStore,
  isRecordingSettingsDialogOpenStore,
  isVideoModalOpenStore,
  currentPlayingVideoSrcStore,
  currentPlayingMediaTypeStore,
  setRecordingsList,
  setTotalRecordings,
  setRecordingsPage,
  setRecordingsRowsPerPage,
  setRecordingsSortBy,
  setRecordingsSortOrder,
  setRecordingsSearchQuery,
  setRecordingDrawerOpen,
  setSelectedRecording,
  setEditableRecording,
  setRecordingTypeFilter,
  setIsRecordingSettingsDialogOpen,
  setIsVideoModalOpen,
  setCurrentPlayingVideoSrc,
  setCurrentPlayingMediaType,
} from './stores/recordingStore';
import { useStore } from '@nanostores/react';

import { getFileStreamUrl } from '@/api/media';
import { recordingApi } from './api/recording';
import { setLoading, isLoading } from '@/stores/loadingStore';
import { StartCameraRecordingDto, RecordingItem, SortField, SortOrder, RecordingType } from './types/recording';
import VideoModal from '@/components/VideoModal';
import path from 'path-browserify';

const RECORDING_TYPES: RecordingType[] = ['screenRecord', 'screenShot', 'cameraRecord'];

export function Recording() {
  // States from store
  const isScreenRecording = useStore(isScreenRecordingStore);
  const currentRecordingId = useStore(currentRecordingIdStore);
  const isCameraRecording = useStore(isCameraRecordingStore);
  const currentCameraRecordingId = useStore(currentCameraRecordingIdStore);
  const currentRecorderSettings = useStore(recorderSettingsStore);

  const recordings = useStore(recordingsListStore);
  const totalRecordings = useStore(totalRecordingsStore);
  const page = useStore(recordingsPageStore);
  const rowsPerPage = useStore(recordingsRowsPerPageStore);
  const sortBy = useStore(recordingsSortByStore);
  const sortOrder = useStore(recordingsSortOrderStore);
  const searchQuery = useStore(recordingsSearchQueryStore);
  const drawerOpen = useStore(recordingDrawerOpenStore);
  const selectedRecording = useStore(selectedRecordingStore);
  const editableRecording = useStore(editableRecordingStore);
  const typeFilter = useStore(recordingTypeFilterStore);
  const isSettingsDialogOpen = useStore(isRecordingSettingsDialogOpenStore);
  const isVideoModalOpen = useStore(isVideoModalOpenStore);
  const currentPlayingVideoSrc = useStore(currentPlayingVideoSrcStore);
  const currentPlayingMediaType = useStore(currentPlayingMediaTypeStore);

  // Ref for media element
  const mediaElementRef = useRef<HTMLVideoElement | HTMLImageElement>(null);

  // Fetch recordings from API
  const fetchRecordings = useCallback(async () => {
    setLoading('recordingsList', true);
    try {
      const data = await recordingApi.getRecordings({
        page: page + 1,
        pageSize: rowsPerPage,
        sortBy,
        sortOrder,
        search: searchQuery || undefined,
        type: typeFilter || undefined,
      });

      const items: RecordingItem[] = data.items.map((r) => ({
        id: r.id,
        name: r.path.split('/').pop() || r.id,
        createdAt: r.createdAt,
        sizeBytes: r.data.fileSize || 0,
        type: r.type as RecordingType, // Cast to RecordingType
        status: r.status,
        path: r.path,
        createdById: r.createdById,
        data: r.data,
      }));

      setRecordingsList(items);
      setTotalRecordings(data.total);

      if (data.items.length === 0 && page > 0) setRecordingsPage(page - 1);
    } finally {
      setLoading('recordingsList', false);
    }
  }, [
    page,
    rowsPerPage,
    sortBy,
    sortOrder,
    searchQuery,
    typeFilter,
    setRecordingsList,
    setTotalRecordings,
    setRecordingsPage,
  ]);

  useEffect(() => {
    fetchRecordings();
  }, [
    fetchRecordings,
    isScreenRecording,
    currentRecordingId,
    isCameraRecording,
    currentCameraRecordingId,
  ]);

  // Screen Recording actions
  const handleStartScreenRecording = async () => {
    setLoading('startRecording', true);
    try {
      const res = await recordingApi.startRecording();
      setIsScreenRecording(true);
      currentRecordingIdStore.set(res.id);
      fetchRecordings();
    } finally {
      setLoading('startRecording', false);
    }
  };

  const handleStopScreenRecording = async () => {
    if (!currentRecordingId) return;
    setLoading('stopRecording', true);
    try {
      await recordingApi.stopRecording(currentRecordingId);
      setIsScreenRecording(false);
      currentRecordingIdStore.set(null);
      fetchRecordings();
    } finally {
      setLoading('stopRecording', false);
    }
  };

  // Camera Recording actions
  const handleStartCameraRecording = async () => {
    setLoading('startCameraRecording', true);
    try {
      const dto: StartCameraRecordingDto = {
        cameraDevice: currentRecorderSettings.cameraVideoDevice,
        audioDevice: currentRecorderSettings.cameraAudioDevice,
        resolution: currentRecorderSettings.cameraResolution,
        framerate: currentRecorderSettings.cameraFramerate,
        name: `${currentRecorderSettings.namePrefix}-camera-record-${Date.now()}`,
      };
      const res = await recordingApi.startCameraRecording(dto);
      setIsCameraRecording(true);
      currentCameraRecordingIdStore.set(res.id);
      fetchRecordings();
    } finally {
      setLoading('startCameraRecording', false);
    }
  };

  const handleStopCameraRecording = async () => {
    if (!currentCameraRecordingId) return;
    setLoading('stopCameraRecording', true);
    try {
      await recordingApi.stopCameraRecording(currentCameraRecordingId);
      setIsCameraRecording(false);
      currentCameraRecordingIdStore.set(null);
      fetchRecordings();
    } finally {
      setLoading('stopCameraRecording', false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading('deleteRecording', true);
    try {
      await recordingApi.deleteRecording(id);
      fetchRecordings();
    } finally {
      setLoading('deleteRecording', false);
    }
  };

  const handleConvertToGif = async (recording: RecordingItem) => {
    setLoading('convertToGif', true);
    try {
      const transcodeDto = {
        inputFilename: path.basename(recording.path),
        fps: 15,
        width: 720,
        loop: 0,
      };
      const result = await recordingApi.convertToGif(transcodeDto);

      await recordingApi.updateRecording(recording.id, {
        data: { ...recording.data, animatedGif: result.fullPath },
      });
      fetchRecordings();
    } finally {
      setLoading('convertToGif', false);
    }
  };

  const handlePlay = (recording: RecordingItem) => {
    let mediaPath: string;
    let mediaType: 'video' | 'gif' | 'image';

    if (recording.data?.animatedGif) {
      mediaPath = recording.data.animatedGif;
      mediaType = 'gif';
    } else if (recording.type === 'screenShot') {
      mediaPath = recording.path;
      mediaType = 'image';
    } else {
      mediaPath = recording.path;
      mediaType = 'video';
    }

    const mediaUrl = getFileStreamUrl(mediaPath);

    setCurrentPlayingVideoSrc(mediaUrl);
    setCurrentPlayingMediaType(mediaType);
    setIsVideoModalOpen(true);
  };

  const handleCloseVideoModal = () => {
    setIsVideoModalOpen(false);
    setCurrentPlayingVideoSrc(null);
    setCurrentPlayingMediaType('video');
    if (mediaElementRef.current) {
      if (currentPlayingMediaType === 'video') {
        (mediaElementRef.current as HTMLVideoElement).pause();
        (mediaElementRef.current as HTMLVideoElement).currentTime = 0;
      }
    }
  };

  const handlePlayerReady = useCallback(
    (_htmlMediaElement: HTMLVideoElement) => {
      // Can be used to perform actions when the video player is ready
    },
    [],
  );

  const handlePageChange = (_: unknown, newPage: number) =>
    setRecordingsPage(newPage);
  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRecordingsRowsPerPage(parseInt(event.target.value, 10));
    setRecordingsPage(0);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setRecordingsSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setRecordingsSortBy(field);
      setRecordingsSortOrder('desc'); // Default to 'desc' when changing sort field
    }
    setRecordingsPage(0);
  };

  const handleSearch = () => setRecordingsPage(0);

  const openDrawer = (recording: RecordingItem) => {
    setSelectedRecording(recording);
    setEditableRecording({ name: recording.name, type: recording.type });
    setRecordingDrawerOpen(true);
  };

  const closeDrawer = () => {
    setSelectedRecording(null);
    setEditableRecording({});
    setRecordingDrawerOpen(false);
  };

  const handleUpdateRecording = async () => {
    if (!selectedRecording) return;
    setLoading('updateRecording', true);
    try {
      await recordingApi.updateRecording(selectedRecording.id, editableRecording);
      fetchRecordings();
      closeDrawer();
    } finally {
      setLoading('updateRecording', false);
    }
  };

  const handleOpenSettingsDialog = () => {
    setIsRecordingSettingsDialogOpen(true);
  };

  const handleCloseSettingsDialog = () => {
    setIsRecordingSettingsDialogOpen(false);
  };

  return (
    <Box className="flex flex-col gap-6 p-6">
      {(isLoading('recordingsList') ||
        isLoading('deleteRecording') ||
        isLoading('startRecording') ||
        isLoading('stopRecording') ||
        isLoading('startCameraRecording') ||
        isLoading('stopCameraRecording') ||
        isLoading('updateRecording') ||
        isLoading('convertToGif')) && <LinearProgress />}

      <Box className="flex items-center justify-between">
        <RecordingControls
          isScreenRecording={isScreenRecording}
          isCameraRecording={isCameraRecording}
          isCapturing={false}
          onStartScreenRecording={handleStartScreenRecording}
          onStopScreenRecording={handleStopScreenRecording}
          onStartCameraRecording={handleStartCameraRecording}
          onStopCameraRecording={handleStopCameraRecording}
          onCapture={() => {}}
          onOpenSettings={handleOpenSettingsDialog}
        />
        <RecordingStatus />
      </Box>

      <RecordingSearchBar
        searchQuery={searchQuery}
        onSearchChange={setRecordingsSearchQuery}
        onSearch={handleSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={setRecordingTypeFilter}
        typeOptions={RECORDING_TYPES}
        onRefresh={fetchRecordings}
      />

      <RecordingsTable
        recordings={recordings}
        onPlay={handlePlay}
        onDelete={handleDelete}
        onView={openDrawer}
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onConvertToGif={handleConvertToGif}
      />

      <RecordingsPagination
        total={totalRecordings}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
      <RecordingInfoDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        recording={selectedRecording}
        onUpdate={handleUpdateRecording}
      />

      <RecordingSettingsDialog
        open={isSettingsDialogOpen}
        onClose={handleCloseSettingsDialog}
      />

      {currentPlayingVideoSrc && (
        <VideoModal
          open={isVideoModalOpen}
          onClose={handleCloseVideoModal}
          src={currentPlayingVideoSrc}
          mediaElementRef={mediaElementRef}
          autoplay={true}
          controls={true}
          muted={false}
          onPlayerReady={handlePlayerReady}
          mediaType={currentPlayingMediaType}
        />
      )}
    </Box>
  );
}
