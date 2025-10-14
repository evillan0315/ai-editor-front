import { persistentAtom } from '@/utils/persistentAtom';
import { IRecorderSettings } from '@/types/recording';

export const currentRecordingIdStore = persistentAtom<string | null>(
  'currentRecordingId',
  null,
);
export const isScreenRecordingStore = persistentAtom<boolean>(
  'isScreenRecording',
  false,
); // Renamed from isCurrentRecording for clarity

export const currentCameraRecordingIdStore = persistentAtom<string | null>(
  'currentCameraRecordingId',
  null,
);
export const isCameraRecordingStore = persistentAtom<boolean>(
  'isCameraRecording',
  false,
);

export const setIsScreenRecording = (isRecording: boolean) => {
  isScreenRecordingStore.set(isRecording);
};

export const setIsCameraRecording = (isRecording: boolean) => {
  isCameraRecordingStore.set(isRecording);
};

export const editRecordingStore = persistentAtom<any>('editRecording', {});

export const recorderSettingsStore = persistentAtom<IRecorderSettings>(
  'recorderSettings',
  {
    namePrefix: 'codejector-recording',
    screenResolution: '1920x1080',
    screenFramerate: 30,
    cameraResolution: '1280x720',
    cameraFramerate: 30,
    cameraAudioDevice: 'alsa_input.pci-0000_00_1b.0.analog-stereo',
    cameraVideoDevice: '/dev/video0',
  },
);