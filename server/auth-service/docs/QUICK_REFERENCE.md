# Auth Service - Quick Reference Guide

## 🚀 Getting Started

### Base URL
```
http://localhost:5000
```

### Required Headers
```
Content-Type: application/json
Authorization: Bearer <token> // For authenticated endpoints
```

---

## 📝 Most Common Endpoints

### 1. Register New User
```bash
POST /auth/register
{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "SecurePass123",
  "role": "CLIENT"
}
```

### 2. Login User
```bash
POST /auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123" 
}
```

### 3. Verify Token (for other services)
```bash
POST /verify-token
Headers: Authorization: Bearer <token>
```

### 4. Logout User
```bash
POST /auth/logout
Headers: Authorization: Bearer <token>
```

---

## 🔐 Password Reset Flow

### Step 1: Request OTP
```bash
POST /auth/forgot-password
{
  "email": "john@example.com"
}
```

### Step 2: Reset with OTP
```bash
POST /auth/reset-password
{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePass123"
}
```

---

## 👤 Profile Management

### Get Profile (CLIENT)
```bash
GET /client/profile
Headers: Authorization: Bearer <token>
```

### Update Profile (CLIENT)
```bash
PUT /client/profile
Headers: Authorization: Bearer <token>
{
  "companyName": "Acme Corp",
  "industry": "Technology"
}
```

### Get Profile (FREELANCER)
```bash
GET /freelancer/profile  
Headers: Authorization: Bearer <token>
```

### Update Profile (FREELANCER)
```bash
PUT /freelancer/profile
Headers: Authorization: Bearer <token>
{
  "bio": "Full-stack developer",
  "hourlyRate": 75.00,
  "experienceLevel": "SENIOR"
}
```

---

## 🔒 OTP Operations

### Request OTP
```bash
POST /otp/request
{
  "email": "john@example.com",
  "type": "EMAIL_VERIFICATION"
}
```

### Verify OTP
```bash
POST /otp/verify
{
  "email": "john@example.com", 
  "otp": "123456",
  "type": "EMAIL_VERIFICATION"
}
```

---

## 🔍 Monitoring & Health

### Basic Health Check
```bash
GET /health
```

### Detailed Metrics
```bash
GET /monitoring/health/detailed
```

---

## ⚠️ Rate Limits

| Endpoint | Limit | Window |
|----------|--------|--------|
| Register | 3/hour | Per IP |
| Login | 5/15min | Per email |
| Password Reset | 3/hour | Per IP |
| OTP Request | 5/30min | Per IP |
| Token Verify | 100/min | Per IP |

---

## 🎯 Response Codes

- **200** - Success
- **201** - Created  
- **400** - Invalid input
- **401** - Invalid credentials
- **429** - Rate limited
- **500** - Server error

---

## 💡 Tips for Frontend Team

1. **Store tokens securely** - Use httpOnly cookies in production
2. **Handle rate limits** - Show user-friendly error messages
3. **Validate inputs** - Match password requirements on frontend
4. **Monitor token expiry** - Tokens last 7 days
5. **Use health endpoint** - Check service status
6. **Handle CORS** - Service allows localhost:3000
7. **Session tracking** - Active sessions shown in health response
8. **Error handling** - All errors have consistent format

---

## 🧪 cURL Examples

### Registration
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123", 
    "role": "CLIENT"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### Token Verification
```bash
curl -X POST http://localhost:5000/verify-token \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Health Check
```bash
curl http://localhost:5000/health
```

---

## 🔧 Development Setup

1. **Start Services**
   ```bash
   docker compose up -d
   ```

2. **Check Status**
   ```bash
   docker compose ps
   ```

3. **View Logs**
   ```bash
   docker compose logs auth_service
   ```

4. **Stop Services**
   ```bash
   docker compose down
   ```
