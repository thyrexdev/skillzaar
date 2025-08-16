import { prisma } from '@vync/shared';
import { PlatformMetrics } from '../interfaces/admin.interfaces';

export class AnalyticsService {
  async getPlatformMetrics(timeRange: 'daily' | 'monthly' | 'yearly' = 'monthly'): Promise<PlatformMetrics> {
    const now = new Date();
    const periods = this.generateTimePeriods(timeRange, now);

    const [
      userGrowthData,
      jobMetricsData,
      revenueData,
      performanceData
    ] = await Promise.all([
      this.getUserGrowthMetrics(periods, timeRange),
      this.getJobMetrics(),
      this.getRevenueAnalytics(periods, timeRange),
      this.getPerformanceInsights()
    ]);

    return {
      userGrowth: userGrowthData,
      jobMetrics: jobMetricsData,
      revenueAnalytics: revenueData,
      performanceInsights: performanceData
    };
  }

  private generateTimePeriods(timeRange: 'daily' | 'monthly' | 'yearly', now: Date) {
    const periods = [];
    let count = timeRange === 'daily' ? 30 : timeRange === 'monthly' ? 12 : 5;
    
    for (let i = count - 1; i >= 0; i--) {
      let start: Date, end: Date, label: string;
      
      if (timeRange === 'daily') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
        label = start.toISOString().split('T')[0];
      } else if (timeRange === 'monthly') {
        start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        label = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else {
        start = new Date(now.getFullYear() - i, 0, 1);
        end = new Date(now.getFullYear() - i, 11, 31);
        label = start.getFullYear().toString();
      }
      
      periods.push({ start, end, label });
    }
    
    return periods;
  }

  private async getUserGrowthMetrics(periods: any[], timeRange: string) {
    const growthData = await Promise.all(periods.map(async (period) => {
      const [newUsers, activeUsers] = await Promise.all([
        prisma.user.count({
          where: {
            createdAt: {
              gte: period.start,
              lte: period.end
            }
          }
        }),
        prisma.user.count({
          where: {
            updatedAt: {
              gte: period.start,
              lte: period.end
            }
          }
        })
      ]);

      return {
        [timeRange === 'daily' ? 'date' : timeRange === 'monthly' ? 'month' : 'year']: period.label,
        newUsers,
        activeUsers
      };
    }));

    return {
      daily: timeRange === 'daily' ? growthData : [],
      monthly: timeRange === 'monthly' ? growthData : [],
      yearly: timeRange === 'yearly' ? growthData : []
    };
  }

