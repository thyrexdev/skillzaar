import { logger } from '@vync/config';
import { pipelineUtils, getRedisClient, PipelineOperation } from '@vync/cache';
import { redisPipelineMonitoringWrapper } from '../middleware/monitoring.middleware';

export interface AuthPipelineResult {
  success: boolean;
  results: any[];
  errors: (Error | null)[];
  executionTime: number;
  operationCount: number;
}

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  lastActivity: string;
  ipAddress: string;
  userAgent: string;
}

export interface OtpData {
  email: string;
  otp: string;
  type: string;
  expiresAt: number;
  attempts: number;
}

/**
 * Batch session operations using Redis pipeline
 */
export const batchSessionOperations = redisPipelineMonitoringWrapper(
  'session_batch',
  async (operations: {
    userId: string;
    sessionData: SessionData;
    ttl: number;
    action: 'create' | 'update' | 'destroy';
  }[]): Promise<AuthPipelineResult> => {
    const pipelineOps: PipelineOperation[] = [];
    
    operations.forEach(({ userId, sessionData, ttl, action }) => {
      const sessionKey = `session:${userId}`;
      const activeSessionsKey = 'tag:active_sessions';
      const userActivityKey = `activity:${userId}`;
      
      switch (action) {
        case 'create':
        case 'update':
          pipelineOps.push(
            {
              command: 'setex',
              args: [sessionKey, ttl, JSON.stringify(sessionData)],
              key: sessionKey,
            },
            {
              command: 'sadd',
              args: [activeSessionsKey, userId],
              key: activeSessionsKey,
            },
            {
              command: 'hset',
              args: [
                userActivityKey,
                'lastSeen', 
                Date.now().toString(),
                'ipAddress', 
                sessionData.ipAddress,
                'userAgent',
                sessionData.userAgent
              ],
              key: userActivityKey,
            },
            {
              command: 'expire',
              args: [userActivityKey, ttl],
              key: userActivityKey,
            }
          );
          break;
          
        case 'destroy':
          pipelineOps.push(
            {
              command: 'del',
              args: [sessionKey],
              key: sessionKey,
            },
            {
              command: 'srem',
              args: [activeSessionsKey, userId],
              key: activeSessionsKey,
            },
            {
              command: 'del',
              args: [userActivityKey],
              key: userActivityKey,
            }
          );
          break;
      }
    });
    
    return await pipelineUtils.execute(pipelineOps);
  }
);

/**
 * Batch user caching operations
 */
export const batchUserCaching = redisPipelineMonitoringWrapper(
  'user_cache_batch',
  async (users: Array<{
    userId: string;
    userData: any;
    ttl?: number;
  }>): Promise<AuthPipelineResult> => {
    const pipelineOps: PipelineOperation[] = [];
    const defaultTtl = 3600; // 1 hour
    
    users.forEach(({ userId, userData, ttl = defaultTtl }) => {
      const userKey = `user:${userId}`;
      const userIndexKey = 'index:users';
      
      pipelineOps.push(
        {
          command: 'setex',
          args: [userKey, ttl, JSON.stringify(userData)],
          key: userKey,
        },
        {
          command: 'sadd',
          args: [userIndexKey, userId],
          key: userIndexKey,
        },
        {
          command: 'expire',
          args: [userIndexKey, ttl * 2], // Index expires later
          key: userIndexKey,
        }
      );
    });
    
    return await pipelineUtils.execute(pipelineOps);
  }
);

/**
 * Batch OTP operations
 */
export const batchOtpOperations = redisPipelineMonitoringWrapper(
  'otp_batch',
  async (otpRequests: Array<{
    email: string;
    otpData: OtpData;
    action: 'create' | 'verify' | 'cleanup';
  }>): Promise<AuthPipelineResult> => {
    const pipelineOps: PipelineOperation[] = [];
    
    otpRequests.forEach(({ email, otpData, action }) => {
      const otpKey = `otp:${email}:${otpData.type}`;
      const attemptsKey = `otp:attempts:${email}:${otpData.type}`;
      const rateLimitKey = `otp:ratelimit:${email}:${otpData.type}`;
      
      switch (action) {
        case 'create':
          pipelineOps.push(
            {
              command: 'setex',
              args: [otpKey, 300, JSON.stringify(otpData)], // 5 minutes
              key: otpKey,
            },
            {
              command: 'setex',
              args: [attemptsKey, 300, '0'],
              key: attemptsKey,
            },
            {
              command: 'setex',
              args: [rateLimitKey, 60, '1'], // 1 minute rate limit
              key: rateLimitKey,
            }
          );
          break;
          
        case 'verify':
          pipelineOps.push(
            {
              command: 'incr',
              args: [attemptsKey],
              key: attemptsKey,
            },
            {
              command: 'expire',
              args: [attemptsKey, 300],
              key: attemptsKey,
            }
          );
          break;
          
        case 'cleanup':
          pipelineOps.push(
            {
              command: 'del',
              args: [otpKey],
              key: otpKey,
            },
            {
              command: 'del',
              args: [attemptsKey],
              key: attemptsKey,
            }
          );
          break;
      }
    });
    
    return await pipelineUtils.execute(pipelineOps);
  }
);

