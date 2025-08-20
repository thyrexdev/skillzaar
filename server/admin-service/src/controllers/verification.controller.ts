import { Context } from 'hono';
import { z } from 'zod';
import {
  getVerificationQueue,
  getVerificationStats,
  getDocumentPreview,
  updateDocumentStatus,
  bulkUpdateDocuments,
  getDocumentFile
} from '../services/verification.service';
import {
  verificationFiltersSchema,
  verificationDocumentActionSchema,
  VerificationFiltersType,
  VerificationDocumentActionType
} from '../interfaces/admin.interfaces';

/**
 * Get verification queue with optional filters
 */
export const getVerificationQueueHandler = async (c: Context) => {
  try {
    const query = c.req.query();
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    
    // Parse and validate filters
    const filters = verificationFiltersSchema.safeParse({
      status: query.status,
      docType: query.docType,
      userRole: query.userRole,
      search: query.search,
      dateRange: query.startDate && query.endDate ? {
        start: query.startDate,
        end: query.endDate
      } : undefined
    });

    if (!filters.success) {
      return c.json({ error: 'Invalid filters', details: filters.error.issues }, 400);
    }

    // Convert date strings to Date objects for the service
    const processedFilters = {
      ...filters.data,
      dateRange: filters.data.dateRange ? {
        start: new Date(filters.data.dateRange.start),
        end: new Date(filters.data.dateRange.end)
      } : undefined
    };
    
    const result = await getVerificationQueue(processedFilters, page, limit);
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

/**
 * Get verification statistics
 */
export const getVerificationStatsHandler = async (c: Context) => {
  try {
    const stats = await getVerificationStats();
    return c.json({ success: true, data: stats });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

/**
 * Get document preview
 */
export const getDocumentPreviewHandler = async (c: Context) => {
  try {
    const documentId = c.req.param('documentId');
    
    if (!documentId) {
      return c.json({ error: 'Document ID is required' }, 400);
    }

    const preview = await getDocumentPreview(documentId);
    
    if (!preview) {
      return c.json({ error: 'Document not found' }, 404);
    }

    return c.json({ success: true, data: preview });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

/**
 * Update document verification status (approve/reject)
 */
export const updateDocumentStatusHandler = async (c: Context) => {
  try {
    const documentId = c.req.param('documentId');
    const body = await c.req.json();
    const user = c.get('user');
    
    if (!documentId) {
      return c.json({ error: 'Document ID is required' }, 400);
    }
    
    // Validate request body
    const actionResult = verificationDocumentActionSchema.safeParse(body);
    if (!actionResult.success) {
      return c.json({ error: 'Invalid request data', details: actionResult.error.issues }, 400);
    }

    const { action, rejectionReason, adminNotes }: VerificationDocumentActionType = actionResult.data;
    
    if (!user?.id) {
      return c.json({ error: 'Admin authentication required' }, 401);
    }

    // Validate rejection reason if action is reject
    if (action === 'reject' && !rejectionReason) {
      return c.json({ error: 'Rejection reason is required when rejecting documents' }, 400);
    }

    const success = await updateDocumentStatus(
      documentId,
      action,
      user.id,
      rejectionReason,
      adminNotes
    );

    return c.json({
      success: true,
      message: `Document ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      data: { updated: success }
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

/**
 * Bulk update documents (approve/reject multiple)
 */
export const bulkUpdateDocumentsHandler = async (c: Context) => {
  try {
    const body = await c.req.json();
    const user = c.get('user');
    
    const bulkActionSchema = z.object({
      documentIds: z.array(z.string()).min(1, 'At least one document ID is required'),
      action: z.enum(['approve', 'reject']),
      rejectionReason: z.string().min(5, 'Rejection reason must be at least 5 characters').optional(),
      adminNotes: z.string().optional()
    });

    const actionResult = bulkActionSchema.safeParse(body);
    if (!actionResult.success) {
      return c.json({ error: 'Invalid request data', details: actionResult.error.issues }, 400);
    }

    const { documentIds, action, rejectionReason, adminNotes } = actionResult.data;
    
    if (!user?.id) {
      return c.json({ error: 'Admin authentication required' }, 401);
    }

    // Validate rejection reason if action is reject
    if (action === 'reject' && !rejectionReason) {
      return c.json({ error: 'Rejection reason is required when rejecting documents' }, 400);
    }

    const result = await bulkUpdateDocuments(
      documentIds,
      action,
      user.id,
      rejectionReason,
      adminNotes
    );

    return c.json({
      success: true,
      message: `Bulk ${action} completed`,
      data: result
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

/**
 * Download document file
 */
export const downloadDocumentHandler = async (c: Context) => {
  try {
    const documentId = c.req.param('documentId');
    
    if (!documentId) {
      return c.json({ error: 'Document ID is required' }, 400);
    }

    const document = await getDocumentFile(documentId);
    
    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    // Here you would typically integrate with your media service to get the actual file
    // For now, we'll return the file info and let the client handle the download
    return c.json({
      success: true,
      message: 'Document file info retrieved',
      data: {
        fileName: document.fileName,
        originalName: document.originalName,
        fileType: document.fileType,
        downloadUrl: `/api/media/files/${document.fileName}` // This would be the actual media service URL
      }
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

/**
 * Get all pending verification documents (simplified endpoint)
 */
export const getPendingVerificationsHandler = async (c: Context) => {
  try {
    const result = await getVerificationQueue({ status: 'PENDING' }, 1, 100);
    
    return c.json({
      success: true,
      data: {
        items: result.items,
        total: result.total
      }
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
