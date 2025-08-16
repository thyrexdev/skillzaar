/**
 * Complete Admin Client Library
 * 
 * This module provides a comprehensive client library for admin operations,
 * including hooks, utilities, and type-safe API interactions.
 */

import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import type {
  UserDetail,
  UserStats,
  UserManagementFilters,
  PaginatedResponse,
  DashboardOverview,
  JobStats,
  FinancialStats,
  ModerationStats,
  PlatformMetrics,
  Transaction,
  VerificationQueueItem,
  ReportedContent
} from '@/types/admin.types';

import {
  // User Management
  getUsers,
  getUserStats,
  getUserDetails,
  performUserAction,
  suspendUser,
  banUser,
  verifyUser,
  updateUserProfile,
  
  // Dashboard
  getDashboardOverview,
  
  // Jobs & Proposals
  getJobStats,
  getJobs,
  getProposalStats,
  
  // Financial
  getFinancialStats,
  getTransactions,
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  
  // Moderation
  getModerationStats,
  getReportedContent,
  moderateContent,
  
  // Analytics
  getPlatformMetrics,
  getSystemHealthMetrics,
  
  // Export/Import
  exportData,
  importData,
  
  // System
  getSystemConfiguration,
  updateSystemConfiguration
} from '@/lib/api/admin-api';

// Admin Client Class
export class AdminClient {
  private static instance: AdminClient;

  static getInstance(): AdminClient {
    if (!AdminClient.instance) {
      AdminClient.instance = new AdminClient();
    }
    return AdminClient.instance;
  }

  // User Management Methods
  async getUsersWithFilters(filters: UserManagementFilters, page = 1, limit = 20) {
    try {
      const result = await getUsers(filters, page, limit);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch users' };
    }
  }

  async getUserStatsSafe() {
    try {
      const stats = await getUserStats();
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch user stats' };
    }
  }

