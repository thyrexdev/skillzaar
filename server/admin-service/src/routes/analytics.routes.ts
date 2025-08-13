import { Hono } from 'hono';
import { requireAdmin } from '../middlewares/admin.middleware';
import {
  getPlatformMetrics,
  getUserEngagementMetrics,
  getTopPerformers,
  getSystemHealthMetrics
} from '../controllers/analytics.controller';

const analyticsRoutes = new Hono();

// Apply admin middleware to all routes
analyticsRoutes.use('*', requireAdmin);

// Platform analytics
analyticsRoutes.get('/platform', getPlatformMetrics);
analyticsRoutes.get('/engagement', getUserEngagementMetrics);
analyticsRoutes.get('/top-performers', getTopPerformers);
analyticsRoutes.get('/system-health', getSystemHealthMetrics);

export default analyticsRoutes;
