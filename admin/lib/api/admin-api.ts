import { adminApi } from '@/lib/axios';
import type {
  PaginatedResponse,
  DashboardOverview,
  UserStats,
  UserDetail,
  UserManagementFilters,
  UserActivity,
  AdminAction,
  VerificationDocumentAction,
  JobStats,
  JobFilters,
  ProposalStats,
  FinancialStats,
  TransactionFilters,
  Transaction,
  WithdrawalRequest,
  EscrowStats,
  ModerationStats,
  ReportedContent,
  ContentModerationFilters,
  ContentModerationAction,
  PlatformMetrics,
} from '@/types/admin.types';

// Base response types that match backend
interface BaseApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Backend pagination structure matches the services
interface BackendPaginatedData<T> {
  users?: T[]; // For user endpoints
  jobs?: T[]; // For job endpoints  
  documents?: T[]; // For verification endpoints
  items?: T[]; // Generic items
  transactions?: T[]; // For financial endpoints
  reports?: T[]; // For moderation endpoints
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

// Helper to convert backend pagination to our format
const toPaginatedResponse = <T>(apiData: BackendPaginatedData<T>, page: number, limit: number): PaginatedResponse<T> => {
  // Determine which array property contains the data
  const data = apiData.users || apiData.jobs || apiData.documents || apiData.items || 
              apiData.transactions || apiData.reports || [];
  
  return {
    data: data as T[],
    pagination: {
      page: apiData.currentPage || page,
      limit,
      total: apiData.totalCount,
      totalPages: apiData.totalPages,
    },
  };
};

// Dashboard APIs
export const getDashboardOverview = async (): Promise<DashboardOverview> => {
  const response = await adminApi.get<DashboardOverview>('/dashboard');
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch dashboard overview');
  }
  return response.data!;
};

// User Management APIs
export const getUserStats = async (): Promise<UserStats> => {
  const response = await adminApi.get<UserStats>('/users/stats');
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch user stats');
  }
  return response.data!;
};

export const getUsers = async (
  filters: UserManagementFilters = {},
  page = 1,
  limit = 20
): Promise<PaginatedResponse<UserDetail>> => {
  const response = await adminApi.getPaginated<UserDetail>(
    '/users',
    page,
    limit,
    filters
  );
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch users');
  }
  return toPaginatedResponse(response.data!, page, limit);
};

export const getUserDetails = async (userId: string): Promise<UserDetail> => {
  const response = await adminApi.get<UserDetail>(`/users/${userId}`);
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch user details');
  }
  return response.data!;
};

export const getUserActivity = async (userId?: string, limit = 50): Promise<UserActivity[]> => {
  const response = await adminApi.getWithParams<UserActivity[]>('/users/activity', { userId, limit });
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch user activity');
  }
  return response.data!;
};

export const performUserAction = async (action: AdminAction): Promise<{ success: boolean; message: string }> => {
  const response = await adminApi.post<{ success: boolean; message: string }>('/users/action', action);
  if (!response.success) {
    throw new Error(response.error || 'Failed to perform user action');
  }
  return response.data!;
};

export const suspendUser = async (userId: string, reason: string, duration?: number): Promise<{ success: boolean; message: string }> => {
  const response = await adminApi.post<{ success: boolean; message: string }>(`/users/${userId}/suspend`, { reason, duration });
  if (!response.success) {
    throw new Error(response.error || 'Failed to suspend user');
  }
  return response.data!;
};

export const banUser = async (userId: string, reason: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApi.post<{ success: boolean; message: string }>(`/users/${userId}/ban`, { reason });
  if (!response.success) {
    throw new Error(response.error || 'Failed to ban user');
  }
  return response.data!;
};

export const verifyUser = async (userId: string, reason?: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApi.post<{ success: boolean; message: string }>(`/users/${userId}/verify`, { 
    reason: reason || 'Manual verification by admin' 
  });
  if (!response.success) {
    throw new Error(response.error || 'Failed to verify user');
  }
  return response.data!;
};

// Legacy verification document APIs (Note: Use verification-api.ts for new verification queue)
export const getVerificationDocuments = async (
  status?: 'PENDING' | 'APPROVED' | 'REJECTED',
  page = 1,
  limit = 20
): Promise<PaginatedResponse<VerificationDocumentAction>> => {
  const response = await adminApi.getPaginated<VerificationDocumentAction>(
    '/users/verification/documents',
    page,
    limit,
    { status }
  );
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch verification documents');
  }
  return toPaginatedResponse(response.data!, page, limit);
};

