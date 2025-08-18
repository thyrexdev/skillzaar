import { Context, Next } from "hono";
import { getUserFromToken, getTokenStats, type UserTokenPayload, type ExtendedUserTokenPayload } from "../getUserFromToken";
import { rateLimitUtils } from '@vync/cache';
import { logger } from '@vync/config';

/**
 * Enhanced auth middleware with Redis integration, rate limiting, and security features
 */
export const authMiddleware = async (c: Context, next: Next) => {
  const startTime = Date.now();
  
  try {
    // Extract authorization header
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      logger.warn('Authorization header missing', { 
        ip: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
        userAgent: c.req.header('User-Agent') || 'unknown'
      });
      return c.json({ error: "Authorization header missing" }, 401);
    }

    // Extract and validate token format
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token || token.length < 10) {
      logger.warn('Invalid token format provided');
      return c.json({ error: "Invalid token format" }, 401);
    }

    // Get client information for security context
    const clientInfo = {
      ipAddress: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
      userAgent: c.req.header('User-Agent') || 'unknown',
      deviceInfo: c.req.header('X-Device-Info') || undefined,
    };

    // Rate limiting by IP address
    const rateLimitResult = await rateLimitUtils.checkSimpleRateLimit(
      `auth:${clientInfo.ipAddress}`,
      100, // 100 requests
      60   // per minute
    );

    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded for auth requests', { 
        ip: clientInfo.ipAddress,
        remaining: rateLimitResult.remaining 
      });
      return c.json({ 
        error: "Too many authentication attempts",
        retryAfter: 60 
      }, 429);
    }

    // Verify token with Redis integration
    const user = await getUserFromToken(token, {
      updateActivity: true,
      sessionInfo: clientInfo
    });

    if (!user) {
      logger.warn('Token verification failed', {
        ip: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        tokenPreview: token.slice(-8)
      });
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    // Set user in context with additional metadata
    const contextUser: ExtendedUserTokenPayload = {
      ...user,
      ...clientInfo,
    };

    c.set("user", contextUser);
    c.set("authTime", startTime);
    c.set("clientInfo", clientInfo);
    
    // Add security headers
    c.header('X-Auth-User-ID', user.userId);
    c.header('X-Auth-Role', user.role);
    
    logger.debug(`Authentication successful for user ${user.userId}`, {
      userId: user.userId,
      role: user.role,
      ip: clientInfo.ipAddress,
      duration: Date.now() - startTime
    });

    await next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return c.json({ error: "Internal authentication error" }, 500);
  }
};

/**
 * Stricter auth middleware for admin-only routes
 */
export const adminAuthMiddleware = async (c: Context, next: Next) => {
  const startTime = Date.now();
  
  try {
    // Extract authorization header
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      logger.warn('Authorization header missing', { 
        ip: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
        userAgent: c.req.header('User-Agent') || 'unknown'
      });
      return c.json({ error: "Authorization header missing" }, 401);
    }

    // Extract and validate token format
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token || token.length < 10) {
      logger.warn('Invalid token format provided');
      return c.json({ error: "Invalid token format" }, 401);
    }

    // Get client information for security context
    const clientInfo = {
      ipAddress: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
      userAgent: c.req.header('User-Agent') || 'unknown',
      deviceInfo: c.req.header('X-Device-Info') || undefined,
    };

    // Rate limiting by IP address
    const rateLimitResult = await rateLimitUtils.checkSimpleRateLimit(
      `auth:${clientInfo.ipAddress}`,
      100, // 100 requests
      60   // per minute
    );

    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded for auth requests', { 
        ip: clientInfo.ipAddress,
        remaining: rateLimitResult.remaining 
      });
      return c.json({ 
        error: "Too many authentication attempts",
        retryAfter: 60 
      }, 429);
    }

    // Verify token with Redis integration
    const user = await getUserFromToken(token, {
      updateActivity: true,
      sessionInfo: clientInfo
    });

    if (!user) {
      logger.warn('Token verification failed', {
        ip: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        tokenPreview: token.slice(-8)
      });
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      logger.warn(`Access denied for non-admin user`, {
        userId: user.userId,
        role: user.role,
        ip: clientInfo.ipAddress
      });
      return c.json({ error: "Admin access required" }, 403);
    }

    // Set user in context with additional metadata
    const contextUser: ExtendedUserTokenPayload = {
      ...user,
      ...clientInfo,
    };

    c.set("user", contextUser);
    c.set("authTime", startTime);
    c.set("clientInfo", clientInfo);
    
    // Add security headers
    c.header('X-Auth-User-ID', user.userId);
    c.header('X-Auth-Role', user.role);
    
    logger.debug(`Admin authentication successful for user ${user.userId}`, {
      userId: user.userId,
      role: user.role,
      ip: clientInfo.ipAddress,
      duration: Date.now() - startTime
    });

    await next();
  } catch (error) {
    logger.error('Admin auth middleware error:', error);
    return c.json({ error: "Internal authentication error" }, 500);
  }
};

