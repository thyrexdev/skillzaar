import { Otp, OtpStatus, OtpType } from '@vync/shared/src/generated/prisma';
import { OtpEmailType } from '../utils/sendOtpEmail';

// Request interfaces
export interface RequestOtpRequest {
  email: string;
  type: OtpEmailType;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
  type: OtpEmailType;
}

// Response interfaces
export interface OtpResponse {
  message: string;
  expiresAt?: Date;
}

export interface OtpVerifyResponse {
  success: boolean;
  message: string;
}

// Error response interface
export interface OtpErrorResponse {
  error: string;
  details?: any;
}

// Service methods interfaces
export interface CreateAndSendOtpResult {
  message: string;
  expiresAt: Date;
}

export interface VerifyOtpResult {
  success: boolean;
  message: string;
}
