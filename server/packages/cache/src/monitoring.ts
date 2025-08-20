import { logger } from '@vync/config/src/logger';
import { getRedisClient, isRedisConnected } from './redis';
import { pipelineUtils } from './pipeline';

export interface RedisMetrics {
  timestamp: string;
  uptime: number;
  connections: {
    connected: number;
    totalConnections: number;
    rejectedConnections: number;
  };
  memory: {
    used: number;
    peak: number;
    rss: number;
    lua: number;
    overhead: number;
    dataset: number;
    fragmentation: number;
  };
  stats: {
    totalCommands: number;
    instantaneousOps: number;
    hitRate: number;
    missRate: number;
    evictedKeys: number;
    expiredKeys: number;
  };
  keyspace: {
    totalKeys: number;
    keysWithTtl: number;
    avgTtl: number;
  };
  performance: {
    avgCommandLatency: number;
    slowLogLength: number;
  };
}

export interface OperationMetrics {
  operation: string;
  key?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  size?: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  avgLatency: number;
  operationCounts: { [operation: string]: number };
  errorCounts: { [errorType: string]: number };
}

// Global state for metrics
let metrics: CacheMetrics = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0,
  avgLatency: 0,
  operationCounts: {},
  errorCounts: {},
};

let operationHistory: OperationMetrics[] = [];
const maxHistorySize = 1000;
let metricsInterval: NodeJS.Timeout | undefined;
let startTime = Date.now();

/**
 * Parse Redis INFO response
 */
const parseRedisInfo = (infoString: string): { [key: string]: string } => {
  const info: { [key: string]: string } = {};
  const lines = infoString.split('\r\n');
  
  lines.forEach(line => {
    if (line.includes(':')) {
      const [key, value] = line.split(':');
      if (key && value) {
        info[key.trim()] = value.trim();
      }
    }
  });
  
  return info;
};

/**
 * Calculate hit rate from stats
 */
const calculateHitRate = (stats: { [key: string]: string }): number => {
  const hits = parseInt(stats.keyspace_hits || '0') || 0;
  const misses = parseInt(stats.keyspace_misses || '0') || 0;
  const total = hits + misses;
  
  return total > 0 ? (hits / total) * 100 : 0;
};

/**
 * Calculate miss rate from stats
 */
const calculateMissRate = (stats: { [key: string]: string }): number => {
  const hits = parseInt(stats.keyspace_hits || '0') || 0;
  const misses = parseInt(stats.keyspace_misses || '0') || 0;
  const total = hits + misses;
  
  return total > 0 ? (misses / total) * 100 : 0;
};

/**
 * Get count of keys with TTL
 */
const getKeysWithTtlCount = async (): Promise<number> => {
  try {
    const client = getRedisClient();
    const info = await client.info('keyspace');
    const keyspaceData = parseRedisInfo(info);
    
    return parseInt(keyspaceData.expires || '0') || 0;
  } catch (error) {
    return 0;
  }
};

/**
 * Get average TTL of keys with expiration
 */
const getAverageTtl = async (): Promise<number> => {
  try {
    const client = getRedisClient();
    const keys = await client.keys('*');
    if (keys.length === 0) return 0;
    
    const sampleSize = Math.min(100, keys.length);
    const sampleKeys = keys.slice(0, sampleSize);
    
    let totalTtl = 0;
    let keysWithTtl = 0;
    
    for (const key of sampleKeys) {
      const ttl = await client.ttl(key);
      if (ttl > 0) {
        totalTtl += ttl;
        keysWithTtl++;
      }
    }
    
    return keysWithTtl > 0 ? Math.round(totalTtl / keysWithTtl) : 0;
  } catch (error) {
    return 0;
  }
};

/**
 * Get slow log length
 */
const getSlowLogLength = async (): Promise<number> => {
  try {
    const client = getRedisClient();
    // Use call method for SLOWLOG LEN command
    const slowLog = await client.call('SLOWLOG', 'LEN');
    return parseInt(slowLog as string) || 0;
  } catch (error) {
    return 0;
  }
};

/**
 * Increment operation count
 */
const incrementOperationCount = (operation: string) => {
  metrics.operationCounts[operation] = (metrics.operationCounts[operation] || 0) + 1;
};

/**
 * Increment error count
 */
const incrementErrorCount = (errorType: string) => {
  metrics.errorCounts[errorType] = (metrics.errorCounts[errorType] || 0) + 1;
};

/**
 * Update average latency
 */
const updateLatency = (operation: OperationMetrics) => {
  if (operation.duration !== undefined) {
    const totalOps = Object.values(metrics.operationCounts).reduce((a, b) => a + b, 0);
    metrics.avgLatency = (metrics.avgLatency * (totalOps - 1) + operation.duration) / totalOps;
  }
};

/**
 * Update metrics with operation data
 */
