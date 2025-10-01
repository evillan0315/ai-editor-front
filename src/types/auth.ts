import { UserProfile } from './user';

// src/types/auth.ts

export interface User {
  id: string;
  email: string;
  username: string;
  // Add other user properties like avatar, roles, etc.
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface AuthResponse {
  user: UserProfile; // Changed to UserProfile for consistency
  accessToken: string; // Assuming JWT or similar token
}

export type AuthProvider = 'google' | 'github' | 'local';
