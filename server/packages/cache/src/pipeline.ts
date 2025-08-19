import Redis from 'ioredis';
import { getRedisClient } from './redis';
import { logger } from '@vync/config/src/logger';

export interface PipelineOperation {
  command: string;
  args: any[];
  key?: string; // for monitoring purposes
}

export interface PipelineResult {
  success: boolean;
  results: any[];
  errors: (Error | null)[];
  executionTime: number;
  operationCount: number;
}

/**
 * Parse Redis memory info
 */
const parseMemoryInfo = (memoryInfo: string): any => {
  const info: any = {};
  const lines = memoryInfo.split('\r\n');
  
  lines.forEach(line => {
    if (line.includes(':')) {
      const [key, value] = line.split(':');
      if (key && value) {
        info[key.trim()] = isNaN(Number(value)) ? value.trim() : Number(value);
      }
    }
  });
  
  return info;
};

/**
 * Pipeline utilities for batch Redis operations
 */
export const pipelineUtils = {
  /**
   * Execute multiple Redis commands in a pipeline
   */
  async execute(operations: PipelineOperation[]): Promise<PipelineResult> {
    const startTime = Date.now();
    const client = getRedisClient();
    const pipeline = client.pipeline();

    // Add operations to pipeline
    operations.forEach(({ command, args }) => {
      (pipeline as any)[command](...args);
    });

    try {
      const results = await pipeline.exec();
      const executionTime = Date.now() - startTime;
      
      const errors: (Error | null)[] = [];
      const values: any[] = [];
      let hasErrors = false;

      if (results) {
        results.forEach(([error, result]) => {
          errors.push(error);
          values.push(result);
          if (error) hasErrors = true;
        });
      }

      if (hasErrors) {
        logger.warn(`Pipeline executed with ${errors.filter(e => e).length} errors in ${executionTime}ms`);
      } else {
        logger.debug(`Pipeline executed ${operations.length} operations in ${executionTime}ms`);
      }

      return {
        success: !hasErrors,
        results: values,
        errors,
        executionTime,
        operationCount: operations.length,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Pipeline execution failed:', error);
      
      return {
        success: false,
        results: [],
        errors: [error as Error],
        executionTime,
        operationCount: operations.length,
      };
    }
  },

  /**
   * Batch set multiple key-value pairs
   */
  async batchSet(keyValues: Array<{ key: string; value: string; ttl?: number }>): Promise<PipelineResult> {
    const operations: PipelineOperation[] = keyValues.map(({ key, value, ttl }) => ({
      command: ttl ? 'setex' : 'set',
      args: ttl ? [key, ttl, value] : [key, value],
      key,
    }));

    return await this.execute(operations);
  },

  /**
   * Batch get multiple keys
   */
  async batchGet(keys: string[]): Promise<{ [key: string]: string | null }> {
    const startTime = Date.now();
    const client = getRedisClient();
    
    try {
      const values = await client.mget(...keys);
      const result: { [key: string]: string | null } = {};
      
      keys.forEach((key, index) => {
        result[key] = values[index] ?? null;
      });

      const executionTime = Date.now() - startTime;
      logger.debug(`Batch GET executed for ${keys.length} keys in ${executionTime}ms`);
      
      return result;
    } catch (error) {
      logger.error('Batch GET failed:', error);
      throw error;
    }
  },

  /**
   * Batch delete multiple keys
   */
  async batchDelete(keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    
    const startTime = Date.now();
    const client = getRedisClient();
    
    try {
      const deletedCount = await client.del(...keys);
      const executionTime = Date.now() - startTime;
      
      logger.debug(`Batch DELETE executed for ${keys.length} keys, ${deletedCount} deleted in ${executionTime}ms`);
      return deletedCount;
    } catch (error) {
      logger.error('Batch DELETE failed:', error);
      throw error;
    }
  },

  /**
   * Batch check existence of multiple keys
   */
  async batchExists(keys: string[]): Promise<{ [key: string]: boolean }> {
    const operations: PipelineOperation[] = keys.map(key => ({
      command: 'exists',
      args: [key],
      key,
    }));

    const result = await this.execute(operations);
    const existence: { [key: string]: boolean } = {};
    
    keys.forEach((key, index) => {
      existence[key] = result.results[index] === 1;
    });

    return existence;
  },

  /**
   * Batch set TTL for multiple keys
   */
  async batchExpire(keyTtls: Array<{ key: string; ttl: number }>): Promise<PipelineResult> {
    const operations: PipelineOperation[] = keyTtls.map(({ key, ttl }) => ({
      command: 'expire',
      args: [key, ttl],
      key,
    }));

    return await this.execute(operations);
  },

  /**
   * Complex user session batch operations
   */
  async batchSessionOperations(userId: string, sessionData: any, ttl: number): Promise<PipelineResult> {
    const sessionKey = `session:${userId}`;
    const activeSessionsKey = 'tag:active_sessions';
    
    const operations: PipelineOperation[] = [
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
        command: 'expire',
        args: [activeSessionsKey, ttl],
        key: activeSessionsKey,
      },
    ];

    return await this.execute(operations);
  },

  /**
   * Batch OTP operations (create + rate limit)
   */
  async batchOtpOperations(
    email: string,
    otpType: string,
    otpData: any,
    ttl: number
  ): Promise<PipelineResult> {
    const pendingKey = `otp:pending:${email}:${otpType}`;
    const attemptsKey = `otp:attempts:${email}:${otpType}`;
    const rateLimitKey = `otp:ratelimit:${email}:${otpType}`;
    
    const operations: PipelineOperation[] = [
      {
        command: 'setex',
        args: [pendingKey, ttl, JSON.stringify(otpData)],
        key: pendingKey,
      },
      {
        command: 'setex',
        args: [attemptsKey, ttl, '0'],
        key: attemptsKey,
      },
      {
        command: 'setex',
        args: [rateLimitKey, 120, '1'], // 2 minutes rate limit
        key: rateLimitKey,
      },
    ];

    return await this.execute(operations);
  },

  /**
   * Batch user logout operations
   */
  async batchLogoutOperations(
    userId: string,
    tokenHash: string,
    tokenTtl: number
  ): Promise<PipelineResult> {
    const sessionKey = `session:${userId}`;
    const blacklistKey = `blacklist:${tokenHash}`;
    const activeSessionsKey = 'tag:active_sessions';
    const userKey = `user:${userId}`;
    
    const operations: PipelineOperation[] = [
      {
        command: 'del',
        args: [sessionKey],
        key: sessionKey,
      },
      {
        command: 'setex',
        args: [blacklistKey, tokenTtl, '1'],
        key: blacklistKey,
      },
      {
        command: 'srem',
        args: [activeSessionsKey, userId],
        key: activeSessionsKey,
      },
      {
        command: 'del',
        args: [userKey],
        key: userKey,
      },
    ];

    return await this.execute(operations);
  },

  /**
   * Batch cleanup operations
   */
  async batchCleanup(patterns: string[]): Promise<number> {
    let totalDeleted = 0;
    const client = getRedisClient();
    
    for (const pattern of patterns) {
      try {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
          const deleted = await this.batchDelete(keys);
          totalDeleted += deleted;
          logger.debug(`Cleaned up ${deleted} keys matching pattern: ${pattern}`);
        }
      } catch (error) {
        logger.error(`Cleanup failed for pattern ${pattern}:`, error);
      }
    }
    
    return totalDeleted;
  },

  /**
   * Health check with pipeline
   */
  async healthCheck(): Promise<{
    ping: boolean;
    info: any;
    keyCount: number;
    memory: any;
    executionTime: number;
  }> {
    const startTime = Date.now();
    const client = getRedisClient();
    const pipeline = client.pipeline();
    
    pipeline.ping();
    pipeline.info('memory');
    pipeline.dbsize();
    pipeline.info('stats');
    
    try {
      const results = await pipeline.exec();
      const executionTime = Date.now() - startTime;
      
      if (!results) {
        throw new Error('Pipeline returned no results');
      }
      
      const [pingResult, memoryInfo, keyCount, statsInfo] = results;
      
      // Validate results to prevent undefined access
      if (!pingResult || !memoryInfo || !keyCount || !statsInfo) {
        throw new Error('Incomplete pipeline results');
      }
      
      return {
        ping: pingResult[1] === 'PONG',
        info: {
          memory: memoryInfo[1],
          stats: statsInfo[1],
        },
        keyCount: keyCount[1] as number,
        memory: parseMemoryInfo(memoryInfo[1] as string),
        executionTime,
      };
    } catch (error) {
      logger.error('Redis health check pipeline failed:', error);
      throw error;
    }
  },

};

export default pipelineUtils;
