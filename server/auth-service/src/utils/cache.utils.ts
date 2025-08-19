import { 
  redis, 
  cacheUtils, 
  sessionUtils, 
  keyBuilder, 
  pipelineUtils, 
  redisMonitoring, 
  monitoringMiddleware 
} from '@vync/cache';
import { logger } from '@vync/config';
import * as jose from 'jose';

export interface CachedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  loginTime: string;
  lastActivity: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Auth-specific cache utilities
 */
export const authCacheUtils = {
  /**
   * Session management
   */
  async createSession(
    userId: string, 
    sessionData: Omit<SessionData, 'userId'>, 
    ttlSeconds: number = 7 * 24 * 60 * 60 // 7 days default
  ): Promise<void> {
    const fullSessionData: SessionData = {
      userId,
      ...sessionData,
    };
    
    const monitoredOperation = monitoringMiddleware.withSessionMonitoring(
      'create',
      async () => {
        // Use pipeline for batch session operations
        const result = await pipelineUtils.batchSessionOperations(
          userId,
          fullSessionData,
          ttlSeconds
        );
        
        if (!result.success) {
          throw new Error(`Session creation failed: ${result.errors.filter(e => e).length} errors`);
        }
        
        return result;
      }
    );
    
    try {
      await monitoredOperation();
      redisMonitoring.recordCacheSet('session_create', userId, JSON.stringify(fullSessionData).length);
      logger.info(`Session created for user: ${userId}`);
    } catch (error) {
      redisMonitoring.recordError('session_create', 'SessionCreationError', error instanceof Error ? error.message : 'Unknown error');
      logger.error(`Failed to create session for user ${userId}:`, error);
      throw error;
    }
  },

  async getSession(userId: string): Promise<SessionData | null> {
    try {
      return await sessionUtils.getSession<SessionData>(userId);
    } catch (error) {
      logger.error(`Failed to get session for user ${userId}:`, error);
      return null;
    }
  },

  async updateSessionActivity(userId: string, ipAddress?: string): Promise<void> {
    try {
      const session = await authCacheUtils.getSession(userId);
      if (session) {
        session.lastActivity = new Date().toISOString();
        if (ipAddress) {
          session.ipAddress = ipAddress;
        }
        await sessionUtils.setSession(userId, session, 7 * 24 * 60 * 60); // Extend for 7 days
      }
    } catch (error) {
      logger.error(`Failed to update session activity for user ${userId}:`, error);
    }
  },

  async deleteSession(userId: string): Promise<void> {
    try {
      await sessionUtils.deleteSession(userId);
      
      // Remove from active sessions set
      const activeSessionsKey = keyBuilder.tag('active_sessions');
      await redis.srem(activeSessionsKey, userId);
      
      logger.info(`Session deleted for user: ${userId}`);
    } catch (error) {
      logger.error(`Failed to delete session for user ${userId}:`, error);
      throw error;
    }
  },

  async extendSession(userId: string, ttlSeconds: number = 7 * 24 * 60 * 60): Promise<void> {
    try {
      await sessionUtils.extendSession(userId, ttlSeconds);
      
      // Extend active sessions tracking
      const activeSessionsKey = keyBuilder.tag('active_sessions');
      await redis.expire(activeSessionsKey, ttlSeconds);
    } catch (error) {
      logger.error(`Failed to extend session for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * User data caching
   */
  async cacheUser(user: CachedUser, ttlSeconds: number = 60 * 60): Promise<void> { // 1 hour default
    const key = keyBuilder.user(user.id);
    try {
      await cacheUtils.setJSON(key, user, ttlSeconds);
      logger.debug(`User cached: ${user.id}`);
    } catch (error) {
      logger.error(`Failed to cache user ${user.id}:`, error);
      throw error;
    }
  },

  async getCachedUser(userId: string): Promise<CachedUser | null> {
    const key = keyBuilder.user(userId);
    try {
      return await cacheUtils.getJSON<CachedUser>(key);
    } catch (error) {
      logger.error(`Failed to get cached user ${userId}:`, error);
      return null;
    }
  },

  async invalidateUserCache(userId: string): Promise<void> {
    const key = keyBuilder.user(userId);
    try {
      await redis.del(key);
      logger.debug(`User cache invalidated: ${userId}`);
    } catch (error) {
      logger.error(`Failed to invalidate user cache ${userId}:`, error);
    }
  },

  /**
   * JWT Token blacklisting
   */
  async blacklistToken(token: string, expiryDate: Date): Promise<void> {
    try {
      // Decode token to get jti (JWT ID) or create a hash of the token
      const tokenHash = await Bun.hash(token).toString();
      const key = `blacklist:${tokenHash}`;
      
      const ttlSeconds = Math.ceil((expiryDate.getTime() - Date.now()) / 1000);
      
      if (ttlSeconds > 0) {
        await redis.set(key, '1', ttlSeconds);
        
        // Also add to blacklist set for batch operations
        const blacklistSet = keyBuilder.tag('blacklisted_tokens');
        await redis.sadd(blacklistSet, tokenHash);
        await redis.expire(blacklistSet, ttlSeconds);
        
        logger.info(`Token blacklisted with TTL: ${ttlSeconds}s`);
      }
    } catch (error) {
      logger.error('Failed to blacklist token:', error);
      throw error;
    }
  },

  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const tokenHash = await Bun.hash(token).toString();
      const key = `blacklist:${tokenHash}`;
      
      const exists = await redis.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error('Failed to check token blacklist:', error);
      // Return false to avoid blocking valid users on Redis errors
      return false;
    }
  },

  /**
   * Cache invalidation for auth-related data
   */
  async invalidateAllUserSessions(userId: string): Promise<void> {
    try {
      // Delete main session
      await authCacheUtils.deleteSession(userId);
      
      // Invalidate user cache
      await authCacheUtils.invalidateUserCache(userId);
      
      // Remove from active sessions
      const activeSessionsKey = keyBuilder.tag('active_sessions');
      await redis.srem(activeSessionsKey, userId);
      
      logger.info(`All sessions invalidated for user: ${userId}`);
    } catch (error) {
      logger.error(`Failed to invalidate all sessions for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Get active sessions count
   */
  async getActiveSessionsCount(): Promise<number> {
    try {
      const activeSessionsKey = keyBuilder.tag('active_sessions');
      // Use smembers and get length since scard is not available in the redis utils
      const members = await redis.smembers(activeSessionsKey);
      return members.length;
    } catch (error) {
      logger.error('Failed to get active sessions count:', error);
      return 0;
    }
  },

  /**
   * Cleanup expired blacklisted tokens
   */
  async cleanupExpiredBlacklist(): Promise<number> {
    try {
      const blacklistSet = keyBuilder.tag('blacklisted_tokens');
      const tokens = await redis.smembers(blacklistSet);
      
      let cleanedCount = 0;
      for (const tokenHash of tokens) {
        const key = `blacklist:${tokenHash}`;
        const exists = await redis.exists(key);
        if (exists === 0) {
          await redis.srem(blacklistSet, tokenHash);
          cleanedCount++;
        }
      }
      
      logger.debug(`Cleaned up ${cleanedCount} expired blacklisted tokens`);
      return cleanedCount;
    } catch (error) {
      logger.error('Failed to cleanup expired blacklist:', error);
      return 0;
    }
  }
};

/**
 * Auth-specific key builders
 */
export const authKeyBuilder = {
  userProfile: (userId: string) => `user:profile:${userId}`,
  userPermissions: (userId: string) => `user:permissions:${userId}`,
  loginAttempts: (identifier: string) => `login:attempts:${identifier}`,
  passwordReset: (userId: string) => `password:reset:${userId}`,
  emailVerification: (userId: string) => `email:verify:${userId}`,
  twoFactorAuth: (userId: string) => `2fa:${userId}`,
};
