import { Context, Next } from 'hono';
import { logger } from '@vync/config';
import { 
  startOperation, 
  completeOperation, 
  recordAuthOperation 
} from '../services/monitoring.service';

/**
 * Extract client IP from request headers
 */
const getClientIp = (c: Context): string => {
  return c.req.header('X-Forwarded-For') || 
         c.req.header('X-Real-IP') || 
         c.req.header('CF-Connecting-IP') || 
         'unknown';
};

/**
 * Extract user agent from request headers
 */
const getUserAgent = (c: Context): string => {
  return c.req.header('User-Agent') || 'unknown';
};

/**
 * Extract user ID from request context or token
 */
const extractUserId = async (c: Context): Promise<string | undefined> => {
  try {
    const authHeader = c.req.header('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { getUserFromToken } = await import('@vync/shared');
      const user = await getUserFromToken(token);
      return user?.userId;
    }
  } catch (error) {
    // Ignore token parsing errors
  }
  return undefined;
};

/**
 * Determine operation type from request path and method
 */
const getOperationType = (path: string, method: string): string => {
  // Normalize path by removing leading slashes and splitting
  const pathParts = path.replace(/^\/+/, '').split('/');
  
  if (pathParts.includes('auth')) {
    if (pathParts.includes('login')) return 'login';
    if (pathParts.includes('register')) return 'register';
    if (pathParts.includes('logout')) return 'logout';
    if (pathParts.includes('refresh')) return 'token_refresh';
    if (pathParts.includes('forgot-password')) return 'password_reset_request';
    if (pathParts.includes('reset-password')) return 'password_reset';
  }
  
  if (pathParts.includes('verify-token')) return 'token_verify';
  
  if (pathParts.includes('otp')) {
    if (method === 'POST' && pathParts.includes('send')) return 'otp_generate';
    if (method === 'POST' && pathParts.includes('verify')) return 'otp_verify';
    if (method === 'POST' && pathParts.includes('resend')) return 'otp_resend';
  }
  
  if (pathParts.includes('oauth')) {
    if (pathParts.includes('google')) return 'oauth_google';
    if (pathParts.includes('github')) return 'oauth_github';
    return 'oauth_login';
  }
  
  if (pathParts.includes('client') || pathParts.includes('freelancer')) {
    if (method === 'POST') return 'profile_create';
    if (method === 'PUT' || method === 'PATCH') return 'profile_update';
    if (method === 'GET') return 'profile_get';
  }
  
  return 'unknown_operation';
};

/**
 * General monitoring middleware for all requests
 */
export const monitoringMiddleware = () => {
  return async (c: Context, next: Next) => {
    const startTime = Date.now();
    const operationType = getOperationType(c.req.path, c.req.method);
    const clientIp = getClientIp(c);
    const userAgent = getUserAgent(c);
    
    // Start operation tracking
    const operationId = startOperation(operationType, undefined, clientIp, userAgent);
    
    // Store operation ID in context for later use
    c.set('operationId', operationId);
    c.set('operationType', operationType);
    c.set('startTime', startTime);
    
    try {
      await next();
      
      // Operation completed successfully
      const duration = Date.now() - startTime;
      const userId = await extractUserId(c);
      
      completeOperation(operationId, true, undefined, {
        statusCode: c.res.status,
        duration,
        userId,
      });
      
      // Log slow operations
      if (duration > 2000) {
        logger.warn(`Slow operation detected: ${operationType} took ${duration}ms`, {
          path: c.req.path,
          method: c.req.method,
          ip: clientIp,
          userId,
        });
      }
      
    } catch (error) {
      // Operation failed
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const userId = await extractUserId(c);
      
      completeOperation(operationId, false, errorMessage, {
        statusCode: 500,
        duration,
        userId,
      });
      
      throw error; // Re-throw to maintain error handling flow
    }
  };
};

/**
 * Authentication-specific monitoring middleware
 */
