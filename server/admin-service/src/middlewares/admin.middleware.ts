import type { MiddlewareHandler } from 'hono';
import { jwtVerify } from 'jose';
import { env, logger } from '@vync/config';

const JWT_SECRET = env.JWT_SECRET;

export const requireAdmin: MiddlewareHandler = async (c, next) => {
    logger.info('🔍 Admin middleware called for:', c.req.method, c.req.url);
    
    const authHeader = c.req.header('authorization');
    logger.info('📋 Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn('❌ Authorization header missing or malformed');
        return c.json({ message: 'Authorization header missing or malformed' }, 401);
    }

    const token = authHeader.split(' ')[1];
    logger.info('🎫 Token extracted:', token ? 'Yes' : 'No', '(length:', token?.length || 0, ')');
    logger.info('🔑 JWT_SECRET available:', JWT_SECRET ? 'Yes' : 'No');
    
    if (!token) {
        logger.warn('❌ Token not provided');
        return c.json({ message: 'Token not provided' }, 401);
    }

    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        logger.info('✅ Token verified successfully for user:', payload.sub || payload.id);
        
        // Check if user has admin role
        if (payload.role !== 'ADMIN') {
            logger.warn('❌ Access denied. User role:', payload.role, '(required: ADMIN)');
            return c.json({ message: 'Access denied. Admin privileges required.' }, 403);
        }
        
        logger.info('✅ Admin access granted for user:', payload.sub || payload.id);
        c.set('user', payload);
        await next();
    } catch (err: any) {
        logger.error('❌ JWT verification failed:', err.message);
        logger.error('Token preview:', token?.substring(0, 20) + '...');
        return c.json({ message: 'Invalid or expired token' }, 401);
    }
};