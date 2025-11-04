import { useEffect, useCallback, useRef } from 'react';
import { Box, LinearProgress } from '@mui/material';
import { RecordingControls } from './RecordingControls';
import { RecordingStatus } from './RecordingStatus';
import { RecordingsTable } from './RecordingsTable';
// import { RecordingInfoDrawer } from './RecordingInfoDrawer'; // Removed
import { RecordingInfoDialogContent } from './RecordingInfoDialogContent'; // New import
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
  // recordingDrawerOpenStore, // Removed
  selectedRecordingStore,
  editableRecordingStore,
  recordingTypeFilterStore,
  isVideoModalOpenStore,
  currentPlayingVideoSrcStore,
  currentPlayingMediaTypeStore,
  availableAudioInputDevicesStore,
  availableVideoInputDevicesStore,
  pendingRecorderSettingsStore,
  setRecordingsList,
  setTotalRecordings,
  setRecordingsPage,
  setRecordingsRowsPerPage,
  setRecordingsSortBy,
  setRecordingsSortOrder,
  setRecordingsSearchQuery,
  // setRecordingDrawerOpen, // Removed
  setSelectedRecording,
  setEditableRecording,
  setRecordingTypeFilter,
  setIsVideoModalOpen,
  setCurrentPlayingVideoSrc,
  setCurrentPlayingMediaType,
  setAvailableAudioInputDevices,
  setAvailableVideoInputDevices,
  setPendingRecorderSettings,
} from './stores/recordingStore';
import { useStore } from '@nanostores/react';
import { getFileStreamUrl } from '@/api/media';
import { recordingApi } from './api/recording';
import { ffmpegApi } from '@/api/ffmpeg';
import { setLoading, isLoading } from '@/stores/loadingStore';
import { showGlobalSnackbar as showSnackbar, SnackbarSeverity } from '@/stores/snackbarStore';
import {
  StartCameraRecordingDto,
  RecordingItem,
  SortField,
  SortOrder,
  RecordingType,
  StartScreenRecordingDto,
  DeviceDto,
} from './types/recording';
import VideoModal from '@/components/VideoModal';
import path from 'path-browserify';
import { showDialog, hideDialog } from '@/stores/dialogStore';
import AudioDeviceSelector from './AudioDeviceSelector';
import { TableListToolbar, FilterOption } from '@/components/ui/views/table/TableListToolbar';
import SettingsIcon from '@mui/icons-material/Settings';
import GlobalActionButton from '@/components/ui/GlobalActionButton'; // Import GlobalActionButton
import SaveIcon from '@mui/icons-material/Save'; // Import SaveIcon
import CancelIcon from '@mui/icons-material/Cancel'; // Import CancelIcon
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
  // const drawerOpen = useStore(recordingDrawerOpenStore); // Removed
  const selectedRecording = useStore(selectedRecordingStore);
  const editableRecording = useStore(editableRecordingStore);
  const typeFilter = useStore(recordingTypeFilterStore);
  const isVideoModalOpen = useStore(isVideoModalOpenStore);
  const currentPlayingVideoSrc = useStore(currentPlayingVideoSrcStore);
  const currentPlayingMediaType = useStore(currentPlayingMediaTypeStore);
  const availableAudioInputDevices = useStore(availableAudioInputDevicesStore);
  const availableVideoInputDevices = useStore(availableVideoInputDevicesStore);
  // Ref for media element
  const mediaElementRef = useRef<HTMLVideoElement | HTMLImageElement>(null);
  // Fetch recordings from API
  const fetchRecordingsData = useCallback(async () => {
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
  // Fetch available devices from API
  const fetchAvailableDevices = useCallback(async () => {
    setLoading('fetchDevices', true);
    try {
      const devices = await ffmpegApi.getAvailableDevices();
      setAvailableAudioInputDevices(devices.audioInputDevices);
      setAvailableVideoInputDevices(devices.videoInputDevices);
    } finally {
      setLoading('fetchDevices', false);
    }
  }, [setAvailableAudioInputDevices, setAvailableVideoInputDevices]);
  // Effect for fetching recording data based on pagination, sort, search, and filter
  useEffect(() => {
    fetchRecordingsData();
  }, [
    fetchRecordingsData,
    // Also trigger a fetch if recording state changes, as this implies a list update.
    // currentRecordingId and currentCameraRecordingId are implicitly handled by isScreenRecording/isCameraRecording
    isScreenRecording,
    isCameraRecording,
  ]);
  // Effect for fetching available devices (less frequent, different dependencies)
  useEffect(() => {
    fetchAvailableDevices();
  }, [fetchAvailableDevices]);
  // Screen Recording actions
  const handleStartScreenRecording = async () => {
    if (currentRecorderSettings.enableScreenAudio) {
      // Show dialog to select audio device
      showDialog({
        title: 'Select Audio Input',
        content: (
          <AudioDeviceSelector
            devices={availableAudioInputDevices}
            onSelect={async (selectedAudioDevice) => {
              hideDialog();
              await startScreenRecordingWithAudio(selectedAudioDevice);
            }}
            defaultSelection={currentRecorderSettings.screenAudioDevice}
          />
        ),
        maxWidth: 'xs',
        fullWidth: true,
        showCloseButton: true,
      });
    } else {
      // Start recording without audio
      await startScreenRecordingWithAudio(null); // No audio device
    }
  };
  const startScreenRecordingWithAudio = async (audioDevice: string | null) => {
    setLoading('startRecording', true);
    try {
      const dto: StartScreenRecordingDto = {
        name: `${currentRecorderSettings.namePrefix}-screen-record-${Date.now()}`,
        enableAudio: audioDevice !== null,
        audioDevice: audioDevice || undefined,
      };
      const res = await recordingApi.startRecording(dto);
      setIsScreenRecording(true);
      currentRecordingIdStore.set(res.id);
      fetchRecordingsData(); // Use fetchRecordingsData to trigger refetch
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
      fetchRecordingsData(); // Use fetchRecordingsData to trigger refetch
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
      fetchRecordingsData(); // Use fetchRecordingsData to trigger refetch
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
      fetchRecordingsData(); // Use fetchRecordingsData to trigger refetch
    } finally {
      setLoading('stopCameraRecording', false);
    }
  };
  const handleStopRecording = async (id: string, type: RecordingType) => {
    // Ensure the recording to stop is the currently active one for its type
    if (
      (type === 'screenRecord' && currentRecordingId !== id) ||
      (type === 'cameraRecord' && currentCameraRecordingId !== id)
    )
    {
// //       console.warn(`Attempted to stop a non-active recording of type ${type}. ID: ${id}`);
      return; // Do not proceed if it's not the currently active recording of its type
    }
    if (type === 'screenRecord') {
      setLoading('stopRecording', true);
      try {
        await recordingApi.stopRecording(id);
        setIsScreenRecording(false);
        currentRecordingIdStore.set(null);
        fetchRecordingsData(); // Use fetchRecordingsData to trigger refetch
      } finally {
        setLoading('stopRecording', false);
      }
    } else if (type === 'cameraRecord') {
      setLoading('stopCameraRecording', true);
      try {
        await recordingApi.stopCameraRecording(id);
        setIsCameraRecording(false);
        currentCameraRecordingIdStore.set(null);
        fetchRecordingsData(); // Use fetchRecordingsData to trigger refetch
      } finally {
        setLoading('stopCameraRecording', false);
      }
    }
  };
  const handleCaptureScreenshot = async () => {
    setLoading('captureScreenshot', true);
    try {
      await recordingApi.capture();
      fetchRecordingsData(); // Refresh the list to show the new screenshot
    } finally {
      setLoading('captureScreenshot', false);
    }
  };
  const handleDelete = async (id: string) => {
    setLoading('deleteRecording', true);
    try {
      await recordingApi.deleteRecording(id);
      fetchRecordingsData(); // Use fetchRecordingsData to trigger refetch
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
      fetchRecordingsData(); // Use fetchRecordingsData to trigger refetch
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
  // Updated handleSort to match TableList's onSortChange signature
  const handleSort = (field: string, newOrder: SortOrder) => {
    setRecordingsSortBy(field as SortField);
    setRecordingsSortOrder(newOrder);
    setRecordingsPage(0);
  };
  const handleSearch = () => setRecordingsPage(0);
  // Renamed from openDrawer to openRecordingInfoDialog
  const openRecordingInfoDialog = (recording: RecordingItem) => {
    setSelectedRecording(recording); // Set selected recording
    setEditableRecording({ // Initialize editable state
      name: recording.name,
      type: recording.type,
      data: recording.data, // Important: pass the current data object for editing
    });
    showDialog({
      title: `Recording Details: ${recording.name}`,
      content: (
        <RecordingInfoDialogContent
          onClose={handleCloseRecordingInfoDialog}
          onUpdate={handleUpdateRecording} // Pass the update handler
        />
      ),
      maxWidth: 'sm',
      fullWidth: true,
      showCloseButton: true,
      actions: (
        <GlobalActionButton
          globalActions={[
            {
              id: 'cancel-recording-info',
              label: 'Cancel',
              action: handleCloseRecordingInfoDialog,
              icon: <CancelIcon />,
              color: 'inherit',
              variant: 'outlined',
            },
            {
              id: 'save-recording-info',
              label: 'Save Changes',
              action: handleUpdateRecording,
              icon: <SaveIcon />,
              color: 'primary',
              variant: 'contained',
            },
          ]}
        />
      ),
      onClose: handleCloseRecordingInfoDialog, // Handle dialog close via backdrop/escape
    });
  };
  // Renamed from closeDrawer to handleCloseRecordingInfoDialog
  const handleCloseRecordingInfoDialog = () => {
    setSelectedRecording(null);
    setEditableRecording({}); // Clear editable state on close
    hideDialog();
  };
  // Modified handleUpdateRecording to read from store
  const handleUpdateRecording = async () => {
    console.log(selectedRecording, 'selectedRecording');
    if (!selectedRecording) return;
    const updatedRecordingData = editableRecordingStore.get(); // Get the latest editable state
    setLoading('updateRecording', true);
    try {
      await recordingApi.updateRecording(selectedRecording.id, updatedRecordingData);
      fetchRecordingsData(); // Use fetchRecordingsData to trigger refetch
      showSnackbar('Recording updated successfully!', 'success');
    } finally {
      setLoading('updateRecording', false);
    }
  };
  // This function will be called by the 'Save Changes' button in the GlobalDialog actions
  const handleUpdateRecordingAndCloseDialog = async () => {
    await handleUpdateRecording();
    handleCloseRecordingInfoDialog(); // Close dialog after saving
  };
  const handleOpenSettingsDialog = () => {
    const currentSettings = recorderSettingsStore.get();
    setPendingRecorderSettings(currentSettings); // Initialize pending settings with current active settings
    const handleSaveSettingsInternal = () => {
      const newSettings = pendingRecorderSettingsStore.get();
      if (newSettings) {
        recorderSettingsStore.set(newSettings); // Commit pending changes to main store
      }
      setPendingRecorderSettings(null); // Clear pending state
       hideDialog();
      // Close dialog
      showSnackbar(
        'Recorder settings saved successfully!',
        'success',
        { 'showCloseButton': true}
      );
    };
    const handleCancelSettingsInternal = () => {
      setPendingRecorderSettings(null); // Discard pending state
      hideDialog(); // Close dialog
      showSnackbar(
        'Recorder settings discarded.',
        'info',
        { 'showCloseButton': true}
      );
    };
    showDialog({
      title: 'Recorder Settings',
      content: <RecordingSettingsDialog />,
      maxWidth: 'sm',
      fullWidth: true,
      showCloseButton: true,
      onClose: handleCancelSettingsInternal, // Use cancel logic if dialog is closed via X or backdrop
      actions: (
        <GlobalActionButton
          globalActions={[
            {
              id: 'cancel-recorder-settings',
              label: 'Cancel',
              action: handleCancelSettingsInternal,
              icon: <CancelIcon />,
              color: 'inherit',
              variant: 'outlined',
            },
            {
              id: 'save-recorder-settings',
              label: 'Save Settings',
              action: handleSaveSettingsInternal,
              icon: <SaveIcon />,
              color: 'primary',
              variant: 'contained',
            },
          ]
        }/>
      ),
    });
  };
  const handleShareRecording = (recording: RecordingItem) => {
    showSnackbar(
      `Sharing recording: ${recording.name}`,
      'info',
    );
    // TODO: Implement actual sharing logic (e.g., generate shareable link, open share dialog)
// //     console.log('Share recording:', recording);
  };
  const handleUploadToGoogleDrive = (recording: RecordingItem) => {
    showSnackbar(
      `Uploading recording to Google Drive: ${recording.name}`,
      'info',
    );
    // TODO: Implement actual Google Drive upload logic (e.g., API call to backend service)
// //     console.log('Upload to Google Drive:', recording);
  };
  // Prepare filter options for TableListToolbar
  const typeFilterOptions: FilterOption[] = RECORDING_TYPES.map((type) => ({
    value: type,
    label: type,
  }));
  return (
    <Box className="flex flex-col gap-4 p-2">
      {(isLoading('recordingsList') ||
        isLoading('deleteRecording') ||
        isLoading('startRecording') ||
        isLoading('stopRecording') ||
        isLoading('startCameraRecording') ||
        isLoading('stopCameraRecording') ||
        isLoading('updateRecording') ||
        isLoading('convertToGif') ||
        isLoading('captureScreenshot') ||
        isLoading('fetchDevices')) && <LinearProgress />}
      <Box className="flex items-center justify-between">
        <RecordingControls
          isScreenRecording={isScreenRecording}
          isCameraRecording={isCameraRecording}
          isCapturing={isLoading('captureScreenshot')}
          onStartScreenRecording={handleStartScreenRecording}
          onStopScreenRecording={handleStopScreenRecording}
          onStartCameraRecording={handleStartCameraRecording}
          onStopCameraRecording={handleStopCameraRecording}
          onCapture={handleCaptureScreenshot}
        />
      </Box>
      <TableListToolbar
        title="Recordings"
        searchQuery={searchQuery}
        onSearchChange={setRecordingsSearchQuery}
        onApplySearch={handleSearch}
        filterBy={typeFilter}
        onFilterChange={setRecordingTypeFilter}
        filterOptions={typeFilterOptions}
        onRefresh={fetchRecordingsData}
        rightActions={[
          {
            id: 'recording-settings',
            label: 'Recording Settings',
            icon: <SettingsIcon />,
            action: handleOpenSettingsDialog,
            tooltip: 'Open recording settings',
          },
        ]}
      />
      <RecordingsTable
        recordings={recordings}
        total={totalRecordings}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setRecordingsPage}
        onRowsPerPageChange={setRecordingsRowsPerPage}
        onPlay={handlePlay}
        onDelete={handleDelete}
        onView={openRecordingInfoDialog} // Use the new dialog opener
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onConvertToGif={handleConvertToGif}
        onStopRecording={handleStopRecording}
        onShare={handleShareRecording}
        onUploadToGoogleDrive={handleUploadToGoogleDrive}
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