const updateMetrics = (operation: OperationMetrics) => {
  incrementOperationCount(operation.operation);
  
  if (operation.success) {
    if (operation.operation.toLowerCase().includes('get')) {
      metrics.hits++;
    } else if (operation.operation.toLowerCase().includes('set')) {
      metrics.sets++;
    } else if (operation.operation.toLowerCase().includes('del')) {
      metrics.deletes++;
    }
  } else {
    metrics.errors++;
    incrementErrorCount(operation.error || 'unknown');
  }

  updateLatency(operation);
};

/**
 * Collect comprehensive Redis metrics
 */
const collectMetrics = async (): Promise<RedisMetrics | null> => {
  if (!isRedisConnected()) {
    return null;
  }

  try {
    const healthCheck = await pipelineUtils.healthCheck();
    const client = getRedisClient();
    
    const [serverInfo, clientsInfo, replicationInfo] = await Promise.all([
      client.info('server'),
      client.info('clients'),
      client.info('replication'),
    ]);

    const serverData = parseRedisInfo(serverInfo);
    const clientsData = parseRedisInfo(clientsInfo);
    const statsData = parseRedisInfo(healthCheck.info.stats);
    const memoryData = healthCheck.memory;

    const redisMetrics: RedisMetrics = {
      timestamp: new Date().toISOString(),
      uptime: parseInt(serverData.uptime_in_seconds || '0') || 0,
      connections: {
        connected: parseInt(clientsData.connected_clients || '0') || 0,
        totalConnections: parseInt(statsData.total_connections_received || '0') || 0,
        rejectedConnections: parseInt(statsData.rejected_connections || '0') || 0,
      },
      memory: {
        used: parseInt(memoryData.used_memory || '0') || 0,
        peak: parseInt(memoryData.used_memory_peak || '0') || 0,
        rss: parseInt(memoryData.used_memory_rss || '0') || 0,
        lua: parseInt(memoryData.used_memory_lua || '0') || 0,
        overhead: parseInt(memoryData.used_memory_overhead || '0') || 0,
        dataset: parseInt(memoryData.used_memory_dataset || '0') || 0,
        fragmentation: parseFloat(memoryData.mem_fragmentation_ratio || '0') || 0,
      },
      stats: {
        totalCommands: parseInt(statsData.total_commands_processed || '0') || 0,
        instantaneousOps: parseInt(statsData.instantaneous_ops_per_sec || '0') || 0,
        hitRate: calculateHitRate(statsData),
        missRate: calculateMissRate(statsData),
        evictedKeys: parseInt(statsData.evicted_keys || '0') || 0,
        expiredKeys: parseInt(statsData.expired_keys || '0') || 0,
      },
      keyspace: {
        totalKeys: healthCheck.keyCount,
        keysWithTtl: await getKeysWithTtlCount(),
        avgTtl: await getAverageTtl(),
      },
      performance: {
        avgCommandLatency: metrics.avgLatency,
        slowLogLength: await getSlowLogLength(),
      },
    };

    logger.debug('Redis metrics collected:', {
      keyCount: redisMetrics.keyspace.totalKeys,
      memoryUsed: redisMetrics.memory.used,
      hitRate: redisMetrics.stats.hitRate,
      avgLatency: redisMetrics.performance.avgCommandLatency,
    });

    return redisMetrics;
  } catch (error) {
    logger.error('Failed to collect Redis metrics:', error);
    return null;
  }
};

/**
 * Start periodic metrics collection
 */
const startPeriodicMetricsCollection = () => {
  metricsInterval = setInterval(async () => {
    try {
      await collectMetrics();
    } catch (error) {
      logger.error('Failed to collect Redis metrics:', error);
    }
  }, 30000); // Every 30 seconds
};

/**
 * Stop metrics collection
 */
const stopMetricsCollection = () => {
  if (metricsInterval) {
    clearInterval(metricsInterval);
    metricsInterval = undefined;
  }
};

/**
 * Record operation start
 */
const startOperation = (operation: string, key?: string): string => {
  const operationId = `${Date.now()}-${Math.random()}`;
  const operationMetric: OperationMetrics = {
    operation,
    key,
    startTime: Date.now(),
    success: false,
  };

  operationHistory.push(operationMetric);
  
  // Keep history size manageable
  if (operationHistory.length > maxHistorySize) {
    operationHistory.shift();
  }

  return operationId;
};

/**
 * Record operation completion
 */
const endOperation = (operationId: string, success: boolean, error?: string, size?: number) => {
  const operation = operationHistory.find(op => 
    `${op.startTime}-${Math.random()}` === operationId
  );

  if (operation) {
    operation.endTime = Date.now();
    operation.duration = operation.endTime - operation.startTime;
    operation.success = success;
    operation.error = error;
    operation.size = size;

    updateMetrics(operation);
  }
};

/**
 * Record cache hit
 */
