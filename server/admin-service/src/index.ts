import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from '@frevix/config/dist/logger';
// Import route modules
import userManagementRoutes from './routes/user-management.routes';
import jobManagementRoutes from './routes/job-management.routes';
import financialOversightRoutes from './routes/financial-oversight.routes';
import analyticsRoutes from './routes/analytics.routes';
import contentModerationRoutes from './routes/content-moderation.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app = new Hono();

// Enable CORS for all routes (permissive for development)
app.use('*', cors({
  origin: '*', // Allow all origins for development
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check endpoint
app.get('/health', (c) => {
    logger.info('🏥 Health check requested');
    return c.json({ 
    status: 'healthy', 
    service: 'admin-service', 
    timestamp: new Date().toISOString(),
    port: process.env.ADMIN_PORT || 3005
  });
});

// Mount API route modules
app.route('/dashboard', dashboardRoutes);
app.route('/users', userManagementRoutes);
app.route('/jobs', jobManagementRoutes);
app.route('/financial', financialOversightRoutes);
app.route('/analytics', analyticsRoutes);
app.route('/moderation', contentModerationRoutes);

export default {
  port: process.env.PORT,
  fetch: app.fetch,
};
