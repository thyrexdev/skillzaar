# Auth Service API Documentation

## Base URL
```
http://localhost:5000
```

## Table of Contents
- [Authentication Endpoints](#authentication-endpoints)
- [OTP Endpoints](#otp-endpoints)
- [Token Verification](#token-verification)
- [Client/Freelancer Profile Endpoints](#clientfreelancer-profile-endpoints)
- [OAuth Endpoints](#oauth-endpoints)
- [Monitoring Endpoints](#monitoring-endpoints)
- [Error Responses](#error-responses)
- [Rate Limiting](#rate-limiting)

---

## Authentication Endpoints

### 1. User Registration
**POST** `/auth/register`

Register a new user with role-based profile creation.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123",
  "role": "CLIENT" // or "FREELANCER" or "ADMIN"
}
```

**Validation Rules:**
- `name`: Minimum 2 characters
- `email`: Valid email format
- `password`: Minimum 8 characters, must contain lowercase, uppercase, and number
- `role`: Must be one of: CLIENT, FREELANCER, ADMIN

**Success Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "role": "CLIENT",
    "status": "ACTIVE",
    "isVerified": false,
    "createdAt": "2025-08-19T16:45:51.399Z",
    "updatedAt": "2025-08-19T16:45:51.399Z",
    "googleId": null,
    "profilePicture": null,
    "authProvider": "EMAIL"
  },
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Rate Limit:** 3 requests per hour per IP

---

### 2. User Login
**POST** `/auth/login`

Authenticate user and create session.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "role": "CLIENT",
    "status": "ACTIVE",
    "isVerified": false,
    "createdAt": "2025-08-19T16:45:51.399Z",
    "updatedAt": "2025-08-19T16:45:51.399Z",
    "googleId": null,
    "profilePicture": null,
    "authProvider": "EMAIL"
  },
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Rate Limit:** 5 requests per 15 minutes per email (resets on successful login)

---

### 3. User Logout
**POST** `/auth/logout`

Logout user and blacklist token.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:** None

**Success Response (200):**
```json
{
  "message": "Successfully logged out"
}
```

---

### 4. Forgot Password
**POST** `/auth/forgot-password`

Request password reset OTP.

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Success Response (200):**
```json
{
  "message": "Password reset OTP sent to email"
}
```

**Rate Limit:** 3 requests per hour per IP

---

### 5. Reset Password
**POST** `/auth/reset-password`

Reset password using OTP.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePassword123"
}
```

**Validation Rules:**
- `otp`: 4-8 characters, numbers only
- `newPassword`: Same rules as registration password

**Success Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

**Rate Limit:** 3 requests per hour per IP

---

## OTP Endpoints

### 1. Request OTP
**POST** `/otp/request`

Request OTP for various purposes.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "type": "PASSWORD_RESET" // or "EMAIL_VERIFICATION", "TWO_FACTOR_AUTH", "ACCOUNT_VERIFICATION"
}
```

**Success Response (200):**
```json
{
  "message": "OTP sent successfully"
}
```

**Rate Limit:** 5 requests per 30 minutes per IP

---

### 2. Verify OTP
**POST** `/otp/verify`

Verify OTP code.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "otp": "123456",
  "type": "PASSWORD_RESET"
}
```

**Success Response (200):**
```json
{
  "message": "OTP verified successfully"
}
```

**Rate Limit:** 10 requests per hour per IP

---

## Token Verification

### Verify Token
**POST** `/verify-token`

Verify JWT token validity (used by other services).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:** None

**Success Response (200):**
```json
{
  "sub": "user-uuid",
  "role": "CLIENT",
  "exp": 1756226772,
  "lastActivity": 1755621985246
}
```

**Rate Limit:** 100 requests per minute per IP

---

## Client/Freelancer Profile Endpoints

### 1. Get Client Profile
**GET** `/client/profile`

Get current user's client profile.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "fullName": "John Doe",
  "companyName": null,
  "industry": null,
  "description": null,
  "website": null,
  "address": null,
  "phoneNumber": null,
  "createdAt": "2025-08-19T16:45:51.399Z",
  "updatedAt": "2025-08-19T16:45:51.399Z"
}
```

---

### 2. Update Client Profile
**PUT** `/client/profile`

Update current user's client profile.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "companyName": "Acme Corp",
  "industry": "Technology",
  "description": "Leading tech company",
  "website": "https://acme.com",
  "address": "123 Main St, City, Country",
  "phoneNumber": "+1234567890"
}
```

**Success Response (200):**
```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "fullName": "John Doe",
  "companyName": "Acme Corp",
  "industry": "Technology",
  "description": "Leading tech company",
  "website": "https://acme.com",
  "address": "123 Main St, City, Country",
  "phoneNumber": "+1234567890",
  "createdAt": "2025-08-19T16:45:51.399Z",
  "updatedAt": "2025-08-19T16:45:51.399Z"
}
```

---

### 3. Get Freelancer Profile
**GET** `/freelancer/profile`

Get current user's freelancer profile.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "fullName": "Jane Smith",
  "bio": "Full-stack developer with 5 years experience",
  "hourlyRate": 75.00,
  "experienceLevel": "SENIOR",
  "skills": ["JavaScript", "React", "Node.js"],
  "portfolioLinks": [
    {
      "title": "E-commerce App",
      "description": "React-based shopping platform",
      "imageUrls": ["https://example.com/img1.jpg"],
      "liveUrl": "https://app.example.com"
    }
  ],
  "contractsCount": 12,
  "reviewsCount": 8,
  "createdAt": "2025-08-19T16:45:51.399Z",
  "updatedAt": "2025-08-19T16:45:51.399Z"
}
```

---

### 4. Update Freelancer Profile
**PUT** `/freelancer/profile`

Update current user's freelancer profile.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "bio": "Full-stack developer with 5 years experience",
  "hourlyRate": 75.00,
  "experienceLevel": "SENIOR" // "JUNIOR", "MID_LEVEL", "SENIOR", "EXPERT"
}
```

**Success Response (200):**
```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "fullName": "Jane Smith",
  "bio": "Full-stack developer with 5 years experience",
  "hourlyRate": 75.00,
  "experienceLevel": "SENIOR",
  "createdAt": "2025-08-19T16:45:51.399Z",
  "updatedAt": "2025-08-19T16:45:51.399Z"
}
```

---

## OAuth Endpoints

### 1. Google OAuth Login
**GET** `/oauth/google`

Redirect to Google OAuth authorization.

**Query Parameters:**
- `redirect_uri` (optional): Frontend callback URL

**Response:** Redirects to Google OAuth

---

### 2. Google OAuth Callback
**GET** `/oauth/google/callback`

Handle Google OAuth callback (internal use).

**Query Parameters:**
- `code`: Authorization code from Google
- `state`: Optional state parameter

**Response:** Redirects to frontend with token or error

---

## Monitoring Endpoints

### 1. Health Check
**GET** `/health`

Basic health check.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-19T16:47:09.186Z",
  "redis": {
    "connected": true,
    "activeSessions": 1
  },
  "version": "1.0.0"
}
```

---

### 2. Detailed Health Check
**GET** `/monitoring/health/detailed`

Comprehensive system metrics.

**Response (200):**
```json
{
  "service": "auth-service",
  "status": "healthy",
  "timestamp": "2025-08-19T16:45:30.919Z",
  "uptime": 47130,
  "version": "1.0.0",
  "health": {
    "redis": true,
    "authentication": true,
    "performance": true,
    "errors": true
  },
  "metrics": {
    "authentication": {
      "successRate": 95.5,
      "totalAttempts": 100,
      "activeUsers": 25,
      "totalSessions": 30
    },
    "performance": {
      "avgResponseTime": 120,
      "throughput": 150,
      "errorRate": 2.1,
      "slowQueries": 0
    },
    "redis": {
      "status": "connected",
      "activeSessions": 30,
      "blacklistedTokens": 5,
      "memoryUsage": "1.09M"
    },
    "security": {
      "suspiciousActivities": 0,
      "rateLimitHits": 12,
      "failedAttemptsByIp": 3
    }
  },
  "alerts": []
}
```

---

## Error Responses

### Common Error Format
All error responses follow this format:

```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid credentials |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

### Common Error Messages

**Validation Errors (400):**
```json
{
  "error": "Name must be at least 2 characters long"
}
```

**Authentication Errors (401):**
```json
{
  "error": "Invalid credentials"
}
```

**Rate Limit Errors (429):**
```json
{
  "error": "Too many login attempts. Please try again later.",
  "retryAfter": 1755622904
}
```

---

## Rate Limiting

The auth service implements comprehensive rate limiting:

| Endpoint | Limit | Window | Notes |
|----------|--------|--------|--------|
| `/auth/register` | 3 requests | 1 hour | Per IP |
| `/auth/login` | 5 requests | 15 minutes | Per email, resets on success |
| `/auth/forgot-password` | 3 requests | 1 hour | Per IP |
| `/auth/reset-password` | 3 requests | 1 hour | Per IP |
| `/otp/request` | 5 requests | 30 minutes | Per IP |
| `/otp/verify` | 10 requests | 1 hour | Per IP |
| `/verify-token` | 100 requests | 1 minute | Per IP |

### Rate Limit Headers
All responses include rate limit headers:
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1755622904
```

---

## Authentication Flow Examples

### 1. User Registration Flow
```javascript
// 1. Register user
const response = await fetch('/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'SecurePass123',
    role: 'CLIENT'
  })
});

