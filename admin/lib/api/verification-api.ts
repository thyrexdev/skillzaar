import { adminApi } from '@/lib/axios';
import type {
  VerificationQueueItem,
  VerificationStats,
  VerificationFilters,
  DocumentPreview,
  VerificationAction,
} from '@/types/admin.types';

/**
 * Get verification queue with filters and pagination
 */
export const getVerificationQueue = async (
  filters: VerificationFilters = {},
  page: number = 1,
  limit: number = 20
): Promise<{ items: VerificationQueueItem[]; total: number; totalPages: number }> => {
  const response = await adminApi.getPaginated<VerificationQueueItem>(
    '/verification/queue',
    page,
    limit,
    filters
  );
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch verification queue');
  }
  
  return response.data!;
};

/**
 * Get verification statistics
 */
export const getVerificationStats = async (): Promise<VerificationStats> => {
  const response = await adminApi.get<VerificationStats>('/verification/stats');
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch verification stats');
  }
  
  return response.data!;
};

/**
 * Get document preview information
 */
export const getDocumentPreview = async (documentId: string): Promise<DocumentPreview> => {
  const response = await adminApi.get<DocumentPreview>(`/verification/documents/${documentId}`);
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch document preview');
  }
  
  return response.data!;
};

/**
 * Update single document status (approve/reject)
 */
export const updateDocumentStatus = async (
  documentId: string,
  action: 'approve' | 'reject',
  rejectionReason?: string,
  adminNotes?: string
): Promise<boolean> => {
  const response = await adminApi.put<{ updated: boolean }>(
    `/verification/documents/${documentId}`,
    {
      action,
      rejectionReason,
      adminNotes
    }
  );
  
  if (!response.success) {
    throw new Error(response.error || `Failed to ${action} document`);
  }
  
  return response.data?.updated || false;
};

/**
 * Bulk update multiple documents (approve/reject)
 */
export const bulkUpdateDocuments = async (
  documentIds: string[],
  action: 'approve' | 'reject',
  rejectionReason?: string,
  adminNotes?: string
): Promise<{ success: number; failed: number }> => {
  const response = await adminApi.post<{ success: number; failed: number }>(
    '/verification/bulk-update',
    {
      documentIds,
      action,
      rejectionReason,
      adminNotes
    }
  );
  
  if (!response.success) {
    throw new Error(response.error || `Failed to bulk ${action} documents`);
  }
  
  return response.data!;
};

/**
 * Get document download URL
 */
export const getDocumentDownloadUrl = async (documentId: string): Promise<string> => {
  const response = await adminApi.get<{ downloadUrl: string }>(
    `/verification/documents/${documentId}/download`
  );
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to get document download URL');
  }
  
  return response.data!.downloadUrl;
};

/**
 * Download document file directly
 */
export const downloadDocument = async (documentId: string, filename?: string): Promise<void> => {
  try {
    await adminApi.downloadFile(`/verification/documents/${documentId}/download`, filename);
  } catch{
    throw new Error('Failed to download document');
  }
};

/**
 * Get pending verification documents (simplified)
 */
export const getPendingVerifications = async (limit: number = 100): Promise<{
  items: VerificationQueueItem[];
  total: number;
}> => {
  const response = await adminApi.getWithParams<{
    items: VerificationQueueItem[];
    total: number;
    totalPages: number;
  }>('/verification/pending', { limit });
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch pending verifications');
  }
  
  return {
    items: response.data!.items,
    total: response.data!.total
  };
};

/**
 * Perform verification action (unified function)
 */
export const performVerificationAction = async (action: VerificationAction): Promise<boolean> => {
  const isMultiple = action.documentIds && action.documentIds.length > 1;
  
  if (isMultiple) {
    const result = await bulkUpdateDocuments(
      action.documentIds!,
      action.action,
      action.rejectionReason,
      action.adminNotes
    );
    return result.success > 0;
  } else {
    const documentId = action.documentId || action.documentIds?.[0];
    if (!documentId) {
      throw new Error('No document ID provided');
    }
    
    return await updateDocumentStatus(
      documentId,
      action.action,
      action.rejectionReason,
      action.adminNotes
    );
  }
};

/**
 * Check verification service health
 */
export const checkVerificationHealth = async (): Promise<boolean> => {
  try {
    const response = await adminApi.get('/verification/health', { 
      skipErrorNotification: true 
    });
    return response.success;
  } catch {
    return false;
  }
};
