import { getToken } from '@/stores/authStore'; // Import getToken from authStore

export const API_BASE_URL = `/api`; 

export interface ApiError extends Error {
  statusCode?: number;
  message: string;
  data?: any; // To hold parsed error body
}

// Handles the response from a fetch call, checks for errors, and parses JSON or text.
export const handleResponse = async <T>(response: Response): Promise<T> => {
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const text = await response.text(); // Consume body once as text

  let data: any;
  if (isJson && text.trim().length > 0) {
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.warn('Response content-type was JSON but failed to parse:', e, 'Raw text:', text);
      data = text; // Fallback to raw text if JSON parsing fails
    }
  } else {
    data = text; // If not JSON or empty, use raw text
  }

  if (!response.ok) {
    // Log detailed error information for debugging purposes
    console.error(`API Error - Status: ${response.status}, StatusText: ${response.statusText}, Raw Response: ${text}`);

    let detailedErrorMessage = `API error: ${response.status} ${response.statusText}`;

    if (typeof data === 'object' && data !== null) {
      // Try to extract a more specific message from the JSON response
      if (data.message) {
        detailedErrorMessage = data.message;
      } else if (data.error) { // Common in some API error structures
        detailedErrorMessage = data.error;
      } else {
        // If it's an object but no specific message field, stringify the whole object
        detailedErrorMessage = JSON.stringify(data);
      }
    } else if (typeof data === 'string' && data.trim().length > 0) {
      // Use raw text if it's a non-empty string
      detailedErrorMessage = data;
    }

    const error: ApiError = new Error(detailedErrorMessage);
    error.statusCode = response.status;
    error.data = data; // Always attach the parsed (or raw) response body for further inspection
    throw error;
  }

  return data as T;
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
