import { persistentAtom } from '@/utils/persistentAtom';



export const schemaStore = atom<string | null>('generatedSchema', null);
