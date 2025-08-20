import { prisma } from '@vync/shared';
import { TransactionFilters, FinancialStats, EscrowStats } from '../interfaces/admin.interfaces';

export class FinancialOversightService {
  async getFinancialStats(): Promise<FinancialStats> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const months = [];
    
    // Get last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, now.getMonth() - i, 1);
      months.push({
        start: date,
        end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      });
    }

    const [
      totalTransactions,
      transactionsByStatus,
      totalWithdrawals,
      withdrawalsByStatus,
      revenueByMonth
    ] = await Promise.all([
      prisma.walletTransaction.count(),
      prisma.walletTransaction.groupBy({
        by: ['type'],
        _count: { id: true },
        _sum: { amount: true }
      }),
      prisma.withdrawal.count(),
      prisma.withdrawal.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { amount: true }
      }),
      Promise.all(months.map(async (month) => {
        const transactions = await prisma.walletTransaction.aggregate({
          where: {
            createdAt: {
              gte: month.start,
              lte: month.end
            }
          },
          _count: { id: true },
          _sum: { amount: true }
        });

        return {
          month: month.label,
          revenue: (transactions._sum.amount || 0) / 100, // Convert from piasters
          transactions: transactions._count.id || 0
        };
      }))
    ]);

    const statusStats = transactionsByStatus.reduce((acc, curr) => {
      acc[curr.type] = {
        count: curr._count.id,
        amount: (curr._sum.amount || 0) / 100
      };
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    const withdrawalStats = withdrawalsByStatus.reduce((acc, curr) => {
      acc[curr.status] = {
        count: curr._count.id,
        amount: curr._sum.amount || 0
      };
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    const totalRevenue = Object.values(statusStats)
      .reduce((sum, stat) => sum + stat.amount, 0);

    const averageTransactionValue = totalTransactions > 0 
      ? totalRevenue / totalTransactions 
      : 0;

    // Platform fees (assuming 5% platform fee)
    const platformFees = totalRevenue * 0.05;

    return {
      totalRevenue,
      totalTransactions,
      pendingTransactions: statusStats.HOLD?.count || 0,
      failedTransactions: 0, // TODO: Add failed transaction tracking
      totalWithdrawals,
      pendingWithdrawals: withdrawalStats.PENDING?.count || 0,
      platformFees,
      averageTransactionValue,
      revenueByMonth
    };
  }

  async getTransactions(filters: TransactionFilters, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.amountRange) {
      where.amount = {
        gte: filters.amountRange.min * 100, // Convert to piasters
        lte: filters.amountRange.max * 100
      };
    }

    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end
      };
    }

    if (filters.userId) {
      where.wallet = {
        userId: filters.userId
      };
    }

    const [transactions, totalCount] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        skip,
        take: limit,
        include: {
          wallet: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.walletTransaction.count({ where })
    ]);

    return {
      transactions: transactions.map(tx => ({
        ...tx,
        amount: tx.amount / 100 // Convert from piasters
      })),
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    };
  }

  async getWithdrawals(status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED', page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [withdrawals, totalCount] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        skip,
        take: limit,
        include: {
          freelancer: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  isVerified: true
                }
              }
            }
          }
        },
        orderBy: { requestedAt: 'desc' }
      }),
      prisma.withdrawal.count({ where })
    ]);

    return {
      withdrawals,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    };
  }

  async approveWithdrawal(withdrawalId: string, adminId: string, notes?: string) {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: {
        freelancer: {
          include: {
            user: {
              include: {
                wallet: true
              }
            }
          }
        }
      }
    });

    if (!withdrawal) {
      throw new Error('Withdrawal not found');
    }

    if (withdrawal.status !== 'PENDING') {
      throw new Error('Withdrawal is not in pending status');
    }

    // Check if freelancer has sufficient balance
    const walletBalance = withdrawal.freelancer.user.wallet?.balance || 0;
    const withdrawalAmountInPiasters = withdrawal.amount * 100;

    if (walletBalance < withdrawalAmountInPiasters) {
      throw new Error('Insufficient balance for withdrawal');
    }

    await prisma.$transaction(async (tx) => {
      // Update withdrawal status
      await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'APPROVED',
          processedAt: new Date(),
          notes
        }
      });

      // Deduct amount from wallet
      await tx.wallet.update({
        where: { userId: withdrawal.freelancer.userId },
        data: {
          balance: {
            decrement: withdrawalAmountInPiasters
          }
        }
      });

      // Add withdrawal transaction
      await tx.walletTransaction.create({
        data: {
          walletId: withdrawal.freelancer.user.wallet!.id,
          amount: -withdrawalAmountInPiasters,
          type: 'WITHDRAWAL',
          relatedId: withdrawalId,
          metadata: { approvedBy: adminId, notes }
        }
      });
    });

    console.log(`Admin ${adminId} approved withdrawal ${withdrawalId} for ${withdrawal.amount}`);

    return { success: true, message: 'Withdrawal approved successfully' };
  }

  async rejectWithdrawal(withdrawalId: string, adminId: string, reason: string) {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId }
    });

    if (!withdrawal) {
      throw new Error('Withdrawal not found');
    }

    if (withdrawal.status !== 'PENDING') {
      throw new Error('Withdrawal is not in pending status');
    }

    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: 'REJECTED',
        processedAt: new Date(),
        notes: reason
      }
    });

    console.log(`Admin ${adminId} rejected withdrawal ${withdrawalId}: ${reason}`);

    return { success: true, message: 'Withdrawal rejected successfully' };
  }

  async getEscrowStats(): Promise<EscrowStats> {
    const [
      escrowTransactions,
      contractStats
    ] = await Promise.all([
      prisma.walletTransaction.aggregate({
        where: { type: 'HOLD' },
        _sum: { amount: true },
        _count: { id: true }
      }),
      prisma.contract.groupBy({
        by: ['status'],
        _count: { id: true }
      })
    ]);

    const contractStatusStats = contractStats.reduce((acc, curr) => {
      acc[curr.status.toLowerCase()] = curr._count.id;
      return acc;
    }, {
      active: 0,
      completed: 0,
      disputed: 0 // TODO: Add dispute tracking
    } as Record<string, number>);

    // Calculate average escrow duration
    const completedContracts = await prisma.contract.findMany({
      where: { status: 'COMPLETED' },
      select: {
        startDate: true,
        endDate: true
      }
    });

    const averageDuration = completedContracts.length > 0
      ? completedContracts.reduce((sum, contract) => {
          const duration = contract.endDate 
            ? (contract.endDate.getTime() - contract.startDate.getTime()) / (1000 * 60 * 60 * 24)
            : 0;
          return sum + duration;
        }, 0) / completedContracts.length
      : 0;

    return {
      totalEscrowAmount: (escrowTransactions._sum.amount || 0) / 100,
      activeEscrows: escrowTransactions._count.id,
      completedEscrows: contractStatusStats.completed,
      disputedEscrows: contractStatusStats.disputed,
      averageEscrowDuration: Math.round(averageDuration)
    };
  }

  async getUserFinancialSummary(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: {
          include: {
            transactions: {
              take: 20,
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        Freelancer: {
          include: {
            withdrawals: {
              take: 10,
              orderBy: { requestedAt: 'desc' }
            },
            contracts: {
              include: {
                payments: true
              }
            }
          }
        },
        Client: {
          include: {
            contracts: {
              include: {
                payments: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const totalEarnings = user.Freelancer?.contracts
      .flatMap(c => c.payments)
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0) || 0;

    const totalSpent = user.Client?.contracts
      .flatMap(c => c.payments)
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0) || 0;

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      wallet: {
        balance: (user.wallet?.balance || 0) / 100,
        transactions: user.wallet?.transactions.map(tx => ({
          ...tx,
          amount: tx.amount / 100
        })) || []
      },
      totalEarnings: totalEarnings / 100,
      totalSpent: totalSpent / 100,
      withdrawals: user.Freelancer?.withdrawals || [],
      pendingPayments: user.Freelancer?.contracts
        .flatMap(c => c.payments)
        .filter(p => p.status === 'PENDING') || []
    };
  }

  async updatePlatformFees(newFeePercentage: number, adminId: string) {
    // TODO: Implement platform fee configuration storage
    console.log(`Admin ${adminId} updated platform fees to ${newFeePercentage}%`);
    
    return { 
      success: true, 
      message: `Platform fees updated to ${newFeePercentage}%` 
    };
  }
}
