import axios from "axios";
import { User } from "@/stores/useAuth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// For auth endpoints, we don't need the interceptors since we're not authenticated yet
// So we use a separate axios instance for auth

export const loginUser = async (email: string, password: string, role: string) => {
  const res = await axios.post(`${API_URL}/auth/login`, { email, password, role });
  return res.data as { user: User; token: string };
};

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  role: string
) => {
  const res = await axios.post(`${API_URL}/auth/register`, {
    name,
    email,
    password,
    role,
  });
  return res.data as { user: User; token: string };
};

// Password Reset Services
export const requestPasswordReset = async (email: string) => {
  const res = await axios.post(`${API_URL}/auth/forgot-password`, {
    email
  });
  return res.data;
};

export const verifyOtpAndResetPassword = async (
  email: string,
  otp: string,
  newPassword: string
) => {
  const res = await axios.post(`${API_URL}/auth/reset-password`, {
    email,
    otp,
    newPassword
  });
  return res.data;
};