/**
 * Batch token blacklisting operations
 */
export const batchTokenBlacklist = redisPipelineMonitoringWrapper(
  'token_blacklist_batch',
  async (tokens: Array<{
    tokenHash: string;
    expiresAt: number;
    reason?: string;
  }>): Promise<AuthPipelineResult> => {
    const pipelineOps: PipelineOperation[] = [];
    const blacklistIndexKey = 'index:blacklisted_tokens';
    
    tokens.forEach(({ tokenHash, expiresAt, reason = 'logout' }) => {
      const blacklistKey = `blacklist:${tokenHash}`;
      const ttl = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      
      if (ttl > 0) {
        pipelineOps.push(
          {
            command: 'setex',
            args: [blacklistKey, ttl, JSON.stringify({ reason, timestamp: Date.now() })],
            key: blacklistKey,
          },
          {
            command: 'sadd',
            args: [blacklistIndexKey, tokenHash],
            key: blacklistIndexKey,
          },
          {
            command: 'expire',
            args: [blacklistIndexKey, ttl],
            key: blacklistIndexKey,
          }
        );
      }
    });
    
    return await pipelineUtils.execute(pipelineOps);
  }
);

/**
 * Batch rate limiting checks
 */
export const batchRateLimitCheck = redisPipelineMonitoringWrapper(
  'rate_limit_batch',
  async (requests: Array<{
    identifier: string;
    type: string;
    windowMs: number;
    maxRequests: number;
  }>): Promise<{
    results: Array<{
      identifier: string;
      allowed: boolean;
      remaining: number;
      resetTime: number;
    }>;
    success: boolean;
  }> => {
    const pipelineOps: PipelineOperation[] = [];
    const now = Date.now();
    
    // First pass: get current counts
    requests.forEach(({ identifier, type }) => {
      const rateLimitKey = `rate_limit:${type}:${identifier}`;
      pipelineOps.push({
        command: 'get',
        args: [rateLimitKey],
        key: rateLimitKey,
      });
    });
    
    const currentCountsResult = await pipelineUtils.execute(pipelineOps);
    
    // Second pass: update counters for allowed requests
    const updateOps: PipelineOperation[] = [];
    const results: Array<{
      identifier: string;
      allowed: boolean;
      remaining: number;
      resetTime: number;
    }> = [];
    
    requests.forEach(({ identifier, type, windowMs, maxRequests }, index) => {
      const rateLimitKey = `rate_limit:${type}:${identifier}`;
      const currentCount = parseInt(currentCountsResult.results[index] || '0');
      const allowed = currentCount < maxRequests;
      const resetTime = now + windowMs;
      
      results.push({
        identifier,
        allowed,
        remaining: Math.max(0, maxRequests - currentCount - (allowed ? 1 : 0)),
        resetTime,
      });
      
      if (allowed) {
        updateOps.push(
          {
            command: 'incr',
            args: [rateLimitKey],
            key: rateLimitKey,
          },
          {
            command: 'expire',
            args: [rateLimitKey, Math.ceil(windowMs / 1000)],
            key: rateLimitKey,
          }
        );
      }
    });
    
    if (updateOps.length > 0) {
      await pipelineUtils.execute(updateOps);
    }
    
    return {
      results,
      success: true,
    };
  }
);

/**
 * Cleanup expired auth data
 */
export const cleanupExpiredAuthData = redisPipelineMonitoringWrapper(
  'auth_cleanup',
  async (): Promise<{
    cleaned: {
      sessions: number;
      otps: number;
      tokens: number;
      users: number;
    };
    success: boolean;
  }> => {
    const client = getRedisClient();
    const cleanupResults = {
      sessions: 0,
      otps: 0,
      tokens: 0,
      users: 0,
    };
    
    try {
      // Cleanup expired sessions
      const expiredSessionKeys = await client.keys('session:*');
      if (expiredSessionKeys.length > 0) {
        const sessionPipeline: PipelineOperation[] = expiredSessionKeys.map(key => ({
          command: 'ttl',
          args: [key],
          key,
        }));
        
        const ttlResults = await pipelineUtils.execute(sessionPipeline);
        const expiredSessions = expiredSessionKeys.filter((_, index) => 
          ttlResults.results[index] === -2 // Key doesn't exist or expired
        );
        
        if (expiredSessions.length > 0) {
          const cleanupOps: PipelineOperation[] = expiredSessions.map(key => ({
            command: 'del',
            args: [key],
            key,
          }));
          
          const cleanupResult = await pipelineUtils.execute(cleanupOps);
          cleanupResults.sessions = cleanupResult.results.filter(r => r === 1).length;
        }
      }
      
      // Cleanup expired OTPs
      const otpPatterns = ['otp:*', 'otp:attempts:*', 'otp:ratelimit:*'];
      for (const pattern of otpPatterns) {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
          const deleted = await pipelineUtils.batchDelete(keys);
          cleanupResults.otps += deleted;
        }
      }
      
      // Cleanup expired blacklisted tokens
      const tokenKeys = await client.keys('blacklist:*');
      if (tokenKeys.length > 0) {
        const deleted = await pipelineUtils.batchDelete(tokenKeys);
        cleanupResults.tokens = deleted;
      }
      
      logger.info('Auth data cleanup completed', cleanupResults);
      
      return {
        cleaned: cleanupResults,
        success: true,
      };
    } catch (error) {
      logger.error('Auth data cleanup failed:', error);
      return {
        cleaned: cleanupResults,
        success: false,
      };
    }
  }
);

