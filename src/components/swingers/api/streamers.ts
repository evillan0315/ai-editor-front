import { fetchWithToken, handleResponse, SLS_API_URL } from '@/api/fetch';
import { ISwinger } from '@/components/swingers/types';

const SWINGERS_STREAMERS = `${SLS_API_URL}/streamers`;