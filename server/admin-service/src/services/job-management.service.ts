import { prisma } from '@frevix/shared';
import { JobFilters, JobStats, ProposalStats } from '../interfaces/admin.interfaces';

export class JobManagementService {
  async getJobStats(): Promise<JobStats> {
    const [
      totalJobs,
      jobsByStatus,
      jobsByCategory,
      avgBudget
    ] = await Promise.all([
      prisma.job.count(),
      prisma.job.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      prisma.job.groupBy({
        by: ['category'],
        _count: { id: true }
      }),
      prisma.job.aggregate({
        _avg: { budget: true }
      })
    ]);

    const statusStats = jobsByStatus.reduce((acc, curr) => {
      acc[curr.status.toLowerCase() as keyof typeof acc] = curr._count.id;
      return acc;
    }, {
      open: 0,
      in_progress: 0,
      completed: 0,
      canceled: 0
    });

    const categoryStats = jobsByCategory.reduce((acc, curr) => {
      acc[curr.category] = curr._count.id;
      return acc;
    }, {} as Record<string, number>);

    const completionRate = totalJobs > 0 
      ? (statusStats.completed / (statusStats.completed + statusStats.canceled)) * 100 
      : 0;

    return {
      totalJobs,
      activeJobs: statusStats.open + statusStats.in_progress,
      completedJobs: statusStats.completed,
      canceledJobs: statusStats.canceled,
      reportedJobs: 0, // TODO: Implement job reporting system
      averageBudget: avgBudget._avg.budget || 0,
      jobsByCategory: categoryStats,
      completionRate
    };
  }

  async getProposalStats(): Promise<ProposalStats> {
    const [
      totalProposals,
      proposalsByStatus,
      avgProposalsPerJob,
      topFreelancers
    ] = await Promise.all([
      prisma.proposal.count(),
      prisma.proposal.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      prisma.job.aggregate({
        _avg: {
          proposals: { _count: true }
        }
      }),
      prisma.proposal.groupBy({
        by: ['freelancerId'],
        _count: { id: true },
        _sum: { status: true },
        orderBy: {
          _count: { id: 'desc' }
        },
        take: 10
      })
    ]);

    const statusStats = proposalsByStatus.reduce((acc, curr) => {
      acc[curr.status.toLowerCase() as keyof typeof acc] = curr._count.id;
      return acc;
    }, {
      pending: 0,
      accepted: 0,
      declined: 0,
      interviewing: 0
    });

    // Get freelancer details for top freelancers
    const freelancerIds = topFreelancers.map(f => f.freelancerId);
    const freelancerDetails = await prisma.freelancer.findMany({
      where: { id: { in: freelancerIds } },
      select: {
        id: true,
        fullName: true,
        user: { select: { name: true } }
      }
    });

    const topFreelancersWithDetails = topFreelancers.map(tf => {
      const freelancer = freelancerDetails.find(f => f.id === tf.freelancerId);
      const acceptanceRate = tf._count.id > 0 
        ? (statusStats.accepted / tf._count.id) * 100 
        : 0;

      return {
        id: tf.freelancerId,
        name: freelancer?.fullName || freelancer?.user.name || 'Unknown',
        acceptanceRate,
        totalProposals: tf._count.id
      };
    });

    return {
      totalProposals,
      acceptedProposals: statusStats.accepted,
      rejectedProposals: statusStats.declined,
      pendingProposals: statusStats.pending,
      averageProposalsPerJob: Number(avgProposalsPerJob._avg.proposals) || 0,
      topFreelancers: topFreelancersWithDetails
    };
  }

  async getJobs(filters: JobFilters, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.category) {
      where.category = { contains: filters.category, mode: 'insensitive' };
    }

    if (filters.budgetRange) {
      where.budget = {
        gte: filters.budgetRange.min,
        lte: filters.budgetRange.max
      };
    }

    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end
      };
    }

    if (filters.reported) {
      // TODO: Implement job reporting system
      // where.reported = true;
    }

    const [jobs, totalCount] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: {
            select: {
              id: true,
              fullName: true,
              companyName: true,
              user: {
                select: {
                  name: true,
                  email: true,
                  isVerified: true
                }
              }
            }
          },
          proposals: {
            select: {
              id: true,
              status: true,
              proposedRate: true,
              freelancer: {
                select: {
                  fullName: true,
                  user: { select: { name: true } }
                }
              }
            }
          },
          contract: {
            select: {
              id: true,
              status: true,
              payments: {
                select: {
                  amount: true,
                  status: true
                }
              }
            }
          },
          assets: {
            select: {
              id: true,
              originalName: true,
              fileType: true,
              fileSize: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.job.count({ where })
    ]);

    return {
      jobs,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    };
  }

  async getJobDetails(jobId: string) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        client: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isVerified: true,
                profilePicture: true
              }
            }
          }
        },
        proposals: {
          include: {
            freelancer: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    isVerified: true,
                    profilePicture: true
                  }
                },
                skills: true
              }
            }
          }
        },
        contract: {
          include: {
            freelancer: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            },
            payments: true
          }
        },
        assets: true
      }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return job;
  }

  async getProposals(jobId?: string, freelancerId?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (jobId) {
      where.jobId = jobId;
    }

    if (freelancerId) {
      where.freelancerId = freelancerId;
    }

    const [proposals, totalCount] = await Promise.all([
      prisma.proposal.findMany({
        where,
        skip,
        take: limit,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              budget: true,
              status: true,
              category: true,
              client: {
                select: {
                  fullName: true,
                  user: { select: { name: true } }
                }
              }
            }
          },
          freelancer: {
            select: {
              id: true,
              fullName: true,
              hourlyRate: true,
              experienceLevel: true,
              user: {
                select: {
                  name: true,
                  email: true,
                  isVerified: true,
                  profilePicture: true
                }
              },
              skills: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.proposal.count({ where })
    ]);

    return {
      proposals,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    };
  }

  async updateJobStatus(jobId: string, status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED', adminId: string, reason?: string) {
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    await prisma.job.update({
      where: { id: jobId },
      data: { status }
    });

    // TODO: Log admin action
    console.log(`Admin ${adminId} updated job ${jobId} status to ${status}. Reason: ${reason || 'No reason provided'}`);

    return { success: true, message: 'Job status updated successfully' };
  }

  async getJobCategories() {
    const categories = await prisma.job.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: {
        _count: { id: 'desc' }
      }
    });

    return categories.map(category => ({
      name: category.category,
      count: category._count.id
    }));
  }

  async updateJobCategory(oldCategory: string, newCategory: string, adminId: string) {
    const result = await prisma.job.updateMany({
      where: { category: oldCategory },
      data: { category: newCategory }
    });

    console.log(`Admin ${adminId} updated category "${oldCategory}" to "${newCategory}" for ${result.count} jobs`);

    return { 
      success: true, 
      message: `Updated ${result.count} jobs from "${oldCategory}" to "${newCategory}"` 
    };
  }
}
