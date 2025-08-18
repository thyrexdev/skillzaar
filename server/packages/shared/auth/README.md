# Redis-Enhanced Authentication System

A comprehensive authentication system with Redis integration for caching, session management, token blacklisting, and security features.

## Features

- 🚀 **Token Caching**: Reduce JWT verification overhead with intelligent Redis caching
- 🔒 **Token Blacklisting**: Secure logout and security incident handling
- 📱 **Session Management**: Full session lifecycle with device tracking
- 🛡️ **Rate Limiting**: Protect against brute force attacks
- 🔄 **Refresh Tokens**: Secure token renewal mechanism
- 📊 **Activity Tracking**: Monitor user sessions and security events
- 🌐 **Multi-Device Support**: Handle concurrent sessions across devices
- ⚡ **Performance Optimized**: Redis-backed for high performance

## Quick Start

```typescript
import { 
  getUserFromToken, 
  blacklistToken, 
  createSession, 
  authMiddleware 
} from '@vync/shared';

// Use in your Hono routes
app.use('/api/protected/*', authMiddleware);

// Get user from token (with Redis caching)
const user = await getUserFromToken(token);

// Create a session
const { accessToken, refreshToken, sessionId } = await createSession(
  userId, 
  'CLIENT', 
  {
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    deviceInfo: 'iPhone 13'
  }
);

// Logout (blacklist token)
await blacklistToken(token, 'User logout');
```

## Core Components

### 1. Enhanced Token Verification (`getUserFromToken.ts`)

The main authentication function with Redis integration:

```typescript
import { getUserFromToken } from '@vync/shared';

// Basic usage
const user = await getUserFromToken(token);

// With options
const user = await getUserFromToken(token, {
  skipCache: false,        // Use Redis cache
  updateActivity: true,    // Update last activity
  sessionInfo: {           // Add session context
    ipAddress: '192.168.1.1',
    userAgent: 'Chrome/91.0',
    deviceInfo: 'Desktop'
  }
});

// Read-only verification (no cache updates)
const user = await verifyTokenReadOnly(token);

// Force refresh from JWT
const user = await refreshTokenFromJWT(token);
```

**Features:**
- ✅ Automatic Redis caching (15-minute TTL)
- ✅ Blacklist checking
- ✅ Failed attempt rate limiting
- ✅ Activity tracking
- ✅ Graceful fallback to direct JWT verification

### 2. Session Management (`session-manager.ts`)

Complete session lifecycle management:

```typescript
import { SessionManager } from '@vync/shared';

// Create session
const session = await SessionManager.createSession('user123', 'CLIENT', {
  ipAddress: '192.168.1.1',
  userAgent: 'Chrome/91.0',
  deviceInfo: 'Desktop',
  location: { country: 'US', city: 'San Francisco' },
  extendedTTL: false // true for "Remember Me"
});

// Get user's active sessions
const sessions = await SessionManager.getUserSessions('user123');

// Destroy specific session
await SessionManager.destroySession('user123', sessionId, 'User logout');

// Destroy all user sessions (security incident)
await SessionManager.destroyAllUserSessions('user123', 'Password changed');

// Refresh token
const newTokens = await SessionManager.refreshToken(refreshToken);
```

### 3. Enhanced Middleware (`auth.middleware.ts`)

Production-ready middleware with security features:

```typescript
import { 
  authMiddleware, 
  adminAuthMiddleware, 
  optionalAuthMiddleware,
  requireRole,
  requireAnyRole 
} from '@vync/shared';

// Standard auth middleware
app.use('/api/protected/*', authMiddleware);

// Admin-only routes
app.use('/api/admin/*', adminAuthMiddleware);

// Optional auth (user context if token provided)
app.use('/api/mixed/*', optionalAuthMiddleware);

// Role-based access
app.use('/api/freelancer/*', requireRole('FREELANCER'));
app.use('/api/staff/*', requireAnyRole(['ADMIN', 'MODERATOR']));
```

**Features:**
- ✅ IP-based rate limiting (100 req/min)
- ✅ Comprehensive security logging
- ✅ Client information extraction
- ✅ Token health monitoring
- ✅ Role-based access control

### 4. Redis Auth Utilities (`redis-auth.ts`)

Advanced Redis-backed authentication utilities:

```typescript
import { 
  tokenManager, 
  authSessionManager, 
  authUserManager 
} from '@vync/shared';

// Token management
const isBlacklisted = await tokenManager.isTokenBlacklisted(token);
await tokenManager.blacklistToken(token, 'Security incident');
await tokenManager.clearTokenCache(token);

// Session management
const sessionId = await authSessionManager.createSession(userId, sessionData);
await authSessionManager.updateLastActivity(userId, sessionId);

// User management
const { token, sessionId } = await authUserManager.createTokenWithSession(
  userId, 
  role, 
  { ipAddress, userAgent }
);
await authUserManager.logout(token, userId, sessionId);
```

## Configuration

### Environment Variables

```bash
# Redis (from @vync/cache)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=15m
```

### Constants (Customizable)

```typescript
// In getUserFromToken.ts
const TOKEN_CACHE_TTL = 15 * 60; // 15 minutes
const BLACKLIST_TTL = 7 * 24 * 60 * 60; // 7 days
const MAX_FAILED_ATTEMPTS = 5;

// In session-manager.ts
const SESSION_TTL = 24 * 60 * 60; // 24 hours
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 days
const MAX_SESSIONS_PER_USER = 5;
```

