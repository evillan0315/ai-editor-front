import { fetchWithToken, SLS_API_URL, SWINGERS_STREAMERS } from './fetch';
import { IStreamerEntity} from '@/components/swingers/types';

// Placeholder for future API calls related to streamers if any
export const getStreamers = async (): Promise<IStreamerEntity[]> => {
   try {
     return await fetchWithToken<IStreamerEntity[]>(SWINGERS_STREAMERS, { method: 'GET' });
   } catch (error) {
     console.error(`Error fetching streamers:`, error);
     throw error;
   }
};
