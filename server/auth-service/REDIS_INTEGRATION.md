# Redis Integration in Auth Service

This document outlines the comprehensive Redis integration implemented in the auth-service to improve performance, security, and scalability.

## Overview

The Redis integration provides the following key features:

- **Session Management**: User sessions stored in Redis with automatic expiration
- **User Data Caching**: Frequently accessed user data cached for faster retrieval
- **Token Blacklisting**: JWT tokens invalidated on logout using Redis TTL
- **OTP Caching**: OTP data cached with automatic expiration for faster verification
- **Rate Limiting**: Prevent brute force attacks using Redis-based rate limiting
- **Health Monitoring**: Track active sessions and Redis connectivity

## Features Implemented

### 1. Session Management

- **Session Creation**: When users log in, session data is stored in Redis with TTL
- **Session Tracking**: Track login time, last activity, IP address, and user agent
- **Session Extension**: Automatically extend session TTL on user activity
- **Session Cleanup**: Remove sessions on logout or expiration

**Redis Keys:**
- `session:{userId}` - User session data
- `tag:active_sessions` - Set of active user IDs

### 2. User Data Caching

- **Cache on Authentication**: User data cached on login/register
- **Cache Refresh**: Automatic cache refresh from database when needed
- **Cache Invalidation**: Remove stale user data from cache
- **Fallback Strategy**: Continue operation if Redis is unavailable

**Redis Keys:**
- `user:{userId}` - Cached user profile data

### 3. Token Blacklisting

- **Logout Blacklisting**: Tokens added to blacklist on logout
- **Automatic Expiration**: Blacklisted tokens expire based on JWT expiry
- **Fast Verification**: Check blacklist before token validation
- **Memory Efficient**: Uses Redis TTL to automatically clean up expired entries

**Redis Keys:**
- `blacklist:{tokenHash}` - Individual blacklisted tokens
- `tag:blacklisted_tokens` - Set of all blacklisted token hashes

### 4. OTP Caching

- **Fast Verification**: OTP data cached for immediate verification
- **Rate Limiting**: Prevent rapid OTP requests using Redis TTL
- **Attempt Tracking**: Track verification attempts in Redis
- **Automatic Cleanup**: OTPs expire automatically based on configuration

**Redis Keys:**
- `otp:pending:{email}:{type}` - Pending OTP data
- `otp:attempts:{email}:{type}` - Verification attempt counter
- `otp:ratelimit:{email}:{type}` - Rate limiting for OTP requests

### 5. Rate Limiting

- **Login Protection**: Limit login attempts per IP and email
- **Registration Throttling**: Prevent spam registrations
- **OTP Request Limiting**: Control OTP generation frequency
- **Token Verification**: Rate limit token verification requests
- **Sliding Window**: Advanced rate limiting with precise time windows

**Rate Limits:**
- **Login**: 5 attempts per 15 minutes (per email)
- **Registration**: 3 attempts per hour (per IP)
- **Password Reset**: 3 attempts per hour (per IP)
- **OTP Requests**: 5 attempts per 30 minutes (per IP)
- **OTP Verification**: 10 attempts per hour (per IP)
- **Token Verification**: 100 requests per minute (per IP)

## Endpoints Enhanced

### Authentication Endpoints
- `POST /auth/register` - Rate limited, caches user data
- `POST /auth/login` - Rate limited, creates session, caches user data
- `POST /auth/logout` - Blacklists token, removes session
- `POST /auth/forgot-password` - Rate limited
- `POST /auth/reset-password` - Rate limited

### OTP Endpoints
- `POST /otp/request` - Rate limited, caches OTP data
- `POST /otp/verify` - Rate limited, fast cache-based verification

### Utility Endpoints
- `POST /verify-token` - Rate limited, checks blacklist, caches user data
- `GET /health` - Shows Redis status and active sessions count

## Redis Data Structures Used

### Strings
- User session data (JSON)
- Cached user profiles (JSON)
- OTP data (JSON)
- Rate limiting counters
- Token blacklist flags

### Sets
- Active sessions tracking
- Blacklisted tokens tracking

### Sorted Sets
- Rate limiting with sliding windows
- Time-based operations

### TTL (Time To Live)
- Automatic cleanup of expired data
- Session expiration (7 days default)
- OTP expiration (based on type configuration)
- Rate limit windows
- Token blacklist expiration

## Configuration

### Session Settings
- **Default TTL**: 7 days
- **Extension on Activity**: Yes
- **Track IP/User Agent**: Yes

### Cache Settings
- **User Data TTL**: 1 hour
- **Fallback Strategy**: Continue without cache
- **Auto Refresh**: On cache miss

### Rate Limiting Settings
- **Strategy**: Sliding window
- **Headers**: X-RateLimit-* headers included
- **Error Messages**: User-friendly with retry information

## Error Handling

### Redis Unavailable
- **Session Management**: Continue without session tracking
- **User Caching**: Fall back to database queries
- **Rate Limiting**: Allow requests (fail open)
- **OTP Verification**: Use database only
- **Token Blacklisting**: Skip blacklist check

### Redis Errors
- **Logging**: All Redis errors logged for monitoring
- **Graceful Degradation**: Service continues without Redis features
- **Health Check**: Reports Redis connection status

## Performance Benefits

### Reduced Database Load
- User data served from cache
- OTP verification without database hits
- Session data in memory

### Faster Response Times
- Cache-first strategies
- In-memory operations
- Reduced query complexity

### Better Security
- Token blacklisting prevents replay attacks
- Rate limiting prevents brute force
- Session tracking for audit trails

### Scalability
- Stateless authentication with cached state
- Distributed rate limiting
- Horizontal scaling support

## Monitoring

### Health Check Endpoint
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "redis": {
    "connected": true,
    "activeSessions": 42
  },
  "version": "1.0.0"
}
```

### Metrics Tracked
- Redis connection status
- Active sessions count
- Cache hit/miss rates (in logs)
- Rate limit violations (in logs)

## Deployment Considerations

### Redis Configuration
- **Memory Policy**: `allkeys-lru` recommended
- **Persistence**: RDB + AOF for durability
- **Clustering**: Supported for high availability

### Environment Variables
Ensure these are set in your Redis configuration:
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD` (if authentication required)

### Monitoring
- Monitor Redis memory usage
- Track connection pool metrics
- Alert on Redis disconnections

## Future Enhancements

### Planned Features
- **Multi-device Sessions**: Track multiple sessions per user
- **Advanced Analytics**: User behavior tracking
- **Geo-location**: IP-based location tracking
- **Device Fingerprinting**: Enhanced security
- **Cache Preloading**: Predictive caching strategies

### Optimization Opportunities
- **Pipeline Operations**: Batch Redis commands
- **Compression**: Compress large cached objects
- **Read Replicas**: Distribute read operations
- **Partitioning**: Shard data across Redis instances
