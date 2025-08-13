import { Context } from 'hono';
import { ContentModerationService } from '../services/content-moderation.service';
import { contentModerationFiltersSchema, contentModerationActionSchema } from '../interfaces/admin.interfaces';

const moderationService = new ContentModerationService();

export const getModerationStats = async (c: Context) => {
  try {
    const stats = await moderationService.getModerationStats();
    return c.json({ success: true, data: stats });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getReportedContent = async (c: Context) => {
  try {
    const query = c.req.query();
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');

    const filters = contentModerationFiltersSchema.safeParse({
      type: query.type,
      status: query.status,
      severity: query.severity,
      dateRange: query.startDate && query.endDate ? {
        start: query.startDate,
        end: query.endDate
      } : undefined
    });

    if (!filters.success) {
      return c.json({ error: 'Invalid filters', details: filters.error.issues }, 400);
    }

    const result = await moderationService.getReportedContent(filters.data, page, limit);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getFlaggedMessages = async (c: Context) => {
  try {
    const query = c.req.query();
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');

    const result = await moderationService.getFlaggedMessages(page, limit);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getFlaggedJobs = async (c: Context) => {
  try {
    const query = c.req.query();
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');

    const result = await moderationService.getFlaggedJobs(page, limit);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getFlaggedFiles = async (c: Context) => {
  try {
    const query = c.req.query();
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');

    const result = await moderationService.getFlaggedFiles(page, limit);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const moderateContent = async (c: Context) => {
  try {
    const body = await c.req.json();
    const user = c.get('user');

    const validatedAction = contentModerationActionSchema.safeParse(body);
    if (!validatedAction.success) {
      return c.json({ error: 'Invalid action data', details: validatedAction.error.issues }, 400);
    }

    const result = await moderationService.moderateContent(validatedAction.data, user.id);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const removeMessage = async (c: Context) => {
  try {
    const messageId = c.req.param('messageId');
    const body = await c.req.json();
    const user = c.get('user');

    if (!messageId) {
      return c.json({ error: 'Message ID is required' }, 400);
    }

    if (!body.reason) {
      return c.json({ error: 'Reason is required' }, 400);
    }

    const result = await moderationService.removeMessage(messageId, user.id, body.reason);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const removeJob = async (c: Context) => {
  try {
    const jobId = c.req.param('jobId');
    const body = await c.req.json();
    const user = c.get('user');

    if (!jobId) {
      return c.json({ error: 'Job ID is required' }, 400);
    }

    if (!body.reason) {
      return c.json({ error: 'Reason is required' }, 400);
    }

    const result = await moderationService.removeJob(jobId, user.id, body.reason);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const removeFile = async (c: Context) => {
  try {
    const fileId = c.req.param('fileId');
    const body = await c.req.json();
    const user = c.get('user');

    if (!fileId) {
      return c.json({ error: 'File ID is required' }, 400);
    }

    if (!body.reason) {
      return c.json({ error: 'Reason is required' }, 400);
    }

    const result = await moderationService.removeFile(fileId, user.id, body.reason);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const warnUser = async (c: Context) => {
  try {
    const userId = c.req.param('userId');
    const body = await c.req.json();
    const user = c.get('user');

    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }

    if (!body.reason) {
      return c.json({ error: 'Reason is required' }, 400);
    }

    const result = await moderationService.warnUser(userId, user.id, body.reason);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getContentAnalytics = async (c: Context) => {
  try {
    const query = c.req.query();
    const dateRange = query.startDate && query.endDate ? {
      start: new Date(query.startDate),
      end: new Date(query.endDate)
    } : undefined;

    const analytics = await moderationService.getContentAnalytics(dateRange);
    return c.json({ success: true, data: analytics });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getBulkModerationQueue = async (c: Context) => {
  try {
    const contentType = c.req.param('contentType') as 'message' | 'job' | 'file';
    const query = c.req.query();
    const limit = parseInt(query.limit || '50');

    if (!['message', 'job', 'file'].includes(contentType)) {
      return c.json({ error: 'Invalid content type. Must be message, job, or file' }, 400);
    }

    const result = await moderationService.getBulkModerationQueue(contentType, limit);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
