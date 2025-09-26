import { getToken } from '@/stores/authStore';
export const API_BASE_URL = `/api`; // Changed to relative path for Vite proxy consistency

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

    throw new Error(typeof errorData === 'string' ? errorData : errorData.message || `API error: ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
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
