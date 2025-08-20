import { redisMonitoring } from './monitoring';
import { logger } from '@vync/config/src/logger';

/**
 * Redis operation monitoring wrapper
 */
export const withMonitoring = <T extends any[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    const operationId = redisMonitoring.startOperation(operation, args[0] as string);
    const startTime = Date.now();
    
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      
      // Record successful operation
      redisMonitoring.endOperation(operationId, true, undefined, JSON.stringify(result).length);
      
      // Record specific operation type
      if (operation.toLowerCase().includes('get')) {
        if (result !== null && result !== undefined) {
          redisMonitoring.recordCacheHit(operation, args[0] as string, JSON.stringify(result).length);
        } else {
          redisMonitoring.recordCacheMiss(operation, args[0] as string);
        }
      } else if (operation.toLowerCase().includes('set')) {
        redisMonitoring.recordCacheSet(operation, args[0] as string, JSON.stringify(args[1]).length);
      } else if (operation.toLowerCase().includes('del')) {
        redisMonitoring.recordCacheDelete(operation, args[0] as string);
      }
      
      if (duration > 100) {
        logger.warn(`Slow Redis operation ${operation}: ${duration}ms for key: ${args[0]}`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      redisMonitoring.endOperation(operationId, false, errorMessage);
      redisMonitoring.recordError(operation, error instanceof Error ? error.name : 'UnknownError', errorMessage);
      
      logger.error(`Redis operation ${operation} failed after ${duration}ms:`, error);
      throw error;
    }
  };
};

/**
 * Batch operation monitoring
 */
export const withBatchMonitoring = <T extends any[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    const batchSize = Array.isArray(args[0]) ? args[0].length : 1;
    const operationId = redisMonitoring.startOperation(`batch_${operation}`, `batch:${batchSize}`);
    const startTime = Date.now();
    
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      
      redisMonitoring.endOperation(operationId, true, undefined, JSON.stringify(result).length);
      
      // Record batch metrics
      redisMonitoring.recordCacheSet(`batch_${operation}`, `batch:${batchSize}`, JSON.stringify(result).length);
      
      if (duration > 200) {
        logger.warn(`Slow batch Redis operation ${operation}: ${duration}ms for ${batchSize} items`);
      }
      
      logger.debug(`Batch ${operation} completed in ${duration}ms for ${batchSize} items`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      redisMonitoring.endOperation(operationId, false, errorMessage);
      redisMonitoring.recordError(`batch_${operation}`, error instanceof Error ? error.name : 'UnknownError', errorMessage);
      
      logger.error(`Batch Redis operation ${operation} failed after ${duration}ms:`, error);
      throw error;
    }
  };
};

/**
 * Pipeline operation monitoring
 */
export const withPipelineMonitoring = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    const operationCount = Array.isArray(args[0]) ? args[0].length : 1;
    const operationId = redisMonitoring.startOperation('pipeline', `ops:${operationCount}`);
    const startTime = Date.now();
    
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      
      redisMonitoring.endOperation(operationId, true, undefined, JSON.stringify(result).length);
      
      if (duration > 150) {
        logger.warn(`Slow pipeline operation: ${duration}ms for ${operationCount} operations`);
      }
      
      logger.debug(`Pipeline completed in ${duration}ms for ${operationCount} operations`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      redisMonitoring.endOperation(operationId, false, errorMessage);
      redisMonitoring.recordError('pipeline', error instanceof Error ? error.name : 'UnknownError', errorMessage);
      
      logger.error(`Pipeline operation failed after ${duration}ms:`, error);
      throw error;
    }
  };
};

/**
 * Session operation monitoring
 */
