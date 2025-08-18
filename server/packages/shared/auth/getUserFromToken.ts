import { verifyToken } from "./jwt";
import { cacheUtils, keyBuilder } from '@vync/cache';
import { logger } from '@vync/config';
import { createHash } from 'crypto';

export type UserTokenPayload = {
  userId: string;
  role: string;
};

export type ExtendedUserTokenPayload = UserTokenPayload & {
  sessionId?: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  iat?: number;
  exp?: number;
  lastActivity?: number;
};

// Configuration constants
const TOKEN_CACHE_TTL = 15 * 60; // 15 minutes
const BLACKLIST_TTL = 7 * 24 * 60 * 60; // 7 days
const FAILED_ATTEMPTS_TTL = 60 * 5; // 5 minutes
const MAX_FAILED_ATTEMPTS = 5;

/**
 * Generate a secure hash of the token for caching (last 16 chars + hash)
 */
const generateTokenHash = (token: string): string => {
  const hash = createHash('sha256').update(token).digest('hex');
  return `${token.slice(-16)}_${hash.slice(0, 16)}`;
};

/**
 * Check if token is blacklisted
 */
const isTokenBlacklisted = async (tokenHash: string): Promise<boolean> => {
  try {
    const blacklistKey = keyBuilder.api('auth:blacklist', { token: tokenHash });
    const blacklisted = await cacheUtils.getJSON(blacklistKey);
    return blacklisted !== null;
  } catch (error) {
    logger.error('Error checking token blacklist:', error);
    return false; // Fail open for availability
  }
};

/**
 * Blacklist a token
 */
export const blacklistToken = async (token: string, reason: string = 'Manual blacklist', metadata?: any): Promise<void> => {
  try {
    const tokenHash = generateTokenHash(token);
    const blacklistKey = keyBuilder.api('auth:blacklist', { token: tokenHash });
    
    const blacklistData = {
      tokenHash,
      reason,
      timestamp: Date.now(),
      metadata,
    };

    await cacheUtils.setJSON(blacklistKey, blacklistData, BLACKLIST_TTL);
    
    // Remove from cache if it exists
    const cacheKey = keyBuilder.api('auth:token', { token: tokenHash });
    await cacheUtils.invalidatePattern(cacheKey);
    
    logger.info(`Token blacklisted: ${reason}`);
  } catch (error) {
    logger.error('Error blacklisting token:', error);
    throw error;
  }
};

/**
 * Track failed token attempts for rate limiting
 */
const trackFailedAttempt = async (tokenHash: string): Promise<boolean> => {
  try {
    const failedKey = keyBuilder.api('auth:failed', { token: tokenHash });
    const current = await cacheUtils.getJSON<number>(failedKey) || 0;
    const newCount = current + 1;
    
    await cacheUtils.setJSON(failedKey, newCount, FAILED_ATTEMPTS_TTL);
    
    if (newCount >= MAX_FAILED_ATTEMPTS) {
      logger.warn(`Token exceeded max failed attempts: ${newCount}`);
      return false; // Block this token
    }
    
    return true;
  } catch (error) {
    logger.error('Error tracking failed attempt:', error);
    return true; // Fail open
  }
};

/**
 * Clear failed attempts for a successful token
 */
const clearFailedAttempts = async (tokenHash: string): Promise<void> => {
  try {
    const failedKey = keyBuilder.api('auth:failed', { token: tokenHash });
    await cacheUtils.invalidatePattern(failedKey);
  } catch (error) {
    logger.error('Error clearing failed attempts:', error);
  }
};

/**
 * Enhanced user token verification with Redis integration
 * This is the main function that should be used for all token verification
 */
