import { logger } from '@vync/config';
import { redisMonitoring, getRedisClient, pipelineUtils } from '@vync/cache';
import { authCacheUtils } from '../utils/cache.utils';

export interface AuthMetrics {
  authentication: {
    loginAttempts: number;
    successfulLogins: number;
    failedLogins: number;
    registrations: number;
    tokenVerifications: number;
    passwordResets: number;
    logouts: number;
    sessionTimeouts: number;
  };
  sessions: {
    activeSessions: number;
    sessionCreations: number;
    sessionUpdates: number;
    sessionDestructions: number;
    averageSessionDuration: number;
    concurrentUsers: number;
  };
  otp: {
    otpGenerated: number;
    otpVerified: number;
    otpExpired: number;
    otpAttempts: number;
    otpRateLimited: number;
  };
  security: {
    blacklistedTokens: number;
    rateLimitHits: number;
    suspiciousActivities: number;
    failedAttemptsByIp: { [ip: string]: number };
  };
  performance: {
    averageResponseTime: number;
    slowQueries: number;
    errorRate: number;
    throughput: number;
  };
  redis: {
    connectionStatus: string;
    keyCount: number;
    memoryUsage: number;
    hitRate: number;
    avgLatency: number;
    errors: number;
  };
}

export interface AuthOperation {
  type: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  metadata?: any;
  id?: string;
}

// Global state
let metrics: AuthMetrics;
let operations: AuthOperation[] = [];
const maxOperationHistory = 10000;
let startTime: number;

/**
 * Initialize metrics structure
 */
const initializeMetrics = (): AuthMetrics => ({
  authentication: {
    loginAttempts: 0,
    successfulLogins: 0,
    failedLogins: 0,
    registrations: 0,
    tokenVerifications: 0,
    passwordResets: 0,
    logouts: 0,
    sessionTimeouts: 0,
  },
  sessions: {
    activeSessions: 0,
    sessionCreations: 0,
    sessionUpdates: 0,
    sessionDestructions: 0,
    averageSessionDuration: 0,
    concurrentUsers: 0,
  },
  otp: {
    otpGenerated: 0,
    otpVerified: 0,
    otpExpired: 0,
    otpAttempts: 0,
    otpRateLimited: 0,
  },
  security: {
    blacklistedTokens: 0,
    rateLimitHits: 0,
    suspiciousActivities: 0,
    failedAttemptsByIp: {},
  },
  performance: {
    averageResponseTime: 0,
    slowQueries: 0,
    errorRate: 0,
    throughput: 0,
  },
  redis: {
    connectionStatus: 'unknown',
    keyCount: 0,
    memoryUsage: 0,
    hitRate: 0,
    avgLatency: 0,
    errors: 0,
  },
});

/**
 * Update authentication metrics based on operation type
 */
const updateAuthMetrics = (type: string, success: boolean, ip?: string): void => {
  switch (type) {
    case 'login':
      metrics.authentication.loginAttempts++;
      if (success) {
        metrics.authentication.successfulLogins++;
      } else {
        metrics.authentication.failedLogins++;
        if (ip) {
          metrics.security.failedAttemptsByIp[ip] = 
            (metrics.security.failedAttemptsByIp[ip] || 0) + 1;
        }
      }
      break;
    case 'register':
      if (success) {
        metrics.authentication.registrations++;
      }
      break;
    case 'token_verify':
      metrics.authentication.tokenVerifications++;
      break;
    case 'password_reset':
      if (success) {
        metrics.authentication.passwordResets++;
      }
      break;
    case 'logout':
      if (success) {
        metrics.authentication.logouts++;
      }
      break;
    case 'session_create':
      if (success) {
        metrics.sessions.sessionCreations++;
      }
      break;
    case 'session_update':
      if (success) {
        metrics.sessions.sessionUpdates++;
      }
      break;
    case 'session_destroy':
      if (success) {
        metrics.sessions.sessionDestructions++;
      }
      break;
    case 'otp_generate':
      if (success) {
        metrics.otp.otpGenerated++;
      }
      break;
    case 'otp_verify':
      metrics.otp.otpAttempts++;
      if (success) {
        metrics.otp.otpVerified++;
      }
      break;
    case 'rate_limit_hit':
      metrics.security.rateLimitHits++;
      break;
  }
};