## API Reference

### Core Functions

#### `getUserFromToken(token: string, options?: GetUserOptions)`

Enhanced token verification with Redis caching.

**Parameters:**
- `token` - JWT token string
- `options.skipCache` - Bypass Redis cache
- `options.updateActivity` - Update last activity timestamp
- `options.sessionInfo` - Add session context

**Returns:** `ExtendedUserTokenPayload | null`

#### `blacklistToken(token: string, reason?: string, metadata?: any)`

Blacklist a token (for logout, security incidents).

#### `SessionManager.createSession(userId, role, options)`

Create a new user session with device tracking.

#### `SessionManager.refreshToken(refreshToken)`

Refresh access token using refresh token.

### Middleware Functions

#### `authMiddleware(c: Context, next: Next)`

Main authentication middleware with rate limiting and security.

#### `adminAuthMiddleware(c: Context, next: Next)`

Admin-only authentication middleware.

#### `requireRole(role: string)`

Role-based access control middleware factory.

### Utility Functions

#### `getTokenStats(token: string)`

Get token cache statistics and health info.

#### `batchVerifyTokens(tokens: string[])`

Efficiently verify multiple tokens in parallel.

#### `cleanupExpiredSessions()`

Clean up expired sessions (run periodically).

## Security Features

### Token Blacklisting
- Secure logout functionality
- Security incident handling
- Configurable TTL (default: 7 days)

### Rate Limiting
- Failed attempt tracking (max 5 attempts)
- IP-based rate limiting (100 req/min)
- Automatic token blocking on abuse

### Session Security
- Device fingerprinting
- IP address monitoring
- Session age validation
- Concurrent session limiting

### Activity Tracking
- Last activity timestamps
- Location tracking (optional)
- Security event logging
- Suspicious activity detection

## Performance Optimizations

### Redis Caching Strategy
- 15-minute token cache TTL
- Intelligent cache invalidation
- Fallback to direct JWT verification
- Batch operations for efficiency

### Connection Management
- Redis connection pooling
- Graceful error handling
- Circuit breaker pattern
- Health monitoring

## Error Handling

The system implements comprehensive error handling:

```typescript
try {
  const user = await getUserFromToken(token);
  if (!user) {
    // Token invalid, expired, or blacklisted
    return res.status(401).json({ error: 'Invalid token' });
  }
} catch (error) {
  // System error - Redis down, etc.
  logger.error('Auth system error:', error);
  return res.status(500).json({ error: 'Authentication service unavailable' });
}
```

## Monitoring and Observability

### Logging
- Structured logging with contextual information
- Security event tracking
- Performance metrics
- Error tracking

### Metrics (Available)
- Active sessions count
- Token cache hit rate
- Failed authentication attempts
- Session duration statistics

### Health Checks
- Redis connectivity
- Token validation performance
- Session cleanup status
- Rate limiting status

## Migration Guide

### From Basic JWT to Redis-Enhanced Auth

1. **Update imports:**
```typescript
// Before
import { getUserFromToken } from '@vync/shared';

// After - same import, enhanced functionality
import { getUserFromToken } from '@vync/shared';
```

2. **Update middleware:**
```typescript
// Before
app.use('/api/*', authMiddleware);

// After - same usage, enhanced security
app.use('/api/*', authMiddleware);
```

3. **Add session management (optional):**
```typescript
// New capability
const { accessToken, refreshToken } = await SessionManager.createSession(
  userId, role, { ipAddress, userAgent }
);
```

## Best Practices

### Security
- Always use HTTPS in production
- Rotate JWT secrets regularly
- Monitor for suspicious activity
- Implement proper CORS policies
- Use secure session storage

### Performance
- Configure Redis with appropriate memory limits
- Monitor cache hit rates
- Use batch operations when possible
- Implement proper connection pooling
- Set up Redis clustering for high availability

### Monitoring
- Set up alerts for failed authentication spikes
- Monitor session creation patterns
- Track token blacklist size
- Alert on Redis connectivity issues
- Monitor rate limiting effectiveness

## Examples

### Complete Authentication Flow

```typescript
// 1. Login
const { accessToken, refreshToken, sessionId } = await SessionManager.createSession(
  userId, 
  userRole,
  {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    deviceInfo: req.headers['x-device-info']
  }
);

// 2. Protected route access
app.get('/api/profile', authMiddleware, (c) => {
  const user = getAuthUser(c);
  return c.json({ profile: user });
});

// 3. Token refresh
app.post('/api/auth/refresh', async (c) => {
  const { refreshToken } = await c.req.json();
  const tokens = await SessionManager.refreshToken(refreshToken);
  
  if (!tokens) {
    return c.json({ error: 'Invalid refresh token' }, 401);
  }
  
  return c.json(tokens);
});

// 4. Logout
app.post('/api/auth/logout', authMiddleware, async (c) => {
  const user = getAuthUser(c);
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  
  await SessionManager.destroySession(user.userId, user.sessionId, 'User logout');
  await blacklistToken(token, 'User logout');
  
  return c.json({ message: 'Logged out successfully' });
});

// 5. Admin route
app.get('/api/admin/stats', adminAuthMiddleware, async (c) => {
  const stats = await SessionManager.getSessionStats();
  return c.json(stats);
});
```

This Redis-enhanced authentication system provides enterprise-grade security, performance, and monitoring capabilities while maintaining a simple, developer-friendly API.
