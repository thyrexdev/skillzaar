import type {
  ApiResponse,
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

const API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:5004';
// Admin service routes are mounted directly without /api prefix
const API_ENDPOINT = API_BASE_URL;

import { useAuthStore } from '@/stores/authStore';

const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const state = useAuthStore.getState();
    return state.token;
  }
  return null;
};

const buildQueryParams = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (key === 'dateRange' && typeof value === 'object' && value.start && value.end) {
        // Handle date ranges - backend expects startDate and endDate
        searchParams.append('startDate', value.start.toISOString());
        searchParams.append('endDate', value.end.toISOString());
      } else if (typeof value === 'object' && value.min && value.max) {
        // Handle ranges
        searchParams.append(`${key}Min`, value.min.toString());
        searchParams.append(`${key}Max`, value.max.toString());
      } else {
        searchParams.append(key, value.toString());
      }
    }
  });

  return searchParams.toString();
};

const request = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = getAuthToken();
  const url = `${API_ENDPOINT}${endpoint}`;
  
  console.log('🚀 API Request:', url); // Debug log
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    // Log response details
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📡 Raw response:', responseText.substring(0, 200));
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
    }
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error('❌ API Error:', error.message);
    throw error;
  }
};

// Dashboard APIs
export const getDashboardOverview = async (): Promise<DashboardOverview> => {
  const response = await request<DashboardOverview>('/dashboard');
  return response.data!;
};

// User Management APIs
export const getUserStats = async (): Promise<UserStats> => {
  const response = await request<UserStats>('/users/stats');
  return response.data!;
};

export const getUsers = async (
  filters: UserManagementFilters = {},
  page = 1,
  limit = 20
): Promise<PaginatedResponse<UserDetail>> => {
  const queryParams = buildQueryParams({ ...filters, page, limit });
  const response = await request<PaginatedResponse<UserDetail>>(
    `/users?${queryParams}`
  );
  return response.data!;
};

export const getUserDetails = async (userId: string): Promise<UserDetail> => {
  const response = await request<UserDetail>(`/users/${userId}`);
  return response.data!;
};

export const getUserActivity = async (userId?: string, limit = 50): Promise<UserActivity[]> => {
  const queryParams = buildQueryParams({ userId, limit });
  const response = await request<UserActivity[]>(`/users/activity?${queryParams}`);
  return response.data!;
};

export const performUserAction = async (action: AdminAction): Promise<any> => {
  const response = await request('/users/action', {
    method: 'POST',
    body: JSON.stringify(action),
  });
  return response.data;
};

export const suspendUser = async (userId: string, reason: string, duration?: number): Promise<any> => {
  const response = await request(`/users/${userId}/suspend`, {
    method: 'POST',
    body: JSON.stringify({ reason, duration }),
  });
  return response.data;
};

export const banUser = async (userId: string, reason: string): Promise<any> => {
  const response = await request(`/users/${userId}/ban`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return response.data;
};

export const verifyUser = async (userId: string, reason?: string): Promise<any> => {
  const response = await request(`/users/${userId}/verify`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason || 'Manual verification by admin' }),
  });
  return response.data;
};

export const getVerificationDocuments = async (
  status?: 'PENDING' | 'APPROVED' | 'REJECTED',
  page = 1,
  limit = 20
): Promise<PaginatedResponse<any>> => {
  const queryParams = buildQueryParams({ status, page, limit });
  const response = await request<PaginatedResponse<any>>(
    `/users/verification-documents?${queryParams}`
  );
  return response.data!;
};

export const handleVerificationDocument = async (action: VerificationDocumentAction): Promise<any> => {
  const response = await request('/users/verification-documents/action', {
    method: 'POST',
    body: JSON.stringify(action),
  });
  return response.data;
};

// Job Management APIs
export const getJobStats = async (): Promise<JobStats> => {
  const response = await request<JobStats>('/jobs/stats');
  return response.data!;
};

export const getJobs = async (
  filters: JobFilters = {},
  page = 1,
  limit = 20
): Promise<PaginatedResponse<any>> => {
  const queryParams = buildQueryParams({ ...filters, page, limit });
  const response = await request<PaginatedResponse<any>>(
    `/jobs?${queryParams}`
  );
  return response.data!;
};

export const getProposalStats = async (): Promise<ProposalStats> => {
  const response = await request<ProposalStats>('/jobs/proposals/stats');
  return response.data!;
};

// Financial Management APIs
export const getFinancialStats = async (): Promise<FinancialStats> => {
  const response = await request<FinancialStats>('/financial/stats');
  return response.data!;
};

export const getTransactions = async (
  filters: TransactionFilters = {},
  page = 1,
  limit = 20
): Promise<PaginatedResponse<Transaction>> => {
  const queryParams = buildQueryParams({ ...filters, page, limit });
  const response = await request<PaginatedResponse<Transaction>>(
    `/financial/transactions?${queryParams}`
  );
  return response.data!;
};

