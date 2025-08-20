import { redis } from './redis';
import { logger } from '@vync/config/src/logger';

/**
 * Cache utility functions for common patterns
 */
export const cacheUtils = {
  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  getOrSet: async <T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> => {
    try {
      // Try to get from cache
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }

      // Compute the value
      const value = await fetchFn();
      
      // Store in cache
      await redis.set(key, JSON.stringify(value), ttlSeconds);
      
      return value;
    } catch (error) {
      logger.error(`Cache getOrSet error for key ${key}:`, error);
      // Fallback to computing without cache
      return await fetchFn();
    }
  },

  /**
   * Cache with JSON serialization/deserialization
   */
  setJSON: async <T>(key: string, value: T, ttlSeconds?: number): Promise<void> => {
    try {
      await redis.set(key, JSON.stringify(value), ttlSeconds);
    } catch (error) {
      logger.error(`Error setting JSON cache for key ${key}:`, error);
      throw error;
    }
  },

  getJSON: async <T>(key: string): Promise<T | null> => {
    try {
      const cached = await redis.get(key);
      if (!cached) return null;
      
      return JSON.parse(cached) as T;
    } catch (error) {
      logger.error(`Error getting JSON cache for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Cache invalidation patterns
   */
  invalidatePattern: async (pattern: string): Promise<number> => {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      return await redis.delMultiple(keys);
    } catch (error) {
      logger.error(`Error invalidating pattern ${pattern}:`, error);
      return 0;
    }
  },

  /**
   * Tag-based cache invalidation
   */
  setWithTags: async (key: string, value: string, tags: string[], ttlSeconds?: number): Promise<void> => {
    try {
      // Set the main key
      await redis.set(key, value, ttlSeconds);
      
      // Add key to each tag set
      for (const tag of tags) {
        await redis.sadd(`tag:${tag}`, key);
        if (ttlSeconds) {
          await redis.expire(`tag:${tag}`, ttlSeconds);
        }
      }
    } catch (error) {
      logger.error(`Error setting cache with tags for key ${key}:`, error);
      throw error;
    }
  },

  invalidateByTag: async (tag: string): Promise<number> => {
    try {
      const keys = await redis.smembers(`tag:${tag}`);
      if (keys.length === 0) return 0;

      // Delete all keys associated with the tag
      await redis.delMultiple(keys);
      
      // Delete the tag set itself
      await redis.del(`tag:${tag}`);
      
      return keys.length;
    } catch (error) {
      logger.error(`Error invalidating tag ${tag}:`, error);
      return 0;
    }
  },
};

/**
 * Session management utilities
 */
export const sessionUtils = {
  /**
   * Store user session
   */
  setSession: async (userId: string, sessionData: any, ttlSeconds: number = 86400): Promise<void> => {
    const key = `session:${userId}`;
    await cacheUtils.setJSON(key, sessionData, ttlSeconds);
  },

  /**
   * Get user session
   */
  getSession: async <T = any>(userId: string): Promise<T | null> => {
    const key = `session:${userId}`;
    return await cacheUtils.getJSON<T>(key);
  },

  /**
   * Delete user session
   */
  deleteSession: async (userId: string): Promise<void> => {
    try {
      const key = `session:${userId}`;
      await redis.del(key);
    } catch (error) {
      logger.error(`Error deleting session for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Extend session TTL
   */
  extendSession: async (userId: string, ttlSeconds: number = 86400): Promise<void> => {
    try {
      const key = `session:${userId}`;
      await redis.expire(key, ttlSeconds);
    } catch (error) {
      logger.error(`Error extending session for user ${userId}:`, error);
      throw error;
    }
  },
};

/**
 * Rate limiting utilities
 */
export const rateLimitUtils = {
  /**
   * Simple rate limiter - sliding window
   */
  checkRateLimit: async (
    identifier: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> => {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - (windowSeconds * 1000);

    try {
      const client = redis;
      
      // Remove old entries
      await client.zremrangebyscore(key, 0, windowStart);
      
      // Count current requests
      const currentRequests = await client.zcard(key);
      
      if (currentRequests >= maxRequests) {
        // Get the oldest request time to calculate reset time
        const oldestRequest = await client.zrange(key, 0, 0, true);
        const resetTime = oldestRequest.length > 1 && oldestRequest[1] 
          ? parseInt(oldestRequest[1]) + (windowSeconds * 1000)
          : now + (windowSeconds * 1000);
        
        return {
          allowed: false,
          remaining: 0,
          resetTime: Math.ceil(resetTime / 1000),
        };
      }

      // Add current request
      await client.zadd(key, now, `${now}-${Math.random()}`);
      await client.expire(key, windowSeconds);

      return {
        allowed: true,
        remaining: maxRequests - currentRequests - 1,
        resetTime: Math.ceil((now + (windowSeconds * 1000)) / 1000),
      };
    } catch (error) {
      logger.error(`Rate limit check error for ${identifier}:`, error);
      // Allow request on error to avoid blocking users
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: Math.ceil((now + (windowSeconds * 1000)) / 1000),
      };
    }
  },

  /**
   * Simple counter-based rate limiter
   */
  checkSimpleRateLimit: async (
    identifier: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number }> => {
    const key = `simple_rate_limit:${identifier}`;
    
    try {
      const current = await redis.incr(key);
      
      if (current === 1) {
        // First request, set expiration
        await redis.expire(key, windowSeconds);
      }
      
      return {
        allowed: current <= maxRequests,
        remaining: Math.max(0, maxRequests - current),
      };
    } catch (error) {
      logger.error(`Simple rate limit check error for ${identifier}:`, error);
      return { allowed: true, remaining: maxRequests - 1 };
    }
  },
};

/**
 * Lock utilities for distributed operations
 */
export const lockUtils = {
  /**
   * Acquire a distributed lock
   */
  acquireLock: async (
    lockKey: string,
    ttlSeconds: number = 30,
    identifier: string = `${Date.now()}-${Math.random()}`
  ): Promise<string | null> => {
    const key = `lock:${lockKey}`;
    
    try {
      const result = await redis.set(key, identifier, ttlSeconds);
      return result === 'OK' ? identifier : null;
    } catch (error) {
      logger.error(`Error acquiring lock ${lockKey}:`, error);
      return null;
    }
  },

  /**
   * Release a distributed lock
   */
  releaseLock: async (lockKey: string, identifier: string): Promise<boolean> => {
    const key = `lock:${lockKey}`;
    
    try {
      const lockValue = await redis.get(key);
      if (lockValue === identifier) {
        await redis.del(key);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Error releasing lock ${lockKey}:`, error);
      return false;
    }
  },

  /**
   * Execute with lock
   */
  withLock: async <T>(
    lockKey: string,
    operation: () => Promise<T>,
    ttlSeconds: number = 30
  ): Promise<T> => {
    const identifier = `${Date.now()}-${Math.random()}`;
    const lockId = await lockUtils.acquireLock(lockKey, ttlSeconds, identifier);
    
    if (!lockId) {
      throw new Error(`Could not acquire lock: ${lockKey}`);
    }

    try {
      return await operation();
    } finally {
      await lockUtils.releaseLock(lockKey, identifier);
    }
  },
};

/**
 * Cache key builders
 */
export const keyBuilder = {
  user: (userId: string) => `user:${userId}`,
  session: (userId: string) => `session:${userId}`,
  rateLimit: (identifier: string) => `rate_limit:${identifier}`,
  lock: (resource: string) => `lock:${resource}`,
  api: (endpoint: string, params?: Record<string, any>) => {
    const baseKey = `api:${endpoint}`;
    if (!params || Object.keys(params).length === 0) {
      return baseKey;
    }
    
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join(':');
    
    return `${baseKey}:${sortedParams}`;
  },
  tag: (tagName: string) => `tag:${tagName}`,
};