const { user, token } = await response.json();

// 2. Store token for future requests
localStorage.setItem('authToken', token);
```

### 2. User Login Flow
```javascript
// 1. Login user
const response = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'SecurePass123'
  })
});

const { user, token } = await response.json();

// 2. Store token
localStorage.setItem('authToken', token);
```

### 3. Authenticated Requests
```javascript
// Use token in subsequent requests
const token = localStorage.getItem('authToken');

const response = await fetch('/client/profile', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const profile = await response.json();
```

### 4. Password Reset Flow
```javascript
// 1. Request password reset
await fetch('/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com'
  })
});

// 2. User enters OTP from email
const otp = '123456'; // From user input

// 3. Reset password
await fetch('/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    otp: otp,
    newPassword: 'NewSecurePass123'
  })
});
```

---

## Frontend Integration Notes

1. **Token Storage**: Store JWT tokens securely (httpOnly cookies recommended for production)

2. **Token Refresh**: Tokens expire in 7 days. Monitor expiration and handle refresh

3. **Error Handling**: Always handle rate limiting and authentication errors gracefully

4. **CORS**: Service supports CORS for `http://localhost:3000` and `http://127.0.0.1:3000`

5. **WebSocket**: Chat service requires separate WebSocket connection with token authentication

6. **File Uploads**: Use media service endpoints for profile pictures and portfolio images

7. **Real-time Updates**: Consider implementing WebSocket connections for real-time session updates

8. **Security**: Always validate user input on frontend before sending to API

9. **Performance**: User data is cached for 1 hour, so repeated profile requests are fast

10. **Monitoring**: Use health endpoints to display system status in admin dashboards
