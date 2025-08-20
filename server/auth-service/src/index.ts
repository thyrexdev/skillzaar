import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env, logger } from '@vync/config';
import { connectRedis, disconnectRedis, redisMonitoring } from '@vync/cache';
import authRoutes from './routes/auth.routes';
import otpRoutes from './routes/otp.routes';
import clientRoutes from './routes/client.routes';
import freelancerRoutes from './routes/freelancer.routes';
import oauthRoutes from './routes/oauth.routes';
import monitoringRoutes from './routes/monitoring.routes';
import { initializeMonitoring } from './services/monitoring.service';
import { initializeAuthPipeline } from './services/auth-pipeline.service';
import { monitoringMiddleware } from './middleware/monitoring.middleware';

const app = new Hono();

// Enable CORS for all routes
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Global monitoring middleware
app.use('*', monitoringMiddleware());

app.route('/auth', authRoutes);
app.route('/oauth', oauthRoutes);
app.route('/otp', otpRoutes);
app.route('/client', clientRoutes);
app.route('/freelancer', freelancerRoutes);
app.route('/monitoring', monitoringRoutes);

// Basic health check endpoint
app.get('/health', async (c) => {
  try {
    const { isRedisConnected, authCacheUtils } = await import('@vync/cache').then(async (cache) => {
      const { authCacheUtils } = await import('./utils/cache.utils');
      return { isRedisConnected: cache.isRedisConnected, authCacheUtils };
    });
    
    const redisStatus = isRedisConnected();
    let activeSessionsCount = 0;
    
    if (redisStatus) {
      try {
        activeSessionsCount = await authCacheUtils.getActiveSessionsCount();
      } catch (error) {
        logger.error('Failed to get active sessions count:', error);
      }
    }
    
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      redis: {
        connected: redisStatus,
        activeSessions: activeSessionsCount
      },
      version: '1.0.0'
    });
  } catch (error) {
    logger.error('Health check error:', error);
    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service health check failed'
    }, 500);
  }
});

// Enhanced health check with detailed metrics is available at /monitoring/health/detailed

// Import rate limiting for token verification
const { rateLimitMiddleware, rateLimitConfigs } = await import('./middleware/rateLimiting.middleware');

// Token verification endpoint for other services
app.post('/verify-token', rateLimitMiddleware(rateLimitConfigs.tokenVerify), async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    // Import auth cache utilities
    const { authCacheUtils } = await import('./utils/cache.utils');
    
    // Check if token is blacklisted
    const isBlacklisted = await authCacheUtils.isTokenBlacklisted(token);
    if (isBlacklisted) {
      logger.warn('Token verification failed: token is blacklisted');
      return c.json({ error: 'Token has been invalidated' }, 401);
    }

    // Get user from token (this validates the token)
    const { getUserFromToken } = await import('@vync/shared');
    const user = await getUserFromToken(token);
    
    // Check if user token is valid
    if (!user) {
      logger.warn('Token verification failed: invalid or expired token');
      return c.json({ error: 'Invalid or expired token' }, 401);
    }
    
    // Try to get user from cache first for better performance
    let cachedUser = await authCacheUtils.getCachedUser(user.userId);
    
    if (!cachedUser) {
      // If not in cache, get from database and cache it
      const { AuthService } = await import('./services/auth.service');
      cachedUser = await AuthService.refreshUserCache(user.userId);
    }
    
    // Update session activity if session exists
    try {
      const clientIp = c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP');
      await authCacheUtils.updateSessionActivity(user.userId, clientIp);
    } catch (error) {
      // Continue if session update fails
      logger.debug(`Failed to update session activity for user ${user.userId}:`, error);
    }
    
    // Return cached user data if available, otherwise return the JWT user data
    const responseUser = cachedUser || user;
    return c.json(responseUser, 200);
  } catch (error: any) {
    logger.error('Token verification error:', error);
    return c.json({ error: 'Invalid token' }, 401);
  }
});

// Initialize Redis connection
try {
  await connectRedis();
  redisMonitoring.initialize();
  logger.info('Redis connection established for auth-service');
} catch (error) {
  logger.error('Failed to connect to Redis:', error);
  // Continue without Redis for now, but log the error
}

// Initialize monitoring services
try {
  initializeMonitoring();
  initializeAuthPipeline();
  logger.info('Monitoring and pipeline services initialized');
} catch (error) {
  logger.error('Failed to initialize monitoring services:', error);
}

// Graceful shutdown handler
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  try {
    redisMonitoring.shutdown();
    await disconnectRedis();
    logger.info('Services and Redis connection closed');
  } catch (error) {
    logger.error('Error during shutdown:', error);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  try {
    redisMonitoring.shutdown();
    await disconnectRedis();
    logger.info('Services and Redis connection closed');
  } catch (error) {
    logger.error('Error during shutdown:', error);
  }
  process.exit(0);
});

export default {
    port: env.AUTH_SERVICE_PORT,
    fetch: app.fetch,
};
