# Auth Service Monitoring & Performance System

This document describes the comprehensive monitoring and performance system implemented for the Vync Auth Service, including Redis pipeline optimization, real-time metrics collection, and dashboard endpoints.

## 🚀 Features Overview

### Core Monitoring Components

1. **Real-time Metrics Collection** - Tracks authentication operations, session management, and performance
2. **Redis Pipeline Optimization** - Batch operations for improved performance
3. **Performance Monitoring** - Real-time alerting and slow query detection
4. **Dashboard Endpoints** - RESTful APIs for metrics visualization
5. **Health Check Enhancement** - Detailed system health with comprehensive metrics
6. **Prometheus Integration** - Export metrics in Prometheus format

## 📊 Monitoring Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Auth Routes   │    │   Monitoring     │    │   Dashboard     │
│   (Operations)  │────│   Middleware     │────│   Endpoints     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────│  Monitoring     │──────────────┘
                        │   Service       │
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │ Redis Pipeline  │
                        │   Operations    │
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │     Redis       │
                        │    Cache        │
                        └─────────────────┘
```

## 🔧 Implementation Details

### 1. Monitoring Service (`src/services/monitoring.service.ts`)

**Functional Design**: Uses pure functions instead of classes for better performance and simplicity.

**Key Features**:
- Real-time operation tracking
- Automatic metrics aggregation
- Performance analytics
- Security event logging
- Prometheus metrics export

**Example Usage**:
```typescript
import { 
  recordAuthOperation, 
  startOperation, 
  completeOperation 
} from './services/monitoring.service';

// Record a simple operation
recordAuthOperation('login', true, userId, clientIp, userAgent);

// Track complex operations
const operationId = startOperation('password_reset', userId, clientIp);
// ... perform operation ...
completeOperation(operationId, success, errorMessage);
```

### 2. Monitoring Middleware (`src/middleware/monitoring.middleware.ts`)

**Automatic Tracking**: Wraps all HTTP requests and auth operations with monitoring.

**Features**:
- Request/response time tracking
- Error rate monitoring
- User activity tracking
- Rate limiting monitoring
- Performance threshold alerts

**Integration**:
```typescript
// Applied globally
app.use('*', monitoringMiddleware());

// Applied to specific operations
app.get('/login', authMonitoringMiddleware('login'), loginHandler);
```

### 3. Redis Pipeline Service (`src/services/auth-pipeline.service.ts`)

**Optimized Operations**: Batch Redis operations for better performance.

**Pipeline Operations**:
- **Session Management**: Batch session create/update/destroy
- **User Caching**: Bulk user data caching
- **OTP Operations**: Efficient OTP lifecycle management
- **Token Blacklisting**: Batch token invalidation
- **Rate Limiting**: Batch rate limit checks
- **Cleanup Operations**: Automated expired data cleanup

**Example**:
```typescript
import { batchSessionOperations } from './services/auth-pipeline.service';

// Batch process multiple user sessions
const result = await batchSessionOperations([
  { userId: '1', sessionData: {...}, ttl: 3600, action: 'create' },
  { userId: '2', sessionData: {...}, ttl: 3600, action: 'update' },
  { userId: '3', sessionData: {...}, ttl: 3600, action: 'destroy' }
]);
```

## 📈 Dashboard Endpoints

All monitoring endpoints are available under `/monitoring` route:

### Core Metrics
- **GET /monitoring/metrics** - Comprehensive metrics overview
- **GET /monitoring/metrics/summary** - Dashboard-ready metrics summary
- **GET /monitoring/metrics/prometheus** - Prometheus formatted metrics

### Operations Analysis
- **GET /monitoring/operations/recent** - Recent operations (default 5min window)
- **GET /monitoring/operations/failed** - Failed operations with details
- **GET /monitoring/operations/slow** - Slow operations (>1s threshold)
- **GET /monitoring/operations/type/:type** - Operations filtered by type

### User Analytics
- **GET /monitoring/user/:userId/activity** - User-specific activity metrics
- **GET /monitoring/analytics/performance** - Performance analytics with breakdowns

### Health & Status
- **GET /monitoring/health/detailed** - Enhanced health check with full metrics
- **GET /monitoring/status** - Quick status overview with indicators
- **GET /monitoring/redis/health** - Redis-specific health metrics

### Maintenance
- **POST /monitoring/maintenance/cleanup** - Manual cleanup of expired data
- **POST /monitoring/maintenance/reset-metrics** - Reset metrics (development)

## 🎯 Key Metrics Tracked

### Authentication Metrics
```json
{
  "authentication": {
    "loginAttempts": 1234,
    "successfulLogins": 1180,
    "failedLogins": 54,
    "registrations": 89,
    "tokenVerifications": 5432,
    "passwordResets": 12,
    "logouts": 234
  }
}
```

### Performance Metrics
```json
{
  "performance": {
    "averageResponseTime": 145,
    "slowQueries": 3,
    "errorRate": 2.1,
    "throughput": 45.2
  }
}
```

### Security Metrics
```json
{
  "security": {
    "blacklistedTokens": 23,
    "rateLimitHits": 12,
    "suspiciousActivities": 2,
    "failedAttemptsByIp": {
      "192.168.1.100": 5,
      "10.0.0.50": 3
    }
  }
}
```

### Redis Metrics
```json
{
  "redis": {
    "connectionStatus": "connected",
    "keyCount": 1234,
    "memoryUsage": 52428800,
    "hitRate": 94.5,
    "avgLatency": 2.3
  }
}
```

## ⚡ Performance Features

### 1. Pipeline Optimization
- **Batch Operations**: Group multiple Redis commands
- **Atomic Transactions**: Ensure data consistency
- **Optimistic Locking**: Concurrent update handling
- **Rate Limiting**: Sliding window implementation

### 2. Real-time Alerts
- **Slow Operations**: >2s response time alert
- **High Error Rate**: >5% error rate alert
- **Redis Issues**: Connection/memory alerts
- **Performance Degradation**: Automatic detection

### 3. Automatic Cleanup
- **Expired Sessions**: Automatic cleanup every 5 minutes
- **Stale Tokens**: Blacklist cleanup
- **Old Metrics**: Historical data pruning
- **Memory Management**: Prevent memory leaks

## 🔍 Monitoring Best Practices

### 1. Operation Tracking
```typescript
// Always wrap auth operations
const operationId = startOperation('login', userId, clientIp, userAgent);
try {
  const result = await performLogin(credentials);
  completeOperation(operationId, true, undefined, result);
  return result;
} catch (error) {
  completeOperation(operationId, false, error.message);
  throw error;
}
```

### 2. Performance Monitoring
```typescript
// Use performance wrappers for critical functions
const optimizedFunction = withPerformanceMonitoring(
  'database_query',
  originalDatabaseFunction
);
```

### 3. Batch Operations
```typescript
// Prefer batch operations for multiple Redis operations
const sessionOps = users.map(user => ({
  userId: user.id,
  sessionData: user.sessionData,
  ttl: 3600,
  action: 'create'
}));

