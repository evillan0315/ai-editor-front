import { fetchWithToken, handleResponse, SLS_API_URL } from '@/api/fetch';
import { ISwinger } from '@/components/swingers/types';
import { getUniqueSubscribers } from '@/components/swingers/utils/subscriberUtils';

const SWINGERS_SUBSCRIBERS = `${SLS_API_URL}/subscribers`;

/**
 * Fetches all subscribers and returns a list of unique subscribers, 
 * where uniqueness is determined by the 'email' property.
 * This function delegates the uniqueness logic to `getUniqueSubscribers` utility.
 * @returns A promise that resolves to an array of unique ISwinger objects.
 */
export const getSubscribers = async (): Promise<ISwinger[]> => {
  try {
    const response = await fetchWithToken(
      `${SWINGERS_SUBSCRIBERS}`,
      { method: 'GET' },
    );
    const allSubscribers = await handleResponse<ISwinger[]>(response);
    return getUniqueSubscribers(allSubscribers);
  } catch (error) {
    console.error(
      `Error fetching swingers subscribers:`,
      error,
    );
    throw error;
  }
};