/**
 * Update performance metrics
 */
const updatePerformanceMetrics = (operation: AuthOperation): void => {
  if (operation.duration) {
    const totalOps = operations.filter(op => op.duration).length;
    const totalDuration = operations
      .filter(op => op.duration)
      .reduce((sum, op) => sum + (op.duration || 0), 0);
    
    metrics.performance.averageResponseTime = totalDuration / totalOps;

    if (operation.duration > 1000) {
      metrics.performance.slowQueries++;
      logger.warn(`Slow auth operation: ${operation.type} took ${operation.duration}ms`);
    }
  }

  const recentOps = getRecentOperations(300000); // Last 5 minutes
  const errorCount = recentOps.filter(op => !op.success).length;
  metrics.performance.errorRate = recentOps.length > 0 ? 
    (errorCount / recentOps.length) * 100 : 0;
  
  metrics.performance.throughput = recentOps.length / 5; // ops per minute
};

/**
 * Record security event
 */
const recordSecurityEvent = (type: string, ip?: string, error?: string): void => {
  metrics.security.suspiciousActivities++;
  
  logger.warn(`Security event: ${type} failed`, {
    ip,
    error,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Record authentication operation
 */
export const recordAuthOperation = (
  type: string,
  success: boolean,
  userId?: string,
  ip?: string,
  userAgent?: string,
  error?: string,
  metadata?: any
): void => {
  const operation: AuthOperation = {
    type,
    userId,
    ip,
    userAgent,
    startTime: Date.now(),
    endTime: Date.now(),
    duration: 0,
    success,
    error,
    metadata,
  };

  operations.push(operation);
  
  // Keep operation history manageable
  if (operations.length > maxOperationHistory) {
    operations.shift();
  }

  // Update metrics
  updateAuthMetrics(type, success, ip);
  
  // Log security events
  if (!success && ['login', 'token_verify'].includes(type)) {
    recordSecurityEvent(type, ip, error);
  }
};

/**
 * Start operation tracking
 */
export const startOperation = (
  type: string, 
  userId?: string, 
  ip?: string, 
  userAgent?: string
): string => {
  const operationId = `${Date.now()}-${Math.random()}`;
  const operation: AuthOperation = {
    type,
    userId,
    ip,
    userAgent,
    startTime: Date.now(),
    success: false,
    id: operationId,
  };

  operations.push(operation);
  return operationId;
};

/**
 * Complete operation tracking
 */
export const completeOperation = (
  operationId: string, 
  success: boolean, 
  error?: string, 
  metadata?: any
): void => {
  const operation = operations.find(op => op.id === operationId);
  if (operation) {
    operation.endTime = Date.now();
    operation.duration = operation.endTime - operation.startTime;
    operation.success = success;
    operation.error = error;
    operation.metadata = metadata;

    updateAuthMetrics(operation.type, success, operation.ip);
    updatePerformanceMetrics(operation);

    if (!success) {
      recordSecurityEvent(operation.type, operation.ip, error);
    }
  }
};

/**
 * Get recent operations
 */
export const getRecentOperations = (timeWindowMs: number = 300000): AuthOperation[] => {
  const cutoff = Date.now() - timeWindowMs;
  return operations.filter(op => op.startTime > cutoff);
};

/**
 * Get operations by type
 */
export const getOperationsByType = (type: string, limit: number = 100): AuthOperation[] => {
  return operations
    .filter(op => op.type === type)
    .slice(-limit)
    .reverse();
};

/**
 * Get failed operations
 */
export const getFailedOperations = (limit: number = 100): AuthOperation[] => {
  return operations
    .filter(op => !op.success)
    .slice(-limit)
    .reverse();
};

/**
 * Get slow operations
 */
export const getSlowOperations = (thresholdMs: number = 1000, limit: number = 100): AuthOperation[] => {
  return operations
    .filter(op => op.duration && op.duration > thresholdMs)
    .sort((a, b) => (b.duration || 0) - (a.duration || 0))
    .slice(0, limit);
};

/**
 * Get user activity summary
 */
export const getUserActivity = async (userId: string): Promise<{
  totalOperations: number;
  successRate: number;
  lastActivity: string;
  operationBreakdown: { [type: string]: number };
}> => {
  const userOps = operations.filter(op => op.userId === userId);
  const successCount = userOps.filter(op => op.success).length;
  const operationBreakdown: { [type: string]: number } = {};

  userOps.forEach(op => {
    operationBreakdown[op.type] = (operationBreakdown[op.type] || 0) + 1;
  });

  return {
    totalOperations: userOps.length,
    successRate: userOps.length > 0 ? (successCount / userOps.length) * 100 : 0,
    lastActivity: userOps.length > 0 ? 
      new Date(Math.max(...userOps.map(op => op.endTime || op.startTime))).toISOString() : 
      'never',
    operationBreakdown,
  };
};

/**
 * Get blacklisted tokens count
 */
const getBlacklistedTokensCount = async (): Promise<number> => {
  try {
    const client = getRedisClient();
    const keys = await client.keys('blacklist:*');
    return keys.length;
  } catch (error) {
    return 0;
  }
};

/**
 * Collect Redis metrics
 */
export const collectRedisMetrics = async (): Promise<void> => {
  try {
    const cacheMetrics = redisMonitoring.getCacheMetrics();
    const healthCheck = await pipelineUtils.healthCheck();

    // Determine connection status from ping result
    const connectionStatus = healthCheck.ping ? 'connected' : 'disconnected';

    metrics.redis = {
      connectionStatus,
      keyCount: healthCheck.keyCount,
      memoryUsage: healthCheck.memory.used_memory || 0,
      hitRate: cacheMetrics.hitRate,
      avgLatency: cacheMetrics.avgLatency,
      errors: cacheMetrics.errors,
    };

    // Collect auth-specific Redis data
    metrics.sessions.activeSessions = await authCacheUtils.getActiveSessionsCount();
    metrics.security.blacklistedTokens = await getBlacklistedTokensCount();
    
  } catch (error) {
    logger.error('Failed to collect Redis metrics:', error);
    metrics.redis.connectionStatus = 'error';
  }
};

/**
 * Get comprehensive metrics
 */
export const getMetrics = async (): Promise<AuthMetrics & { uptime: number; timestamp: string }> => {
  await collectRedisMetrics();
  
  return {
    ...metrics,
    uptime: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Get metrics summary for dashboard
 */
export const getMetricsSummary = async (): Promise<{
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  successRate: number;
  avgResponseTime: number;
  redisHealth: string;
  alerts: string[];
}> => {
  const currentMetrics = await getMetrics();
  const recentOps = getRecentOperations(3600000); // Last hour
  const uniqueUsers = new Set(recentOps.filter(op => op.userId).map(op => op.userId)).size;
  
  const alerts: string[] = [];
  
  // Check for performance issues
  if (currentMetrics.performance.averageResponseTime > 2000) {
    alerts.push('High response time detected');
  }
  
  if (currentMetrics.performance.errorRate > 5) {
    alerts.push('High error rate detected');
  }
  
  if (currentMetrics.redis.connectionStatus !== 'connected') {
    alerts.push('Redis connection issues');
  }
  
  const totalAttempts = currentMetrics.authentication.loginAttempts;
  const successRate = totalAttempts > 0 ? 
    (currentMetrics.authentication.successfulLogins / totalAttempts) * 100 : 0;

  return {
    totalUsers: uniqueUsers,
    activeUsers: currentMetrics.sessions.concurrentUsers,
    totalSessions: currentMetrics.sessions.activeSessions,
    successRate: Math.round(successRate * 100) / 100,
    avgResponseTime: Math.round(currentMetrics.performance.averageResponseTime),
    redisHealth: currentMetrics.redis.connectionStatus,
    alerts,
  };
};

/**
 * Get Prometheus formatted metrics
 */
export const getPrometheusMetrics = (): string => {
  const timestamp = Date.now();
  let output = '';

  // Authentication metrics
  output += `# HELP auth_login_attempts_total Total login attempts\n`;
  output += `# TYPE auth_login_attempts_total counter\n`;
  output += `auth_login_attempts_total ${metrics.authentication.loginAttempts} ${timestamp}\n\n`;

  output += `# HELP auth_login_success_total Successful logins\n`;
  output += `# TYPE auth_login_success_total counter\n`;
  output += `auth_login_success_total ${metrics.authentication.successfulLogins} ${timestamp}\n\n`;

  output += `# HELP auth_sessions_active Active sessions count\n`;
  output += `# TYPE auth_sessions_active gauge\n`;
  output += `auth_sessions_active ${metrics.sessions.activeSessions} ${timestamp}\n\n`;

  output += `# HELP auth_response_time_avg Average response time in milliseconds\n`;
  output += `# TYPE auth_response_time_avg gauge\n`;
  output += `auth_response_time_avg ${metrics.performance.averageResponseTime} ${timestamp}\n\n`;

  output += `# HELP auth_error_rate Error rate percentage\n`;
  output += `# TYPE auth_error_rate gauge\n`;
  output += `auth_error_rate ${metrics.performance.errorRate} ${timestamp}\n\n`;

  // OTP metrics
  output += `# HELP auth_otp_generated_total Total OTP generated\n`;
  output += `# TYPE auth_otp_generated_total counter\n`;
  output += `auth_otp_generated_total ${metrics.otp.otpGenerated} ${timestamp}\n\n`;

  output += `# HELP auth_otp_verified_total Total OTP verified\n`;
  output += `# TYPE auth_otp_verified_total counter\n`;
  output += `auth_otp_verified_total ${metrics.otp.otpVerified} ${timestamp}\n\n`;

  // Security metrics
  output += `# HELP auth_blacklisted_tokens Blacklisted tokens count\n`;
  output += `# TYPE auth_blacklisted_tokens gauge\n`;
  output += `auth_blacklisted_tokens ${metrics.security.blacklistedTokens} ${timestamp}\n\n`;

  output += `# HELP auth_rate_limit_hits_total Rate limit hits\n`;
  output += `# TYPE auth_rate_limit_hits_total counter\n`;
  output += `auth_rate_limit_hits_total ${metrics.security.rateLimitHits} ${timestamp}\n\n`;

  // Redis metrics
  output += `# HELP auth_redis_keys Redis keys count\n`;
  output += `# TYPE auth_redis_keys gauge\n`;
  output += `auth_redis_keys ${metrics.redis.keyCount} ${timestamp}\n\n`;

  output += `# HELP auth_redis_memory_bytes Redis memory usage in bytes\n`;
  output += `# TYPE auth_redis_memory_bytes gauge\n`;
  output += `auth_redis_memory_bytes ${metrics.redis.memoryUsage} ${timestamp}\n\n`;

  return output;
};

/**
 * Start periodic metrics collection
 */
const startPeriodicCollection = (): void => {
  setInterval(async () => {
    try {
      await collectRedisMetrics();
    } catch (error) {
      logger.error('Periodic metrics collection failed:', error);
    }
  }, 30000); // Every 30 seconds

  // Cleanup old operations periodically
  setInterval(() => {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    operations = operations.filter(op => op.startTime > cutoff);
  }, 3600000); // Every hour
};

/**
 * Reset metrics (for testing or maintenance)
 */
export const resetMetrics = (): void => {
  metrics = initializeMetrics();
  operations = [];
  startTime = Date.now();
  logger.info('Auth metrics reset');
};

/**
 * Initialize monitoring service
 */
export const initializeMonitoring = (): void => {
  startTime = Date.now();
  metrics = initializeMetrics();
  startPeriodicCollection();
  logger.info('Auth monitoring service initialized');
};

/**
 * Get current operations count
 */
export const getOperationsCount = (): number => operations.length;

/**
 * Get metrics for specific time range
 */
export const getMetricsForTimeRange = (startTime: number, endTime: number): {
  operations: AuthOperation[];
  summary: {
    totalOps: number;
    successRate: number;
    avgDuration: number;
    errorCount: number;
  };
} => {
  const filteredOps = operations.filter(
    op => op.startTime >= startTime && op.startTime <= endTime
  );
  
  const successCount = filteredOps.filter(op => op.success).length;
  const totalDuration = filteredOps
    .filter(op => op.duration)
    .reduce((sum, op) => sum + (op.duration || 0), 0);
  const avgDuration = filteredOps.length > 0 ? totalDuration / filteredOps.length : 0;

  return {
    operations: filteredOps,
    summary: {
      totalOps: filteredOps.length,
      successRate: filteredOps.length > 0 ? (successCount / filteredOps.length) * 100 : 0,
      avgDuration,
      errorCount: filteredOps.length - successCount,
    },
  };
};
