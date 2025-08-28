import { prisma } from "@vync/shared";
import { generateOtp } from "../utils/generateOtp";
import { sendOtpEmail, OtpEmailType } from "../utils/sendOtpEmail";
import { OTP_CONFIGS } from "../config/otpConfig";
import { logger } from "@vync/config";
import {
  CreateAndSendOtpResult,
  VerifyOtpResult
} from "../interfaces/otp.interfaces";

export const OtpService = {
  async createAndSendOtp(email: string, otpType: OtpEmailType): Promise<CreateAndSendOtpResult> {
    const config = OTP_CONFIGS[otpType];
    const now = new Date();

    // Check for recent OTP requests (rate limiting)
    const recentOtp = await prisma.otp.findFirst({
      where: {
        email,
        type: otpType,
        createdAt: {
          gte: new Date(now.getTime() - 2 * 60 * 1000), // 2 minutes ago
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (recentOtp) {
      throw new Error("Please wait before requesting another OTP");
    }

    // Invalidate any existing pending OTPs for this email and type
    await prisma.otp.updateMany({
      where: {
        email,
        type: otpType,
        status: "PENDING",
      },
      data: {
        status: "EXPIRED",
      },
    });

    // Generate and create new OTP
    const otp = generateOtp(config.length);
    const expiresAt = new Date(now.getTime() + config.expiryMinutes * 60 * 1000);

    await prisma.otp.create({
      data: {
        email,
        otp,
        type: otpType,
        expiresAt,
        attempts: 0,
      },
    });

    // Send OTP via email
    await sendOtpEmail(email, otp, otpType);

    logger.info(`OTP sent successfully to ${email} for type ${otpType}`);
    return {
      message: "OTP sent successfully",
      expiresAt,
    };
  },

  async verifyOtp(email: string, otp: string, otpType: OtpEmailType): Promise<VerifyOtpResult> {
    const config = OTP_CONFIGS[otpType];
    const now = new Date();

    // Find the most recent pending OTP
    const otpRecord = await prisma.otp.findFirst({
      where: {
        email,
        type: otpType,
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      throw new Error("No pending OTP found");
    }

    // Check if OTP is expired
    if (otpRecord.expiresAt < now) {
      await prisma.otp.update({
        where: { id: otpRecord.id },
        data: { status: "EXPIRED" },
      });
      throw new Error("OTP has expired");
    }

    // Check max attempts
    if (otpRecord.attempts >= config.maxAttempts) {
      await prisma.otp.update({
        where: { id: otpRecord.id },
        data: { status: "EXPIRED" },
      });
      throw new Error("Maximum verification attempts exceeded");
    }

    // Increment attempts
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: {
        attempts: otpRecord.attempts + 1,
        lastAttempt: now,
      },
    });

    // Check if OTP matches
    if (otpRecord.otp !== otp) {
      const remainingAttempts = config.maxAttempts - (otpRecord.attempts + 1);
      throw new Error(`Invalid OTP. ${remainingAttempts} attempts remaining.`);
    }

    // Mark OTP as verified
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: {
        status: "VERIFIED",
        verifiedAt: now,
      },
    });

    return {
      success: true,
      message: "OTP verified successfully",
    };
  },

  async cleanupExpiredOtps(): Promise<void> {
    const now = new Date();
    await prisma.otp.updateMany({
      where: {
        expiresAt: {
          lt: now,
        },
        status: "PENDING",
      },
      data: {
        status: "EXPIRED",
      },
    });
  },
};
