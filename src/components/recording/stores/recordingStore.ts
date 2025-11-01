import { persistentAtom } from '@/utils/persistentAtom';
import { IRecorderSettings, RecordingItem, SortField, SortOrder, RecordingType, DeviceDto } from '../types/recording';

// Existing stores
export const currentRecordingIdStore = persistentAtom<string | null>(
  'currentRecordingId',
  null,
);
export const isScreenRecordingStore = persistentAtom<boolean>(
  'isScreenRecording',
  false,
);

export const currentCameraRecordingIdStore = persistentAtom<string | null>(
  'currentCameraRecordingId',
  null,
);
export const isCameraRecordingStore = persistentAtom<boolean>(
  'isCameraRecording',
  false,
);

// New stores for Recording.tsx states
export const recordingsListStore = persistentAtom<RecordingItem[]>(
  'recordingsList',
  [],
);
export const totalRecordingsStore = persistentAtom<number>(
  'totalRecordings',
  0,
);
export const recordingsPageStore = persistentAtom<number>(
  'recordingsPage',
  0,
);
export const recordingsRowsPerPageStore = persistentAtom<number>(
  'recordingsRowsPerPage',
  10,
);
export const recordingsSortByStore = persistentAtom<SortField>(
  'recordingsSortBy',
  'createdAt',
);
export const recordingsSortOrderStore = persistentAtom<SortOrder>(
  'recordingsSortOrder',
  'desc',
);
export const recordingsSearchQueryStore = persistentAtom<string>(
  'recordingsSearchQuery',
  '',
);
export const recordingDrawerOpenStore = persistentAtom<boolean>(
  'recordingDrawerOpen',
  false,
);
export const selectedRecordingStore = persistentAtom<RecordingItem | null>(
  'selectedRecording',
  null,
);
export const editableRecordingStore = persistentAtom<Partial<RecordingItem>>(
  'editableRecording',
  {}, // Store the editable form state
);
export const recordingTypeFilterStore = persistentAtom<RecordingType | ''>(
  'recordingTypeFilter',
  '',
);
// Removed isRecordingSettingsDialogOpenStore as GlobalDialog manages its open state
export const isVideoModalOpenStore = persistentAtom<boolean>(
  'isVideoModalOpen',
  false,
);
export const currentPlayingVideoSrcStore = persistentAtom<string | null>(
  'currentPlayingVideoSrc',
  null,
);
export const currentPlayingMediaTypeStore = persistentAtom<
  'video' | 'gif' | 'image'
>('currentPlayingMediaType', 'video');

// New stores for available devices
export const availableAudioInputDevicesStore = persistentAtom<DeviceDto[]>(
  'availableAudioInputDevices',
  [],
);
export const availableVideoInputDevicesStore = persistentAtom<DeviceDto[]>(
  'availableVideoInputDevices',
  [],
);

// Setters
export const setIsScreenRecording = (isRecording: boolean) => {
  isScreenRecordingStore.set(isRecording);
};

export const setIsCameraRecording = (isRecording: boolean) => {
  isCameraRecordingStore.set(isRecording);
};

export const setRecordingsList = (recordings: RecordingItem[]) => {
  recordingsListStore.set(recordings);
};

export const setTotalRecordings = (total: number) => {
  totalRecordingsStore.set(total);
};

export const setRecordingsPage = (page: number) => {
  recordingsPageStore.set(page);
};

export const setRecordingsRowsPerPage = (rowsPerPage: number) => {
  recordingsRowsPerPageStore.set(rowsPerPage);
};

export const setRecordingsSortBy = (sortBy: SortField) => {
  recordingsSortByStore.set(sortBy);
};

export const setRecordingsSortOrder = (sortOrder: SortOrder) => {
  recordingsSortOrderStore.set(sortOrder);
};

export const setRecordingsSearchQuery = (query: string) => {
  recordingsSearchQueryStore.set(query);
};

export const setRecordingDrawerOpen = (open: boolean) => {
  recordingDrawerOpenStore.set(open);
};

export const setSelectedRecording = (recording: RecordingItem | null) => {
  selectedRecordingStore.set(recording);
};

export const setEditableRecording = (editable: Partial<RecordingItem>) => {
  editableRecordingStore.set(editable);
};

export const setRecordingTypeFilter = (typeFilter: RecordingType | '') => {
  recordingTypeFilterStore.set(typeFilter);
};

// Removed setIsRecordingSettingsDialogOpen

export const setIsVideoModalOpen = (open: boolean) => {
  isVideoModalOpenStore.set(open);
};

export const setCurrentPlayingVideoSrc = (src: string | null) => {
  currentPlayingVideoSrcStore.set(src);
};

export const setCurrentPlayingMediaType = (
  type: 'video' | 'gif' | 'image',
) => {
  currentPlayingMediaTypeStore.set(type);
};

export const setAvailableAudioInputDevices = (devices: DeviceDto[]) => {
  availableAudioInputDevicesStore.set(devices);
};

export const setAvailableVideoInputDevices = (devices: DeviceDto[]) => {
  availableVideoInputDevicesStore.set(devices);
};

export const recorderSettingsStore = persistentAtom<IRecorderSettings>(
  'recorderSettings',
  {
    namePrefix: 'codejector-recording',
    screenResolution: '1920x1080',
    screenFramerate: 30,
    enableScreenAudio: false, // New: Default to no audio for screen recording
    screenAudioDevice: 'default', // New: Default audio device for screen recording
    cameraResolution: '1280x720',
    cameraFramerate: 30,
    cameraVideoDevice: '/dev/video0',
    cameraAudioDevice: 'default', // Changed default to 'default' for flexibility
  },
);
