import { prisma } from "@vync/shared";
import { 
  cacheUtils, 
  redis, 
  pipelineUtils, 
  redisMonitoring, 
  monitoringMiddleware 
} from "@vync/cache";
import { generateOtp } from "../utils/generateOtp";
import { sendOtpEmail, OtpEmailType } from "../utils/sendOtpEmail";
import { OTP_CONFIGS } from "../config/otpConfig";
import { logger } from "@vync/config";
import {
  CreateAndSendOtpResult,
  VerifyOtpResult
} from "../interfaces/otp.interfaces";

interface CachedOtp {
  email: string;
  otp: string;
  type: OtpEmailType;
  attempts: number;
  expiresAt: string;
  createdAt: string;
}

/**
 * OTP cache key builders
 */
const otpKeys = {
  pending: (email: string, type: OtpEmailType) => `otp:pending:${email}:${type}`,
  rateLimit: (email: string, type: OtpEmailType) => `otp:ratelimit:${email}:${type}`,
  attempts: (email: string, type: OtpEmailType) => `otp:attempts:${email}:${type}`,
};

export const OtpService = {
  async createAndSendOtp(email: string, otpType: OtpEmailType): Promise<CreateAndSendOtpResult> {
    const config = OTP_CONFIGS[otpType];
    const now = new Date();
    
    // Check rate limiting using Redis
    const rateLimitKey = otpKeys.rateLimit(email, otpType);
    try {
      const rateLimitExists = await redis.exists(rateLimitKey);
      if (rateLimitExists) {
        throw new Error("Please wait before requesting another OTP");
      }
    } catch (error) {
      logger.error('Redis rate limit check failed, falling back to database:', error);
      // Fallback to database check
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
    }

    // Invalidate any existing pending OTPs (both Redis and database)
    const pendingKey = otpKeys.pending(email, otpType);
    const attemptsKey = otpKeys.attempts(email, otpType);
    
    try {
      await redis.del(pendingKey);
      await redis.del(attemptsKey);
    } catch (error) {
      logger.error('Failed to clear Redis OTP cache:', error);
    }

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
    const ttlSeconds = config.expiryMinutes * 60;

    // Store in database
    await prisma.otp.create({
      data: {
        email,
        otp,
        type: otpType,
        expiresAt,
        attempts: 0,
      },
    });

    // Cache OTP in Redis using pipeline for better performance
    const monitoredOperation = monitoringMiddleware.withOtpMonitoring(
      'create',
      async () => {
        const cachedOtp: CachedOtp = {
          email,
          otp,
          type: otpType,
          attempts: 0,
          expiresAt: expiresAt.toISOString(),
          createdAt: now.toISOString(),
        };
        
        // Use pipeline for batch OTP operations
        const result = await pipelineUtils.batchOtpOperations(
          email,
          otpType,
          cachedOtp,
          ttlSeconds
        );
        
        if (!result.success) {
          throw new Error(`OTP caching failed: ${result.errors.filter(e => e).length} errors`);
        }
        
        return result;
      }
    );
    
    try {
      await monitoredOperation();
      redisMonitoring.recordCacheSet('otp_create', email, JSON.stringify({ email, otpType }).length);
      logger.debug(`OTP cached in Redis for ${email}:${otpType}`);
    } catch (error) {
      redisMonitoring.recordError('otp_create', 'OtpCacheError', error instanceof Error ? error.message : 'Unknown error');
      logger.error('Failed to cache OTP in Redis:', error);
      // Continue without caching
    }

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
    const pendingKey = otpKeys.pending(email, otpType);
    const attemptsKey = otpKeys.attempts(email, otpType);

    let cachedOtp: CachedOtp | null = null;
    let currentAttempts = 0;

    // Try to get OTP from Redis cache first
    try {
      cachedOtp = await cacheUtils.getJSON<CachedOtp>(pendingKey);
      if (cachedOtp) {
        const attemptsStr = await redis.get(attemptsKey);
        currentAttempts = parseInt(attemptsStr || '0');
        
        // Check if cached OTP is expired
        if (new Date(cachedOtp.expiresAt) < now) {
          await redis.del(pendingKey);
          await redis.del(attemptsKey);
          cachedOtp = null;
        }
      }
    } catch (error) {
      logger.error('Failed to get OTP from Redis cache:', error);
      cachedOtp = null;
    }

    // If not found in cache, fall back to database
    let otpRecord = null;
    if (!cachedOtp) {
      otpRecord = await prisma.otp.findFirst({
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

      currentAttempts = otpRecord.attempts;
    }

    // Check max attempts
    if (currentAttempts >= config.maxAttempts) {
      if (cachedOtp) {
        await redis.del(pendingKey);
        await redis.del(attemptsKey);
      }
      if (otpRecord) {
        await prisma.otp.update({
          where: { id: otpRecord.id },
          data: { status: "EXPIRED" },
        });
      }
      throw new Error("Maximum verification attempts exceeded");
    }

    // Increment attempts
    const newAttempts = currentAttempts + 1;
    
    if (cachedOtp) {
      try {
        await redis.set(attemptsKey, newAttempts.toString());
      } catch (error) {
        logger.error('Failed to update attempts in Redis:', error);
      }
    }
    
    if (otpRecord) {
      await prisma.otp.update({
        where: { id: otpRecord.id },
        data: {
          attempts: newAttempts,
          lastAttempt: now,
        },
      });
    }

    // Check if OTP matches
    const storedOtp = cachedOtp ? cachedOtp.otp : otpRecord?.otp;
    if (storedOtp !== otp) {
      const remainingAttempts = config.maxAttempts - newAttempts;
      throw new Error(`Invalid OTP. ${remainingAttempts} attempts remaining.`);
    }

    // Mark OTP as verified and clean up cache
    try {
      await redis.del(pendingKey);
      await redis.del(attemptsKey);
    } catch (error) {
      logger.error('Failed to clean up OTP cache:', error);
    }

    if (otpRecord) {
      await prisma.otp.update({
        where: { id: otpRecord.id },
        data: {
          status: "VERIFIED",
          verifiedAt: now,
        },
      });
    } else {
      // If we only had cached data, find and update the database record
      const dbRecord = await prisma.otp.findFirst({
        where: {
          email,
          type: otpType,
          status: "PENDING",
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (dbRecord) {
        await prisma.otp.update({
          where: { id: dbRecord.id },
          data: {
            status: "VERIFIED",
            verifiedAt: now,
          },
        });
      }
    }

    logger.info(`OTP verified successfully for ${email}:${otpType}`);
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
