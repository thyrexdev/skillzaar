import { Hono } from 'hono';
import { logger } from '@vync/config';
import { 
  getMetrics, 
  getMetricsSummary, 
  getPrometheusMetrics,
  getRecentOperations,
  getFailedOperations,
  getSlowOperations,
  getUserActivity,
  getOperationsByType,
  resetMetrics,
  getMetricsForTimeRange
} from '../services/monitoring.service';
import { 
  getAuthHealthMetrics,
  cleanupExpiredAuthData 
} from '../services/auth-pipeline.service';
import { monitoringMiddleware } from '../middleware/monitoring.middleware';

const app = new Hono();

// Apply monitoring middleware to all routes
app.use('*', monitoringMiddleware());

/**
 * Get comprehensive metrics overview
 */
app.get('/metrics', async (c) => {
  try {
    const metrics = await getMetrics();
    
    return c.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get metrics:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve metrics',
    }, 500);
  }
});

/**
 * Get metrics summary for dashboard
 */
app.get('/metrics/summary', async (c) => {
  try {
    const summary = await getMetricsSummary();
    
    return c.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get metrics summary:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve metrics summary',
    }, 500);
  }
});

/**
 * Get Prometheus formatted metrics
 */
app.get('/metrics/prometheus', async (c) => {
  try {
    const metrics = getPrometheusMetrics();
    
    return c.text(metrics, 200, {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
    });
  } catch (error) {
    logger.error('Failed to get Prometheus metrics:', error);
    return c.text('# Error retrieving metrics\n', 500);
  }
});

/**
 * Get recent operations
 */
app.get('/operations/recent', async (c) => {
  try {
    const timeWindow = parseInt(c.req.query('timeWindow') || '300000'); // 5 minutes default
    const operations = getRecentOperations(timeWindow);
    
    return c.json({
      success: true,
      data: {
        operations,
        count: operations.length,
        timeWindow,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get recent operations:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve recent operations',
    }, 500);
  }
});

/**
 * Get failed operations
 */
app.get('/operations/failed', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const operations = getFailedOperations(limit);
    
    return c.json({
      success: true,
      data: {
        operations,
        count: operations.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get failed operations:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve failed operations',
    }, 500);
  }
});

/**
 * Get slow operations
 */
