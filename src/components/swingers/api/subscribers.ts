import { fetchWithToken, handleResponse, SLS_API_URL } from '@/api/fetch';
import { ISwinger } from '@/components/swingers/types';
import { getUniqueSubscribers } from '@/components/swingers/utils/subscriberUtils';

const SWINGERS_SUBSCRIBERS = `${SLS_API_URL}/subscribers`;


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
