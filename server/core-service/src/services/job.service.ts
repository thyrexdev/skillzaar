import { prisma } from "@vync/shared";
import { type Job, JobStatus } from "@vync/shared/src/generated/prisma";
import type {
  CreateJobRequest,
  UpdateJobRequest,
  GetClientJobsFilters,
  GetJobProposalsFilters,
  JobStats,
  ClientJobsResponse,
  JobProposalsResponse,
  DeleteJobResponse,
  BrowseJobsFilters,
  BrowseJobsResponse,
  JobMarketStats
} from "../interfaces/job.interface";
import { cachedBrowseJobs, cachedClientJobs, cachedFeaturedJobs, cachedJob, cachedJobMarketStats, getCachedBrowseJobs, getCachedClientJobs, getCachedFeaturedJobs, getCachedJob, getCachedJobMarketStats } from "../cache/core.cache";

export const JobService = {
  createJob: async (userId: string, jobData: CreateJobRequest): Promise<Job> => {
    // First, verify that the user is a client
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Client: true }
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== "CLIENT") {
      throw new Error("Only clients can post jobs");
    }

    if (!user.Client) {
      throw new Error("Client profile not found");
    }

    // Create the job
    const job = await prisma.job.create({
      data: {
        clientId: user.Client.id,
        title: jobData.title,
        description: jobData.description,
        budget: jobData.budget,
        category: jobData.category,
        status: JobStatus.OPEN,
      },
      include: {
        client: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        _count: {
          select: {
            proposals: true
          }
        }
      }
    });


    const cached = await getCachedClientJobs(user.Client.id);
    if (cached) {
      await cachedClientJobs(user.Client.id, [job, ...cached], 60 * 5);
    } else {
      await cachedClientJobs(user.Client.id, [job], 60 * 5);
    }

    return job;
  },

  getClientJobs: async (userId: string, filters: GetClientJobsFilters): Promise<ClientJobsResponse> => {
    // Verify user is a client
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Client: true }
    });

    if (!user || user.role !== "CLIENT" || !user.Client) {
      throw new Error("Client not found");
    }

    const { page, limit, status, category } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      clientId: user.Client.id,
    };

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = {
        contains: category,
        mode: 'insensitive'
      };
    }

    const cached = await getCachedClientJobs(userId)
    if (cached) {
      const paginated = cached.slice(skip, skip + limit)
      return {
        jobs: paginated,
        pagination: {
          page,
          limit,
          total: cached.length,
          pages: Math.ceil(cached.length / limit)
        }
      }
    }
    // Get jobs with pagination
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          client: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              }
            }
          },
          _count: {
            select: {
              proposals: true
            }
          }
        }
      }),
      prisma.job.count({ where })
    ]);

    await cachedClientJobs(userId, jobs, 60 * 5)

    return {
      jobs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  },

  getJobById: async (jobId: string, userId: string): Promise<Job> => {
    // Verify user is a client
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Client: true }
    });

    if (!user || user.role !== "CLIENT" || !user.Client) {
      throw new Error("Client not found");
    }

    const jobFromCache = await getCachedJob(jobId);
    if (jobFromCache) {
      return jobFromCache;
    }

    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        clientId: user.Client.id,
      },
      include: {
        client: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
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
                  }
                },
                skills: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            proposals: true
          }
        }
      }
    });

    if (!job) {
      throw new Error("Job not found");
    }


    await cachedJob(job, 3600);

    return job;
  },

  updateJob: async (jobId: string, userId: string, updateData: UpdateJobRequest): Promise<Job> => {
    // Verify user is a client and owns the job
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Client: true }
    });

    if (!user || user.role !== "CLIENT" || !user.Client) {
      throw new Error("Client not found");
    }

    // Check if job exists and belongs to the client
    const existingJob = await prisma.job.findFirst({
      where: {
        id: jobId,
        clientId: user.Client.id,
      }
    });

    if (!existingJob) {
      throw new Error("Job not found");
    }

    // Check if job can be updated (shouldn't update completed or canceled jobs)
    if (existingJob.status === JobStatus.COMPLETED || existingJob.status === JobStatus.CANCELED) {
      throw new Error("Cannot update completed or canceled jobs");
    }

    const job = await prisma.job.update({
      where: { id: jobId },
      data: updateData,
      include: {
        client: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        _count: {
          select: {
            proposals: true
          }
        }
      }
    });

    return job;
  },

  deleteJob: async (jobId: string, userId: string): Promise<DeleteJobResponse> => {
    // Verify user is a client and owns the job
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Client: true }
    });

    if (!user || user.role !== "CLIENT" || !user.Client) {
      throw new Error("Client not found");
    }

    // Check if job exists and belongs to the client
    const existingJob = await prisma.job.findFirst({
      where: {
        id: jobId,
        clientId: user.Client.id,
      },
      include: {
        contract: true,
        _count: {
          select: {
            proposals: true
          }
        }
      }
    });

    if (!existingJob) {
      throw new Error("Job not found");
    }

    // Check if job can be deleted
    if (existingJob.contract || existingJob.status === JobStatus.IN_PROGRESS) {
      throw new Error("Cannot delete jobs with active contracts or in progress");
    }

    await prisma.job.delete({
      where: { id: jobId }
    });

    return { message: "Job deleted successfully" };
  },

  getJobStats: async (userId: string): Promise<JobStats> => {
    // Verify user is a client
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Client: true }
    });

    if (!user || user.role !== "CLIENT" || !user.Client) {
      throw new Error("Client not found");
    }

    const [
      totalJobs,
      activeJobs,
      completedJobs,
      inProgressJobs,
      totalProposals,
      totalSpent
    ] = await Promise.all([
      prisma.job.count({
        where: { clientId: user.Client.id }
      }),
      prisma.job.count({
        where: {
          clientId: user.Client.id,
          status: JobStatus.OPEN
        }
      }),
      prisma.job.count({
        where: {
          clientId: user.Client.id,
          status: JobStatus.COMPLETED
        }
      }),
      prisma.job.count({
        where: {
          clientId: user.Client.id,
          status: JobStatus.IN_PROGRESS
        }
      }),
      prisma.proposal.count({
        where: {
          job: {
            clientId: user.Client.id
          }
        }
      }),
      prisma.job.aggregate({
        where: {
          clientId: user.Client.id,
          status: JobStatus.COMPLETED
        },
        _sum: {
          budget: true
        }
      })
    ]);

    return {
      totalJobs,
      activeJobs,
      completedJobs,
      inProgressJobs,
      canceledJobs: totalJobs - activeJobs - completedJobs - inProgressJobs,
      totalProposals,
      totalSpent: totalSpent._sum.budget || 0,
      averageBudget: totalJobs > 0 ? (totalSpent._sum.budget || 0) / completedJobs : 0
    };
  },

  getJobProposals: async (jobId: string, userId: string, filters: GetJobProposalsFilters): Promise<JobProposalsResponse> => {
    // Verify user is a client and owns the job
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Client: true }
    });

    if (!user || user.role !== "CLIENT" || !user.Client) {
      throw new Error("Client not found");
    }

    // Check if job exists and belongs to the client
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        clientId: user.Client.id,
      }
    });

    if (!job) {
      throw new Error("Job not found");
    }

    const { page, limit } = filters;
    const skip = (page - 1) * limit;

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where: { jobId },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          freelancer: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              },
              skills: true,
              _count: {
                select: {
                  contracts: true,
                  reviews: true
                }
              }
            }
          }
        }
      }),
      prisma.proposal.count({ where: { jobId } })
    ]);

    return {
      proposals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  updateJobStatus: async (jobId: string, userId: string, status: string): Promise<Job> => {
    // Verify user is a client and owns the job
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Client: true }
    });

    if (!user || user.role !== "CLIENT" || !user.Client) {
      throw new Error("Client not found");
    }

    // Check if job exists and belongs to the client
    const existingJob = await prisma.job.findFirst({
      where: {
        id: jobId,
        clientId: user.Client.id,
      }
    });

    if (!existingJob) {
      throw new Error("Job not found");
    }

    const job = await prisma.job.update({
      where: { id: jobId },
      data: { status: status as JobStatus },
      include: {
        client: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        _count: {
          select: {
            proposals: true
          }
        }
      }
    });

    return job;
  },

  // Browse all jobs (for freelancers and general browsing)

  browseJobs: async (filters: BrowseJobsFilters): Promise<BrowseJobsResponse> => {
    const { page, limit, category, minBudget, maxBudget, status, search } = filters
    const skip = (page - 1) * limit

    // 🔑 1. Check cache first
    const cached = await getCachedBrowseJobs(filters)
    if (cached) {
      const total = cached.length
      return {
        jobs: cached,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      }
    }

    // Build where clause
    const where: any = {}

    // Filter by status (default to OPEN jobs)
    where.status = status || JobStatus.OPEN

    // Filter by category
    if (category) {
      where.category = {
        contains: category,
        mode: "insensitive",
      }
    }

    // Filter by budget range
    if (minBudget || maxBudget) {
      where.budget = {}
      if (minBudget) {
        where.budget.gte = minBudget
      }
      if (maxBudget) {
        where.budget.lte = maxBudget
      }
    }

    // Search in title and description
    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
      ]
    }

    // 2. Get jobs from DB
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          client: {
            select: {
              id: true,
              fullName: true,
              companyName: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              proposals: true,
            },
          },
        },
      }),
      prisma.job.count({ where }),
    ])

    const response: BrowseJobsResponse = {
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }

    // 3. Store in cache for next time
    await cachedBrowseJobs(filters, jobs)

    return response
  },

  // Get job market statistics
  getJobMarketStats: async (): Promise<JobMarketStats> => {

    const cached = await getCachedJobMarketStats()
    if (cached) return cached

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [
      totalOpenJobs,
      totalJobsThisWeek,
      averageBudgetData,
      topCategoriesData
    ] = await Promise.all([
      // Total open jobs
      prisma.job.count({
        where: { status: JobStatus.OPEN }
      }),
      // Jobs posted this week
      prisma.job.count({
        where: {
          createdAt: {
            gte: oneWeekAgo
          }
        }
      }),
      // Average budget of open jobs
      prisma.job.aggregate({
        where: { status: JobStatus.OPEN },
        _avg: {
          budget: true
        }
      }),
      // Top categories by job count
      prisma.job.groupBy({
        by: ['category'],
        where: { status: JobStatus.OPEN },
        _count: {
          category: true
        },
        orderBy: {
          _count: {
            category: 'desc'
          }
        },
        take: 5
      })
    ]);

    const topCategories = topCategoriesData.map((item: { category: any; _count: { category: any; }; }) => ({
      category: item.category,
      count: item._count.category
    }));

    const stats: JobMarketStats = {
      totalOpenJobs,
      totalJobsThisWeek,
      averageBudget: averageBudgetData._avg.budget || 0,
      topCategories
    }

    await cachedJobMarketStats(stats, 600)

    return stats
  },

  // Get a single job by ID (public - for freelancers)
  getJobByIdPublic: async (jobId: string): Promise<Job> => {

    const cached = await getCachedJob(jobId);
    if (cached) return cached;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        _count: {
          select: {
            proposals: true
          }
        }
      }
    });

    if (!job) {
      throw new Error("Job not found");
    }

    // Only return open jobs for public access
    if (job.status !== JobStatus.OPEN) {
      throw new Error("Job is not available");
    }

    await cachedJob(job, 300);

    return job;
  },

  // Get featured jobs (most recent or with most proposals)
  getFeaturedJobs: async (limit: number = 6): Promise<Job[]> => {

    const cached = await getCachedFeaturedJobs()
    if (cached) return cached

    const jobs = await prisma.job.findMany({
      where: { status: JobStatus.OPEN },
      take: limit,
      orderBy: [
        {
          proposals: {
            _count: 'desc'
          }
        },
        {
          createdAt: 'desc'
        }
      ],
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        _count: {
          select: {
            proposals: true
          }
        }
      }
    });

    await cachedFeaturedJobs(jobs)

    return jobs;
  }
};