export const handleVerificationDocument = async (action: VerificationDocumentAction): Promise<{ success: boolean; message: string }> => {
  const response = await adminApi.post<{ success: boolean; message: string }>('/users/verification/handle', action);
  if (!response.success) {
    throw new Error(response.error || 'Failed to handle verification document');
  }
  return response.data!;
};

// Job Management APIs
export const getJobStats = async (): Promise<JobStats> => {
  const response = await adminApi.get<JobStats>('/jobs/stats');
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch job stats');
  }
  return response.data!;
};

export const getJobs = async (
  filters: JobFilters = {},
  page = 1,
  limit = 20
): Promise<PaginatedResponse<{ id: string; title: string; status: string }>> => {
  const response = await adminApi.getPaginated<{ id: string; title: string; status: string }>('/jobs', page, limit, filters);
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch jobs');
  }
  return toPaginatedResponse(response.data!, page, limit);
};

export const getProposalStats = async (): Promise<ProposalStats> => {
  const response = await adminApi.get<ProposalStats>('/jobs/proposals/stats');
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch proposal stats');
  }
  return response.data!;
};

// Financial Management APIs
export const getFinancialStats = async (): Promise<FinancialStats> => {
  const response = await adminApi.get<FinancialStats>('/financial/stats');
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch financial stats');
  }
  return response.data!;
};

export const getTransactions = async (
  filters: TransactionFilters = {},
  page = 1,
  limit = 20
): Promise<PaginatedResponse<Transaction>> => {
  const response = await adminApi.getPaginated<Transaction>('/financial/transactions', page, limit, filters);
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch transactions');
  }
  return toPaginatedResponse(response.data!, page, limit);
};

export const getWithdrawals = async (
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED',
  page = 1,
  limit = 20
): Promise<PaginatedResponse<WithdrawalRequest>> => {
  const response = await adminApi.getPaginated<WithdrawalRequest>('/financial/withdrawals', page, limit, { status });
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch withdrawals');
  }
  return toPaginatedResponse(response.data!, page, limit);
};

export const approveWithdrawal = async (withdrawalId: string, notes?: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApi.post<{ success: boolean; message: string }>(`/financial/withdrawals/${withdrawalId}/approve`, { notes });
  if (!response.success) {
    throw new Error(response.error || 'Failed to approve withdrawal');
  }
  return response.data!;
};

export const rejectWithdrawal = async (withdrawalId: string, reason: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApi.post<{ success: boolean; message: string }>(`/financial/withdrawals/${withdrawalId}/reject`, { reason });
  if (!response.success) {
    throw new Error(response.error || 'Failed to reject withdrawal');
  }
  return response.data!;
};

export const getEscrowStats = async (): Promise<EscrowStats> => {
  const response = await adminApi.get<EscrowStats>('/financial/escrow/stats');
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch escrow stats');
  }
  return response.data!;
};

export const getUserFinancialSummary = async (userId: string): Promise<{
  totalEarnings: number;
  totalSpent: number;
  pendingAmount: number;
}> => {
  const response = await adminApi.get<{
    totalEarnings: number;
    totalSpent: number;
    pendingAmount: number;
  }>(`/financial/users/${userId}/summary`);
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch user financial summary');
  }
  return response.data!;
};

export const updatePlatformFees = async (feePercentage: number): Promise<{ success: boolean; message: string }> => {
  const response = await adminApi.put<{ success: boolean; message: string }>('/financial/platform-fees', { feePercentage });
  if (!response.success) {
    throw new Error(response.error || 'Failed to update platform fees');
  }
  return response.data!;
};

// Content Moderation APIs
export const getModerationStats = async (): Promise<ModerationStats> => {
  const response = await adminApi.get<ModerationStats>('/moderation/stats');
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch moderation stats');
  }
  return response.data!;
};

export const getReportedContent = async (
  filters: ContentModerationFilters = {},
  page = 1,
  limit = 20
): Promise<PaginatedResponse<ReportedContent>> => {
  const response = await adminApi.getPaginated<ReportedContent>('/moderation/reports', page, limit, filters);
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch reported content');
  }
  return toPaginatedResponse(response.data!, page, limit);
};

export const moderateContent = async (action: ContentModerationAction): Promise<{ success: boolean; message: string }> => {
  const response = await adminApi.post<{ success: boolean; message: string }>('/moderation/action', action);
  if (!response.success) {
    throw new Error(response.error || 'Failed to moderate content');
  }
  return response.data!;
};

export const getFlaggedMessages = async (page = 1, limit = 20): Promise<PaginatedResponse<{ id: string; content: string }>> => {
  const response = await adminApi.getPaginated<{ id: string; content: string }>('/moderation/messages', page, limit);
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch flagged messages');
  }
  return toPaginatedResponse(response.data!, page, limit);
};

