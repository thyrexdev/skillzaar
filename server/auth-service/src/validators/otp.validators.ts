import { z } from "zod";
import { OtpType } from "@frevix/shared/src/generated/prisma";

export const requestOtpSchema = z.object({
  email: z.string().email("Invalid email format"),
  type: z.nativeEnum(OtpType, {
    errorMap: () => ({ message: "OTP type must be one of: PASSWORD_RESET, EMAIL_VERIFICATION, TWO_FACTOR_AUTH, ACCOUNT_VERIFICATION" })
  }),
});

export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string()
    .min(4, "OTP must be at least 4 characters")
    .max(8, "OTP must be at most 8 characters")
    .regex(/^\d+$/, "OTP must contain only numbers"),
  type: z.nativeEnum(OtpType, {
    errorMap: () => ({ message: "OTP type must be one of: PASSWORD_RESET, EMAIL_VERIFICATION, TWO_FACTOR_AUTH, ACCOUNT_VERIFICATION" })
  }),
});
