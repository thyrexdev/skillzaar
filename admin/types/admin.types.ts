/* eslint-disable @typescript-eslint/no-explicit-any */
// User Management Types
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

// Job Management Types
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

// Financial Management Types
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

export interface EscrowStats {
  totalEscrowAmount: number;
  activeEscrows: number;
  completedEscrows: number;
  disputedEscrows: number;
  averageEscrowDuration: number;
}

// Verification Queue Interfaces
export interface VerificationDocument {
  id: string;
  docType: 'FRONT' | 'BACK' | 'SELFIE';
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  rejectionReason?: string;
  adminNotes?: string;
}

export interface VerificationQueueItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: 'CLIENT' | 'FREELANCER';
  documents: VerificationDocument[];
  submittedAt: Date;
  lastUpdated: Date;
  overallStatus: 'PENDING' | 'INCOMPLETE' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
}

export interface VerificationStats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  averageReviewTime: number;
  completionRate: number;
  docTypeBreakdown: {
    front: { pending: number; approved: number; rejected: number };
    back: { pending: number; approved: number; rejected: number };
    selfie: { pending: number; approved: number; rejected: number };
  };
  recentActivity: Array<{
    date: string;
    approved: number;
    rejected: number;
    submitted: number;
  }>;
}

export interface VerificationFilters {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  docType?: 'FRONT' | 'BACK' | 'SELFIE';
  userRole?: 'CLIENT' | 'FREELANCER';
  search?: string;
  dateRange?: [Date, Date] | null;
}

export interface DocumentPreview {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  docType: 'FRONT' | 'BACK' | 'SELFIE';
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  rejectionReason?: string;
  adminNotes?: string;
  downloadUrl: string;
}

export interface VerificationAction {
  documentId?: string;
  documentIds?: string[];
  action: 'approve' | 'reject';
  rejectionReason?: string;
  adminNotes?: string;
}

// Content Moderation Types
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

export interface ContentModerationFilters {
  type?: 'message' | 'job' | 'profile' | 'file';
  status?: 'pending' | 'approved' | 'rejected';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Analytics Types
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

// Dashboard Types
export interface DashboardOverview {
  overview: {
    totalUsers: number;
    activeJobs: number;
    totalRevenue: number;
    systemUptime: number;
  };
  userStats: UserStats;
  jobStats: JobStats;
  financialStats: FinancialStats;
  systemHealth: {
    systemStatus: {
      uptime: number;
    };
  };
}

// Action Types
export interface AdminAction {
  userId: string;
  action: 'suspend' | 'unsuspend' | 'ban' | 'unban' | 'verify' | 'unverify';
  reason: string;
  duration?: number;
}

export interface ContentModerationAction {
  reportId: string;
  action: 'approve' | 'remove_content' | 'warn_user' | 'suspend_user' | 'ban_user';
  reason: string;
}

export interface VerificationDocumentAction {
  documentId: string;
  action: 'approve' | 'reject';
  reason?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// User Detail Types
export interface UserDetail {
  id: string;
  email: string;
  name: string
  role: 'CLIENT' | 'FREELANCER' | 'ADMIN';
  isVerified: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  createdAt: Date;
  lastActivity?: Date;
  profile?: {
    avatar?: string;
    bio?: string;
    location?: string;
    skills?: string[];
  };
  statistics?: {
    jobsPosted?: number;
    jobsCompleted?: number;
    totalSpent?: number;
    totalEarnings?: number;
    rating?: number;
    reviewCount?: number;
  };
}

// Transaction Types
export interface Transaction {
  id: string;
  userId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'HOLD' | 'RELEASE' | 'ADJUSTMENT';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amount: number;
  currency: string;
  description: string;
  createdAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: string;
  reason?: string;
  bankDetails: {
    accountNumber: string;
    bankName: string;
    accountHolderName: string;
  };
}
