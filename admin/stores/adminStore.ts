/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  DashboardOverview,
  UserStats,
  UserDetail,
  UserManagementFilters,
  UserActivity,
  JobStats,
  FinancialStats,
  ModerationStats,
  ReportedContent,
  PlatformMetrics,
  PaginatedResponse,
} from '@/types/admin.types';
import {
  getDashboardOverview,
  getUserStats,
  getUsers,
  getUserActivity,
} from '@/lib/api/admin-api';

interface AdminState {
  // Dashboard
  dashboardData: DashboardOverview | null;
  dashboardLoading: boolean;
  dashboardError: string | null;

  // Users
  users: PaginatedResponse<UserDetail> | null;
  userStats: UserStats | null;
  userActivity: UserActivity[] | null;
  usersLoading: boolean;
  usersError: string | null;
  usersFilters: UserManagementFilters;
  
  // General loading state
  loading: boolean;

  // Jobs
  jobStats: JobStats | null;
  jobsLoading: boolean;
  jobsError: string | null;

  // Financial
  financialStats: FinancialStats | null;
  financialLoading: boolean;
  financialError: string | null;

  // Moderation
  moderationStats: ModerationStats | null;
  reportedContent: ReportedContent[];
  moderationLoading: boolean;
  moderationError: string | null;

  // Analytics
  platformMetrics: PlatformMetrics | null;
  analyticsLoading: boolean;
  analyticsError: string | null;

  // Enhanced User Management UI State
  searchTerm: string;
  selectedRole: string | undefined;
  selectedStatus: string | undefined;
  detailDrawerVisible: boolean;
  selectedUser: UserDetail | null;
  userDetails: UserDetail;
  actionModalVisible: boolean;
  currentAction: { type: string; user: UserDetail } | null;
  dateRange: [any, any] | null;
  advancedFilters: boolean;
}

interface AdminActions {
  // Dashboard actions
  setDashboardData: (data: DashboardOverview) => void;
  setDashboardLoading: (loading: boolean) => void;
  setDashboardError: (error: string | null) => void;
  fetchDashboardData: () => Promise<void>;

  // User actions
  setUsers: (data: PaginatedResponse<UserDetail>) => void;
  setUserStats: (stats: UserStats) => void;
  setUserActivity: (activity: UserActivity[]) => void;
  setUsersLoading: (loading: boolean) => void;
  setUsersError: (error: string | null) => void;
  setUsersFilters: (filters: UserManagementFilters) => void;
  updateUserInList: (userId: string, updates: Partial<UserDetail>) => void;
  
  // API functions
  fetchUsers: (filters?: UserManagementFilters, page?: number, limit?: number) => Promise<void>;
  fetchUserStats: () => Promise<void>;
  fetchUserActivity: (userId?: string, limit?: number) => Promise<void>;

  // Job actions
  setJobStats: (stats: JobStats) => void;
  setJobsLoading: (loading: boolean) => void;
  setJobsError: (error: string | null) => void;

  // Financial actions
  setFinancialStats: (stats: FinancialStats) => void;
  setFinancialLoading: (loading: boolean) => void;
  setFinancialError: (error: string | null) => void;

  // Moderation actions
  setModerationStats: (stats: ModerationStats) => void;
  setReportedContent: (content: ReportedContent[]) => void;
  setModerationLoading: (loading: boolean) => void;
  setModerationError: (error: string | null) => void;
  updateReportedContentItem: (id: string, updates: Partial<ReportedContent>) => void;

  // Analytics actions
  setPlatformMetrics: (metrics: PlatformMetrics) => void;
  setAnalyticsLoading: (loading: boolean) => void;
  setAnalyticsError: (error: string | null) => void;

  // Enhanced User Management UI Actions
  setSearchTerm: (term: string) => void;
  setSelectedRole: (role: string | undefined) => void;
  setSelectedStatus: (status: string | undefined) => void;
  setDetailDrawerVisible: (visible: boolean) => void;
  setSelectedUser: (user: UserDetail | null) => void;
  setUserDetails: (details: UserDetail) => void;
  setActionModalVisible: (visible: boolean) => void;
  setCurrentAction: (action: { type: string; user: UserDetail } | null) => void;
  setDateRange: (range: [any, any] | null) => void;
  setAdvancedFilters: (show: boolean) => void;
  resetUserManagementFilters: () => void;

  // General actions
  clearAllErrors: () => void;
  resetAllData: () => void;
}

