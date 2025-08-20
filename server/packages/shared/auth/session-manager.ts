import { cacheUtils, keyBuilder, rateLimitUtils } from '@vync/cache';
import { logger } from '@vync/config';
import { signToken } from './jwt';
import { blacklistToken, type UserTokenPayload, type ExtendedUserTokenPayload } from './getUserFromToken';
import { createHash, randomBytes } from 'crypto';

/**
 * Comprehensive session management with Redis
 */

// Session configuration
const SESSION_TTL = 24 * 60 * 60; // 24 hours
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 days
const MAX_SESSIONS_PER_USER = 5;
const SESSION_CLEANUP_INTERVAL = 60 * 60; // 1 hour

export interface SessionData extends UserTokenPayload {
  sessionId: string;
  refreshToken: string;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
  ipAddress: string;
  userAgent: string;
  deviceInfo?: string;
  deviceFingerprint?: string;
  isActive: boolean;
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
}

export interface SessionCreateOptions {
  ipAddress: string;
  userAgent: string;
  deviceInfo?: string;
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
  extendedTTL?: boolean; // For "Remember Me" functionality
}

export interface SessionListItem {
  sessionId: string;
  createdAt: number;
  lastActivity: number;
  ipAddress: string;
  userAgent: string;
  deviceInfo?: string;
  location?: {
    country?: string;
    city?: string;
  };
  isCurrentSession: boolean;
}

/**
 * Generate secure session ID
 */
const generateSessionId = (): string => {
  return `sess_${Date.now()}_${randomBytes(16).toString('hex')}`;
};

/**
 * Generate secure refresh token
 */
const generateRefreshToken = (): string => {
  return `ref_${randomBytes(32).toString('hex')}`;
};

/**
 * Generate device fingerprint from user agent and other factors
 */
const generateDeviceFingerprint = (userAgent: string, ipAddress: string): string => {
  const data = `${userAgent}_${ipAddress}`;
  return createHash('sha256').update(data).digest('hex').slice(0, 16);
};

/**
 * Session management class
 */