export const getUserFromToken = async (
  token: string, 
  options: {
    skipCache?: boolean;
    updateActivity?: boolean;
    sessionInfo?: {
      ipAddress?: string;
      userAgent?: string;
      deviceInfo?: string;
    };
  } = {}
): Promise<ExtendedUserTokenPayload | null> => {
  const { skipCache = false, updateActivity = true, sessionInfo } = options;
  
  if (!token || token.length < 10) {
    logger.warn('Invalid token format provided');
    return null;
  }

  const tokenHash = generateTokenHash(token);
  const cacheKey = keyBuilder.api('auth:token', { token: tokenHash });
  
  try {
    // 1. Check if token is blacklisted
    const blacklisted = await isTokenBlacklisted(tokenHash);
    if (blacklisted) {
      logger.warn('Attempted to use blacklisted token');
      await trackFailedAttempt(tokenHash);
      return null;
    }

    // 2. Check failed attempts rate limiting
    const allowedByRateLimit = await trackFailedAttempt(tokenHash);
    if (!allowedByRateLimit) {
      logger.warn('Token blocked due to too many failed attempts');
      return null;
    }

    // 3. Try cache first (unless skipCache is true)
    if (!skipCache) {
      try {
        const cached = await cacheUtils.getJSON<ExtendedUserTokenPayload>(cacheKey);
        if (cached) {
          logger.debug('Token found in cache');
          
          // Update last activity if requested
          if (updateActivity) {
            cached.lastActivity = Date.now();
            await cacheUtils.setJSON(cacheKey, cached, TOKEN_CACHE_TTL);
          }
          
          // Clear failed attempts on successful cache hit
          await clearFailedAttempts(tokenHash);
          return cached;
        }
      } catch (cacheError) {
        logger.warn('Cache error, falling back to JWT verification:', cacheError);
      }
    }

    // 4. Verify JWT token
    logger.debug('Verifying token with JWT');
    const payload = await verifyToken<UserTokenPayload>(token);
    
    if (!payload) {
      logger.warn('JWT verification failed');
      return null;
    }

    // 5. Create extended payload
    const extendedPayload: ExtendedUserTokenPayload = {
      ...payload,
      ...sessionInfo,
      lastActivity: Date.now(),
    };

    // 6. Cache the verified token (unless skipCache is true)
    if (!skipCache) {
      try {
        await cacheUtils.setJSON(cacheKey, extendedPayload, TOKEN_CACHE_TTL);
        logger.debug('Token verified and cached');
      } catch (cacheError) {
        logger.warn('Failed to cache token, continuing anyway:', cacheError);
      }
    }

    // 7. Clear failed attempts on successful verification
    await clearFailedAttempts(tokenHash);
    
    logger.debug(`Token verified successfully for user: ${payload.userId}`);
    return extendedPayload;

  } catch (error) {
    logger.error('Token verification error:', error);
    
    // Track this as a failed attempt
    await trackFailedAttempt(tokenHash);
    
    return null;
  }
};

/**
 * Force refresh token from JWT (bypass cache)
 */
export const refreshTokenFromJWT = async (token: string): Promise<ExtendedUserTokenPayload | null> => {
  return await getUserFromToken(token, { skipCache: true });
};

/**
 * Verify token without updating cache or activity
 */
export const verifyTokenReadOnly = async (token: string): Promise<ExtendedUserTokenPayload | null> => {
  return await getUserFromToken(token, { skipCache: false, updateActivity: false });
};

/**
 * Clear token from cache (force re-verification on next request)
 */
export const clearTokenCache = async (token: string): Promise<void> => {
  try {
    const tokenHash = generateTokenHash(token);
    const cacheKey = keyBuilder.api('auth:token', { token: tokenHash });
    await cacheUtils.invalidatePattern(cacheKey);
    logger.debug('Token cache cleared');
  } catch (error) {
    logger.error('Error clearing token cache:', error);
  }
};

/**
 * Get token cache statistics
 */
export const getTokenStats = async (token: string): Promise<{
  cached: boolean;
  blacklisted: boolean;
  failedAttempts: number;
  lastActivity?: number;
}> => {
  try {
    const tokenHash = generateTokenHash(token);
    
    const [cached, blacklisted, failedAttemptsResult] = await Promise.all([
      cacheUtils.getJSON<ExtendedUserTokenPayload>(keyBuilder.api('auth:token', { token: tokenHash })),
      isTokenBlacklisted(tokenHash),
      cacheUtils.getJSON<number>(keyBuilder.api('auth:failed', { token: tokenHash })),
    ]);

    const failedAttempts = failedAttemptsResult || 0;

    return {
      cached: cached !== null,
      blacklisted,
      failedAttempts,
      lastActivity: cached?.lastActivity,
    };
  } catch (error) {
    logger.error('Error getting token stats:', error);
    return {
      cached: false,
      blacklisted: false,
      failedAttempts: 0,
    };
  }
};

/**
 * Batch verify multiple tokens efficiently
 */
export const batchVerifyTokens = async (tokens: string[]): Promise<Map<string, ExtendedUserTokenPayload | null>> => {
  const results = new Map<string, ExtendedUserTokenPayload | null>();
  
  // Process tokens in parallel
  const promises = tokens.map(async (token) => {
    const result = await getUserFromToken(token, { updateActivity: false });
    return { token, result };
  });
  
  const responses = await Promise.allSettled(promises);
  
  responses.forEach((response, index) => {
    const token = tokens[index];
    if (response.status === 'fulfilled') {
      results.set(token, response.value.result);
    } else {
      logger.error(`Batch token verification failed for token ${index}:`, response.reason);
      results.set(token, null);
    }
  });
  
  return results;
};

/**
 * Legacy support - simple version that matches the old interface
 * @deprecated Use the main getUserFromToken function instead
 */
export const getUserFromTokenLegacy = async (token: string): Promise<UserTokenPayload | null> => {
  const result = await getUserFromToken(token);
  if (!result) return null;
  
  return {
    userId: result.userId,
    role: result.role,
  };
};