/**
 * Optional auth middleware - continues even if no token provided
 */
export const optionalAuthMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");
  
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "").trim();
    if (token) {
      try {
        const user = await getUserFromToken(token, { updateActivity: false });
        if (user) {
          c.set("user", user);
          c.set("authenticated", true);
        }
      } catch (error) {
        logger.debug('Optional auth failed, continuing without auth:', error);
      }
    }
  }
  
  c.set("authenticated", c.get("user") ? true : false);
  await next();
};

/**
 * Get authenticated user from context
 */
export const getAuthUser = (c: Context): ExtendedUserTokenPayload => {
  const user = c.get("user");
  if (!user) {
    throw new Error(
      "No authenticated user found in context. Did you forget authMiddleware?"
    );
  }
  return user;
};

/**
 * Get authenticated user with fallback (for optional auth)
 */
export const getOptionalAuthUser = (c: Context): ExtendedUserTokenPayload | null => {
  return c.get("user") || null;
};

/**
 * Check if current user has specific role
 */
export const requireRole = (requiredRole: string) => {
  return async (c: Context, next: Next) => {
    const user = getAuthUser(c);
    if (user.role !== requiredRole) {
      logger.warn(`Role access denied`, {
        userId: user.userId,
        userRole: user.role,
        requiredRole,
        ip: c.req.header('CF-Connecting-IP') || 'unknown'
      });
      return c.json({ error: `${requiredRole} role required` }, 403);
    }
    await next();
  };
};

/**
 * Check if current user has any of the specified roles
 */
export const requireAnyRole = (roles: string[]) => {
  return async (c: Context, next: Next) => {
    const user = getAuthUser(c);
    if (!roles.includes(user.role)) {
      logger.warn(`Role access denied - none of required roles`, {
        userId: user.userId,
        userRole: user.role,
        requiredRoles: roles,
        ip: c.req.header('CF-Connecting-IP') || 'unknown'
      });
      return c.json({ error: `One of these roles required: ${roles.join(', ')}` }, 403);
    }
    await next();
  };
};

/**
 * Middleware to check token health and provide warnings
 */
export const tokenHealthMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "").trim();
    if (token) {
      try {
        const stats = await getTokenStats(token);
        
        // Add token health headers
        c.header('X-Token-Cached', stats.cached.toString());
        c.header('X-Token-Failed-Attempts', stats.failedAttempts.toString());
        
        if (stats.failedAttempts > 0) {
          logger.warn(`Token has failed attempts`, {
            failedAttempts: stats.failedAttempts,
            tokenPreview: token.slice(-8)
          });
        }
      } catch (error) {
        logger.debug('Token health check failed:', error);
      }
    }
  }
  
  await next();
};

/**
 * Get client information from context
 */
export const getClientInfo = (c: Context) => {
  return c.get("clientInfo") || {
    ipAddress: 'unknown',
    userAgent: 'unknown',
    deviceInfo: undefined,
  };
};

/**
 * Get authentication timing information
 */
export const getAuthTiming = (c: Context) => {
  const authTime = c.get("authTime");
  return authTime ? Date.now() - authTime : 0;
};
