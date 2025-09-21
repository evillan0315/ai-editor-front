import { persistentAtom } from '@/utils/persistentAtom';

export const currentRecordingIdStore = persistentAtom<string | null>(
  'currentRecordingId',
  null,
);

export const isCurrentRecording = persistentAtom<boolean>('isRecording', false);

export const setIsRecording = (isRecording: boolean) => {
  isCurrentRecording.set(isRecording);
};

export const editRecordingStore = persistentAtom<any>('editRecording', {});
