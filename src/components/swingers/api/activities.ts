import { fetchWithToken, handleResponse, SLS_API_URL } from '@/api/fetch';
import { ISwinger } from '@/components/swingers/types';

const SWINGERS_ACTIVITIES = `${SLS_API_URL}/activities`;