  private async getJobMetrics() {
    const [
      totalJobs,
      completedJobs,
      categories,
      contracts
    ] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { status: 'COMPLETED' } }),
      prisma.job.groupBy({
        by: ['category'],
        _count: { id: true },
        orderBy: {
          _count: { id: 'desc' }
        }
      }),
      prisma.contract.count()
    ]);

    const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
    
    const popularCategories = categories.map(category => ({
      category: category.category,
      count: category._count.id,
      percentage: totalJobs > 0 ? (category._count.id / totalJobs) * 100 : 0
    }));

    const averageJobValue = await prisma.job.aggregate({
      _avg: { budget: true }
    });

    return {
      completionRate,
      averageJobValue: averageJobValue._avg.budget || 0,
      popularCategories,
      successfulHires: contracts
    };
  }

  private async getRevenueAnalytics(periods: any[], timeRange: string) {
    const revenueData = await Promise.all(periods.map(async (period) => {
      const transactions = await prisma.walletTransaction.aggregate({
        where: {
          createdAt: {
            gte: period.start,
            lte: period.end
          },
          type: 'DEPOSIT'
        },
        _sum: { amount: true }
      });

      return (transactions._sum.amount || 0) / 100; // Convert from piasters
    }));

    const totalRevenue = revenueData.reduce((sum, revenue) => sum + revenue, 0);
    const currentPeriodRevenue = revenueData[revenueData.length - 1] || 0;
    const previousPeriodRevenue = revenueData[revenueData.length - 2] || 0;
    
    const monthlyGrowth = previousPeriodRevenue > 0 
      ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
      : 0;

    // Revenue by source (simplified)
    const revenueBySource = {
      'Job Payments': totalRevenue * 0.85,
      'Platform Fees': totalRevenue * 0.15
    };

    // Simple projection (based on current trend)
    const projectedRevenue = currentPeriodRevenue * (1 + monthlyGrowth / 100);

    return {
      totalRevenue,
      monthlyGrowth,
      revenueBySource,
      projectedRevenue
    };
  }

  private async getPerformanceInsights() {
    // These would typically come from monitoring services
    // For now, we'll provide mock data with some basic metrics
    
    const totalMessages = await prisma.message.count();
    const recentMessages = await prisma.message.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    // Mock performance data - in real implementation, these would come from monitoring
    return {
      averageResponseTime: 250, // ms
      systemUptime: 99.8, // percentage
      errorRate: 0.1, // percentage
      userSatisfaction: 4.3 // out of 5, based on reviews if implemented
    };
  }

  async getUserEngagementMetrics(dateRange?: { start: Date; end: Date }) {
    const where = dateRange ? {
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end
      }
    } : {};

    const [
      messageStats,
      jobStats,
      proposalStats,
      userActivity
    ] = await Promise.all([
      prisma.message.aggregate({
        where,
        _count: { id: true },
        _avg: { content: { _count: true } }
      }),
      prisma.job.aggregate({
        where,
        _count: { id: true }
      }),
      prisma.proposal.aggregate({
        where,
        _count: { id: true }
      }),
      prisma.user.groupBy({
        by: ['role'],
        where: {
          updatedAt: dateRange ? {
            gte: dateRange.start,
            lte: dateRange.end
          } : {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        _count: { id: true }
      })
    ]);

    return {
      totalMessages: messageStats._count.id,
      totalJobs: jobStats._count.id,
      totalProposals: proposalStats._count.id,
      activeUsersByRole: userActivity.reduce((acc, curr) => {
        acc[curr.role.toLowerCase()] = curr._count.id;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  async getTopPerformers(limit: number = 10) {
    const [
      topClients,
      topFreelancers,
      topCategories
    ] = await Promise.all([
      // Top clients by jobs posted and budget
      prisma.client.findMany({
        include: {
          jobs: {
            select: {
              budget: true,
              status: true
            }
          },
          user: {
            select: {
              name: true,
              email: true,
              isVerified: true
            }
          }
        }
      }),
      // Top freelancers by earnings and job completion
      prisma.freelancer.findMany({
        include: {
          contracts: {
            include: {
              payments: true
            }
          },
          user: {
            select: {
              name: true,
              email: true,
              isVerified: true
            }
          }
        }
      }),
      // Top job categories
      prisma.job.groupBy({
        by: ['category'],
        _count: { id: true },
        _avg: { budget: true },
        orderBy: {
          _count: { id: 'desc' }
        },
        take: limit
      })
    ]);

    // Process top clients
    const processedClients = topClients
      .map(client => ({
        id: client.id,
        name: client.user.name,
        email: client.user.email,
        isVerified: client.user.isVerified,
        totalJobsPosted: client.jobs.length,
        totalBudget: client.jobs.reduce((sum, job) => sum + job.budget, 0),
        completedJobs: client.jobs.filter(job => job.status === 'COMPLETED').length
      }))
      .sort((a, b) => b.totalBudget - a.totalBudget)
      .slice(0, limit);

    // Process top freelancers
    const processedFreelancers = topFreelancers
      .map(freelancer => {
        const totalEarnings = freelancer.contracts
          .flatMap(contract => contract.payments)
          .filter(payment => payment.status === 'COMPLETED')
          .reduce((sum, payment) => sum + payment.amount, 0);

        return {
          id: freelancer.id,
          name: freelancer.user.name,
          email: freelancer.user.email,
          isVerified: freelancer.user.isVerified,
          totalEarnings: totalEarnings / 100,
          completedJobs: freelancer.contracts.filter(c => c.status === 'COMPLETED').length,
          activeJobs: freelancer.contracts.filter(c => c.status === 'ACTIVE').length
        };
      })
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, limit);

    return {
      topClients: processedClients,
      topFreelancers: processedFreelancers,
      topCategories: topCategories.map(cat => ({
        category: cat.category,
        jobCount: cat._count.id,
        averageBudget: cat._avg.budget || 0
      }))
    };
  }

  async getSystemHealthMetrics() {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      recentActivity,
      weeklyActivity,
      dbHealth,
      fileStorage
    ] = await Promise.all([
      // Recent activity (last 24 hours)
      Promise.all([
        prisma.user.count({ where: { createdAt: { gte: last24Hours } } }),
        prisma.job.count({ where: { createdAt: { gte: last24Hours } } }),
        prisma.message.count({ where: { timestamp: { gte: last24Hours } } }),
        prisma.walletTransaction.count({ where: { createdAt: { gte: last24Hours } } })
      ]),
      // Weekly activity
      Promise.all([
        prisma.user.count({ where: { createdAt: { gte: lastWeek } } }),
        prisma.job.count({ where: { createdAt: { gte: lastWeek } } }),
        prisma.message.count({ where: { timestamp: { gte: lastWeek } } }),
        prisma.walletTransaction.count({ where: { createdAt: { gte: lastWeek } } })
      ]),
      // Database health check
      prisma.$queryRaw`SELECT 1 as healthy`,
      // File storage metrics
      prisma.mediaFile.aggregate({
        _sum: { fileSize: true },
        _count: { id: true }
      })
    ]);

    const [newUsers24h, newJobs24h, newMessages24h, newTransactions24h] = recentActivity;
    const [newUsers7d, newJobs7d, newMessages7d, newTransactions7d] = weeklyActivity;

    return {
      recent24Hours: {
        newUsers: newUsers24h,
        newJobs: newJobs24h,
        newMessages: newMessages24h,
        newTransactions: newTransactions24h
      },
      pastWeek: {
        newUsers: newUsers7d,
        newJobs: newJobs7d,
        newMessages: newMessages7d,
        newTransactions: newTransactions7d
      },
      systemStatus: {
        database: dbHealth ? 'healthy' : 'unhealthy',
        uptime: '99.9%', // Mock data - would come from monitoring
        responseTime: '< 300ms' // Mock data
      },
      storage: {
        totalFiles: fileStorage._count.id,
        totalSize: Math.round((fileStorage._sum.fileSize || 0) / (1024 * 1024)), // MB
        averageFileSize: fileStorage._count.id > 0 
          ? Math.round((fileStorage._sum.fileSize || 0) / fileStorage._count.id / 1024) // KB
          : 0
      }
    };
  }
}
