import { Hono } from 'hono';
import { requireAdmin } from '../middlewares/admin.middleware';
import {
  getFinancialStats,
  getTransactions,
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getEscrowStats,
  getUserFinancialSummary,
  updatePlatformFees
} from '../controllers/financial-oversight.controller';

const financialOversightRoutes = new Hono();

// Apply admin middleware to all routes
financialOversightRoutes.use('*', requireAdmin);

// Financial statistics
financialOversightRoutes.get('/stats', getFinancialStats);
financialOversightRoutes.get('/escrow/stats', getEscrowStats);

// Transaction management
financialOversightRoutes.get('/transactions', getTransactions);

// Withdrawal management
financialOversightRoutes.get('/withdrawals', getWithdrawals);
financialOversightRoutes.post('/withdrawals/:withdrawalId/approve', approveWithdrawal);
financialOversightRoutes.post('/withdrawals/:withdrawalId/reject', rejectWithdrawal);

// User financial data
financialOversightRoutes.get('/users/:userId/summary', getUserFinancialSummary);

// Platform configuration
financialOversightRoutes.put('/fees', updatePlatformFees);

export default financialOversightRoutes;