export const useAdminStore = create<AdminState & AdminActions>()(
  devtools(
    (set) => ({
      // Initial state
      dashboardData: null,
      dashboardLoading: false,
      dashboardError: null,

      users: null,
      userStats: null,
      userActivity: null,
      usersLoading: false,
      usersError: null,
      usersFilters: {},
      
      loading: false,

      jobStats: null,
      jobsLoading: false,
      jobsError: null,

      financialStats: null,
      financialLoading: false,
      financialError: null,

      moderationStats: null,
      reportedContent: [],
      moderationLoading: false,
      moderationError: null,

      platformMetrics: null,
      analyticsLoading: false,
      analyticsError: null,

      // Enhanced User Management UI State
      searchTerm: '',
      selectedRole: undefined,
      selectedStatus: undefined,
      detailDrawerVisible: false,
      selectedUser: null,
      userDetails: null,
      actionModalVisible: false,
      currentAction: null,
      dateRange: null,
      advancedFilters: false,

      // Dashboard actions
      setDashboardData: (data) => set({ dashboardData: data }),
      setDashboardLoading: (loading) => set({ dashboardLoading: loading }),
      setDashboardError: (error) => set({ dashboardError: error }),
      fetchDashboardData: async () => {
        set({ dashboardLoading: true, dashboardError: null });
        try {
          const data = await getDashboardOverview();
          set({ dashboardData: data, dashboardLoading: false });
        } catch (error: any) {
          set({ dashboardError: error.message, dashboardLoading: false });
        }
      },

      // User actions
      setUsers: (data) => set({ users: data }),
      setUserStats: (stats) => set({ userStats: stats }),
      setUserActivity: (activity) => set({ userActivity: activity }),
      setUsersLoading: (loading) => set({ usersLoading: loading, loading }),
      setUsersError: (error) => set({ usersError: error }),
      setUsersFilters: (filters) => set({ usersFilters: filters }),
      updateUserInList: (userId, updates) =>
        set((state) => ({
          users: state.users ? {
            ...state.users,
            data: state.users.data.map((user) =>
              user.id === userId ? { ...user, ...updates } : user
            ),
          } : null,
        })),
        
      // API functions
      fetchUsers: async (filters = {}, page = 1, limit = 20) => {
        console.log('🔄 Fetching users with filters:', filters, 'page:', page, 'limit:', limit);
        if (filters.dateRange) {
          console.log('📅 Date range details:', {
            start: filters.dateRange.start,
            end: filters.dateRange.end,
            startType: typeof filters.dateRange.start,
            endType: typeof filters.dateRange.end
          });
        }
        set({ usersLoading: true, usersError: null, loading: true });
        try {
          const data = await getUsers(filters, page, limit);
          console.log('✅ Users fetched successfully:', data);
          set({ users: data, usersLoading: false, loading: false, usersFilters: filters });
        } catch (error: any) {
          console.error('❌ Error fetching users:', error);
          set({ usersError: error.message, usersLoading: false, loading: false });
        }
      },
      
      fetchUserStats: async () => {
        set({ usersLoading: true, usersError: null, loading: true });
        try {
          const stats = await getUserStats();
          set({ userStats: stats, usersLoading: false, loading: false });
        } catch (error: any) {
          set({ usersError: error.message, usersLoading: false, loading: false });
        }
      },
      
      fetchUserActivity: async (userId, limit = 50) => {
        set({ usersLoading: true, usersError: null, loading: true });
        try {
          const activity = await getUserActivity(userId, limit);
          set({ userActivity: activity, usersLoading: false, loading: false });
        } catch (error: any) {
          set({ usersError: error.message, usersLoading: false, loading: false });
        }
      },

      // Job actions
      setJobStats: (stats) => set({ jobStats: stats }),
      setJobsLoading: (loading) => set({ jobsLoading: loading }),
      setJobsError: (error) => set({ jobsError: error }),

      // Financial actions
      setFinancialStats: (stats) => set({ financialStats: stats }),
      setFinancialLoading: (loading) => set({ financialLoading: loading }),
      setFinancialError: (error) => set({ financialError: error }),

      // Moderation actions
      setModerationStats: (stats) => set({ moderationStats: stats }),
      setReportedContent: (content) => set({ reportedContent: content }),
      setModerationLoading: (loading) => set({ moderationLoading: loading }),
      setModerationError: (error) => set({ moderationError: error }),
      updateReportedContentItem: (id, updates) =>
        set((state) => ({
          reportedContent: state.reportedContent.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),

      // Analytics actions
      setPlatformMetrics: (metrics) => set({ platformMetrics: metrics }),
      setAnalyticsLoading: (loading) => set({ analyticsLoading: loading }),
      setAnalyticsError: (error) => set({ analyticsError: error }),

      // Enhanced User Management UI Actions
      setSearchTerm: (term) => set({ searchTerm: term }),
      setSelectedRole: (role) => set({ selectedRole: role }),
      setSelectedStatus: (status) => set({ selectedStatus: status }),
      setDetailDrawerVisible: (visible) => set({ detailDrawerVisible: visible }),
      setSelectedUser: (user) => set({ selectedUser: user }),
      setUserDetails: (details) => set({ userDetails: details }),
      setActionModalVisible: (visible) => set({ actionModalVisible: visible }),
      setCurrentAction: (action) => set({ currentAction: action }),
      setDateRange: (range) => set({ dateRange: range }),
      setAdvancedFilters: (show) => set({ advancedFilters: show }),
      resetUserManagementFilters: () => set({
        searchTerm: '',
        selectedRole: undefined,
        selectedStatus: undefined,
        dateRange: null,
        advancedFilters: false,
      }),

      // General actions
      clearAllErrors: () =>
        set({
          dashboardError: null,
          usersError: null,
          jobsError: null,
          financialError: null,
          moderationError: null,
          analyticsError: null,
        }),
      resetAllData: () =>
        set({
          dashboardData: null,
          users: null,
          userStats: null,
          userActivity: null,
          jobStats: null,
          financialStats: null,
          moderationStats: null,
          reportedContent: [],
          platformMetrics: null,
          loading: false,
          // Reset Enhanced User Management UI State
          searchTerm: '',
          selectedRole: undefined,
          selectedStatus: undefined,
          detailDrawerVisible: false,
          selectedUser: null,
          userDetails: null,
          actionModalVisible: false,
          currentAction: null,
          dateRange: null,
          advancedFilters: false,
        }),
    }),
    {
      name: 'admin-store',
    }
  )
);
