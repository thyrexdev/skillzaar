import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  VerificationQueueItem,
  VerificationStats,
  VerificationFilters,
  DocumentPreview,
  VerificationAction,
  PaginationConfig
} from '@/types/verification.types';
import { LoadingState } from '@/types/api.types';
import {
  getVerificationQueue as apiGetVerificationQueue,
  getVerificationStats as apiGetVerificationStats,
  getDocumentPreview as apiGetDocumentPreview,
  performVerificationAction as apiPerformVerificationAction,
  getDocumentDownloadUrl as apiGetDocumentDownloadUrl
} from '@/lib/api/verification-api';

interface VerificationStore {
  // State
  queueItems: VerificationQueueItem[];
  stats: VerificationStats | null;
  filters: VerificationFilters;
  pagination: PaginationConfig;
  selectedDocument: DocumentPreview | null;
  selectedDocuments: string[];
  
  // Loading states
  queueLoading: LoadingState;
  statsLoading: LoadingState;
  actionLoading: LoadingState;
  
  // UI state
  previewModalVisible: boolean;
  actionModalVisible: boolean;
  bulkActionMode: boolean;
  
  // Actions
  setQueueItems: (items: VerificationQueueItem[]) => void;
  setStats: (stats: VerificationStats) => void;
  setFilters: (filters: Partial<VerificationFilters>) => void;
  setPagination: (pagination: Partial<PaginationConfig>) => void;
  setSelectedDocument: (document: DocumentPreview | null) => void;
  setSelectedDocuments: (documentIds: string[]) => void;
  
  // Loading actions
  setQueueLoading: (loading: Partial<LoadingState>) => void;
  setStatsLoading: (loading: Partial<LoadingState>) => void;
  setActionLoading: (loading: Partial<LoadingState>) => void;
  
  // UI actions
  setPreviewModalVisible: (visible: boolean) => void;
  setActionModalVisible: (visible: boolean) => void;
  setBulkActionMode: (enabled: boolean) => void;
  
  // API actions
  fetchVerificationQueue: () => Promise<void>;
  fetchVerificationStats: () => Promise<void>;
  fetchDocumentPreview: (documentId: string) => Promise<DocumentPreview | null>;
  performDocumentAction: (action: VerificationAction) => Promise<boolean>;
  downloadDocument: (documentId: string) => Promise<string | null>;
  
  // Utility actions
  resetFilters: () => void;
  resetPagination: () => void;
  clearSelection: () => void;
  refreshData: () => Promise<void>;
}

const initialFilters: VerificationFilters = {
  status: undefined,
  docType: undefined,
  userRole: undefined,
  search: '',
  dateRange: null
};

const initialPagination: PaginationConfig = {
  current: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
};

const initialLoadingState: LoadingState = {
  loading: false,
  error: null,
  lastFetch: null
};

// Helper function to convert filters for API
const processFilters = (filters: VerificationFilters): Record<string, any> => {
  return {
    status: filters.status,
    docType: filters.docType,
    userRole: filters.userRole,
    search: filters.search,
    dateRange: filters.dateRange ? {
      start: filters.dateRange[0],
      end: filters.dateRange[1]
    } : undefined
  };
};

