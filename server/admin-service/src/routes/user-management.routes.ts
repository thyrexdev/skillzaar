import { Hono } from 'hono';
import { requireAdmin } from '../middlewares/admin.middleware';
import {
  getUserStats,
  getUsers,
  getUserActivity,
  performUserAction,
  getUserDetails,
  suspendUser,
  banUser,
  verifyUser,
  getVerificationDocuments,
  handleVerificationDocument
} from '../controllers/user-management.controller';

const userManagementRoutes = new Hono();

// Apply admin middleware to all routes
userManagementRoutes.use('*', requireAdmin);

// User stats and overview
userManagementRoutes.get('/stats', getUserStats);
userManagementRoutes.get('/activity', getUserActivity);

// User listing and filtering
userManagementRoutes.get('/', getUsers);
userManagementRoutes.get('/:userId', getUserDetails);

// User actions
userManagementRoutes.post('/action', performUserAction);
userManagementRoutes.post('/:userId/suspend', suspendUser);
userManagementRoutes.post('/:userId/ban', banUser);
userManagementRoutes.post('/:userId/verify', verifyUser);

// Verification document management
userManagementRoutes.get('/verification/documents', getVerificationDocuments);
userManagementRoutes.post('/verification/handle', handleVerificationDocument);

export default userManagementRoutes;
