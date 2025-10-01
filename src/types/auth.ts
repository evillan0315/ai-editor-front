export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string; // Changed from 'username' to 'name' to align with backend RegisterDto
}