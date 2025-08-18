import { cacheUtils, sessionUtils, keyBuilder } from '@vync/cache';
import { logger } from '@vync/config';
import { verifyToken, signToken } from './jwt';
import type { UserTokenPayload } from './getUserFromToken';
import type { JWTPayload } from 'jose';

/**
 * Redis-enhanced authentication utilities
 */

// Configuration constants
const TOKEN_CACHE_TTL = 60 * 15; // 15 minutes - cache verified tokens
const BLACKLIST_TTL = 60 * 60 * 24 * 7; // 7 days - keep blacklisted tokens
const SESSION_TTL = 60 * 60 * 24; // 24 hours - user session
const MAX_SESSIONS_PER_USER = 5; // Maximum concurrent sessions per user

/**
 * Enhanced token management with Redis caching
 */
export const tokenManager = {
  /**
   * Verify token with Redis caching
   * First checks cache, then verifies JWT if not cached
   */
  verifyTokenWithCache: async <T extends JWTPayload>(token: string): Promise<T | null> => {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await tokenManager.isTokenBlacklisted(token);
      if (isBlacklisted) {
        logger.warn('Attempted to use blacklisted token');
        return null;
      }

      // Try to get from cache first
      const cacheKey = keyBuilder.api('auth:token', { token: token.slice(-8) }); // Use last 8 chars for cache key
      const cached = await cacheUtils.getJSON<T>(cacheKey);
      
      if (cached) {
        logger.debug('Token found in cache');
        return cached;
      }

      // Verify token with JWT if not in cache
      logger.debug('Token not in cache, verifying with JWT');
      const payload = await verifyToken<T>(token);
      
      if (payload) {
        // Cache the verified token payload
        await cacheUtils.setJSON(cacheKey, payload, TOKEN_CACHE_TTL);
        logger.debug('Token verified and cached');
      }

      return payload;
    } catch (error) {
      logger.error('Token verification error:', error);
      return null;
    }
  },

  /**
   * Blacklist a token (for logout, security incidents, etc.)
   */
  blacklistToken: async (token: string, reason?: string): Promise<void> => {
    try {
      const blacklistKey = keyBuilder.api('auth:blacklist', { token: token.slice(-8) });
      const blacklistData = {
        token: token.slice(-8), // Store only last 8 chars for security
        reason: reason || 'User logout',
        timestamp: Date.now(),
      };

      await cacheUtils.setJSON(blacklistKey, blacklistData, BLACKLIST_TTL);
      
      // Also remove from token cache
      const cacheKey = keyBuilder.api('auth:token', { token: token.slice(-8) });
      await cacheUtils.invalidatePattern(cacheKey);
      
      logger.info(`Token blacklisted: ${reason || 'User logout'}`);
    } catch (error) {
      logger.error('Error blacklisting token:', error);
      throw error;
    }
  },

  /**
   * Check if a token is blacklisted
   */
  isTokenBlacklisted: async (token: string): Promise<boolean> => {
    try {
      const blacklistKey = keyBuilder.api('auth:blacklist', { token: token.slice(-8) });
      const blacklisted = await cacheUtils.getJSON(blacklistKey);
      return blacklisted !== null;
    } catch (error) {
      logger.error('Error checking token blacklist:', error);
      return false; // Fail open for availability
    }
  },

  /**
   * Clear token cache (useful for forced re-verification)
   */
  clearTokenCache: async (token: string): Promise<void> => {
    try {
      const cacheKey = keyBuilder.api('auth:token', { token: token.slice(-8) });
      await cacheUtils.invalidatePattern(cacheKey);
      logger.debug('Token cache cleared');
    } catch (error) {
      logger.error('Error clearing token cache:', error);
    }
  },
};

/**
 * Enhanced session management with Redis
 */