export const getFlaggedJobs = async (page = 1, limit = 20): Promise<PaginatedResponse<{ id: string; title: string }>> => {
  const response = await adminApi.getPaginated<{ id: string; title: string }>('/moderation/jobs', page, limit);
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch flagged jobs');
  }
  return toPaginatedResponse(response.data!, page, limit);
};

export const getFlaggedFiles = async (page = 1, limit = 20): Promise<PaginatedResponse<{ id: string; filename: string }>> => {
  const response = await adminApi.getPaginated<{ id: string; filename: string }>('/moderation/files', page, limit);
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch flagged files');
  }
  return toPaginatedResponse(response.data!, page, limit);
};

export const removeMessage = async (messageId: string, reason: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApi.post<{ success: boolean; message: string }>(`/moderation/messages/${messageId}/remove`, { reason });
  if (!response.success) {
    throw new Error(response.error || 'Failed to remove message');
  }
  return response.data!;
};

export const removeJob = async (jobId: string, reason: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApi.post<{ success: boolean; message: string }>(`/moderation/jobs/${jobId}/remove`, { reason });
  if (!response.success) {
    throw new Error(response.error || 'Failed to remove job');
  }
  return response.data!;
};

export const removeFile = async (fileId: string, reason: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApi.post<{ success: boolean; message: string }>(`/moderation/files/${fileId}/remove`, { reason });
  if (!response.success) {
    throw new Error(response.error || 'Failed to remove file');
  }
  return response.data!;
};

export const warnUser = async (userId: string, reason: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApi.post<{ success: boolean; message: string }>(`/moderation/users/${userId}/warn`, { reason });
  if (!response.success) {
    throw new Error(response.error || 'Failed to warn user');
  }
  return response.data!;
};

export const getContentAnalytics = async (dateRange?: { start: Date; end: Date }): Promise<{
  totalContent: number;
  flaggedContent: number;
  approvedContent: number;
  rejectedContent: number;
}> => {
  const response = await adminApi.getWithParams<{
    totalContent: number;
    flaggedContent: number;
    approvedContent: number;
    rejectedContent: number;
  }>('/moderation/analytics', { dateRange });
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch content analytics');
  }
  return response.data!;
};

export const getBulkModerationQueue = async (
  contentType: 'message' | 'job' | 'file',
  limit = 50
): Promise<{
  items: Array<{ id: string; content?: string; title?: string; filename?: string }>;
  total: number;
}> => {
  const response = await adminApi.getWithParams<{
    items: Array<{ id: string; content?: string; title?: string; filename?: string }>;
    total: number;
  }>(`/moderation/bulk/${contentType}`, { limit });
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch bulk moderation queue');
  }
  return response.data!;
};

// Analytics APIs
export const getPlatformMetrics = async (
  timeRange: 'daily' | 'monthly' | 'yearly' = 'monthly'
): Promise<PlatformMetrics> => {
  const response = await adminApi.getWithParams<PlatformMetrics>('/analytics/platform', { timeRange });
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch platform metrics');
  }
  return response.data!;
};

export const getUserEngagementMetrics = async (dateRange?: { start: Date; end: Date }): Promise<{
  activeUsers: number;
  sessionDuration: number;
}> => {
  const response = await adminApi.getWithParams<{
    activeUsers: number;
    sessionDuration: number;
  }>('/analytics/engagement', { dateRange });
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch user engagement metrics');
  }
  return response.data!;
};

export const getTopPerformers = async (limit = 10): Promise<{
  users: Array<{
    id: string;
    name: string;
    score: number;
  }>;
}> => {
  const response = await adminApi.getWithParams<{
    users: Array<{
      id: string;
      name: string;
      score: number;
    }>;
  }>('/analytics/top-performers', { limit });
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch top performers');
  }
  return response.data!;
};

export const getSystemHealthMetrics = async (): Promise<{
  uptime: number;
  responseTime: number;
  errorRate: number;
}> => {
  const response = await adminApi.get<{
    uptime: number;
    responseTime: number;
    errorRate: number;
  }>('/analytics/system-health');
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch system health metrics');
  }
  return response.data!;
};

// Additional Job Management APIs
export const getJobDetails = async (jobId: string): Promise<any> => {
  const response = await adminApi.get<any>(`/jobs/${jobId}`);
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch job details');
  }
  return response.data!;
};

export const updateJobStatus = async (
  jobId: string, 
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED',
  reason?: string
): Promise<{ success: boolean; message: string }> => {
  const response = await adminApi.put<{ success: boolean; message: string }>(
    `/jobs/${jobId}/status`, 
    { status, reason }
  );
  if (!response.success) {
    throw new Error(response.error || 'Failed to update job status');
  }
  return response.data!;
};

