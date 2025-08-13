import { Context } from 'hono';
import { AnalyticsService } from '../services/analytics.service';

const analyticsService = new AnalyticsService();

export const getPlatformMetrics = async (c: Context) => {
  try {
    const query = c.req.query();
    const timeRange = (query.timeRange as 'daily' | 'monthly' | 'yearly') || 'monthly';

    const metrics = await analyticsService.getPlatformMetrics(timeRange);
    return c.json({ success: true, data: metrics });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getUserEngagementMetrics = async (c: Context) => {
  try {
    const query = c.req.query();
    const dateRange = query.startDate && query.endDate ? {
      start: new Date(query.startDate),
      end: new Date(query.endDate)
    } : undefined;

    const metrics = await analyticsService.getUserEngagementMetrics(dateRange);
    return c.json({ success: true, data: metrics });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getTopPerformers = async (c: Context) => {
  try {
    const query = c.req.query();
    const limit = parseInt(query.limit || '10');

    const performers = await analyticsService.getTopPerformers(limit);
    return c.json({ success: true, data: performers });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getSystemHealthMetrics = async (c: Context) => {
  try {
    const health = await analyticsService.getSystemHealthMetrics();
    return c.json({ success: true, data: health });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
