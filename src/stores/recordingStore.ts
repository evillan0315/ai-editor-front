import { persistentAtom } from '@/utils/persistentAtom';

export const currentRecordingIdStore = persistentAtom<string | null>(
  'currentRecordingId',
  null,
);
