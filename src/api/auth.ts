import { loginSuccess, logout, setLoading, setError, getToken } from '@/stores/authStore';
import { API_BASE_URL, ResponseError, handleResponse, fetchWithAuth } from '@/api';
import { LoginRequest, RegisterRequest } from '@/types/auth';
import { UserProfile } from '@/types/user';

export interface LoginLocalResponse {
  access_token: string;
  refresh_token: string;
  user: UserProfile;
}
export interface RegisterLocalResponse {
  access_token: string;
  user: UserProfile;
}

export interface LogoutResponse {
  message: string;
}

// Renamed from CheckAuthResponse to MeResponseDto to be more precise about the DTO for /auth/me
export interface MeResponseDto {
  id: string;
  email: string;
  username: string | null;
  emailVerified: string;
  image: string;
  name: string;
  phone_number: string;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  role: 'ADMIN' | 'USER' | 'MANAGER' | 'DEVELOPER'; // Mirroring backend Role enum
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
      method: 'POST',
    });
    logout();
    return handleResponse<LogoutResponse>(response);
  } catch (error: unknown) {
    const errorMessage = (error instanceof ResponseError) ? error.message : 'An unknown error occurred during logout.';
    setError(errorMessage);
    return Promise.reject(error);
  } finally {
    setLoading(false);
  }
};

/**
 * Checks the current authentication status by calling the backend '/me' endpoint.
 * Updates the auth store based on the response.
 */
export const checkAuthStatus = async (): Promise<MeResponseDto> => {
  setLoading(true);
  setError(null);
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
    });
    const meData = await handleResponse<MeResponseDto>(response);
    if (meData && getToken()) {
      // Construct UserProfile from MeResponseDto
      const userProfile: UserProfile = {
        id: meData.id,
        email: meData.email,
        name: meData.name,
        image: meData.image,
        role: meData.role as UserProfile['role'], // Cast to ensure compatibility with UserProfile['role']
        username: meData.username,
      };
      loginSuccess(userProfile, getToken() || ''); // Pass userProfile and handle null/undefined token
    }
    return meData; // Return the full MeResponseDto
  } catch (error: unknown) {
    console.error('Failed to check authentication', error);
    const errorMessage = (error instanceof ResponseError) ? error.message : 'You are not logged in. Please login.'; // Refined error message access
    setError(errorMessage);
    return Promise.reject(error);
  } finally {
    setLoading(false);
  }
};

/**
 * Handles local email/password login.
 * @param credentials User's email and password.
 */
export const loginLocal = async (
  credentials: LoginRequest,
): Promise<LoginLocalResponse> => {
  setLoading(true);
  setError(null);
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    const authData = await handleResponse<LoginLocalResponse>(response); // Corrected property access
    if (authData && authData.access_token) {
      loginSuccess(authData.user, authData.access_token);
    }
    return authData;
  } catch (error: unknown) {
    console.error('Failed to authenticate:', error);
    const errorMessage = (error instanceof ResponseError) ? error.message : 'An unknown error message occurred during login.';
    setError(errorMessage);
    return Promise.reject(error);
  } finally {
    setLoading(false);
  }
};

/**
 * Handles local email/password registration.
 * @param userData User's registration data (email, password, username).
 */
export const registerLocal = async (
  userData: RegisterRequest,
): Promise<RegisterLocalResponse> => {
  setLoading(true);
  setError(null);
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    const authData = await handleResponse<RegisterLocalResponse>(response); // Corrected property access
    if (authData && authData.access_token) {
      loginSuccess(authData.user, authData.access_token); // Corrected property access
    }
    return authData;
  } catch (error: unknown) {
    console.error('Registration failed', error);
    const errorMessage = (error instanceof ResponseError) ? error.message : 'An unknown error message occurred during registration.';
    setError(errorMessage);
    return Promise.reject(error);
  } finally {
    setLoading(false);
  }
};
