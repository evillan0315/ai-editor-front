import { fetchWithToken, SLS_API_URL } from '@/api/fetch';
import { ISwinger } from '@/components/swingers/types';

const SWINGERS_STREAMERS = `${SLS_API_URL}/streamers`;

// Placeholder for future API calls related to streamers if any
// Example: export const getStreamers = async (): Promise<ISwinger[]> => {
//   try {
//     return await fetchWithToken<ISwinger[]>(SWINGERS_STREAMERS, { method: 'GET' });
//   } catch (error) {
//     console.error(`Error fetching streamers:`, error);
//     throw error;
//   }
// };
