// src/components/recording/Recording.tsx
import { useEffect, useState, useCallback } from 'react';
import { Box, LinearProgress } from '@mui/material'; // Removed unused imports: TextField, Button, MenuItem
import { RecordingControls } from './RecordingControls';
import { RecordingStatus } from './RecordingStatus';
import { RecordingsTable, RecordingItem } from './RecordingsTable';
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
import { StartCameraRecordingDto } from '@/types';

type SortOrder = 'asc' | 'desc';
type SortField = 'name' | 'createdAt' | 'type' | 'status';

const RECORDING_TYPES = ['screenRecord', 'screenShot', 'cameraRecord']; // Updated with cameraRecord

export function Recording() {
  const isScreenRecording = useStore(isScreenRecordingStore); // Use renamed store
  const currentRecordingId = useStore(currentRecordingIdStore);

  const isCameraRecording = useStore(isCameraRecordingStore); // Use new camera store
  const currentCameraRecordingId = useStore(currentCameraRecordingIdStore);

  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [totalRecordings, setTotalRecordings] = useState(0);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [searchQuery, setSearchQuery] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecording, setSelectedRecording] =
    useState<RecordingItem | null>(null);
  const [editableRecording, setEditableRecording] = useState<
    Partial<RecordingItem>
  >({});
  const [typeFilter, setTypeFilter] = useState<string>('');
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
  }, [page, rowsPerPage, sortBy, sortOrder, searchQuery, typeFilter]); // Add typeFilter to dependencies

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings, isScreenRecording, currentRecordingId, isCameraRecording, currentCameraRecordingId]); // Add camera recording states

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
        cameraDevice: 'default',
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

  const handlePlay = (recording: RecordingItem) => {
    console.log(recording, 'recording');
  }
  const handleEdit = (id: string) => recordingApi.editRecording?.(id);

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
        editableRecording,
      );
      fetchRecordings();
      closeDrawer();
    } finally {
      setLoading('updateRecording', false);
    }
  };

  return (
    <Box className="flex flex-col gap-6">
      {(isLoading('recordingsList') ||
        isLoading('deleteRecording') ||
        isLoading('startRecording') ||
        isLoading('stopRecording') ||
        isLoading('startCameraRecording') ||
        isLoading('stopCameraRecording') ||
        isLoading('updateRecording')) && <LinearProgress />}

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
      />

      <RecordingsTable
        recordings={recordings}
        onPlay={handlePlay}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={openDrawer} // View info drawer
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
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
    </Box>
  );
}
