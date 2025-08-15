import { z } from 'zod';

// User Management Interfaces
export interface UserManagementFilters {
  role?: 'CLIENT' | 'FREELANCER';
  isVerified?: boolean;
  status?: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  bannedUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  newUsersThisMonth: number;
  usersByRole: {
    clients: number;
    freelancers: number;
    admins: number;
  };
}

export interface UserActivity {
  userId: string;
  userName: string;
  email: string;
  lastActivity: Date;
  loginCount: number;
  jobsPosted?: number;
  proposalsSubmitted?: number;
  totalEarnings?: number;
  totalSpent?: number;
}

// Job & Proposal Management Interfaces
export interface JobFilters {
  status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
  category?: string;
  budgetRange?: {
    min: number;
    max: number;
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
  reported?: boolean;
}

export interface JobStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  canceledJobs: number;
  reportedJobs: number;
  averageBudget: number;
  jobsByCategory: Record<string, number>;
  completionRate: number;
}

export interface ProposalStats {
  totalProposals: number;
  acceptedProposals: number;
  rejectedProposals: number;
  pendingProposals: number;
  averageProposalsPerJob: number;
  topFreelancers: Array<{
    id: string;
    name: string;
    acceptanceRate: number;
    totalProposals: number;
  }>;
}

// Content Moderation Interfaces
export interface ContentModerationFilters {
  type?: 'message' | 'job' | 'profile' | 'file';
  status?: 'pending' | 'approved' | 'rejected';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ReportedContent {
  id: string;
  type: 'message' | 'job' | 'profile' | 'file';
  contentId: string;
  reportedBy: string;
  reportedAt: Date;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  content: any;
  reviewedBy?: string;
  reviewedAt?: Date;
  action?: 'none' | 'warning' | 'content_removed' | 'user_suspended' | 'user_banned';
}

export interface ModerationStats {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  reportsByType: Record<string, number>;
  reportsBySeverity: Record<string, number>;
  averageResolutionTime: number;
  topReporters: Array<{
    userId: string;
    userName: string;
    reportCount: number;
  }>;
}

// Financial Oversight Interfaces
export interface TransactionFilters {
  type?: 'DEPOSIT' | 'WITHDRAWAL' | 'HOLD' | 'RELEASE' | 'ADJUSTMENT';
  status?: 'PENDING' | 'COMPLETED' | 'FAILED';
  amountRange?: {
    min: number;
    max: number;
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
  userId?: string;
}

export interface FinancialStats {
  totalRevenue: number;
  totalTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  platformFees: number;
  averageTransactionValue: number;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    transactions: number;
  }>;
}

export interface EscrowStats {
  totalEscrowAmount: number;
  activeEscrows: number;
  completedEscrows: number;
  disputedEscrows: number;
  averageEscrowDuration: number;
}

// Platform Analytics Interfaces
export interface PlatformMetrics {
  userGrowth: {
    daily: Array<{ date: string; newUsers: number; activeUsers: number }>;
    monthly: Array<{ month: string; newUsers: number; activeUsers: number }>;
    yearly: Array<{ year: string; newUsers: number; activeUsers: number }>;
  };
  jobMetrics: {
    completionRate: number;
    averageJobValue: number;
    popularCategories: Array<{ category: string; count: number; percentage: number }>;
    successfulHires: number;
  };
  revenueAnalytics: {
    totalRevenue: number;
    monthlyGrowth: number;
    revenueBySource: Record<string, number>;
    projectedRevenue: number;
  };
  performanceInsights: {
    averageResponseTime: number;
    systemUptime: number;
    errorRate: number;
    userSatisfaction: number;
  };
}

// Validation Schemas
export const userManagementFiltersSchema = z.object({
  role: z.enum(['CLIENT', 'FREELANCER']).optional(),
  isVerified: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']).optional(),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }).optional(),
  search: z.string().optional(),
});

export const jobFiltersSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELED']).optional(),
  category: z.string().optional(),
  budgetRange: z.object({
    min: z.number(),
    max: z.number(),
  }).optional(),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }).optional(),
  reported: z.boolean().optional(),
});

export const contentModerationFiltersSchema = z.object({
  type: z.enum(['message', 'job', 'profile', 'file']).optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }).optional(),
});

export const transactionFiltersSchema = z.object({
  type: z.enum(['DEPOSIT', 'WITHDRAWAL', 'HOLD', 'RELEASE', 'ADJUSTMENT']).optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED']).optional(),
  amountRange: z.object({
    min: z.number(),
    max: z.number(),
  }).optional(),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }).optional(),
  userId: z.string().optional(),
});

export const adminActionSchema = z.object({
  userId: z.string(),
  action: z.enum(['suspend', 'unsuspend', 'ban', 'unban', 'verify', 'unverify']),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  duration: z.number().optional(), // Duration in days for temporary actions
});

export const verificationDocumentActionSchema = z.object({
  documentId: z.string(),
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
});

export const contentModerationActionSchema = z.object({
  reportId: z.string(),
  action: z.enum(['approve', 'remove_content', 'warn_user', 'suspend_user', 'ban_user']),
  reason: z.string().min(10),
});

export type UserManagementFiltersType = z.infer<typeof userManagementFiltersSchema>;
export type JobFiltersType = z.infer<typeof jobFiltersSchema>;
export type ContentModerationFiltersType = z.infer<typeof contentModerationFiltersSchema>;
export type TransactionFiltersType = z.infer<typeof transactionFiltersSchema>;
export type AdminActionType = z.infer<typeof adminActionSchema>;
export type VerificationDocumentActionType = z.infer<typeof verificationDocumentActionSchema>;
export type ContentModerationActionType = z.infer<typeof contentModerationActionSchema>;
