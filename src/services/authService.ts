import { loginSuccess, logout, setLoading, setError } from '@/stores/authStore';
import { UserProfile, LoginRequest, RegisterRequest } from '@/types/auth';

const API_BASE_URL = '/api/auth'; // Using proxy defined in vite.config.ts

/**
 * Handles logging out the user by calling the backend logout endpoint.
 * Clears local auth state.
 */
export const handleLogout = async () => {
  setLoading(true);
  setError(null);
  try {
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      // Backend is expected to clear httpOnly cookie
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Logout failed');
    }

    logout();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An unknown error occurred during logout.');
  } finally {
    setLoading(false);
  }
};

/**
 * Checks the current authentication status by calling the backend '/me' endpoint.
 * Updates the auth store based on the response.
 */
export const checkAuthStatus = async () => {
  setLoading(true);
  setError(null);
  try {
    const response = await fetch(`${API_BASE_URL}/me`);
    if (response.ok) {
      const user: UserProfile = await response.json();
      // Backend /me endpoint returns null if not logged in, or user object
      if (user && user.id) {
        // Check for a valid user object to ensure logged in
        loginSuccess(user);
      } else {
        logout(); // Explicitly log out if /me returns null/empty (e.g., after token expires)
      }
    } else {
      // If response not ok (e.g., 401 Unauthorized), it means user is not logged in.
      logout();
    }
  } catch (err) {
    // Network errors or other exceptions during the fetch call
    console.error('Failed to check authentication status:', err);
    setError('Failed to check authentication status. Please try again.');
    logout(); // Assume not logged in on network error
  } finally {
    setLoading(false);
  }
};

/**
 * Handles local email/password login.
 * @param credentials User's email and password.
 */
export const loginLocal = async (credentials: LoginRequest) => {
  setLoading(true);
  setError(null);
  try {
    // Corrected endpoint path to match backend AuthController
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
      n;
    }

    // Assuming the backend returns the user object and a token (if needed client-side)
    const user: UserProfile = { ...data.user, provider: 'local' };
    loginSuccess(user, data.access_token); // Use data.access_token as returned by backend
    return { success: true };
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An unknown error occurred during login.');
    return { success: false, message: err instanceof Error ? err.message : 'Unknown error' };
  } finally {
    setLoading(false);
  }
};

/**
 * Handles local email/password registration.
 * @param userData User's registration data (email, password, username).
 */
export const registerLocal = async (userData: RegisterRequest) => {
  setLoading(true);
  setError(null);
  try {
    // Corrected endpoint path to match backend AuthController
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    // Assuming the backend logs in the user directly after registration
    const user: UserProfile = { ...data.user, provider: 'local' };
    loginSuccess(user, data.access_token); // Use data.access_token as returned by backend
    return { success: true };
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An unknown error occurred during registration.');
    return { success: false, message: err instanceof Error ? err.message : 'Unknown error' };
  } finally {
    setLoading(false);
  }
};
