import { map } from 'nanostores';
import { persistentMap } from '@nanostores/persistent';

interface IAppPreviewStore {
  currentUrl: string;
  screenSize: 'mobile' | 'tablet' | 'desktop';
}

export const appPreviewStore = persistentMap<IAppPreviewStore>(
  'appPreview:',
  {
    currentUrl: '',
    screenSize: 'desktop',
  },
  { 
    encode: JSON.stringify, 
    decode: JSON.parse, 
  }
);
