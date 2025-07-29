import { prisma } from "../config/prisma";
import { JobStatus } from "../generated/prisma";

interface CreateJobData {
  title: string;
  description: string;
  budget: number;
  category: string;
}

interface UpdateJobData {
  title?: string;
  description?: string;
  budget?: number;
  category?: string;
}

interface JobFilters {
  page: number;
  limit: number;
  status?: string;
  category?: string;
}

interface ProposalFilters {
  page: number;
  limit: number;
}

export const JobService = {
  createJob: async (userId: string, jobData: CreateJobData) => {
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

    return job;
  },

  getClientJobs: async (userId: string, filters: JobFilters) => {
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
      where.status = status as JobStatus;
    }

    if (category) {
      where.category = {
        contains: category,
        mode: 'insensitive'
      };
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

    return {
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  getJobById: async (jobId: string, userId: string) => {
    // Verify user is a client
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Client: true }
    });

    if (!user || user.role !== "CLIENT" || !user.Client) {
      throw new Error("Client not found");
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

    return job;
  },

  updateJob: async (jobId: string, userId: string, updateData: UpdateJobData) => {
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

  deleteJob: async (jobId: string, userId: string) => {
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

  getJobStats: async (userId: string) => {
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

  getJobProposals: async (jobId: string, userId: string, filters: ProposalFilters) => {
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

  updateJobStatus: async (jobId: string, userId: string, status: string) => {
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
  }
};