export const withSessionMonitoring = <T extends any[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    const userId = args[0] as string;
    const operationId = redisMonitoring.startOperation(`session_${operation}`, `user:${userId}`);
    const startTime = Date.now();
    
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      
      redisMonitoring.endOperation(operationId, true, undefined, JSON.stringify(result).length);
      
      if (operation === 'get') {
        if (result !== null && result !== undefined) {
          redisMonitoring.recordCacheHit(`session_${operation}`, `user:${userId}`, JSON.stringify(result).length);
        } else {
          redisMonitoring.recordCacheMiss(`session_${operation}`, `user:${userId}`);
        }
      } else if (operation === 'set') {
        redisMonitoring.recordCacheSet(`session_${operation}`, `user:${userId}`, JSON.stringify(args[1]).length);
      } else if (operation === 'delete') {
        redisMonitoring.recordCacheDelete(`session_${operation}`, `user:${userId}`);
      }
      
      logger.debug(`Session ${operation} for user ${userId} completed in ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      redisMonitoring.endOperation(operationId, false, errorMessage);
      redisMonitoring.recordError(`session_${operation}`, error instanceof Error ? error.name : 'UnknownError', errorMessage);
      
      logger.error(`Session ${operation} for user ${userId} failed after ${duration}ms:`, error);
      throw error;
    }
  };
};

/**
 * Rate limiting operation monitoring
 */
export const withRateLimitMonitoring = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    const identifier = args[0] as string;
    const operationId = redisMonitoring.startOperation('rate_limit', identifier);
    const startTime = Date.now();
    
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      
      redisMonitoring.endOperation(operationId, true, undefined, JSON.stringify(result).length);
      
      if (duration > 50) {
        logger.warn(`Slow rate limit check: ${duration}ms for ${identifier}`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      redisMonitoring.endOperation(operationId, false, errorMessage);
      redisMonitoring.recordError('rate_limit', error instanceof Error ? error.name : 'UnknownError', errorMessage);
      
      logger.error(`Rate limit check failed after ${duration}ms for ${identifier}:`, error);
      throw error;
    }
  };
};

/**
 * OTP operation monitoring
 */
export const withOtpMonitoring = <T extends any[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    const email = args[0] as string;
    const operationId = redisMonitoring.startOperation(`otp_${operation}`, email);
    const startTime = Date.now();
    
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      
      redisMonitoring.endOperation(operationId, true, undefined, JSON.stringify(result).length);
      
      if (operation === 'verify') {
        if (result && typeof result === 'object' && 'success' in result && result.success) {
          redisMonitoring.recordCacheHit(`otp_${operation}`, email);
        } else {
          redisMonitoring.recordCacheMiss(`otp_${operation}`, email);
        }
      } else if (operation === 'create') {
        redisMonitoring.recordCacheSet(`otp_${operation}`, email, JSON.stringify(args).length);
      }
      
      logger.debug(`OTP ${operation} for ${email} completed in ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      redisMonitoring.endOperation(operationId, false, errorMessage);
      redisMonitoring.recordError(`otp_${operation}`, error instanceof Error ? error.name : 'UnknownError', errorMessage);
      
      logger.error(`OTP ${operation} for ${email} failed after ${duration}ms:`, error);
      throw error;
    }
  };
};

/**
 * Performance alert thresholds
 */
export const performanceThresholds = {
  get: 50,       // 50ms for GET operations
  set: 100,      // 100ms for SET operations
  delete: 75,    // 75ms for DELETE operations
  pipeline: 200, // 200ms for pipeline operations
  batch: 300,    // 300ms for batch operations
  session: 100,  // 100ms for session operations
  rateLimit: 50, // 50ms for rate limit checks
  otp: 150,      // 150ms for OTP operations
};

/**
 * Check if operation exceeded performance threshold
 */
export const checkPerformanceThreshold = (operation: string, duration: number): boolean => {
  const baseOperation = operation.split('_')[0];
  const threshold = performanceThresholds[baseOperation as keyof typeof performanceThresholds] || 100;
  
  if (duration > threshold) {
    logger.warn(`Performance threshold exceeded for ${operation}: ${duration}ms (threshold: ${threshold}ms)`);
    return true;
  }
  
  return false;
};

/**
 * Generic operation wrapper with performance monitoring
 */
export const withPerformanceMonitoring = <T extends any[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>,
  customThreshold?: number
) => {
  return async (...args: T): Promise<R> => {
    const operationId = redisMonitoring.startOperation(operation, args[0] as string);
    const startTime = Date.now();
    
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      
      redisMonitoring.endOperation(operationId, true, undefined, JSON.stringify(result).length);
      
      const threshold = customThreshold || performanceThresholds[operation as keyof typeof performanceThresholds] || 100;
      if (duration > threshold) {
        logger.warn(`${operation} exceeded threshold: ${duration}ms > ${threshold}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      redisMonitoring.endOperation(operationId, false, errorMessage);
      redisMonitoring.recordError(operation, error instanceof Error ? error.name : 'UnknownError', errorMessage);
      
      throw error;
    }
  };
};

export const monitoringMiddleware = {
  withMonitoring,
  withBatchMonitoring,
  withPipelineMonitoring,
  withSessionMonitoring,
  withRateLimitMonitoring,
  withOtpMonitoring,
  withPerformanceMonitoring,
  checkPerformanceThreshold,
};
