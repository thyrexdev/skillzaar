import { prisma } from '@vync/shared';
import {
  UserManagementFilters,
  UserStats,
  UserActivity,
  AdminActionType,
  VerificationDocumentActionType
} from '../interfaces/admin.interfaces';

export class UserManagementService {
  async getUserStats(): Promise<UserStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      usersByRole,
      verifiedUsers,
      newUsersThisMonth
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true }
      }),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.user.count({
        where: {
          createdAt: { gte: startOfMonth }
        }
      })
    ]);

    const roleStats = usersByRole.reduce((acc, curr) => {
      acc[curr.role.toLowerCase() as keyof typeof acc] = curr._count.id;
      return acc;
    }, { clients: 0, freelancers: 0, admins: 0 });

    return {
      totalUsers,
      activeUsers: totalUsers, // TODO: Implement active user logic based on last activity
      suspendedUsers: 0, // TODO: Implement suspension tracking
      bannedUsers: 0, // TODO: Implement ban tracking
      verifiedUsers,
      unverifiedUsers: totalUsers - verifiedUsers,
      newUsersThisMonth,
      usersByRole: roleStats
    };
  }

  async getUsers(filters: UserManagementFilters, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end
      };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          profilePicture: true,
          Client: {
            select: {
              fullName: true,
              companyName: true,
              location: true
            }
          },
          Freelancer: {
            select: {
              fullName: true,
              hourlyRate: true,
              experienceLevel: true,
              isAvailable: true
            }
          },
          verificationDocuments: {
            select: {
              status: true,
              docType: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    };
  }

  async getUserActivity(userId?: string, limit: number = 50): Promise<UserActivity[]> {
    const where = userId ? { id: userId } : {};

    const users = await prisma.user.findMany({
      where,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
        Client: {
          select: {
            jobs: {
              select: { id: true, budget: true }
            }
          }
        },
        Freelancer: {
          select: {
            proposals: {
              select: { id: true }
            },
            contracts: {
              select: {
                payments: {
                  select: { amount: true, status: true }
                }
              }
            }
          }
        },
        wallet: {
          select: {
            transactions: {
              select: { amount: true, type: true }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return users.map(user => {
      const totalSpent = user.Client?.jobs.reduce((sum, job) => sum + job.budget, 0) || 0;
      const totalEarnings = user.Freelancer?.contracts
        .flatMap(contract => contract.payments)
        .filter(payment => payment.status === 'COMPLETED')
        .reduce((sum, payment) => sum + payment.amount, 0) || 0;

      return {
        userId: user.id,
        userName: user.name,
        email: user.email,
        lastActivity: user.updatedAt,
        loginCount: 0, // TODO: Implement login tracking
        jobsPosted: user.Client?.jobs.length,
        proposalsSubmitted: user.Freelancer?.proposals.length,
        totalEarnings: totalEarnings / 100, // Convert from piasters to currency
        totalSpent
      };
    });
  }

  async performUserAction(action: AdminActionType, adminId: string) {
    const { userId, action: actionType, reason, duration } = action;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // TODO: Implement user status tracking in database schema
    // For now, we'll just log the action
    console.log(`Admin ${adminId} performed action ${actionType} on user ${userId}: ${reason}`);

    switch (actionType) {
      case 'suspend':
        // TODO: Implement user suspension
        break;
      case 'unsuspend':
        // TODO: Implement user unsuspension
        break;
      case 'ban':
        // TODO: Implement user banning
        break;
      case 'unban':
        // TODO: Implement user unbanning
        break;
      case 'verify':
        await prisma.user.update({
          where: { id: userId },
          data: { isVerified: true }
        });
        break;
      case 'unverify':
        await prisma.user.update({
          where: { id: userId },
          data: { isVerified: false }
        });
        break;
    }

    return { success: true, message: `User ${actionType} action completed successfully` };
  }

  async getVerificationDocuments(status?: 'PENDING' | 'APPROVED' | 'REJECTED', page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [documents, totalCount] = await Promise.all([
      prisma.verificationDocument.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { uploadedAt: 'desc' }
      }),
      prisma.verificationDocument.count({ where })
    ]);

    return {
      documents,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    };
  }

  async handleVerificationDocument(action: VerificationDocumentActionType, adminId: string) {
    const { documentId, action: actionType, reason } = action;

    const document = await prisma.verificationDocument.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      throw new Error('Verification document not found');
    }

    const status = actionType === 'approve' ? 'APPROVED' : 'REJECTED';

    await prisma.verificationDocument.update({
      where: { id: documentId },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: adminId,
        ...(reason && { metadata: { reason } })
      }
    });

    return { 
      success: true, 
      message: `Verification document ${actionType}d successfully` 
    };
  }

  async getUserDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Client: {
          include: {
            jobs: {
              select: {
                id: true,
                title: true,
                status: true,
                budget: true,
                createdAt: true,
                proposals: {
                  select: { id: true }
                }
              }
            },
            contracts: {
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
            }
          }
        },
        Freelancer: {
          include: {
            proposals: {
              select: {
                id: true,
                status: true,
                proposedRate: true,
                job: {
                  select: {
                    title: true,
                    budget: true
                  }
                }
              }
            },
            contracts: {
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
            skills: true,
            portfolioLinks: true
          }
        },
        verificationDocuments: true,
        wallet: {
          include: {
            transactions: {
              take: 10,
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}
