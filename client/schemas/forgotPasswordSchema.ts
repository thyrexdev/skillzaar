import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address."),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address."),
  otp: z.string().min(6, "OTP must be 6 digits").max(6, "OTP must be 6 digits"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