app.get('/operations/slow', async (c) => {
  try {
    const threshold = parseInt(c.req.query('threshold') || '1000');
    const limit = parseInt(c.req.query('limit') || '100');
    const operations = getSlowOperations(threshold, limit);
    
    return c.json({
      success: true,
      data: {
        operations,
        count: operations.length,
        threshold,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get slow operations:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve slow operations',
    }, 500);
  }
});

/**
 * Get operations by type
 */
app.get('/operations/type/:type', async (c) => {
  try {
    const type = c.req.param('type');
    const limit = parseInt(c.req.query('limit') || '100');
    const operations = getOperationsByType(type, limit);
    
    return c.json({
      success: true,
      data: {
        operations,
        count: operations.length,
        type,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get operations by type:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve operations by type',
    }, 500);
  }
});

/**
 * Get user activity
 */
app.get('/user/:userId/activity', async (c) => {
  try {
    const userId = c.req.param('userId');
    const activity = await getUserActivity(userId);
    
    return c.json({
      success: true,
      data: {
        userId,
        ...activity,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get user activity:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve user activity',
    }, 500);
  }
});

/**
 * Get metrics for time range
 */
app.get('/metrics/range', async (c) => {
  try {
    const startTime = parseInt(c.req.query('start') || '0');
    const endTime = parseInt(c.req.query('end') || Date.now().toString());
    
    if (!startTime || startTime >= endTime) {
      return c.json({
        success: false,
        error: 'Invalid time range. Start time must be less than end time.',
      }, 400);
    }
    
    const metrics = getMetricsForTimeRange(startTime, endTime);
    
    return c.json({
      success: true,
      data: metrics,
      timeRange: {
        start: new Date(startTime).toISOString(),
        end: new Date(endTime).toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get metrics for time range:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve metrics for time range',
    }, 500);
  }
});

/**
 * Get Redis health metrics
 */
app.get('/redis/health', async (c) => {
  try {
    const healthMetrics = await getAuthHealthMetrics();
    
    return c.json({
      success: true,
      data: healthMetrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get Redis health metrics:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve Redis health metrics',
    }, 500);
  }
});

/**
 * Enhanced health check with detailed metrics
 */
app.get('/health/detailed', async (c) => {
  try {
    const [metrics, redisHealth, summary] = await Promise.all([
      getMetrics(),
      getAuthHealthMetrics(),
      getMetricsSummary(),
    ]);
    
    const healthStatus = {
      service: 'auth-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: metrics.uptime,
      version: '1.0.0',
      
      // Core health indicators
      health: {
        redis: redisHealth.connectionStatus === 'connected',
        authentication: summary.successRate > 90,
        performance: summary.avgResponseTime < 2000,
        errors: summary.alerts.length === 0,
      },
      
      // Detailed metrics
      metrics: {
        authentication: {
          successRate: summary.successRate,
          totalAttempts: metrics.authentication.loginAttempts,
          activeUsers: summary.activeUsers,
          totalSessions: summary.totalSessions,
        },
        performance: {
          avgResponseTime: summary.avgResponseTime,
          throughput: metrics.performance.throughput,
          errorRate: metrics.performance.errorRate,
          slowQueries: metrics.performance.slowQueries,
        },
        redis: {
          status: redisHealth.connectionStatus,
          activeSessions: redisHealth.activeSessions,
          blacklistedTokens: redisHealth.blacklistedTokens,
          memoryUsage: redisHealth.memoryUsage,
        },
        security: {
          suspiciousActivities: metrics.security.suspiciousActivities,
          rateLimitHits: metrics.security.rateLimitHits,
          failedAttemptsByIp: Object.keys(metrics.security.failedAttemptsByIp).length,
        },
      },
      
      // Alerts and warnings
      alerts: summary.alerts,
      
      // System resources
      resources: {
        redisMemory: redisHealth.memoryUsage,
        redisKeys: {
          total: redisHealth.totalUsers + redisHealth.activeSessions + redisHealth.blacklistedTokens,
          sessions: redisHealth.activeSessions,
          users: redisHealth.totalUsers,
          tokens: redisHealth.blacklistedTokens,
          otps: redisHealth.recentOtps,
          rateLimits: redisHealth.rateLimitKeys,
        },
      },
    };
    
    // Determine overall health status
    const isHealthy = Object.values(healthStatus.health).every(Boolean);
    healthStatus.status = isHealthy ? 'healthy' : 'degraded';
    
    return c.json(healthStatus, isHealthy ? 200 : 503);
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    return c.json({
      service: 'auth-service',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    }, 500);
  }
});

/**
 * Trigger manual cleanup
 */
app.post('/maintenance/cleanup', async (c) => {
  try {
    const result = await cleanupExpiredAuthData();
    
    return c.json({
      success: true,
      data: result,
      message: 'Cleanup completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Manual cleanup failed:', error);
    return c.json({
      success: false,
      error: 'Cleanup operation failed',
    }, 500);
  }
});

/**
 * Reset metrics (for testing/maintenance)
 */
app.post('/maintenance/reset-metrics', async (c) => {
  try {
    resetMetrics();
    
    return c.json({
      success: true,
      message: 'Metrics reset successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Metrics reset failed:', error);
    return c.json({
      success: false,
      error: 'Failed to reset metrics',
    }, 500);
  }
});

/**
 * Get system status overview
 */
app.get('/status', async (c) => {
  try {
    const [summary, redisHealth] = await Promise.all([
      getMetricsSummary(),
      getAuthHealthMetrics(),
    ]);
    
    const status = {
      service: 'auth-service',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      
      // Quick status indicators
      indicators: {
        auth_success_rate: {
          value: summary.successRate,
          status: summary.successRate > 95 ? 'good' : summary.successRate > 90 ? 'warning' : 'critical',
          unit: '%',
        },
        response_time: {
          value: summary.avgResponseTime,
          status: summary.avgResponseTime < 500 ? 'good' : summary.avgResponseTime < 1000 ? 'warning' : 'critical',
          unit: 'ms',
        },
        active_sessions: {
          value: summary.totalSessions,
          status: 'info',
          unit: 'count',
        },
        redis_health: {
          value: redisHealth.connectionStatus,
          status: redisHealth.connectionStatus === 'connected' ? 'good' : 'critical',
          unit: 'status',
        },
        error_rate: {
          value: parseFloat((100 - summary.successRate).toFixed(2)),
          status: summary.successRate > 95 ? 'good' : summary.successRate > 90 ? 'warning' : 'critical',
          unit: '%',
        },
      },
      
      // Overall system health
      overall_status: {
        status: summary.alerts.length === 0 ? 'healthy' : 'degraded',
        alerts: summary.alerts,
        message: summary.alerts.length === 0 ? 'All systems operational' : `${summary.alerts.length} alerts active`,
      },
    };
    
    return c.json(status);
  } catch (error) {
    logger.error('Status check failed:', error);
    return c.json({
      service: 'auth-service',
      overall_status: {
        status: 'error',
        message: 'Status check failed',
      },
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * Get performance analytics
 */
app.get('/analytics/performance', async (c) => {
  try {
    const timeWindow = parseInt(c.req.query('timeWindow') || '3600000'); // 1 hour default
    const recentOps = getRecentOperations(timeWindow);
    
    // Calculate performance analytics
    const performanceData = {
      totalOperations: recentOps.length,
      averageResponseTime: recentOps.length > 0 ? 
        recentOps.reduce((sum, op) => sum + (op.duration || 0), 0) / recentOps.length : 0,
      successRate: recentOps.length > 0 ? 
        (recentOps.filter(op => op.success).length / recentOps.length) * 100 : 0,
      
      // Operations by type
      operationBreakdown: recentOps.reduce((acc, op) => {
        acc[op.type] = (acc[op.type] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number }),
      
      // Performance by operation type
      performanceByType: Object.entries(
        recentOps.reduce((acc, op) => {
          if (!acc[op.type]) {
            acc[op.type] = { count: 0, totalDuration: 0, successes: 0 };
          }
          acc[op.type].count++;
          acc[op.type].totalDuration += op.duration || 0;
          if (op.success) acc[op.type].successes++;
          return acc;
        }, {} as { [key: string]: { count: number; totalDuration: number; successes: number } })
      ).map(([type, data]) => ({
        type,
        count: data.count,
        avgDuration: data.totalDuration / data.count,
        successRate: (data.successes / data.count) * 100,
      })),
      
      // Hourly distribution
      hourlyDistribution: recentOps.reduce((acc, op) => {
        const hour = new Date(op.startTime).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as { [hour: number]: number }),
    };
    
    return c.json({
      success: true,
      data: performanceData,
      timeWindow,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get performance analytics:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve performance analytics',
    }, 500);
  }
});

export default app;
