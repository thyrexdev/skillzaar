import { Context } from 'hono';
import { JobManagementService } from '../services/job-management.service';
import { jobFiltersSchema } from '../interfaces/admin.interfaces';

const jobService = new JobManagementService();

export const getJobStats = async (c: Context) => {
  try {
    const stats = await jobService.getJobStats();
    return c.json({ success: true, data: stats });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getProposalStats = async (c: Context) => {
  try {
    const stats = await jobService.getProposalStats();
    return c.json({ success: true, data: stats });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getJobs = async (c: Context) => {
  try {
    const query = c.req.query();
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');

    const filters = jobFiltersSchema.safeParse({
      status: query.status,
      category: query.category,
      budgetRange: query.minBudget && query.maxBudget ? {
        min: parseFloat(query.minBudget),
        max: parseFloat(query.maxBudget)
      } : undefined,
      dateRange: query.startDate && query.endDate ? {
        start: query.startDate,
        end: query.endDate
      } : undefined,
      reported: query.reported === 'true'
    });

    if (!filters.success) {
      return c.json({ error: 'Invalid filters', details: filters.error.issues }, 400);
    }

    const result = await jobService.getJobs(filters.data, page, limit);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getJobDetails = async (c: Context) => {
  try {
    const jobId = c.req.param('jobId');
    if (!jobId) {
      return c.json({ error: 'Job ID is required' }, 400);
    }

    const jobDetails = await jobService.getJobDetails(jobId);
    return c.json({ success: true, data: jobDetails });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getProposals = async (c: Context) => {
  try {
    const query = c.req.query();
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const jobId = query.jobId;
    const freelancerId = query.freelancerId;

    const result = await jobService.getProposals(jobId, freelancerId, page, limit);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getJobCategories = async (c: Context) => {
  try {
    const categories = await jobService.getJobCategories();
    return c.json({ success: true, data: categories });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const updateJobCategory = async (c: Context) => {
  try {
    const body = await c.req.json();
    const user = c.get('user');

    const { oldCategory, newCategory } = body;
    if (!oldCategory || !newCategory) {
      return c.json({ error: 'Both old and new category names are required' }, 400);
    }

    const result = await jobService.updateJobCategory(oldCategory, newCategory, user.id);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const updateJobStatus = async (c: Context) => {
  try {
    const jobId = c.req.param('jobId');
    const body = await c.req.json();
    const user = c.get('user');

    if (!jobId) {
      return c.json({ error: 'Job ID is required' }, 400);
    }

    const { status, reason } = body;
    if (!status || !['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'].includes(status)) {
      return c.json({ error: 'Valid status is required' }, 400);
    }

    const result = await jobService.updateJobStatus(jobId, status, user.id, reason);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
