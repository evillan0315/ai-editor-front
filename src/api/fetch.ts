import { getToken } from '@/stores/authStore';

export const API_BASE_URL = `/api`; // Changed to relative path for Vite proxy consistency

export interface ApiError extends Error {
  statusCode?: number;
  message: string;
}

export class ResponseError extends Error implements ApiError {
  public statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ResponseError';
    this.statusCode = statusCode;

    // Set the prototype explicitly to make 'instanceof' work correctly
    // Required when extending Error in TypeScript for older JS environments
    Object.setPrototypeOf(this, ResponseError.prototype);
  }
}

export const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch (e) {
      // If response is not JSON, try to get as text
      errorData = await response.text();
    }

    const message = typeof errorData === 'string'
      ? errorData
      : errorData.message || `API error: ${response.status}`;
    const statusCode = response.status;

    throw new ResponseError(message, statusCode); // Throw custom error class
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      const data = await response.json();
      return data as T;
    } catch (error: unknown) {
      console.error('Error parsing JSON:', error);
      throw new ResponseError('Failed to parse JSON response.', response.status);
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
