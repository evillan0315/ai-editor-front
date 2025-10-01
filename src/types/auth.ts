// src/types/auth.ts

export interface User {
  id: string;
  email: string;
  username: string;
  // Add other user properties like avatar, roles, etc.
}

export interface LoginUserPayload {
  email: string;
  password: string;
}

export interface RegisterUserPayload {
  email: string;
  password: string;
  username: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string; // Assuming JWT or similar token
}

export type AuthProvider = 'google' | 'github' | 'local';
