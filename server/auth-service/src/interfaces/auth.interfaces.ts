import { Role } from '@vync/shared/src';

// Request interfaces
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

// Response interfaces
export interface AuthResponse {
  user: UserResponse;
  token: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: Role;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageResponse {
  message: string;
}

export interface ErrorResponse {
  error: string;
}

// JWT Payload interface
export interface JWTPayload {
  userId: string;
  role: Role;
}

// Service method return types
export interface AuthServiceRegisterResult {
  user: UserResponse;
  token: string;
}

export interface AuthServiceLoginResult {
  user: UserResponse;
  token: string;
}
