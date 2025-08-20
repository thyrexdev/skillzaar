import { Context } from 'hono';
import { UserManagementService } from '../services/user-management.service';
import { JobManagementService } from '../services/job-management.service';
import { FinancialOversightService } from '../services/financial-oversight.service';
import { AnalyticsService } from '../services/analytics.service';

const userService = new UserManagementService();
const jobService = new JobManagementService();
const financialService = new FinancialOversightService();
const analyticsService = new AnalyticsService();

export const getDashboardOverview = async (c: Context) => {
  try {
    const [
      userStats,
      jobStats,
      financialStats,
      systemHealth
    ] = await Promise.all([
      userService.getUserStats(),
      jobService.getJobStats(),
      financialService.getFinancialStats(),
      analyticsService.getSystemHealthMetrics()
    ]);

    return c.json({
      success: true,
      data: {
        overview: {
          totalUsers: userStats.totalUsers,
          activeJobs: jobStats.activeJobs,
          totalRevenue: financialStats.totalRevenue,
          systemUptime: systemHealth.systemStatus.uptime
        },
        userStats,
        jobStats,
        financialStats,
        systemHealth
      }
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
