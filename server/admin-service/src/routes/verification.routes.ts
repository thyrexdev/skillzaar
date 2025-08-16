import { Hono } from 'hono';
import { requireAdmin } from '../middlewares/admin.middleware';
import {
  getVerificationQueueHandler,
  getVerificationStatsHandler,
  getDocumentPreviewHandler,
  updateDocumentStatusHandler,
  bulkUpdateDocumentsHandler,
  downloadDocumentHandler,
  getPendingVerificationsHandler
} from '../controllers/verification.controller';

const verificationRoutes = new Hono();

// Apply admin middleware to all routes
verificationRoutes.use('*', requireAdmin);

// Verification queue and stats
verificationRoutes.get('/queue', getVerificationQueueHandler);
verificationRoutes.get('/stats', getVerificationStatsHandler);
verificationRoutes.get('/pending', getPendingVerificationsHandler);

// Document management
verificationRoutes.get('/documents/:documentId', getDocumentPreviewHandler);
verificationRoutes.get('/documents/:documentId/download', downloadDocumentHandler);
verificationRoutes.put('/documents/:documentId', updateDocumentStatusHandler);

// Bulk operations
verificationRoutes.post('/bulk-update', bulkUpdateDocumentsHandler);

export default verificationRoutes;
