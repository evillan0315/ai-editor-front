import { loginSuccess, logout, setLoading, setError, getToken } from '@/stores/authStore';
import { API_BASE_URL, ApiError, handleResponse, fetchWithAuth } from '@/api';
import { UserProfile, LoginRequest, RegisterRequest } from '@/types/auth';

export interface LoginLocalResponse {
  access_token: string;
  refresh_token:string;
  user: UserProfile
}
export interface RegisterLocalResponse {
  access_token: string;
  user: UserProfile
}

export interface LogoutResponse {
  message: string;
}
export interface CheckAuthResponse {
  id: string;
  email: string;
  username: string | null,
  emailVerified: string;
  image: string;
  name: string;
  phone_number: string;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  role: 'ADMIN' | 'USER' | 'MANAGER' | 'DEVELOPER';
  passwordResetToken: string | null;
  passwordResetExpiresAt: string | null;
}
/**
 * Handles logging out the user by calling the backend logout endpoint.
 * Clears local auth state.
 */
export const handleLogout = async (): Promise<LogoutResponse> => {
  setLoading(true);
  setError(null);
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/logout`, {
      method: 'POST'
    });
    return handleResponse<LogoutResponse>(response);
  } catch (error: ApiError) {
    setError(error.message || 'An unknown error occurred during logout.');
  } finally {
    setLoading(false);
  }
};

/**
 * Checks the current authentication status by calling the backend '/me' endpoint.
 * Updates the auth store based on the response.
 */
export const checkAuthStatus = async (): Promise<CheckAuthResponse> => {
  setLoading(true);
  setError(null);
  try {
    
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/me`, {
      method: 'GET'
    });
    console.log(response, 'response');
    const authData = await handleResponse<CheckAuthResponse>(response);
    console.log(authData, 'authData');
    if(authData && getToken()){
      loginSuccess(authData.user, getToken());
    }
    return handleResponse<CheckAuthResponse>(response);
  } catch (error) {
    console.error('Failed to check authentication', error);
    setError(error.message || 'You are not logged in. Please login.');
  } finally {
    setLoading(false);
  }
};

/**
 * Handles local email/password login.
 * @param credentials User's email and password.
 */
export const loginLocal = async (credentials: LoginRequest): Promise<LoginLocalResponse> => {
  setLoading(true);
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
            headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    const authData = await handleResponse<LoginLocalResponse>(response);
    if(authData && authData.access_token){
      loginSuccess(authData.user, authData.access_token);
    }
    return authData;
  } catch (error: ApiError) {
    console.error('Failed to authenticate:', error);
    setError(error.message || 'An unknown error message occurred during login.');
  } finally {
    setLoading(false);
  }
};

/**
 * Handles local email/password registration.
 * @param userData User's registration data (email, password, username).
 */
export const registerLocal = async (userData: RegisterRequest): Promise<RegisterLocalResponse> => {
  setLoading(true);
  setError(null);
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
            headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    if(response && response.access_token){
      loginSuccess(response.user, response.access_token);
    }
    return handleResponse<RegisterLocalResponse>(response);
  } catch (error: ApiError) {
    console.error('Registration failed', error);
    setError(error.message || 'An unknown error message occurred during registration.');
  } finally {
    setLoading(false);
  }
};

