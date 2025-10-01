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
  const headers: HeadersInit = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  // Only set Content-Type: application/json if the body is not FormData
  // FormData handles its own Content-Type header (multipart/form-data)
  if (!(options?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(url, { ...options, headers });
};
