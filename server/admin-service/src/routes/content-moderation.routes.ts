import { Hono } from 'hono';
import { requireAdmin } from '../middlewares/admin.middleware';
import {
  getModerationStats,
  getReportedContent,
  getFlaggedMessages,
  getFlaggedJobs,
  getFlaggedFiles,
  moderateContent,
  removeMessage,
  removeJob,
  removeFile,
  warnUser,
  getContentAnalytics,
  getBulkModerationQueue
} from '../controllers/content-moderation.controller';

const contentModerationRoutes = new Hono();

// Apply admin middleware to all routes
contentModerationRoutes.use('*', requireAdmin);

// Moderation statistics and analytics
contentModerationRoutes.get('/stats', getModerationStats);
contentModerationRoutes.get('/analytics', getContentAnalytics);

// Reported content management
contentModerationRoutes.get('/reports', getReportedContent);
contentModerationRoutes.post('/moderate', moderateContent);

// Flagged content retrieval
contentModerationRoutes.get('/flagged/messages', getFlaggedMessages);
contentModerationRoutes.get('/flagged/jobs', getFlaggedJobs);
contentModerationRoutes.get('/flagged/files', getFlaggedFiles);

// Content removal actions
contentModerationRoutes.post('/remove/message/:messageId', removeMessage);
contentModerationRoutes.post('/remove/job/:jobId', removeJob);
contentModerationRoutes.post('/remove/file/:fileId', removeFile);

// User warnings
contentModerationRoutes.post('/warn/:userId', warnUser);

// Bulk moderation
contentModerationRoutes.get('/queue/:contentType', getBulkModerationQueue);

export default contentModerationRoutes;