export const getWithdrawals = async (
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED',
  page = 1,
  limit = 20
): Promise<PaginatedResponse<WithdrawalRequest>> => {
  const queryParams = buildQueryParams({ status, page, limit });
  const response = await request<PaginatedResponse<WithdrawalRequest>>(
    `/financial/withdrawals?${queryParams}`
  );
  return response.data!;
};

export const approveWithdrawal = async (withdrawalId: string, notes?: string): Promise<any> => {
  const response = await request(`/financial/withdrawals/${withdrawalId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
  return response.data;
};

export const rejectWithdrawal = async (withdrawalId: string, reason: string): Promise<any> => {
  const response = await request(`/financial/withdrawals/${withdrawalId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return response.data;
};

export const getEscrowStats = async (): Promise<EscrowStats> => {
  const response = await request<EscrowStats>('/financial/escrow/stats');
  return response.data!;
};

export const getUserFinancialSummary = async (userId: string): Promise<any> => {
  const response = await request(`/financial/users/${userId}/summary`);
  return response.data;
};

export const updatePlatformFees = async (feePercentage: number): Promise<any> => {
  const response = await request('/financial/platform-fees', {
    method: 'PUT',
    body: JSON.stringify({ feePercentage }),
  });
  return response.data;
};

// Content Moderation APIs
export const getModerationStats = async (): Promise<ModerationStats> => {
  const response = await request<ModerationStats>('/moderation/stats');
  return response.data!;
};

export const getReportedContent = async (
  filters: ContentModerationFilters = {},
  page = 1,
  limit = 20
): Promise<PaginatedResponse<ReportedContent>> => {
  const queryParams = buildQueryParams({ ...filters, page, limit });
  const response = await request<PaginatedResponse<ReportedContent>>(
    `/moderation/reports?${queryParams}`
  );
  return response.data!;
};

export const moderateContent = async (action: ContentModerationAction): Promise<any> => {
  const response = await request('/moderation/action', {
    method: 'POST',
    body: JSON.stringify(action),
  });
  return response.data;
};

export const getFlaggedMessages = async (page = 1, limit = 20): Promise<PaginatedResponse<any>> => {
  const queryParams = buildQueryParams({ page, limit });
  const response = await request<PaginatedResponse<any>>(
    `/moderation/messages?${queryParams}`
  );
  return response.data!;
};

export const getFlaggedJobs = async (page = 1, limit = 20): Promise<PaginatedResponse<any>> => {
  const queryParams = buildQueryParams({ page, limit });
  const response = await request<PaginatedResponse<any>>(
    `/moderation/jobs?${queryParams}`
  );
  return response.data!;
};

export const getFlaggedFiles = async (page = 1, limit = 20): Promise<PaginatedResponse<any>> => {
  const queryParams = buildQueryParams({ page, limit });
  const response = await request<PaginatedResponse<any>>(
    `/moderation/files?${queryParams}`
  );
  return response.data!;
};

export const removeMessage = async (messageId: string, reason: string): Promise<any> => {
  const response = await request(`/moderation/messages/${messageId}/remove`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return response.data;
};

export const removeJob = async (jobId: string, reason: string): Promise<any> => {
  const response = await request(`/moderation/jobs/${jobId}/remove`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return response.data;
};

export const removeFile = async (fileId: string, reason: string): Promise<any> => {
  const response = await request(`/moderation/files/${fileId}/remove`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return response.data;
};

export const warnUser = async (userId: string, reason: string): Promise<any> => {
  const response = await request(`/moderation/users/${userId}/warn`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return response.data;
};

export const getContentAnalytics = async (dateRange?: { start: Date; end: Date }): Promise<any> => {
  const queryParams = dateRange ? buildQueryParams({ dateRange }) : '';
  const response = await request(`/moderation/analytics?${queryParams}`);
  return response.data;
};

export const getBulkModerationQueue = async (
  contentType: 'message' | 'job' | 'file',
  limit = 50
): Promise<any> => {
  const queryParams = buildQueryParams({ limit });
  const response = await request(
    `/moderation/bulk/${contentType}?${queryParams}`
  );
  return response.data;
};

// Analytics APIs
export const getPlatformMetrics = async (
  timeRange: 'daily' | 'monthly' | 'yearly' = 'monthly'
): Promise<PlatformMetrics> => {
  const response = await request<PlatformMetrics>(
    `/analytics/platform?timeRange=${timeRange}`
  );
  return response.data!;
};

export const getUserEngagementMetrics = async (dateRange?: { start: Date; end: Date }): Promise<any> => {
  const queryParams = dateRange ? buildQueryParams({ dateRange }) : '';
  const response = await request(`/analytics/engagement?${queryParams}`);
  return response.data;
};

export const getTopPerformers = async (limit = 10): Promise<any> => {
  const response = await request(`/analytics/top-performers?limit=${limit}`);
  return response.data;
};

export const getSystemHealthMetrics = async (): Promise<any> => {
  const response = await request('/analytics/system-health');
  return response.data;
};