/**
 * Batch user logout operations
 */
export const batchUserLogout = redisPipelineMonitoringWrapper(
  'user_logout_batch',
  async (logoutRequests: Array<{
    userId: string;
    tokenHash: string;
    tokenExpiry: number;
  }>): Promise<AuthPipelineResult> => {
    const pipelineOps: PipelineOperation[] = [];
    
    logoutRequests.forEach(({ userId, tokenHash, tokenExpiry }) => {
      const sessionKey = `session:${userId}`;
      const blacklistKey = `blacklist:${tokenHash}`;
      const activeSessionsKey = 'tag:active_sessions';
      const userKey = `user:${userId}`;
      const userActivityKey = `activity:${userId}`;
      
      const tokenTtl = Math.max(0, Math.floor((tokenExpiry - Date.now()) / 1000));
      
      pipelineOps.push(
        // Remove session
        {
          command: 'del',
          args: [sessionKey],
          key: sessionKey,
        },
        // Blacklist token
        {
          command: 'setex',
          args: [blacklistKey, tokenTtl, JSON.stringify({ 
            reason: 'logout', 
            timestamp: Date.now() 
          })],
          key: blacklistKey,
        },
        // Remove from active sessions
        {
          command: 'srem',
          args: [activeSessionsKey, userId],
          key: activeSessionsKey,
        },
        // Clear user cache
        {
          command: 'del',
          args: [userKey],
          key: userKey,
        },
        // Update activity with logout time
        {
          command: 'hset',
          args: [userActivityKey, 'lastLogout', Date.now().toString()],
          key: userActivityKey,
        },
        {
          command: 'expire',
          args: [userActivityKey, 86400], // Keep activity for 24 hours
          key: userActivityKey,
        }
      );
    });
    
    return await pipelineUtils.execute(pipelineOps);
  }
);

/**
 * Get authentication health metrics using pipeline
 */
export const getAuthHealthMetrics = redisPipelineMonitoringWrapper(
  'auth_health',
  async (): Promise<{
    activeSessions: number;
    blacklistedTokens: number;
    totalUsers: number;
    recentOtps: number;
    rateLimitKeys: number;
    memoryUsage: any;
    connectionStatus: string;
  }> => {
    const client = getRedisClient();
    const pipelineOps: PipelineOperation[] = [
      {
        command: 'scard',
        args: ['tag:active_sessions'],
        key: 'tag:active_sessions',
      },
      {
        command: 'scard',
        args: ['index:blacklisted_tokens'],
        key: 'index:blacklisted_tokens',
      },
      {
        command: 'scard',
        args: ['index:users'],
        key: 'index:users',
      },
      {
        command: 'info',
        args: ['memory'],
        key: 'memory',
      },
      {
        command: 'ping',
        args: [],
        key: 'ping',
      },
    ];
    
    const results = await pipelineUtils.execute(pipelineOps);
    
    // Count recent OTPs and rate limit keys separately
    const [otpKeys, rateLimitKeys] = await Promise.all([
      client.keys('otp:*'),
      client.keys('rate_limit:*'),
    ]);
    
    return {
      activeSessions: results.results[0] || 0,
      blacklistedTokens: results.results[1] || 0,
      totalUsers: results.results[2] || 0,
      recentOtps: otpKeys.length,
      rateLimitKeys: rateLimitKeys.length,
      memoryUsage: results.results[3],
      connectionStatus: results.results[4] === 'PONG' ? 'connected' : 'disconnected',
    };
  }
);

/**
 * Periodic cleanup scheduler
 */
export const schedulePeriodicCleanup = (): NodeJS.Timeout => {
  return setInterval(async () => {
    try {
      const result = await cleanupExpiredAuthData();
      logger.info('Scheduled auth cleanup completed', result.cleaned);
    } catch (error) {
      logger.error('Scheduled auth cleanup failed:', error);
    }
  }, 300000); // Every 5 minutes
};

/**
 * Initialize auth pipeline service
 */
export const initializeAuthPipeline = (): void => {
  // Start periodic cleanup
  schedulePeriodicCleanup();
  logger.info('Auth pipeline service initialized with periodic cleanup');
};