export const authMonitoringMiddleware = (operationType: string) => {
  return async (c: Context, next: Next) => {
    const startTime = Date.now();
    const clientIp = getClientIp(c);
    const userAgent = getUserAgent(c);
    let userId: string | undefined;
    
    try {
      // Extract userId from request body for login/register operations
      if (['login', 'register'].includes(operationType)) {
        const body = await c.req.json().catch(() => ({}));
        userId = body.userId || body.email || body.username;
      } else {
        userId = await extractUserId(c);
      }
      
      const operationId = startOperation(operationType, userId, clientIp, userAgent);
      c.set('operationId', operationId);
      
      await next();
      
      // Check response status to determine success
      const isSuccess = c.res.status >= 200 && c.res.status < 400;
      const duration = Date.now() - startTime;
      
      completeOperation(operationId, isSuccess, undefined, {
        statusCode: c.res.status,
        duration,
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      const operationId = c.get('operationId');
      if (operationId) {
        completeOperation(operationId, false, errorMessage, {
          statusCode: 500,
          duration,
        });
      } else {
        // Fallback if operation wasn't started
        recordAuthOperation(operationType, false, userId, clientIp, userAgent, errorMessage);
      }
      
      throw error;
    }
  };
};

/**
 * Session monitoring middleware
 */
export const sessionMonitoringMiddleware = () => {
  return async (c: Context, next: Next) => {
    const userId = await extractUserId(c);
    if (!userId) {
      await next();
      return;
    }
    
    const clientIp = getClientIp(c);
    const operationId = startOperation('session_update', userId, clientIp);
    
    try {
      await next();
      
      completeOperation(operationId, true, undefined, {
        statusCode: c.res.status,
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      completeOperation(operationId, false, errorMessage);
      throw error;
    }
  };
};

/**
 * Rate limit monitoring middleware
 */
export const rateLimitMonitoringMiddleware = (identifier: string) => {
  return async (c: Context, next: Next) => {
    const clientIp = getClientIp(c);
    
    try {
      await next();
    } catch (error) {
      // If this is a rate limit error, record it
      if (error instanceof Error && error.message.toLowerCase().includes('rate limit')) {
        recordAuthOperation('rate_limit_hit', false, undefined, clientIp, getUserAgent(c), error.message);
      }
      throw error;
    }
  };
};

/**
 * OTP operation monitoring wrapper
 */
export const otpMonitoringWrapper = <T extends any[]>(
  operationType: 'otp_generate' | 'otp_verify' | 'otp_resend',
  fn: (...args: T) => Promise<any>
) => {
  return async (...args: T): Promise<any> => {
    const startTime = Date.now();
    const email = args[0] as string; // Assuming first arg is email
    
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      
      recordAuthOperation(operationType, true, email, undefined, undefined, undefined, {
        duration,
        result,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      recordAuthOperation(operationType, false, email, undefined, undefined, errorMessage, {
        duration,
      });
      
      throw error;
    }
  };
};

/**
 * Database operation monitoring wrapper
 */
export const dbOperationMonitoringWrapper = <T extends any[]>(
  operationType: string,
  fn: (...args: T) => Promise<any>
) => {
  return async (...args: T): Promise<any> => {
    const startTime = Date.now();
    
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      
      // Log slow database operations
      if (duration > 1000) {
        logger.warn(`Slow database operation: ${operationType} took ${duration}ms`);
      }
      
      recordAuthOperation(`db_${operationType}`, true, undefined, undefined, undefined, undefined, {
        duration,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      recordAuthOperation(`db_${operationType}`, false, undefined, undefined, undefined, errorMessage, {
        duration,
      });
      
      throw error;
    }
  };
};

/**
 * Performance monitoring decorator for functions
 */
export const withPerformanceMonitoring = <T extends any[], R>(
  operationType: string,
  fn: (...args: T) => Promise<R>
): ((...args: T) => Promise<R>) => {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      
      // Record successful operation
      recordAuthOperation(operationType, true, undefined, undefined, undefined, undefined, {
        duration,
        args: args.length,
      });
      
      // Alert on slow operations
      if (duration > 2000) {
        logger.warn(`Performance alert: ${operationType} took ${duration}ms`, {
          args: args.length,
          timestamp: new Date().toISOString(),
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      recordAuthOperation(operationType, false, undefined, undefined, undefined, errorMessage, {
        duration,
        args: args.length,
      });
      
      throw error;
    }
  };
};

/**
 * Batch operation monitoring
 */
export const batchOperationMonitoring = async <T>(
  operationType: string,
  batchSize: number,
  operation: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    
    recordAuthOperation(`batch_${operationType}`, true, undefined, undefined, undefined, undefined, {
      duration,
      batchSize,
    });
    
    logger.debug(`Batch ${operationType} completed: ${batchSize} items in ${duration}ms`);
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    recordAuthOperation(`batch_${operationType}`, false, undefined, undefined, undefined, errorMessage, {
      duration,
      batchSize,
    });
    
    throw error;
  }
};

/**
 * Redis pipeline monitoring wrapper
 */
export const redisPipelineMonitoringWrapper = <T extends any[]>(
  operationType: string,
  fn: (...args: T) => Promise<any>
) => {
  return async (...args: T): Promise<any> => {
    const startTime = Date.now();
    const operationCount = Array.isArray(args[0]) ? args[0].length : 1;
    
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      
      recordAuthOperation(`pipeline_${operationType}`, true, undefined, undefined, undefined, undefined, {
        duration,
        operationCount,
        success: result.success,
      });
      
      if (duration > 500) {
        logger.warn(`Slow Redis pipeline: ${operationType} with ${operationCount} operations took ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      recordAuthOperation(`pipeline_${operationType}`, false, undefined, undefined, undefined, errorMessage, {
        duration,
        operationCount,
      });
      
      throw error;
    }
  };
};
