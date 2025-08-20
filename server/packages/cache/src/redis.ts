import Redis from 'ioredis';
import { env } from '@vync/config';
import { logger } from '@vync/config/src/logger';

let redisClient: Redis | null = null;
let isConnected = false;

/**
 * Create Redis connection configuration
 */
const createRedisConfig = () => ({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  connectTimeout: 10000,
  commandTimeout: 5000,
});

/**
 * Setup Redis event handlers
 */
const setupEventHandlers = (redis: Redis) => {
  redis.on('connect', () => {
    logger.info('Redis connected successfully');
    isConnected = true;
  });

  redis.on('ready', () => {
    logger.info('Redis is ready to receive commands');
  });

  redis.on('error', (error) => {
    logger.error('Redis connection error:', error);
    isConnected = false;
  });

  redis.on('close', () => {
    logger.info('Redis connection closed');
    isConnected = false;
  });

  redis.on('reconnecting', () => {
    logger.info('Redis reconnecting...');
  });
};

/**
 * Get Redis client instance (singleton pattern)
 */
export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(createRedisConfig());
    setupEventHandlers(redisClient);
  }
  return redisClient;
};

/**
 * Connect to Redis
 */
export const connectRedis = async (): Promise<void> => {
  try {
    const redis = getRedisClient();
    await redis.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

/**
 * Disconnect from Redis
 */
export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redisClient) {
      await redisClient.disconnect();
      redisClient = null;
      isConnected = false;
      logger.info('Redis disconnected successfully');
    }
  } catch (error) {
    logger.error('Error disconnecting from Redis:', error);
  }
};

/**
 * Check if Redis is connected
 */
export const isRedisConnected = (): boolean => {
  return isConnected;
};

/**
 * Ping Redis to check connectivity
 */
export const pingRedis = async (): Promise<string> => {
  try {
    const redis = getRedisClient();
    return await redis.ping();
  } catch (error) {
    logger.error('Redis ping failed:', error);
    throw error;
  }
};

/**
 * Redis helper functions for common operations
 */
export const redis = {
  /**
   * Basic key-value operations
   */
  set: async (key: string, value: string, ttlSeconds?: number): Promise<string> => {
    const client = getRedisClient();
    if (ttlSeconds) {
      return await client.setex(key, ttlSeconds, value);
    }
    return await client.set(key, value);
  },

  get: async (key: string): Promise<string | null> => {
    const client = getRedisClient();
    return await client.get(key);
  },

  del: async (key: string): Promise<number> => {
    const client = getRedisClient();
    return await client.del(key);
  },

  exists: async (key: string): Promise<number> => {
    const client = getRedisClient();
    return await client.exists(key);
  },

  expire: async (key: string, seconds: number): Promise<number> => {
    const client = getRedisClient();
    return await client.expire(key, seconds);
  },

  keys: async (pattern: string): Promise<string[]> => {
    const client = getRedisClient();
    return await client.keys(pattern);
  },

  /**
   * Hash operations
   */
  hset: async (key: string, field: string, value: string): Promise<number> => {
    const client = getRedisClient();
    return await client.hset(key, field, value);
  },

  hget: async (key: string, field: string): Promise<string | null> => {
    const client = getRedisClient();
    return await client.hget(key, field);
  },

  hgetall: async (key: string): Promise<Record<string, string>> => {
    const client = getRedisClient();
    return await client.hgetall(key);
  },

  hdel: async (key: string, field: string): Promise<number> => {
    const client = getRedisClient();
    return await client.hdel(key, field);
  },

  /**
   * List operations
   */
  lpush: async (key: string, ...values: string[]): Promise<number> => {
    const client = getRedisClient();
    return await client.lpush(key, ...values);
  },

  rpush: async (key: string, ...values: string[]): Promise<number> => {
    const client = getRedisClient();
    return await client.rpush(key, ...values);
  },

  lpop: async (key: string): Promise<string | null> => {
    const client = getRedisClient();
    return await client.lpop(key);
  },

  rpop: async (key: string): Promise<string | null> => {
    const client = getRedisClient();
    return await client.rpop(key);
  },

  lrange: async (key: string, start: number, stop: number): Promise<string[]> => {
    const client = getRedisClient();
    return await client.lrange(key, start, stop);
  },

  /**
   * Set operations
   */
  sadd: async (key: string, ...members: string[]): Promise<number> => {
    const client = getRedisClient();
    return await client.sadd(key, ...members);
  },

  srem: async (key: string, ...members: string[]): Promise<number> => {
    const client = getRedisClient();
    return await client.srem(key, ...members);
  },

  smembers: async (key: string): Promise<string[]> => {
    const client = getRedisClient();
    return await client.smembers(key);
  },

  sismember: async (key: string, member: string): Promise<number> => {
    const client = getRedisClient();
    return await client.sismember(key, member);
  },

  /**
   * Increment/Decrement operations
   */
  incr: async (key: string): Promise<number> => {
    const client = getRedisClient();
    return await client.incr(key);
  },

  decr: async (key: string): Promise<number> => {
    const client = getRedisClient();
    return await client.decr(key);
  },

  incrby: async (key: string, increment: number): Promise<number> => {
    const client = getRedisClient();
    return await client.incrby(key, increment);
  },

  /**
   * Sorted Set (ZSet) operations
   */
  zadd: async (key: string, score: number, member: string): Promise<number> => {
    const client = getRedisClient();
    return await client.zadd(key, score, member);
  },

  zremrangebyscore: async (key: string, min: number, max: number): Promise<number> => {
    const client = getRedisClient();
    return await client.zremrangebyscore(key, min, max);
  },

  zcard: async (key: string): Promise<number> => {
    const client = getRedisClient();
    return await client.zcard(key);
  },

  zrange: async (key: string, start: number, stop: number, withScores?: boolean): Promise<string[]> => {
    const client = getRedisClient();
    if (withScores) {
      return await client.zrange(key, start, stop, 'WITHSCORES');
    }
    return await client.zrange(key, start, stop);
  },

  /**
   * Multi-key delete operation
   */
  delMultiple: async (keys: string[]): Promise<number> => {
    if (keys.length === 0) return 0;
    const client = getRedisClient();
    return await client.del(...keys);
  },
};

// Export the client instance
export default getRedisClient();