const recordCacheHit = (operation: string, key: string, size?: number) => {
  metrics.hits++;
  incrementOperationCount(operation);
  
  const operationMetric: OperationMetrics = {
    operation,
    key,
    startTime: Date.now(),
    endTime: Date.now(),
    duration: 0,
    success: true,
    size,
  };
  
  updateLatency(operationMetric);
};

/**
 * Record cache miss
 */
const recordCacheMiss = (operation: string, key: string) => {
  metrics.misses++;
  incrementOperationCount(operation);
};

/**
 * Record cache set
 */
const recordCacheSet = (operation: string, key: string, size?: number) => {
  metrics.sets++;
  incrementOperationCount(operation);
};

/**
 * Record cache delete
 */
const recordCacheDelete = (operation: string, key: string) => {
  metrics.deletes++;
  incrementOperationCount(operation);
};

/**
 * Record error
 */
const recordError = (operation: string, errorType: string, error: string) => {
  metrics.errors++;
  incrementOperationCount(operation);
  incrementErrorCount(errorType);
  
  logger.warn(`Redis operation ${operation} failed: ${error}`);
};

/**
 * Get current cache metrics
 */
const getCacheMetrics = (): CacheMetrics & { uptime: number; hitRate: number } => {
  const totalOps = metrics.hits + metrics.misses;
  const hitRate = totalOps > 0 ? (metrics.hits / totalOps) * 100 : 0;
  
  return {
    ...metrics,
    uptime: Date.now() - startTime,
    hitRate: Math.round(hitRate * 100) / 100,
  };
};

/**
 * Get recent operations
 */
const getRecentOperations = (limit: number = 100): OperationMetrics[] => {
  return operationHistory
    .slice(-limit)
    .sort((a, b) => b.startTime - a.startTime);
};

/**
 * Get slow operations
 */
const getSlowOperations = (thresholdMs: number = 100): OperationMetrics[] => {
  return operationHistory
    .filter(op => op.duration && op.duration > thresholdMs)
    .sort((a, b) => (b.duration || 0) - (a.duration || 0));
};

/**
 * Reset metrics
 */
const resetMetrics = () => {
  metrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    avgLatency: 0,
    operationCounts: {},
    errorCounts: {},
  };
  operationHistory = [];
  startTime = Date.now();
};

/**
 * Get Prometheus-formatted metrics
 */
const getPrometheusMetrics = (): string => {
  const currentMetrics = getCacheMetrics();
  const timestamp = Date.now();
  
  let output = '';
  
  // Cache metrics
  output += `# HELP redis_cache_hits_total Total number of cache hits\n`;
  output += `# TYPE redis_cache_hits_total counter\n`;
  output += `redis_cache_hits_total ${currentMetrics.hits} ${timestamp}\n\n`;
  
  output += `# HELP redis_cache_misses_total Total number of cache misses\n`;
  output += `# TYPE redis_cache_misses_total counter\n`;
  output += `redis_cache_misses_total ${currentMetrics.misses} ${timestamp}\n\n`;
  
  output += `# HELP redis_cache_hit_rate Cache hit rate percentage\n`;
  output += `# TYPE redis_cache_hit_rate gauge\n`;
  output += `redis_cache_hit_rate ${currentMetrics.hitRate} ${timestamp}\n\n`;
  
  output += `# HELP redis_operation_latency_avg Average operation latency in milliseconds\n`;
  output += `# TYPE redis_operation_latency_avg gauge\n`;
  output += `redis_operation_latency_avg ${currentMetrics.avgLatency} ${timestamp}\n\n`;
  
  output += `# HELP redis_errors_total Total number of Redis errors\n`;
  output += `# TYPE redis_errors_total counter\n`;
  output += `redis_errors_total ${currentMetrics.errors} ${timestamp}\n\n`;
  
  // Operation counts
  Object.entries(currentMetrics.operationCounts).forEach(([operation, count]) => {
    output += `redis_operations_total{operation="${operation}"} ${count} ${timestamp}\n`;
  });
  
  return output;
};

/**
 * Initialize monitoring
 */
const initializeMonitoring = () => {
  startPeriodicMetricsCollection();
  logger.info('Redis monitoring initialized');
};

/**
 * Shutdown monitoring
 */
const shutdownMonitoring = () => {
  stopMetricsCollection();
  logger.info('Redis monitoring shutdown');
};

export const redisMonitoring = {
  // Lifecycle
  initialize: initializeMonitoring,
  shutdown: shutdownMonitoring,
  
  // Operation tracking
  startOperation,
  endOperation,
  
  // Event recording
  recordCacheHit,
  recordCacheMiss,
  recordCacheSet,
  recordCacheDelete,
  recordError,
  
  // Metrics retrieval
  getCacheMetrics,
  getRecentOperations,
  getSlowOperations,
  collectMetrics,
  getPrometheusMetrics,
  
  // Utilities
  resetMetrics,
  stopMetricsCollection,
};

export default redisMonitoring;
