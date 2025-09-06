import {
  handleLogout,
  checkAuthStatus,
  loginLocal,
  registerLocal,
} from '@/services/authService';

// Re-export auth services for consistency with API folder structure
export { handleLogout, checkAuthStatus, loginLocal, registerLocal };
