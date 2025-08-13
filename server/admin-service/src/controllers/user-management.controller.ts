import { Context } from 'hono';
import { UserManagementService } from '../services/user-management.service';
import { 
  userManagementFiltersSchema, 
  adminActionSchema, 
  verificationDocumentActionSchema 
} from '../interfaces/admin.interfaces';

const userService = new UserManagementService();

export const getUserStats = async (c: Context) => {
  try {
    const stats = await userService.getUserStats();
    return c.json({ success: true, data: stats });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getUsers = async (c: Context) => {
  try {
    const query = c.req.query();
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');

    // Parse and validate filters
    const filters = userManagementFiltersSchema.safeParse({
      role: query.role,
      isVerified: query.isVerified === 'true' ? true : query.isVerified === 'false' ? false : undefined,
      status: query.status,
      search: query.search,
      dateRange: query.startDate && query.endDate ? {
        start: query.startDate,
        end: query.endDate
      } : undefined
    });

    if (!filters.success) {
      return c.json({ error: 'Invalid filters', details: filters.error.issues }, 400);
    }

    const result = await userService.getUsers(filters.data, page, limit);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getUserActivity = async (c: Context) => {
  try {
    const query = c.req.query();
    const userId = query.userId;
    const limit = parseInt(query.limit || '50');

    const activity = await userService.getUserActivity(userId, limit);
    return c.json({ success: true, data: activity });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const performUserAction = async (c: Context) => {
  try {
    const body = await c.req.json();
    const user = c.get('user');
    
    const validatedAction = adminActionSchema.safeParse(body);
    if (!validatedAction.success) {
      return c.json({ error: 'Invalid action data', details: validatedAction.error.issues }, 400);
    }

    const result = await userService.performUserAction(validatedAction.data, user.id);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getVerificationDocuments = async (c: Context) => {
  try {
    const query = c.req.query();
    const status = query.status as 'PENDING' | 'APPROVED' | 'REJECTED' | undefined;
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');

    const result = await userService.getVerificationDocuments(status, page, limit);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const handleVerificationDocument = async (c: Context) => {
  try {
    const body = await c.req.json();
    const user = c.get('user');
    
    const validatedAction = verificationDocumentActionSchema.safeParse(body);
    if (!validatedAction.success) {
      return c.json({ error: 'Invalid action data', details: validatedAction.error.issues }, 400);
    }

    const result = await userService.handleVerificationDocument(validatedAction.data, user.id);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getUserDetails = async (c: Context) => {
  try {
    const userId = c.req.param('userId');
    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }

    const userDetails = await userService.getUserDetails(userId);
    return c.json({ success: true, data: userDetails });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const suspendUser = async (c: Context) => {
  try {
    const userId = c.req.param('userId');
    const body = await c.req.json();
    const user = c.get('user');

    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }

    const actionData = {
      userId,
      action: 'suspend' as const,
      reason: body.reason || 'No reason provided',
      duration: body.duration
    };

    const validatedAction = adminActionSchema.safeParse(actionData);
    if (!validatedAction.success) {
      return c.json({ error: 'Invalid action data', details: validatedAction.error.issues }, 400);
    }

    const result = await userService.performUserAction(validatedAction.data, user.id);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const banUser = async (c: Context) => {
  try {
    const userId = c.req.param('userId');
    const body = await c.req.json();
    const user = c.get('user');

    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }

    const actionData = {
      userId,
      action: 'ban' as const,
      reason: body.reason || 'No reason provided'
    };

    const validatedAction = adminActionSchema.safeParse(actionData);
    if (!validatedAction.success) {
      return c.json({ error: 'Invalid action data', details: validatedAction.error.issues }, 400);
    }

    const result = await userService.performUserAction(validatedAction.data, user.id);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const verifyUser = async (c: Context) => {
  try {
    const userId = c.req.param('userId');
    const body = await c.req.json();
    const user = c.get('user');

    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }

    const actionData = {
      userId,
      action: 'verify' as const,
      reason: body.reason || 'Manual verification by admin'
    };

    const validatedAction = adminActionSchema.safeParse(actionData);
    if (!validatedAction.success) {
      return c.json({ error: 'Invalid action data', details: validatedAction.error.issues }, 400);
    }

    const result = await userService.performUserAction(validatedAction.data, user.id);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