export class SessionManager {
  /**
   * Create a new session for a user
   */
  static async createSession(
    userId: string,
    role: string,
    options: SessionCreateOptions
  ): Promise<{ sessionId: string; accessToken: string; refreshToken: string; expiresIn: number }> {
    try {
      const sessionId = generateSessionId();
      const refreshToken = generateRefreshToken();
      const now = Date.now();
      const ttl = options.extendedTTL ? REFRESH_TOKEN_TTL : SESSION_TTL;
      const expiresAt = now + (ttl * 1000);

      // Generate device fingerprint
      const deviceFingerprint = generateDeviceFingerprint(options.userAgent, options.ipAddress);

      // Create session data
      const sessionData: SessionData = {
        userId,
        role,
        sessionId,
        refreshToken,
        createdAt: now,
        lastActivity: now,
        expiresAt,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        deviceInfo: options.deviceInfo,
        deviceFingerprint,
        isActive: true,
        location: options.location,
      };

      // Store session
      const sessionKey = keyBuilder.api('auth:session', { userId, sessionId });
      await cacheUtils.setJSON(sessionKey, sessionData, ttl);

      // Add to user's active sessions
      await SessionManager.addToActiveSessions(userId, sessionId);

      // Limit concurrent sessions
      await SessionManager.limitUserSessions(userId);

      // Store refresh token mapping
      const refreshTokenKey = keyBuilder.api('auth:refresh', { token: refreshToken });
      await cacheUtils.setJSON(refreshTokenKey, { userId, sessionId }, REFRESH_TOKEN_TTL);

      // Create access token
      const accessToken = await signToken({
        userId,
        role,
        sessionId,
        deviceFingerprint,
      });

      logger.info(`Session created for user ${userId}`, {
        sessionId,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        extendedTTL: options.extendedTTL,
      });

      return {
        sessionId,
        accessToken,
        refreshToken,
        expiresIn: Math.floor(ttl),
      };
    } catch (error) {
      logger.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Get session data
   */
  static async getSession(userId: string, sessionId: string): Promise<SessionData | null> {
    try {
      const sessionKey = keyBuilder.api('auth:session', { userId, sessionId });
      const session = await cacheUtils.getJSON<SessionData>(sessionKey);
      
      if (!session) {
        return null;
      }

      // Check if session has expired
      if (session.expiresAt < Date.now()) {
        await SessionManager.destroySession(userId, sessionId);
        return null;
      }

      return session;
    } catch (error) {
      logger.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Update session activity
   */
  static async updateActivity(userId: string, sessionId: string, metadata?: {
    ipAddress?: string;
    location?: { country?: string; city?: string; region?: string; };
  }): Promise<void> {
    try {
      const session = await SessionManager.getSession(userId, sessionId);
      if (!session) {
        return;
      }

      session.lastActivity = Date.now();
      
      // Update IP address if provided and different
      if (metadata?.ipAddress && metadata.ipAddress !== session.ipAddress) {
        logger.info(`IP address changed for session ${sessionId}`, {
          userId,
          oldIp: session.ipAddress,
          newIp: metadata.ipAddress,
        });
        session.ipAddress = metadata.ipAddress;
      }

      // Update location if provided
      if (metadata?.location) {
        session.location = { ...session.location, ...metadata.location };
      }

      // Save updated session
      const sessionKey = keyBuilder.api('auth:session', { userId, sessionId });
      const ttl = Math.floor((session.expiresAt - Date.now()) / 1000);
      
      if (ttl > 0) {
        await cacheUtils.setJSON(sessionKey, session, ttl);
      }
    } catch (error) {
      logger.error('Error updating session activity:', error);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  } | null> {
    try {
      // Get session info from refresh token
      const refreshTokenKey = keyBuilder.api('auth:refresh', { token: refreshToken });
      const tokenData = await cacheUtils.getJSON<{ userId: string; sessionId: string }>(refreshTokenKey);
      
      if (!tokenData) {
        logger.warn('Invalid refresh token used');
        return null;
      }

      // Get session data
      const session = await SessionManager.getSession(tokenData.userId, tokenData.sessionId);
      if (!session || session.refreshToken !== refreshToken) {
        logger.warn('Refresh token mismatch or session not found');
        return null;
      }

      // Generate new tokens
      const newRefreshToken = generateRefreshToken();
      const newAccessToken = await signToken({
        userId: session.userId,
        role: session.role,
        sessionId: session.sessionId,
        deviceFingerprint: session.deviceFingerprint,
      });

      // Update session with new refresh token
      session.refreshToken = newRefreshToken;
      session.lastActivity = Date.now();

      // Save updated session
      const sessionKey = keyBuilder.api('auth:session', { userId: tokenData.userId, sessionId: tokenData.sessionId });
      const ttl = Math.floor((session.expiresAt - Date.now()) / 1000);
      await cacheUtils.setJSON(sessionKey, session, ttl);

      // Update refresh token mapping
      await cacheUtils.invalidatePattern(refreshTokenKey);
      const newRefreshTokenKey = keyBuilder.api('auth:refresh', { token: newRefreshToken });
      await cacheUtils.setJSON(newRefreshTokenKey, tokenData, REFRESH_TOKEN_TTL);

      logger.info(`Token refreshed for user ${session.userId}`, {
        sessionId: session.sessionId,
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: SESSION_TTL,
      };
    } catch (error) {
      logger.error('Error refreshing token:', error);
      return null;
    }
  }

  /**
   * Destroy a specific session
   */
  static async destroySession(userId: string, sessionId: string, reason: string = 'User logout'): Promise<void> {
    try {
      const session = await SessionManager.getSession(userId, sessionId);
      
      if (session) {
        // Blacklist any existing access tokens for this session
        // This is approximate since we don't store the actual token
        logger.info(`Session destroyed: ${reason}`, {
          userId,
          sessionId,
          ipAddress: session.ipAddress,
        });

        // Remove refresh token
        const refreshTokenKey = keyBuilder.api('auth:refresh', { token: session.refreshToken });
        await cacheUtils.invalidatePattern(refreshTokenKey);
      }

      // Remove session
      const sessionKey = keyBuilder.api('auth:session', { userId, sessionId });
      await cacheUtils.invalidatePattern(sessionKey);

      // Remove from active sessions
      await SessionManager.removeFromActiveSessions(userId, sessionId);
    } catch (error) {
      logger.error('Error destroying session:', error);
      throw error;
    }
  }

  /**
   * Destroy all sessions for a user
   */
  static async destroyAllUserSessions(userId: string, reason: string = 'Security measure'): Promise<void> {
    try {
      const activeSessions = await SessionManager.getActiveSessions(userId);
      
      for (const sessionId of activeSessions) {
        await SessionManager.destroySession(userId, sessionId, reason);
      }

      // Clear active sessions list
      const activeSessionsKey = keyBuilder.api('auth:active-sessions', { userId });
      await cacheUtils.invalidatePattern(activeSessionsKey);

      logger.warn(`All sessions destroyed for user ${userId}: ${reason}`);
    } catch (error) {
      logger.error('Error destroying all user sessions:', error);
      throw error;
    }
  }

  /**
   * Get list of user's active sessions
   */
  static async getUserSessions(userId: string, currentSessionId?: string): Promise<SessionListItem[]> {
    try {
      const activeSessions = await SessionManager.getActiveSessions(userId);
      const sessionList: SessionListItem[] = [];

      for (const sessionId of activeSessions) {
        const session = await SessionManager.getSession(userId, sessionId);
        if (session && session.isActive) {
          sessionList.push({
            sessionId,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            deviceInfo: session.deviceInfo,
            location: session.location,
            isCurrentSession: sessionId === currentSessionId,
          });
        }
      }

      // Sort by last activity (most recent first)
      return sessionList.sort((a, b) => b.lastActivity - a.lastActivity);
    } catch (error) {
      logger.error('Error getting user sessions:', error);
      return [];
    }
  }

  /**
   * Get active session IDs for a user
   */
  static async getActiveSessions(userId: string): Promise<string[]> {
    try {
      const activeSessionsKey = keyBuilder.api('auth:active-sessions', { userId });
      const sessions = await cacheUtils.getJSON<string[]>(activeSessionsKey);
      return sessions || [];
    } catch (error) {
      logger.error('Error getting active sessions:', error);
      return [];
    }
  }

  /**
   * Add session to active sessions list
   */
  static async addToActiveSessions(userId: string, sessionId: string): Promise<void> {
    try {
      const activeSessionsKey = keyBuilder.api('auth:active-sessions', { userId });
      const sessions = await SessionManager.getActiveSessions(userId);
      
      if (!sessions.includes(sessionId)) {
        sessions.push(sessionId);
        await cacheUtils.setJSON(activeSessionsKey, sessions, SESSION_TTL * 2);
      }
    } catch (error) {
      logger.error('Error adding to active sessions:', error);
    }
  }

  /**
   * Remove session from active sessions list
   */
  static async removeFromActiveSessions(userId: string, sessionId: string): Promise<void> {
    try {
      const activeSessionsKey = keyBuilder.api('auth:active-sessions', { userId });
      const sessions = await SessionManager.getActiveSessions(userId);
      
      const updatedSessions = sessions.filter(id => id !== sessionId);
      await cacheUtils.setJSON(activeSessionsKey, updatedSessions, SESSION_TTL * 2);
    } catch (error) {
      logger.error('Error removing from active sessions:', error);
    }
  }

  /**
   * Limit user sessions to maximum allowed
   */
  static async limitUserSessions(userId: string): Promise<void> {
    try {
      const sessions = await SessionManager.getActiveSessions(userId);
      
      if (sessions.length > MAX_SESSIONS_PER_USER) {
        // Get session details to sort by last activity
        const sessionDetails = [];
        
        for (const sessionId of sessions) {
          const session = await SessionManager.getSession(userId, sessionId);
          if (session) {
            sessionDetails.push({ sessionId, lastActivity: session.lastActivity });
          }
        }

        // Sort by last activity (oldest first) and remove excess
        sessionDetails.sort((a, b) => a.lastActivity - b.lastActivity);
        const sessionsToRemove = sessionDetails
          .slice(0, sessionDetails.length - MAX_SESSIONS_PER_USER)
          .map(s => s.sessionId);

        for (const sessionId of sessionsToRemove) {
          await SessionManager.destroySession(userId, sessionId, 'Session limit exceeded');
        }
      }
    } catch (error) {
      logger.error('Error limiting user sessions:', error);
    }
  }

  /**
   * Clean up expired sessions (should be run periodically)
   */
  static async cleanupExpiredSessions(): Promise<{ cleaned: number; errors: number }> {
    let cleaned = 0;
    let errors = 0;

    try {
      // This is a simplified cleanup - in production you'd want to scan Redis more efficiently
      logger.info('Starting session cleanup...');
      
      // In a real implementation, you'd scan for session keys and check expiration
      // For now, we'll return basic stats
      
      logger.info(`Session cleanup completed: ${cleaned} cleaned, ${errors} errors`);
      return { cleaned, errors };
    } catch (error) {
      logger.error('Error during session cleanup:', error);
      return { cleaned, errors: errors + 1 };
    }
  }

  /**
   * Get session statistics
   */
  static async getSessionStats(): Promise<{
    totalActiveSessions: number;
    totalUsers: number;
    avgSessionsPerUser: number;
  }> {
    try {
      // This would require more complex Redis operations to implement efficiently
      // For now, return placeholder values
      return {
        totalActiveSessions: 0,
        totalUsers: 0,
        avgSessionsPerUser: 0,
      };
    } catch (error) {
      logger.error('Error getting session stats:', error);
      return {
        totalActiveSessions: 0,
        totalUsers: 0,
        avgSessionsPerUser: 0,
      };
    }
  }

  /**
   * Validate session security (check for suspicious activity)
   */
  static async validateSessionSecurity(userId: string, sessionId: string, currentIp: string): Promise<{
    isValid: boolean;
    warnings: string[];
    shouldForceReauth: boolean;
  }> {
    try {
      const session = await SessionManager.getSession(userId, sessionId);
      if (!session) {
        return { isValid: false, warnings: ['Session not found'], shouldForceReauth: true };
      }

      const warnings: string[] = [];
      let shouldForceReauth = false;

      // Check IP address changes
      if (session.ipAddress !== currentIp) {
        warnings.push('IP address changed');
        logger.warn(`IP address change detected for session ${sessionId}`, {
          userId,
          oldIp: session.ipAddress,
          newIp: currentIp,
        });
      }

      // Check session age
      const sessionAge = Date.now() - session.createdAt;
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      if (sessionAge > maxAge) {
        warnings.push('Session too old');
        shouldForceReauth = true;
      }

      // Check for inactive sessions
      const inactiveTime = Date.now() - session.lastActivity;
      const maxInactiveTime = 2 * 60 * 60 * 1000; // 2 hours
      if (inactiveTime > maxInactiveTime) {
        warnings.push('Long period of inactivity');
      }

      return {
        isValid: warnings.length === 0 || !shouldForceReauth,
        warnings,
        shouldForceReauth,
      };
    } catch (error) {
      logger.error('Error validating session security:', error);
      return { isValid: false, warnings: ['Security validation failed'], shouldForceReauth: true };
    }
  }
}

// Export convenience functions
export const createSession = SessionManager.createSession.bind(SessionManager);
export const getSession = SessionManager.getSession.bind(SessionManager);
export const updateActivity = SessionManager.updateActivity.bind(SessionManager);
export const refreshToken = SessionManager.refreshToken.bind(SessionManager);
export const destroySession = SessionManager.destroySession.bind(SessionManager);
export const destroyAllUserSessions = SessionManager.destroyAllUserSessions.bind(SessionManager);
export const getUserSessions = SessionManager.getUserSessions.bind(SessionManager);
export const cleanupExpiredSessions = SessionManager.cleanupExpiredSessions.bind(SessionManager);
