import { prisma } from "../../../config/prisma";
import { 
  CreateProposalData, 
  UpdateProposalStatusData, 
  GetProposalsFilters, 
  Proposal, 
  ProposalWithDetails,
  ProposalStatus 
} from "../interfaces/proposal.interfaces";

export const ProposalService = {
  createProposal: async (userId: string, data: CreateProposalData): Promise<Proposal> => {
    // First, verify that the user is a freelancer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Freelancer: true }
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== "FREELANCER") {
      throw new Error("Only freelancers can submit proposals");
    }

    if (!user.Freelancer) {
      throw new Error("Freelancer profile not found");
    }

    // Check if job exists and is open
    const job = await prisma.job.findUnique({
      where: { id: data.jobId }
    });

    if (!job) {
      throw new Error("Job not found");
    }

    if (job.status !== "OPEN") {
      throw new Error("Job is not open for proposals");
    }

    // Check if freelancer has already submitted a proposal for this job
    const existingProposal = await prisma.proposal.findFirst({
      where: {
        freelancerId: user.Freelancer.id,
        jobId: data.jobId
      }
    });

    if (existingProposal) {
      throw new Error("You have already submitted a proposal for this job");
    }

    // Create the proposal
    const proposal = await prisma.proposal.create({
      data: {
        freelancerId: user.Freelancer.id,
        jobId: data.jobId,
        coverLetter: data.coverLetter,
        proposedRate: data.proposedRate,
        status: ProposalStatus.PENDING
      }
    });

    return proposal;
  },

  getProposalById: async (id: string, userId: string): Promise<ProposalWithDetails | null> => {
    // Get user to determine access rights
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        Client: true,
        Freelancer: true 
      }
    });

    if (!user) {
      throw new Error("User not found");
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        freelancer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePicture: true
              }
            },
            skills: {
              include: {
                skill: true
              }
            }
          }
        },
        job: {
          include: {
            client: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePicture: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!proposal) {
      return null;
    }

    // Check access rights
    const isFreelancerOwner = user.Freelancer && proposal.freelancerId === user.Freelancer.id;
    const isClientOwner = user.Client && proposal.job.clientId === user.Client.id;

    if (!isFreelancerOwner && !isClientOwner) {
      throw new Error("Access denied");
    }

    return proposal;
  },

  getProposals: async (userId: string, filters: GetProposalsFilters): Promise<{
    proposals: ProposalWithDetails[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
  }> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        Client: true,
        Freelancer: true 
      }
    });

    if (!user) {
      throw new Error("User not found");
    }

    const { jobId, freelancerId, status, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    // Apply filters based on user role and provided filters
    if (user.role === "CLIENT" && user.Client) {
      // Client can only see proposals for their jobs
      whereClause.job = {
        clientId: user.Client.id
      };
      
      if (jobId) {
        whereClause.jobId = jobId;
      }
    } else if (user.role === "FREELANCER" && user.Freelancer) {
      // Freelancer can only see their own proposals
      whereClause.freelancerId = user.Freelancer.id;
    } else {
      throw new Error("Invalid user role");
    }

    if (status) whereClause.status = status;

    const [proposals, totalCount] = await Promise.all([
      prisma.proposal.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          freelancer: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profilePicture: true
                }
              },
              skills: {
                include: {
                  skill: true
                }
              }
            }
          },
          job: {
            include: {
              client: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      profilePicture: true
                    }
                  }
                }
              }
            }
          }
        }
      }),
      prisma.proposal.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      proposals,
      totalCount,
      currentPage: page,
      totalPages
    };
  },

  updateProposalStatus: async (proposalId: string, userId: string, status: ProposalStatus): Promise<Proposal> => {
    // Verify user is a client
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Client: true }
    });

    if (!user || user.role !== "CLIENT" || !user.Client) {
      throw new Error("Only clients can update proposal status");
    }

    // Check if proposal exists and belongs to client's job
    const existingProposal = await prisma.proposal.findFirst({
      where: {
        id: proposalId,
        job: {
          clientId: user.Client.id
        }
      }
    });

    if (!existingProposal) {
      throw new Error("Proposal not found or access denied");
    }

    // Update the proposal status
    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: { status }
    });

    return updatedProposal;
  },

  deleteProposal: async (proposalId: string, userId: string): Promise<{ message: string }> => {
    // Verify user is a freelancer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Freelancer: true }
    });

    if (!user || user.role !== "FREELANCER" || !user.Freelancer) {
      throw new Error("Only freelancers can delete their proposals");
    }

    const existingProposal = await prisma.proposal.findFirst({
      where: {
        id: proposalId,
        freelancerId: user.Freelancer.id
      }
    });

    if (!existingProposal) {
      throw new Error("Proposal not found or access denied");
    }

    // Only allow deletion if proposal is still pending
    if (existingProposal.status !== ProposalStatus.PENDING) {
      throw new Error("Cannot delete proposal that has been processed");
    }

    await prisma.proposal.delete({
      where: { id: proposalId }
    });

    return { message: "Proposal deleted successfully" };
  },

  getProposalsByJobId: async (jobId: string, userId: string): Promise<ProposalWithDetails[]> => {
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
        clientId: user.Client.id
      }
    });

    if (!job) {
      throw new Error("Job not found or access denied");
    }

    const proposals = await prisma.proposal.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
      include: {
        freelancer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePicture: true
              }
            },
            skills: {
              include: {
                skill: true
              }
            }
          }
        },
        job: true
      }
    });

    return proposals;
  },

  getProposalsByFreelancerId: async (userId: string): Promise<ProposalWithDetails[]> => {
    // Verify user is a freelancer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Freelancer: true }
    });

    if (!user || user.role !== "FREELANCER" || !user.Freelancer) {
      throw new Error("Freelancer not found");
    }

    const proposals = await prisma.proposal.findMany({
      where: { freelancerId: user.Freelancer.id },
      orderBy: { createdAt: 'desc' },
      include: {
        freelancer: true,
        job: {
          include: {
            client: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePicture: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return proposals;
  }
};
