import { Context } from 'hono';
import { FinancialOversightService } from '../services/financial-oversight.service';
import { transactionFiltersSchema } from '../interfaces/admin.interfaces';

const financialService = new FinancialOversightService();

export const getFinancialStats = async (c: Context) => {
  try {
    const stats = await financialService.getFinancialStats();
    return c.json({ success: true, data: stats });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getTransactions = async (c: Context) => {
  try {
    const query = c.req.query();
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');

    const filters = transactionFiltersSchema.safeParse({
      type: query.type,
      status: query.status,
      amountRange: query.minAmount && query.maxAmount ? {
        min: parseFloat(query.minAmount),
        max: parseFloat(query.maxAmount)
      } : undefined,
      dateRange: query.startDate && query.endDate ? {
        start: query.startDate,
        end: query.endDate
      } : undefined,
      userId: query.userId
    });

    if (!filters.success) {
      return c.json({ error: 'Invalid filters', details: filters.error.issues }, 400);
    }

    const result = await financialService.getTransactions(filters.data, page, limit);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getWithdrawals = async (c: Context) => {
  try {
    const query = c.req.query();
    const status = query.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | undefined;
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');

    const result = await financialService.getWithdrawals(status, page, limit);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const approveWithdrawal = async (c: Context) => {
  try {
    const withdrawalId = c.req.param('withdrawalId');
    const body = await c.req.json();
    const user = c.get('user');

    if (!withdrawalId) {
      return c.json({ error: 'Withdrawal ID is required' }, 400);
    }

    const result = await financialService.approveWithdrawal(withdrawalId, user.id, body.notes);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const rejectWithdrawal = async (c: Context) => {
  try {
    const withdrawalId = c.req.param('withdrawalId');
    const body = await c.req.json();
    const user = c.get('user');

    if (!withdrawalId) {
      return c.json({ error: 'Withdrawal ID is required' }, 400);
    }

    if (!body.reason) {
      return c.json({ error: 'Reason is required for rejection' }, 400);
    }

    const result = await financialService.rejectWithdrawal(withdrawalId, user.id, body.reason);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getEscrowStats = async (c: Context) => {
  try {
    const stats = await financialService.getEscrowStats();
    return c.json({ success: true, data: stats });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getUserFinancialSummary = async (c: Context) => {
  try {
    const userId = c.req.param('userId');
    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }

    const summary = await financialService.getUserFinancialSummary(userId);
    return c.json({ success: true, data: summary });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const updatePlatformFees = async (c: Context) => {
  try {
    const body = await c.req.json();
    const user = c.get('user');

    const { feePercentage } = body;
    if (typeof feePercentage !== 'number' || feePercentage < 0 || feePercentage > 100) {
      return c.json({ error: 'Valid fee percentage (0-100) is required' }, 400);
    }

    const result = await financialService.updatePlatformFees(feePercentage, user.id);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
