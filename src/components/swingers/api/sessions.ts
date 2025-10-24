// /openvidu/api/sessions [POST,GET]
import { fetchWithBasicAuth, handleResponse, SLS_VIDU_URL } from '@/api/fetch';
import { ISwinger } from '@/components/swingers/types';

const API = `${SLS_VIDU_URL}/api`;

export const getSessions = async (): Promise<ISwinger[]> => {
  try {
    const response = await fetchWithBasicAuth(
      `${API}`,
      { method: 'GET' },
    );
    return handleResponse<ISwinger[]>(response);
  } catch (error) {
    console.error(
      `Error fetching swingers subscribers:`,
      error,
    );
    throw error;
  }
};

// /openvidu/api/sessions/<SESSION_ID> [GET,DELETE]

export const getSession = async (): Promise<ISwinger[]> => {
  try {
    const response = await fetchWithBasicAuth(
      `${API}`,
      { method: 'GET' },
    );
    return handleResponse<ISwinger[]>(response);
  } catch (error) {
    console.error(
      `Error fetching swingers subscribers:`,
      error,
    );
    throw error;
  }
};