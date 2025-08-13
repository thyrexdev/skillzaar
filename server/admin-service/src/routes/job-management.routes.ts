import { Hono } from 'hono';
import { requireAdmin } from '../middlewares/admin.middleware';
import {
  getJobStats,
  getProposalStats,
  getJobs,
  getJobDetails,
  getJobCategories,
  updateJobCategory,
  getProposals,
  updateJobStatus
} from '../controllers/job-management.controller';

const jobManagementRoutes = new Hono();

// Apply admin middleware to all routes
jobManagementRoutes.use('*', requireAdmin);

// Job statistics
jobManagementRoutes.get('/stats', getJobStats);
jobManagementRoutes.get('/proposals/stats', getProposalStats);

// Job management
jobManagementRoutes.get('/', getJobs);
jobManagementRoutes.get('/:jobId', getJobDetails);
jobManagementRoutes.put('/:jobId/status', updateJobStatus);

// Proposal management
jobManagementRoutes.get('/proposals', getProposals);

// Category management
jobManagementRoutes.get('/categories', getJobCategories);
jobManagementRoutes.put('/categories', updateJobCategory);

export default jobManagementRoutes;
