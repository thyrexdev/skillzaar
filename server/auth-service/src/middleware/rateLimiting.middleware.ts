import { Context, Next } from 'hono';
import { rateLimitUtils } from '@vync/cache';
import { logger } from '@vync/config';

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  keyGenerator?: (c: Context) => string;
  skipSuccessfulRequests?: boolean;
  message?: string;
}

/**
 * Get default identifier using IP address
 */
const getDefaultIdentifier = (c: Context): string => {
  const forwardedFor = c.req.header('X-Forwarded-For');
  const realIp = c.req.header('X-Real-IP');
  
  let ip = 'unknown';
  
  if (forwardedFor) {
    ip = forwardedFor.split(',')[0].trim();
  } else if (realIp) {
    ip = realIp;
  } else {
    ip = 'fallback';
  }
  
  return `ip:${ip}`;
};

/**
 * Extract email from request body
 */
const getEmailFromRequest = async (c: Context): Promise<string | null> => {
  try {
    const body = await c.req.json();
    return body.email || null;
  } catch {
    return null;
  }
};

/**
 * Rate limiting middleware factory
 */
export const rateLimitMiddleware = (config: RateLimitConfig) => {
  return async (c: Context, next: Next) => {
    try {
      // Generate rate limit key
      const identifier = config.keyGenerator 
        ? config.keyGenerator(c)
        : getDefaultIdentifier(c);
      
      // Check rate limit
      const result = await rateLimitUtils.checkRateLimit(
        identifier,
        config.maxRequests,
        config.windowSeconds
      );

      // Add rate limit headers
      c.res.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
      c.res.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      c.res.headers.set('X-RateLimit-Reset', result.resetTime.toString());

      if (!result.allowed) {
        logger.warn(`Rate limit exceeded for identifier: ${identifier}`);
        return c.json({
          error: config.message || 'Rate limit exceeded. Please try again later.',
          retryAfter: result.resetTime
        }, 429);
      }

      await next();

      // If skipSuccessfulRequests is true and the response is successful,
      // we might want to remove the request from the counter (for login attempts)
      if (config.skipSuccessfulRequests && c.res.status >= 200 && c.res.status < 300) {
        logger.debug(`Successful request for identifier: ${identifier}`);
      }

    } catch (error) {
      logger.error('Rate limiting middleware error:', error);
      // Continue without rate limiting on error to avoid blocking users
      await next();
    }
  };
};

/**
 * Email-based rate limiting middleware
 */
export const emailRateLimitMiddleware = (config: RateLimitConfig) => {
  return async (c: Context, next: Next) => {
    try {
      const email = await getEmailFromRequest(c);
      
      if (email) {
        const identifier = `email:${email}`;
        
        const result = await rateLimitUtils.checkRateLimit(
          identifier,
          config.maxRequests,
          config.windowSeconds
        );

        if (!result.allowed) {
          logger.warn(`Email rate limit exceeded for: ${email}`);
          return c.json({
            error: config.message || 'Too many attempts for this email. Please try again later.',
            retryAfter: result.resetTime
          }, 429);
        }
      }

      await next();

      // Reset counter on successful requests if configured
      if (email && config.skipSuccessfulRequests && c.res.status >= 200 && c.res.status < 300) {
        const identifier = `email:${email}`;
        try {
          // Clear the rate limit for this email on successful login
          await rateLimitUtils.checkRateLimit(identifier, 0, 0);
        } catch (error) {
          logger.error('Failed to reset email rate limit counter:', error);
        }
      }

    } catch (error) {
      logger.error('Email rate limiting error:', error);
      await next();
    }
  };
};

/**
 * Combined IP + Email rate limiting middleware
 */
