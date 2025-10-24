import { getToken } from '@/stores/authStore';
export const API_BASE_URL = `/api`; // Changed to relative path for Vite proxy consistency
export const SLS_API_URL = `/swingers`;
export const SLS_VIDU_URL = `/openvidu`;

export interface ApiError extends Error {
  statusCode?: number;
  message: string;
}

export const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = await response.text();
    }

    throw new Error(
      typeof errorData === 'string'
        ? errorData
        : errorData.message || `API error: ${response.status}`,
    );
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error('Error parsing JSON:', error);
      throw new Error('Failed to parse JSON response.');
    }
  } else {
    return response.text() as Promise<T>;
  }
};

export const fetchWithAuth = async (url: string, options?: RequestInit) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  return fetch(url, { ...options, headers });
};

export const fetchWithBasicAuth = async (
  url: string,
  options?: RequestInit,
) => {
  const basic_token = Buffer.from(
    `${import.meta.env.VITE_SLS_USERNAME}:${import.meta.env.VITE_SLS_API_KEY}`,
  ).toString('base64');
  const headers = {
    'Content-Type': 'application/json',
    ...(basic_token && { Authorization: `Basic ${basic_token}` }),
    ...options?.headers,
  };

  return fetch(url, { ...options, headers });
};
export const fetchWithToken = async (url: string, options?: RequestInit) => {
  const token = `${import.meta.env.VITE_SLS_API_KEY}`;
  const nUrl = `${url}?token=${token}`;
  const headers = {
    'Content-Type': 'application/json',
  };
  return fetch(nUrl, { ...options, headers });
};