export const getJobCategories = async (): Promise<Array<{ name: string; count: number }>> => {
  const response = await adminApi.get<Array<{ name: string; count: number }>>('/jobs/categories');
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch job categories');
  }
  return response.data!;
};

export const updateJobCategory = async (
  oldCategory: string, 
  newCategory: string
): Promise<{ success: boolean; message: string }> => {
  const response = await adminApi.put<{ success: boolean; message: string }>(
    '/jobs/categories', 
    { oldCategory, newCategory }
  );
  if (!response.success) {
    throw new Error(response.error || 'Failed to update job category');
  }
  return response.data!;
};

export const getProposals = async (
  jobId?: string,
  freelancerId?: string,
  page = 1,
  limit = 20
): Promise<PaginatedResponse<any>> => {
  const response = await adminApi.getPaginated<any>(
    '/jobs/proposals', 
    page, 
    limit, 
    { jobId, freelancerId }
  );
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch proposals');
  }
  return toPaginatedResponse(response.data!, page, limit);
};

// Enhanced User Management APIs
export const getExtendedUserDetails = async (userId: string): Promise<any> => {
  const response = await adminApi.get<any>(`/users/${userId}`);
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch extended user details');
  }
  return response.data!;
};

export const updateUserProfile = async (
  userId: string, 
  updates: Record<string, any>
): Promise<{ success: boolean; message: string }> => {
  const response = await adminApi.put<{ success: boolean; message: string }>(
    `/users/${userId}`, 
    updates
  );
  if (!response.success) {
    throw new Error(response.error || 'Failed to update user profile');
  }
  return response.data!;
};

export const getUserTransactionHistory = async (
  userId: string,
  page = 1,
  limit = 20
): Promise<PaginatedResponse<Transaction>> => {
  const response = await adminApi.getPaginated<Transaction>(
    `/financial/users/${userId}/transactions`,
    page,
    limit
  );
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch user transactions');
  }
  return toPaginatedResponse(response.data!, page, limit);
};

// System Administration APIs
export const getSystemConfiguration = async (): Promise<any> => {
  const response = await adminApi.get<any>('/system/config');
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch system configuration');
  }
  return response.data!;
};

export const updateSystemConfiguration = async (
  config: Record<string, any>
): Promise<{ success: boolean; message: string }> => {
  const response = await adminApi.put<{ success: boolean; message: string }>(
    '/system/config',
    config
  );
  if (!response.success) {
    throw new Error(response.error || 'Failed to update system configuration');
  }
  return response.data!;
};

// Audit Log APIs
export const getAuditLogs = async (
  filters: {
    userId?: string;
    action?: string;
    dateRange?: { start: Date; end: Date };
  } = {},
  page = 1,
  limit = 20
): Promise<PaginatedResponse<any>> => {
  const response = await adminApi.getPaginated<any>(
    '/audit/logs',
    page,
    limit,
    filters
  );
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch audit logs');
  }
  return toPaginatedResponse(response.data!, page, limit);
};

// Real-time notifications
export const getNotifications = async (
  page = 1,
  limit = 20
): Promise<PaginatedResponse<any>> => {
  const response = await adminApi.getPaginated<any>(
    '/notifications',
    page,
    limit
  );
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch notifications');
  }
  return toPaginatedResponse(response.data!, page, limit);
};

export const markNotificationAsRead = async (
  notificationId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await adminApi.put<{ success: boolean; message: string }>(
    `/notifications/${notificationId}/read`
  );
  if (!response.success) {
    throw new Error(response.error || 'Failed to mark notification as read');
  }
  return response.data!;
};

// Export/Import functionality
export const exportData = async (
  dataType: 'users' | 'jobs' | 'transactions' | 'reports',
  filters: Record<string, any> = {},
  format: 'csv' | 'excel' | 'json' = 'csv'
): Promise<Blob> => {
  // Use direct axios call for file download
  const response = await adminApi.downloadFile(
    `/export/${dataType}?${new URLSearchParams({ ...filters, format }).toString()}`,
    `${dataType}-export.${format}`
  );
  return new Blob(); // downloadFile handles the download directly
};

export const importData = async (
  dataType: 'users' | 'jobs',
  file: File,
  options: Record<string, any> = {}
): Promise<{ success: boolean; message: string; imported: number; errors: any[] }> => {
  const response = await adminApi.uploadFile<{
    success: boolean;
    message: string;
    imported: number;
    errors: any[];
  }>(`/import/${dataType}`, file, options);
  if (!response.success) {
    throw new Error(response.error || 'Failed to import data');
  }
  return response.data!;
};
