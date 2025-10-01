import { useEffect, useState, useCallback, useRef } from 'react';
import { Box, LinearProgress } from '@mui/material';
import { RecordingControls } from './RecordingControls';
import { RecordingStatus } from './RecordingStatus';
import { RecordingsTable } from './RecordingsTable';
import { RecordingsPagination } from './RecordingsPagination';
import { RecordingSearchBar } from './RecordingSearchBar';
import { RecordingInfoDrawer } from './RecordingInfoDrawer';
import {
  isScreenRecordingStore,
  currentRecordingIdStore,
  setIsScreenRecording,
  isCameraRecordingStore,
  currentCameraRecordingIdStore,
  setIsCameraRecording,
} from '@/stores/recordingStore';
import { useStore } from '@nanostores/react';

import { getFileStreamUrl } from '@/api/media';
import { recordingApi } from '@/api/recording';
import { setLoading, isLoading } from '@/stores/loadingStore';
import { StartCameraRecordingDto, RecordingItem } from '@/types';
import VideoModal from '@/components/VideoModal';
import path from 'path-browserify';

type SortOrder = 'asc' | 'desc';
type SortField = keyof RecordingItem; // MODIFIED: Widened to keyof RecordingItem to match RecordingsTableProps

const RECORDING_TYPES = ['screenRecord', 'screenShot', 'cameraRecord'];

export function Recording() {
  const isScreenRecording = useStore(isScreenRecordingStore);
  const currentRecordingId = useStore(currentRecordingIdStore);

  const isCameraRecording = useStore(isCameraRecordingStore);
  const currentCameraRecordingId = useStore(currentCameraRecordingIdStore);

  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [totalRecordings, setTotalRecordings] = useState(0);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [searchQuery, setSearchQuery] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<RecordingItem | null>(null);
  const [editableRecording, setEditableRecording] = useState<
    Partial<RecordingItem>
  >({});
  const [typeFilter, setTypeFilter] = useState<string>('');

  // State for VideoModal / MediaModal
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [currentPlayingVideoSrc, setCurrentPlayingVideoSrc] = useState<
    string | null
  >(null);
  const [currentPlayingMediaType, setCurrentPlayingMediaType] = useState<
    'video' | 'gif' | 'image'
  >('video');
  const mediaElementRef = useRef<HTMLVideoElement | HTMLImageElement>(null);

  // Fetch recordings from API
  const fetchRecordings = useCallback(async () => {
    setLoading('recordingsList', true);
    try {
      const data = await recordingApi.getRecordings({
        page: page + 1,
        pageSize: rowsPerPage, // MODIFIED: Correct property for DTO
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
        type: r.type,
        status: r.status,
        path: r.path,
        createdById: r.createdById,
        data: r.data,
      }));

      setRecordings(items);
      setTotalRecordings(data.total);

      if (data.items.length === 0 && page > 0) setPage(page - 1);
    } finally {
      setLoading('recordingsList', false);
    }
  }, [page, rowsPerPage, sortBy, sortOrder, searchQuery, typeFilter]);

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
        cameraDevice: ['/dev/video0'],
        audioDevice: ['alsa_input.pci-0000_00_1b.0.analog-stereo'],
        resolution: '1280x720',
        framerate: 30,
        name: `camera-record-${Date.now()}`,
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

      // Update recording data with animatedGif path
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
    (_htmlMediaElement: HTMLVideoElement) => {},
    [],
  );

  // MODIFIED: Removed handleEdit as per the thought process.
  // const handleEdit = (id: string) => recordingApi.editRecording?.(id);

  // Pagination
  const handlePageChange = (_: unknown, newPage: number) => setPage(newPage);
  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Sorting
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else setSortBy(field);
    setPage(0);
  };

  // Search
  const handleSearch = () => setPage(0);

  // Drawer
  const openDrawer = (recording: RecordingItem) => {
    setSelectedRecording(recording);
    setEditableRecording({ name: recording.name, type: recording.type });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setSelectedRecording(null);
    setEditableRecording({});
    setDrawerOpen(false);
  };

  const handleUpdateRecording = async () => {
    if (!selectedRecording) return;
    setLoading('updateRecording', true);
    try {
      await recordingApi.updateRecording(
        selectedRecording.id,
        editableRecording as any, // MODIFIED: Casting to any for now as editableRecording can have extra fields not explicitly in UpdateRecordingDto
      );
      fetchRecordings();
      closeDrawer();
    } finally {
      setLoading('updateRecording', false);
    }
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
        />
        <RecordingStatus />
      </Box>

      <RecordingSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
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
