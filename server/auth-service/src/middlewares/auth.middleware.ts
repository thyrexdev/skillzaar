import type { MiddlewareHandler } from 'hono';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;

export const authMiddleware: MiddlewareHandler = async (c, next) => {
    const authHeader = c.req.header('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ message: 'Authorization header missing or malformed' }, 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return c.json({ message: 'Token not provided' }, 401);
    }

    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        c.set('user', payload);
        await next();
    } catch (err) {
        return c.json({ message: 'Invalid or expired token' }, 401);
    }
};
