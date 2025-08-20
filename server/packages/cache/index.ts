// Export Redis client and utilities
export * from './src/redis';
export * from './src/utils';
export * from './src/pipeline';
export * from './src/monitoring';
export * from './src/middleware';

// Re-export commonly used functions
export { 
  getRedisClient,
  connectRedis,
  disconnectRedis,
  isRedisConnected,
  pingRedis,
  redis
} from './src/redis';

export {
  cacheUtils,
  sessionUtils,
  rateLimitUtils,
  lockUtils,
  keyBuilder
} from './src/utils';

export {
  pipelineUtils
} from './src/pipeline';

export {
  redisMonitoring
} from './src/monitoring';

export {
  monitoringMiddleware
} from './src/middleware';