await batchSessionOperations(sessionOps);
```

## 🚨 Alerting Configuration

### Performance Thresholds
- **Response Time**: 2000ms (warning), 5000ms (critical)
- **Error Rate**: 5% (warning), 10% (critical)
- **Memory Usage**: 80% (warning), 95% (critical)
- **Redis Latency**: 50ms (warning), 100ms (critical)

### Security Thresholds
- **Failed Logins**: 5 per IP per minute
- **Rate Limit Hits**: 10 per minute per service
- **Suspicious Activity**: Any SQL injection attempts

## 📊 Dashboard Integration

### Grafana Integration
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'vync-auth-service'
    static_configs:
      - targets: ['localhost:5000']
    metrics_path: '/monitoring/metrics/prometheus'
    scrape_interval: 30s
```

### Custom Dashboards
The `/monitoring/analytics/performance` endpoint provides data perfect for custom dashboards:
- Operation breakdown by type
- Hourly distribution patterns
- Success/failure rates over time
- Performance trends

## 🔧 Configuration

### Environment Variables
```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password

# Monitoring Configuration
MONITORING_ENABLED=true
METRICS_RETENTION_HOURS=24
CLEANUP_INTERVAL_MINUTES=5
PERFORMANCE_THRESHOLD_MS=2000
```

### Service Configuration
```typescript
// Customize thresholds
export const performanceThresholds = {
  get: 50,       // 50ms for GET operations
  set: 100,      // 100ms for SET operations
  pipeline: 200, // 200ms for pipeline operations
  // ... customize per operation type
};
```

## 🚀 Getting Started

1. **Start the Service**:
   ```bash
   cd server/auth-service
   bun run dev
   ```

2. **Check Health**:
   ```bash
   curl http://localhost:5000/monitoring/health/detailed
   ```

3. **View Metrics**:
   ```bash
   curl http://localhost:5000/monitoring/metrics/summary
   ```

4. **Monitor Operations**:
   ```bash
   curl http://localhost:5000/monitoring/operations/recent
   ```

## 📚 API Reference

### Response Format
All monitoring endpoints return standardized responses:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "timeWindow": 300000  // if applicable
}
```

### Error Handling
```json
{
  "success": false,
  "error": "Description of the error",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🔒 Security Considerations

1. **Endpoint Protection**: Monitoring endpoints should be protected in production
2. **Data Sanitization**: User data in metrics is anonymized
3. **Rate Limiting**: Monitoring endpoints have their own rate limits
4. **Access Control**: Consider API keys for monitoring endpoints

## 📝 Troubleshooting

### Common Issues

1. **High Memory Usage**:
   - Check metrics retention settings
   - Ensure cleanup is running
   - Monitor operation history size

2. **Slow Performance**:
   - Check Redis connection latency
   - Review pipeline batch sizes
   - Monitor slow operations endpoint

3. **Missing Metrics**:
   - Verify middleware is applied
   - Check monitoring service initialization
   - Review Redis connection status

### Debug Commands
```bash
# Check service health
curl http://localhost:5000/health

# View slow operations
curl http://localhost:5000/monitoring/operations/slow?threshold=1000

# Check Redis health
curl http://localhost:5000/monitoring/redis/health

# Manual cleanup
curl -X POST http://localhost:5000/monitoring/maintenance/cleanup
```

## 🎉 Conclusion

This comprehensive monitoring system provides:
- ✅ **Real-time visibility** into auth service performance
- ✅ **Automated alerting** for performance and security issues  
- ✅ **Optimized Redis operations** with pipeline batching
- ✅ **Rich dashboard APIs** for custom monitoring solutions
- ✅ **Prometheus integration** for industry-standard monitoring
- ✅ **Security monitoring** with threat detection
- ✅ **Performance optimization** with automatic cleanup

The system is designed to scale with your needs and provide the insights necessary to maintain a high-performance, secure authentication service.
