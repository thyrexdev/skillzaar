# Auth Service Documentation

Welcome to the Vync Auth Service documentation! This folder contains comprehensive documentation for frontend developers and API consumers.

## 📋 Documentation Files

### 📖 [API.md](./API.md)
**Comprehensive API Documentation**
- Complete endpoint reference with request/response examples
- Authentication flows and error handling
- Rate limiting details and security features
- Frontend integration guidelines

### ⚡ [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) 
**Quick Reference Guide**
- Essential endpoints and cURL examples
- Common request/response patterns
- Rate limiting summary table
- Development tips and tricks

### 🔧 [Vync_Auth_Service.postman_collection.json](./Vync_Auth_Service.postman_collection.json)
**Postman Collection**
- Complete API collection for testing
- Pre-configured environment variables
- Automated token management
- Rate limiting test scenarios

---

## 🚀 Getting Started

### 1. **Start the Service**
```bash
# From the server directory
docker compose up -d auth_service
```

### 2. **Verify Service is Running**
```bash
curl http://localhost:5000/health
```

### 3. **Import Postman Collection**
- Import `Vync_Auth_Service.postman_collection.json` into Postman
- Collection includes automated token handling
- Test all endpoints with pre-configured examples

---

## 🔑 Core Features

### **Authentication & Authorization**
- User registration with role-based profiles (CLIENT/FREELANCER/ADMIN)
- Secure JWT-based authentication
- Session management with Redis caching
- Token blacklisting for secure logout
- Password reset with OTP verification

### **Caching & Performance**
- Redis-based user data caching (1 hour TTL)
- Session caching with 7-day expiration
- Pipeline operations for optimal Redis performance
- Real-time session tracking

### **Rate Limiting & Security**
- IP-based and email-based rate limiting
- Progressive rate limiting (resets on successful login)
- Comprehensive security headers
- Failed attempt tracking and monitoring

### **Monitoring & Observability**
- Real-time health checks and metrics
- Performance monitoring with response times
- Security event tracking
- Prometheus-compatible metrics export

---

## 🌐 API Endpoints Overview

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login  
- `POST /auth/logout` - Secure logout
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Password reset confirmation

### Token Management
- `POST /verify-token` - Token validation for microservices

### Profile Management
- `GET /client/profile` - Get client profile
- `PUT /client/profile` - Update client profile
- `GET /freelancer/profile` - Get freelancer profile
- `PUT /freelancer/profile` - Update freelancer profile

### OTP Operations  
- `POST /otp/request` - Request OTP
- `POST /otp/verify` - Verify OTP

### OAuth
- `GET /oauth/google` - Google OAuth initiation
- `GET /oauth/google/callback` - OAuth callback handler

### Monitoring
- `GET /health` - Basic health check
- `GET /monitoring/health/detailed` - Comprehensive metrics
- `GET /monitoring/dashboard` - Dashboard summary
- `GET /monitoring/metrics` - Prometheus metrics

---

## 🛡️ Security Features

### Rate Limiting
| Endpoint | Limit | Window | Scope |
|----------|-------|--------|-------|
| Registration | 3/hour | IP |
| Login | 5/15min | Email (resets on success) |
| Password Reset | 3/hour | IP |
| OTP Operations | 5/30min | IP |
| Token Verification | 100/min | IP |

### Authentication Security
- JWT tokens with 7-day expiration
- Secure password hashing with bcrypt
- Token blacklisting on logout
- Session invalidation on security events
- Failed attempt tracking and blocking

### Data Protection
- User data cached for performance
- Sensitive data excluded from responses
- Secure session management in Redis
- IP address tracking for security

---

## 📊 Monitoring & Metrics

### Health Monitoring
- **Redis Connection**: Real-time connection status
- **Active Sessions**: Current user session count
- **Performance Metrics**: Response times and throughput
- **Error Tracking**: Error rates and failed operations
- **Security Events**: Suspicious activity monitoring

### Available Metrics
- Authentication success/failure rates
- Session creation and management stats
- OTP generation and verification rates
- Rate limiting hits and patterns
- Redis memory usage and performance
- System uptime and availability

---

## 🔧 Development Guidelines

### Frontend Integration
1. **Token Storage**: Use secure httpOnly cookies for production
2. **Error Handling**: Implement user-friendly error messages for rate limits
3. **Input Validation**: Match server-side validation rules on frontend
4. **Session Management**: Monitor active sessions and handle expiry
5. **CORS Configuration**: Service allows localhost:3000 and 127.0.0.1:3000

### Testing
1. **Use Postman Collection**: Pre-configured with all endpoints
2. **Test Rate Limits**: Verify rate limiting behavior
3. **Validate Responses**: Check response formats match documentation
4. **Monitor Performance**: Use health endpoints to check system status

### Production Considerations
1. **Environment Variables**: Ensure all required env vars are set
2. **SSL/TLS**: Use HTTPS in production environments
3. **Token Security**: Implement proper token refresh mechanisms
4. **Monitoring**: Set up alerts for service health and performance
5. **Backup Strategy**: Ensure Redis data persistence if needed

---

## 📞 Support

### Documentation Links
- [Complete API Reference](./API.md) - Full endpoint documentation
- [Quick Reference](./QUICK_REFERENCE.md) - Essential API calls
- [Postman Collection](./Vync_Auth_Service.postman_collection.json) - Ready-to-use testing

### Service URLs
- **Development**: http://localhost:5000
- **Health Check**: http://localhost:5000/health
- **Detailed Metrics**: http://localhost:5000/monitoring/health/detailed

### Docker Commands
```bash
# Start all services
docker compose up -d

# Check service status  
docker compose ps

# View auth service logs
docker compose logs auth_service -f

# Restart auth service
docker compose restart auth_service

# Stop all services
docker compose down
```

---

## 📋 Changelog

### Version 1.0.0
- ✅ Complete authentication system with JWT
- ✅ Redis caching and session management  
- ✅ Comprehensive rate limiting
- ✅ Real-time monitoring and metrics
- ✅ Role-based user profiles
- ✅ OTP-based password reset
- ✅ Google OAuth integration
- ✅ Postman collection and documentation
- ✅ Docker-based deployment
- ✅ TypeScript with full type safety

---

**Happy coding! 🚀**

For questions or issues, please check the health endpoints first, then review the logs using `docker compose logs auth_service`.
