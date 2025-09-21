import { map } from 'nanostores';
import { UserProfile, AuthState } from '@/types/auth';

export const authStore = map<AuthState>({
  isLoggedIn: false,
  user: null,
  loading: true,
  error: null,
});

export const getToken = () => localStorage.getItem('token');

export const loginSuccess = (user: UserProfile, token?: string) => {
  if (token) localStorage.setItem('token', token);
  authStore.set({
    isLoggedIn: true,
    user,
    loading: false,
    error: null,
  });
};

export const logout = () => {
  localStorage.removeItem('token');
  authStore.set({
    isLoggedIn: false,
    user: null,
    loading: false,
    error: null,
  });
};

export const setLoading = (isLoading: boolean) =>
  authStore.setKey('loading', isLoading);

export const setError = (message: string | null) =>
  authStore.setKey('error', message);