  async performUserActionSafe(userId: string, action: string, reason: string, duration?: number) {
    try {
      let result;
      switch (action) {
        case 'suspend':
          result = await suspendUser(userId, reason, duration);
          break;
        case 'ban':
          result = await banUser(userId, reason);
          break;
        case 'verify':
          result = await verifyUser(userId, reason);
          break;
        default:
          result = await performUserAction({
            userId,
            action: action as any,
            reason,
            duration
          });
      }
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : `Failed to ${action} user` };
    }
  }

  // Dashboard Methods
  async getDashboardData() {
    try {
      const overview = await getDashboardOverview();
      return { success: true, data: overview };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch dashboard data' };
    }
  }

  // Export Methods
  async exportDataSafe(dataType: 'users' | 'jobs' | 'transactions' | 'reports', filters = {}, format: 'csv' | 'excel' | 'json' = 'csv') {
    try {
      const blob = await exportData(dataType, filters, format);
      return { success: true, data: blob };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to export data' };
    }
  }

  // Batch Operations
  async batchUserAction(userIds: string[], action: string, reason: string) {
    const results = [];
    for (const userId of userIds) {
      const result = await this.performUserActionSafe(userId, action, reason);
      results.push({ userId, ...result });
    }
    return results;
  }

  // Search and Filter Utilities
  buildUserFilters(searchTerm?: string, role?: string, status?: string, dateRange?: [Date, Date]) {
    const filters: UserManagementFilters = {};
    
    if (searchTerm) {
      filters.search = searchTerm;
    }
    
    if (role && role !== 'all') {
      filters.role = role as 'CLIENT' | 'FREELANCER';
    }
    
    if (status && status !== 'all') {
      filters.status = status as 'ACTIVE' | 'SUSPENDED' | 'BANNED';
    }
    
    if (dateRange && dateRange[0] && dateRange[1]) {
      filters.dateRange = {
        start: dateRange[0],
        end: dateRange[1]
      };
    }
    
    return filters;
  }

  // Validation Utilities
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validateUserData(userData: Partial<UserDetail>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (userData.email && !this.validateEmail(userData.email)) {
      errors.push('Invalid email format');
    }
    
    if (userData.firstName && userData.firstName.length < 2) {
      errors.push('First name must be at least 2 characters');
    }
    
    if (userData.lastName && userData.lastName.length < 2) {
      errors.push('Last name must be at least 2 characters');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // Analytics Utilities
  calculateUserGrowth(stats: UserStats) {
    const growthRate = stats.totalUsers > 0 
      ? (stats.newUsersThisMonth / stats.totalUsers) * 100 
      : 0;
    
    return {
      growthRate: Number(growthRate.toFixed(2)),
      verificationRate: stats.totalUsers > 0 
        ? Number(((stats.verifiedUsers / stats.totalUsers) * 100).toFixed(2))
        : 0,
      activeRate: stats.totalUsers > 0 
        ? Number(((stats.activeUsers / stats.totalUsers) * 100).toFixed(2))
        : 0
    };
  }
}

// Custom Hooks for Admin Operations

/**
 * Hook for user management operations
 */
export const useUserManagement = (initialFilters: UserManagementFilters = {}) => {
  const [users, setUsers] = useState<PaginatedResponse<UserDetail> | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);

  const adminClient = AdminClient.getInstance();

  const fetchUsers = useCallback(async (newFilters = filters, page = 1, limit = 20) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await adminClient.getUsersWithFilters(newFilters, page, limit);
      if (result.success) {
        setUsers(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchUserStats = useCallback(async () => {
    try {
      const result = await adminClient.getUserStatsSafe();
      if (result.success) {
        setUserStats(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user stats');
    }
  }, []);

  const performAction = useCallback(async (userId: string, action: string, reason: string, duration?: number) => {
    try {
      const result = await adminClient.performUserActionSafe(userId, action, reason, duration);
      if (result.success) {
        message.success(result.data.message);
        await fetchUsers(); // Refresh the list
        return true;
      } else {
        message.error(result.error);
        return false;
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Action failed');
      return false;
    }
  }, [fetchUsers]);

  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, []);

  return {
    users,
    userStats,
    loading,
    error,
    filters,
    setFilters,
    fetchUsers,
    fetchUserStats,
    performAction,
    calculateGrowth: userStats ? adminClient.calculateUserGrowth(userStats) : null
  };
};

/**
 * Hook for dashboard operations
 */
export const useDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const adminClient = AdminClient.getInstance();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await adminClient.getDashboardData();
      if (result.success) {
        setDashboardData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    dashboardData,
    loading,
    error,
    refresh: fetchDashboard
  };
};

/**
 * Hook for data export operations
 */
export const useDataExport = () => {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const adminClient = AdminClient.getInstance();

  const exportData = useCallback(async (
    dataType: 'users' | 'jobs' | 'transactions' | 'reports',
    filters = {},
    format: 'csv' | 'excel' | 'json' = 'csv'
  ) => {
    setExporting(true);
    setExportError(null);
    
    try {
      const result = await adminClient.exportDataSafe(dataType, filters, format);
      if (result.success) {
        // The download is handled automatically by the API
        message.success(`${dataType} data exported successfully`);
        return true;
      } else {
        setExportError(result.error);
        message.error(result.error);
        return false;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Export failed';
      setExportError(errorMsg);
      message.error(errorMsg);
      return false;
    } finally {
      setExporting(false);
    }
  }, []);

  return {
    exportData,
    exporting,
    exportError
  };
};

/**
 * Hook for system health monitoring
 */
export const useSystemHealth = (intervalMs = 30000) => {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      setLoading(true);
      const health = await getSystemHealthMetrics();
      setHealthData(health);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system health');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    
    const interval = setInterval(fetchHealth, intervalMs);
    return () => clearInterval(interval);
  }, [fetchHealth, intervalMs]);

  return {
    healthData,
    loading,
    error,
    refresh: fetchHealth
  };
};

// Utility Functions

/**
 * Format currency values
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Format dates consistently
 */
export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  });
};

/**
 * Format relative time
 */
export const formatRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

/**
 * Generate status colors for UI components
 */
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    ACTIVE: 'green',
    INACTIVE: 'gray',
    SUSPENDED: 'orange',
    BANNED: 'red',
    PENDING: 'blue',
    APPROVED: 'green',
    REJECTED: 'red',
    COMPLETED: 'green',
    FAILED: 'red',
    IN_PROGRESS: 'blue',
    OPEN: 'cyan'
  };
  
  return colors[status] || 'gray';
};

/**
 * Debounce function for search inputs
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Safe JSON parsing
 */
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
};

// Constants
export const ADMIN_CONSTANTS = {
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    PAGE_SIZE_OPTIONS: ['10', '20', '50', '100'],
  },
  REFRESH_INTERVALS: {
    DASHBOARD: 30000, // 30 seconds
    SYSTEM_HEALTH: 10000, // 10 seconds
    NOTIFICATIONS: 5000, // 5 seconds
  },
  STATUS_COLORS: {
    ACTIVE: '#52c41a',
    SUSPENDED: '#fa8c16',
    BANNED: '#ff4d4f',
    PENDING: '#1890ff',
    COMPLETED: '#52c41a',
    FAILED: '#ff4d4f',
  },
  USER_ROLES: ['CLIENT', 'FREELANCER', 'ADMIN'],
  USER_STATUSES: ['ACTIVE', 'SUSPENDED', 'BANNED'],
  EXPORT_FORMATS: ['csv', 'excel', 'json'] as const,
  DATA_TYPES: ['users', 'jobs', 'transactions', 'reports'] as const,
};

// Default export
export default AdminClient;