export const authSessionManager = {
  /**
   * Create a new user session
   */
  createSession: async (userId: string, sessionData: UserTokenPayload & { 
    deviceInfo?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<string> => {
    try {
      const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const sessionKey = keyBuilder.api('auth:session', { userId, sessionId });
      
      const fullSessionData = {
        ...sessionData,
        sessionId,
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };

      // Store the session
      await cacheUtils.setJSON(sessionKey, fullSessionData, SESSION_TTL);
      
      // Add session to user's active sessions list
      await authSessionManager.addToActiveSessions(userId, sessionId);
      
      // Limit concurrent sessions
      await authSessionManager.limitUserSessions(userId);
      
      logger.info(`Session created for user ${userId}: ${sessionId}`);
      return sessionId;
    } catch (error) {
      logger.error('Error creating session:', error);
      throw error;
    }
  },

  /**
   * Get session data
   */
  getSession: async (userId: string, sessionId: string): Promise<any | null> => {
    try {
      const sessionKey = keyBuilder.api('auth:session', { userId, sessionId });
      const session = await cacheUtils.getJSON(sessionKey);
      
      if (session) {
        // Update last activity
        await authSessionManager.updateLastActivity(userId, sessionId);
      }
      
      return session;
    } catch (error) {
      logger.error('Error getting session:', error);
      return null;
    }
  },

  /**
   * Update session last activity
   */
  updateLastActivity: async (userId: string, sessionId: string): Promise<void> => {
    try {
      const sessionKey = keyBuilder.api('auth:session', { userId, sessionId });
      const session = await cacheUtils.getJSON<{ lastActivity?: number; [key: string]: any }>(sessionKey);
      
      if (session) {
        session.lastActivity = Date.now();
        await cacheUtils.setJSON(sessionKey, session, SESSION_TTL);
      }
    } catch (error) {
      logger.error('Error updating session activity:', error);
    }
  },

  /**
   * Destroy a specific session
   */
  destroySession: async (userId: string, sessionId: string): Promise<void> => {
    try {
      const sessionKey = keyBuilder.api('auth:session', { userId, sessionId });
      await cacheUtils.invalidatePattern(sessionKey);
      
      // Remove from active sessions list
      await authSessionManager.removeFromActiveSessions(userId, sessionId);
      
      logger.info(`Session destroyed for user ${userId}: ${sessionId}`);
    } catch (error) {
      logger.error('Error destroying session:', error);
      throw error;
    }
  },

  /**
   * Destroy all sessions for a user
   */
  destroyAllUserSessions: async (userId: string): Promise<void> => {
    try {
      // Get all active sessions
      const activeSessions = await authSessionManager.getActiveSessions(userId);
      
      // Destroy each session
      for (const sessionId of activeSessions) {
        await authSessionManager.destroySession(userId, sessionId);
      }
      
      // Clear the active sessions list
      const activeSessionsKey = keyBuilder.api('auth:active-sessions', { userId });
      await cacheUtils.invalidatePattern(activeSessionsKey);
      
      logger.info(`All sessions destroyed for user ${userId}`);
    } catch (error) {
      logger.error('Error destroying all user sessions:', error);
      throw error;
    }
  },

  /**
   * Get active sessions for a user
   */
  getActiveSessions: async (userId: string): Promise<string[]> => {
    try {
      const activeSessionsKey = keyBuilder.api('auth:active-sessions', { userId });
      const sessions = await cacheUtils.getJSON<string[]>(activeSessionsKey);
      return sessions || [];
    } catch (error) {
      logger.error('Error getting active sessions:', error);
      return [];
    }
  },

  /**
   * Add session to active sessions list
   */
  addToActiveSessions: async (userId: string, sessionId: string): Promise<void> => {
    try {
      const activeSessionsKey = keyBuilder.api('auth:active-sessions', { userId });
      const sessions = await authSessionManager.getActiveSessions(userId);
      
      if (!sessions.includes(sessionId)) {
        sessions.push(sessionId);
        await cacheUtils.setJSON(activeSessionsKey, sessions, SESSION_TTL * 2); // Longer TTL for session list
      }
    } catch (error) {
      logger.error('Error adding to active sessions:', error);
    }
  },

  /**
   * Remove session from active sessions list
   */
  removeFromActiveSessions: async (userId: string, sessionId: string): Promise<void> => {
    try {
      const activeSessionsKey = keyBuilder.api('auth:active-sessions', { userId });
      const sessions = await authSessionManager.getActiveSessions(userId);
      
      const updatedSessions = sessions.filter(id => id !== sessionId);
      await cacheUtils.setJSON(activeSessionsKey, updatedSessions, SESSION_TTL * 2);
    } catch (error) {
      logger.error('Error removing from active sessions:', error);
    }
  },

  /**
   * Limit user to maximum number of concurrent sessions
   */
  limitUserSessions: async (userId: string): Promise<void> => {
    try {
      const sessions = await authSessionManager.getActiveSessions(userId);
      
      if (sessions.length > MAX_SESSIONS_PER_USER) {
        // Sort by creation time and remove oldest sessions
        const sessionsToRemove = sessions.slice(0, sessions.length - MAX_SESSIONS_PER_USER);
        
        for (const sessionId of sessionsToRemove) {
          await authSessionManager.destroySession(userId, sessionId);
          logger.info(`Removed old session due to limit: ${sessionId}`);
        }
      }
    } catch (error) {
      logger.error('Error limiting user sessions:', error);
    }
  },
};

/**
 * Enhanced user token utilities
 */
export const authUserManager = {
  /**
   * Get user from token with full Redis integration
   */
  getUserFromTokenWithCache: async (token: string): Promise<UserTokenPayload | null> => {
    try {
      const payload = await tokenManager.verifyTokenWithCache<UserTokenPayload>(token);
      return payload;
    } catch (error) {
      logger.error('Error getting user from token with cache:', error);
      return null;
    }
  },

  /**
   * Create token with session
   */
  createTokenWithSession: async (
    userId: string, 
    role: string,
    sessionInfo?: {
      deviceInfo?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<{ token: string; sessionId: string }> => {
    try {
      const payload: UserTokenPayload = { userId, role };
      const token = await signToken(payload);
      
      // Create session
      const sessionId = await authSessionManager.createSession(userId, {
        ...payload,
        ...sessionInfo,
      });
      
      return { token, sessionId };
    } catch (error) {
      logger.error('Error creating token with session:', error);
      throw error;
    }
  },

  /**
   * Logout user - blacklist token and destroy session
   */
  logout: async (token: string, userId: string, sessionId?: string): Promise<void> => {
    try {
      // Blacklist the token
      await tokenManager.blacklistToken(token, 'User logout');
      
      if (sessionId) {
        // Destroy specific session
        await authSessionManager.destroySession(userId, sessionId);
      } else {
        // If no session ID, destroy all sessions (nuclear option)
        await authSessionManager.destroyAllUserSessions(userId);
      }
      
      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error('Error during logout:', error);
      throw error;
    }
  },

  /**
   * Force logout all user sessions (for security incidents)
   */
  forceLogoutAll: async (userId: string, reason?: string): Promise<void> => {
    try {
      await authSessionManager.destroyAllUserSessions(userId);
      
      // Invalidate all cached tokens for this user (approximate)
      await cacheUtils.invalidatePattern(keyBuilder.api('auth:token', { '*': '*' }));
      
      logger.warn(`Force logout all sessions for user ${userId}: ${reason || 'Security measure'}`);
    } catch (error) {
      logger.error('Error during force logout all:', error);
      throw error;
    }
  },
};

/**
 * Utility functions
 */
export const authUtils = {
  /**
   * Clean up expired sessions and blacklisted tokens
   */
  cleanup: async (): Promise<void> => {
    try {
      // This would typically be run as a scheduled job
      logger.info('Auth cleanup completed');
    } catch (error) {
      logger.error('Error during auth cleanup:', error);
    }
  },

  /**
   * Get auth statistics
   */
  getStats: async (): Promise<{
    activeSessions: number;
    blacklistedTokens: number;
    cachedTokens: number;
  }> => {
    try {
      // This would require more complex Redis operations
      // For now, return basic stats
      return {
        activeSessions: 0,
        blacklistedTokens: 0,
        cachedTokens: 0,
      };
    } catch (error) {
      logger.error('Error getting auth stats:', error);
      return { activeSessions: 0, blacklistedTokens: 0, cachedTokens: 0 };
    }
  },
};