export const combinedRateLimitMiddleware = (
  ipConfig: RateLimitConfig,
  emailConfig: RateLimitConfig
) => {
  return async (c: Context, next: Next) => {
    try {
      // Check IP-based rate limit
      const ipIdentifier = getDefaultIdentifier(c);
      const ipResult = await rateLimitUtils.checkRateLimit(
        ipIdentifier,
        ipConfig.maxRequests,
        ipConfig.windowSeconds
      );

      if (!ipResult.allowed) {
        logger.warn(`IP rate limit exceeded for: ${ipIdentifier}`);
        return c.json({
          error: 'Rate limit exceeded from your IP address.',
          retryAfter: ipResult.resetTime
        }, 429);
      }

      // Check email-based rate limit
      const email = await getEmailFromRequest(c);
      if (email) {
        const emailIdentifier = `email:${email}`;
        const emailResult = await rateLimitUtils.checkRateLimit(
          emailIdentifier,
          emailConfig.maxRequests,
          emailConfig.windowSeconds
        );

        if (!emailResult.allowed) {
          logger.warn(`Email rate limit exceeded for: ${email}`);
          return c.json({
            error: 'Rate limit exceeded for this email address.',
            retryAfter: emailResult.resetTime
          }, 429);
        }
      }

      await next();

    } catch (error) {
      logger.error('Combined rate limiting error:', error);
      await next();
    }
  };
};

/**
 * Login-specific rate limiting that tracks per email and resets on success
 */
export const loginRateLimitMiddleware = (config: RateLimitConfig) => {
  return async (c: Context, next: Next) => {
    try {
      const email = await getEmailFromRequest(c);
      
      if (email) {
        const identifier = `login:email:${email}`;
        
        const result = await rateLimitUtils.checkRateLimit(
          identifier,
          config.maxRequests,
          config.windowSeconds
        );

        if (!result.allowed) {
          logger.warn(`Login rate limit exceeded for email: ${email}`);
          return c.json({
            error: 'Too many login attempts for this email. Please try again later.',
            retryAfter: result.resetTime
          }, 429);
        }
      }

      await next();

      // Reset login attempts on successful login
      if (email && c.res.status === 200) {
        const identifier = `login:email:${email}`;
        try {
          // Clear the failed login attempts for this email
          const redis = await import('@vync/cache').then(m => m.redis);
          await redis.del(`rate_limit:${identifier}`);
          logger.debug(`Reset login attempts for email: ${email}`);
        } catch (error) {
          logger.error('Failed to reset login attempt counter:', error);
        }
      }

    } catch (error) {
      logger.error('Login rate limiting error:', error);
      await next();
    }
  };
};

/**
 * Predefined rate limit configurations
 */
export const rateLimitConfigs = {
  // General authentication endpoints
  auth: {
    maxRequests: 10,
    windowSeconds: 15 * 60, // 15 minutes
    message: 'Too many authentication attempts. Please try again in 15 minutes.'
  } as RateLimitConfig,

  // Login endpoint - more restrictive
  login: {
    maxRequests: 5,
    windowSeconds: 15 * 60, // 15 minutes
    skipSuccessfulRequests: true,
    message: 'Too many login attempts. Please try again in 15 minutes.'
  } as RateLimitConfig,

  // Registration - moderate restriction
  register: {
    maxRequests: 3,
    windowSeconds: 60 * 60, // 1 hour
    message: 'Too many registration attempts. Please try again in 1 hour.'
  } as RateLimitConfig,

  // Password reset - very restrictive
  passwordReset: {
    maxRequests: 3,
    windowSeconds: 60 * 60, // 1 hour
    message: 'Too many password reset attempts. Please try again in 1 hour.'
  } as RateLimitConfig,

  // OTP endpoints - moderate restriction
  otp: {
    maxRequests: 5,
    windowSeconds: 30 * 60, // 30 minutes
    message: 'Too many OTP requests. Please try again in 30 minutes.'
  } as RateLimitConfig,

  // OTP verification - more restrictive
  otpVerify: {
    maxRequests: 10,
    windowSeconds: 60 * 60, // 1 hour
    message: 'Too many OTP verification attempts. Please try again in 1 hour.'
  } as RateLimitConfig,

  // Token verification - less restrictive (used by other services)
  tokenVerify: {
    maxRequests: 100,
    windowSeconds: 60, // 1 minute
    message: 'Too many token verification requests.'
  } as RateLimitConfig,
};
