import { getToken } from '@/stores/authStore'; // Import getToken from authStore

export const API_BASE_URL = `/api`; 

export interface ApiError extends Error {
  statusCode?: number;
  message: string;
}

// Handles the response from a fetch call, checks for errors, and parses JSON or text.
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
// Generic fetch wrapper with token for authenticated requests
export async function fetchWithToken(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const token = `${import.meta.env.VITE_SLS_API_KEY}`;
  const url = `${input}?token=${token}`;
  const headers = {
    'Content-Type': 'application/json',
    ...init?.headers,
  };

  return fetch(url, {
    ...init,
    headers,
  });
}

// Fetch wrapper with Basic Auth for OpenVidu server
export async function fetchWithBasicAuth(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const OPENVIDU_SERVER_SECRET = import.meta.env.VITE_SLS_API_KEY;
  const OPENVIDU_SERVER_USERNAME = import.meta.env.VITE_SLS_USERNAME || 'OPENVIDUAPP'; // Default OpenVidu username
  
  if (!OPENVIDU_SERVER_SECRET) {
    throw new Error('VITE_SLS_API_KEY is not defined in environment variables.');
  }

  const basicAuth = btoa(`${OPENVIDU_SERVER_USERNAME}:${OPENVIDU_SERVER_SECRET}`);
  const headers = {
    'Authorization': `Basic ${basicAuth}`,
    'Content-Type': 'application/json',
    ...init?.headers,
  };

  return fetch(input, {
    ...init,
    headers,
  });
}

// Export URLs from Vite env for convenience
export const SLS_API_URL = '/swingers';
export const SLS_VIDU_URL = '/openvidu';
