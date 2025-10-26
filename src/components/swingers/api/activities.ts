import { handleResponse, fetchWithToken, SLS_API_URL } from './fetch';
import { getConnections } from '@/components/swingers/api/connections';
import { IActivity, IConnection  } from '@/components/swingers/types';

const SWINGERS_ACTIVITIES = `${SLS_API_URL}/activities`;
const token = `${import.meta.env.VITE_SLS_API_KEY}`;

export const getDefaultClient = async (): Promise<IActivity[]> => {
  try {
    const response = await fetch(`${SWINGERS_ACTIVITIES}?token=${token}&_sort=created_at:DESC&_limit=10`);
    
    return handleResponse<IActivity[]>(response);
  } catch (error) {
    console.error(`Error fetching default activity`, error);
    throw error;
  }
};