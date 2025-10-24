import { fetchWithToken, handleResponse, SLS_API_URL } from '@/api/fetch';
import { ISwinger } from '@/components/swingers/types';

const SWINGERS_ROOMS = `${SLS_API_URL}/rooms`;