export const useVerificationStore = create<VerificationStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      queueItems: [],
      stats: null,
      filters: initialFilters,
      pagination: initialPagination,
      selectedDocument: null,
      selectedDocuments: [],
      
      queueLoading: initialLoadingState,
      statsLoading: initialLoadingState,
      actionLoading: initialLoadingState,
      
      previewModalVisible: false,
      actionModalVisible: false,
      bulkActionMode: false,
      
      // State setters
      setQueueItems: (items) => set({ queueItems: items }),
      
      setStats: (stats) => set({ stats }),
      
      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters },
        pagination: { ...state.pagination, current: 1 } // Reset to first page when filters change
      })),
      
      setPagination: (newPagination) => set((state) => ({
        pagination: { ...state.pagination, ...newPagination }
      })),
      
      setSelectedDocument: (document) => set({ selectedDocument: document }),
      
      setSelectedDocuments: (documentIds) => set({ selectedDocuments: documentIds }),
      
      // Loading state setters
      setQueueLoading: (loading) => set((state) => ({
        queueLoading: { ...state.queueLoading, ...loading }
      })),
      
      setStatsLoading: (loading) => set((state) => ({
        statsLoading: { ...state.statsLoading, ...loading }
      })),
      
      setActionLoading: (loading) => set((state) => ({
        actionLoading: { ...state.actionLoading, ...loading }
      })),
      
      // UI state setters
      setPreviewModalVisible: (visible) => set({ previewModalVisible: visible }),
      
      setActionModalVisible: (visible) => set({ actionModalVisible: visible }),
      
      setBulkActionMode: (enabled) => set({ 
        bulkActionMode: enabled,
        selectedDocuments: enabled ? get().selectedDocuments : []
      }),
      
      // API actions
      fetchVerificationQueue: async () => {
        const { filters, pagination, setQueueLoading, setPagination } = get();
        
        setQueueLoading({ loading: true, error: null });
        
        try {
          const processedFilters = processFilters(filters);
          const result = await apiGetVerificationQueue(
            processedFilters,
            pagination.current,
            pagination.pageSize
          );
          
          set({ queueItems: result.items });
          setPagination({
            total: result.total,
            totalPages: result.totalPages
          });
          setQueueLoading({ loading: false, lastFetch: new Date() });
        } catch (error) {
          setQueueLoading({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      },
      
      fetchVerificationStats: async () => {
        const { setStatsLoading } = get();
        
        setStatsLoading({ loading: true, error: null });
        
        try {
          const result = await apiGetVerificationStats();
          set({ stats: result });
          setStatsLoading({ loading: false, lastFetch: new Date() });
        } catch (error) {
          setStatsLoading({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      },
      
      fetchDocumentPreview: async (documentId: string) => {
        try {
          const result = await apiGetDocumentPreview(documentId);
          set({ selectedDocument: result });
          return result;
        } catch (error) {
          console.error('Error fetching document preview:', error);
          return null;
        }
      },
      
      performDocumentAction: async (action: VerificationAction) => {
        const { setActionLoading, fetchVerificationQueue, fetchVerificationStats } = get();
        
        setActionLoading({ loading: true, error: null });
        
        try {
          const success = await apiPerformVerificationAction(action);
          
          if (success) {
            setActionLoading({ loading: false, lastFetch: new Date() });
            // Refresh data after successful action
            await Promise.all([
              fetchVerificationQueue(),
              fetchVerificationStats()
            ]);
            return true;
          } else {
            setActionLoading({ 
              loading: false, 
              error: 'Failed to perform action' 
            });
            return false;
          }
        } catch (error) {
          setActionLoading({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
          return false;
        }
      },
      
      downloadDocument: async (documentId: string) => {
        try {
          const downloadUrl = await apiGetDocumentDownloadUrl(documentId);
          return downloadUrl;
        } catch (error) {
          console.error('Error downloading document:', error);
          return null;
        }
      },
      
      // Utility actions
      resetFilters: () => set({ 
        filters: initialFilters,
        pagination: { ...get().pagination, current: 1 }
      }),
      
      resetPagination: () => set({ pagination: initialPagination }),
      
      clearSelection: () => set({ 
        selectedDocuments: [],
        selectedDocument: null,
        bulkActionMode: false
      }),
      
      refreshData: async () => {
        const { fetchVerificationQueue, fetchVerificationStats } = get();
        await Promise.all([
          fetchVerificationQueue(),
          fetchVerificationStats()
        ]);
      }
    }),
    {
      name: 'verification-store',
      partialize: (state) => ({
        filters: state.filters,
        pagination: state.pagination
      })
    }
  )
);
