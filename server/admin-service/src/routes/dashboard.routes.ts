import { Hono } from 'hono';
import { requireAdmin } from '../middlewares/admin.middleware';
import { getDashboardOverview } from '../controllers/dashboard.controller';

const dashboardRoutes = new Hono();

// Apply admin middleware to all routes
dashboardRoutes.use('*', requireAdmin);

// Dashboard overview
dashboardRoutes.get('/', getDashboardOverview);

export default dashboardRoutes;
