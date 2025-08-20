# Admin Service Development Guide

## Setup Instructions

### 1. Install Dependencies
```bash
cd server
bun install
```

### 2. Environment Setup
Create a `.env` file in the admin-service directory:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/frevix"

# JWT Configuration
JWT_SECRET="your-jwt-secret-key"

# Service Configuration
ADMIN_PORT=3005
NODE_ENV=development

# Optional: Logging
LOG_LEVEL=debug
```

### 3. Database Setup
Ensure your database is set up with the Prisma schema:

```bash
# Generate Prisma client
bun run prisma generate

# Apply database migrations (if needed)
bun run prisma migrate dev
```

### 4. Create Admin User
You'll need an admin user to test the service. You can create one using the auth service or directly in the database:

```sql
-- Create admin user directly (example)
INSERT INTO "User" (id, email, password, name, role, "isVerified", "createdAt", "updatedAt") 
VALUES (
  'admin-user-id', 
  'admin@frevix.com', 
  '$2b$10$hashed_password_here', 
  'Admin User', 
  'ADMIN', 
  true, 
  NOW(), 
  NOW()
);
```

## Development Commands

```bash
# Start the admin service in development mode
bun run dev

# Start with specific port
PORT=3005 bun run dev

# Run with debugging
DEBUG=* bun run dev
```

## Testing the Service

### 1. Health Check
```bash
curl http://localhost:3005/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "admin-service",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 2. Authentication
First, get an admin JWT token from the auth service, then use it:

```bash
# Get admin token from auth service
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@frevix.com",
    "password": "admin_password"
  }'

# Use the token for admin requests
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3005/dashboard
```

### 3. User Management Testing

```bash
# Get user statistics
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3005/users/stats

# List users with filtering
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3005/users?role=CLIENT&page=1&limit=10"

# Get user details
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3005/users/USER_ID

# Suspend a user
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Testing suspension", "duration": 7}' \
  http://localhost:3005/users/USER_ID/suspend
```

### 4. Job Management Testing

```bash
# Get job statistics
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3005/jobs/stats

# List jobs with filtering
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3005/jobs?status=OPEN&category=web-development"

# Get job categories
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3005/jobs/categories
```

### 5. Financial Operations Testing

```bash
# Get financial statistics
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3005/financial/stats

# List transactions
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3005/financial/transactions?page=1&limit=20"

# List pending withdrawals
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3005/financial/withdrawals?status=PENDING"
```

### 6. Analytics Testing

```bash
# Get platform metrics
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3005/analytics/platform?timeRange=monthly"

# Get system health
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3005/analytics/system-health

# Get top performers
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3005/analytics/top-performers?limit=5"
```

### 7. Content Moderation Testing

```bash
# Get moderation stats
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3005/moderation/stats

# Get flagged messages
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3005/moderation/flagged/messages?page=1&limit=10"

# Remove a message
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Inappropriate content"}' \
  http://localhost:3005/moderation/remove/message/MESSAGE_ID
```

## Sample Test Data

To test the admin service effectively, you'll need some sample data. Here are some SQL scripts to create test data:

### Create Test Users
```sql
-- Client users
INSERT INTO "User" (id, email, password, name, role, "isVerified", "createdAt", "updatedAt") 
VALUES 
  ('client-1', 'client1@example.com', '$2b$10$hash', 'John Client', 'CLIENT', true, NOW(), NOW()),
  ('client-2', 'client2@example.com', '$2b$10$hash', 'Jane Client', 'CLIENT', false, NOW(), NOW());

-- Freelancer users
INSERT INTO "User" (id, email, password, name, role, "isVerified", "createdAt", "updatedAt") 
VALUES 
  ('freelancer-1', 'freelancer1@example.com', '$2b$10$hash', 'Bob Freelancer', 'FREELANCER', true, NOW(), NOW()),
  ('freelancer-2', 'freelancer2@example.com', '$2b$10$hash', 'Alice Freelancer', 'FREELANCER', true, NOW(), NOW());

-- Create client and freelancer profiles
INSERT INTO "Client" (id, "userId", "fullName", "companyName", "createdAt", "updatedAt") 
VALUES 
  ('client-profile-1', 'client-1', 'John Client', 'Tech Corp', NOW(), NOW()),
  ('client-profile-2', 'client-2', 'Jane Client', 'Design Studio', NOW(), NOW());

INSERT INTO "Freelancer" (id, "userId", "fullName", "hourlyRate", "experienceLevel", "createdAt", "updatedAt") 
VALUES 
  ('freelancer-profile-1', 'freelancer-1', 'Bob Freelancer', 50.0, 'MID', NOW(), NOW()),
  ('freelancer-profile-2', 'freelancer-2', 'Alice Freelancer', 75.0, 'SENIOR', NOW(), NOW());
```

### Create Test Jobs
```sql
INSERT INTO "Job" (id, "clientId", title, description, budget, category, status, "createdAt", "updatedAt") 
VALUES 
  ('job-1', 'client-profile-1', 'Website Development', 'Need a modern website', 1500.0, 'Web Development', 'OPEN', NOW(), NOW()),
  ('job-2', 'client-profile-2', 'Logo Design', 'Creative logo for startup', 500.0, 'Graphic Design', 'OPEN', NOW(), NOW()),
  ('job-3', 'client-profile-1', 'Mobile App', 'iOS/Android app development', 3000.0, 'Mobile Development', 'IN_PROGRESS', NOW(), NOW());
```

### Create Test Messages
```sql
-- First create conversations
INSERT INTO "Conversation" (id, "user1Id", "user2Id", "createdAt", "updatedAt") 
VALUES 
  ('conv-1', 'client-1', 'freelancer-1', NOW(), NOW()),
  ('conv-2', 'client-2', 'freelancer-2', NOW(), NOW());

-- Then create messages
INSERT INTO "Message" (id, "conversationId", "senderId", "receiverId", content, timestamp) 
VALUES 
  ('msg-1', 'conv-1', 'client-1', 'freelancer-1', 'Hello, I need help with my project', NOW()),
  ('msg-2', 'conv-1', 'freelancer-1', 'client-1', 'Sure, I can help you with that', NOW()),
  ('msg-3', 'conv-2', 'client-2', 'freelancer-2', 'Contact me directly at john@email.com', NOW()); -- Flagged content
```

## Common Development Issues

### 1. Database Connection Issues
```bash
# Check if PostgreSQL is running
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux

# Verify connection string
psql "postgresql://username:password@localhost:5432/frevix"
```

### 2. JWT Token Issues
- Ensure JWT_SECRET matches between auth service and admin service
- Check token expiration
- Verify user has ADMIN role

### 3. CORS Issues
- Check CORS configuration in src/index.ts
- Ensure frontend URL is in allowed origins

### 4. Prisma Issues
```bash
# Regenerate Prisma client
bun run prisma generate

# Reset database (development only)
bun run prisma migrate reset
```

## Performance Testing

### Load Testing with Artillery
Create `artillery.yml`:
```yaml
config:
  target: 'http://localhost:3005'
  phases:
    - duration: 60
      arrivalRate: 10
  headers:
    Authorization: 'Bearer YOUR_JWT_TOKEN'

scenarios:
  - name: "Admin Dashboard"
    requests:
      - get:
          url: "/dashboard"
      - get:
          url: "/users/stats"
      - get:
          url: "/jobs/stats"
```

Run the test:
```bash
npx artillery run artillery.yml
```

## Debugging

### Enable Debug Logging
```bash
DEBUG=admin-service:* bun run dev
```

### Database Query Logging
Add to your .env:
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/frevix?schema=public&logging=true"
```

### API Request Logging
The service logs all requests and their response times. Check the console output for:
- Request method and path
- Response status and time
- Any errors or warnings

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Admin users created
- [ ] CORS origins updated for production
- [ ] JWT secrets secured
- [ ] Logging configured
- [ ] Health check endpoint accessible
- [ ] Security headers configured
- [ ] Rate limiting implemented (if needed)

## Contributing

1. Follow the existing code structure
2. Add proper TypeScript types
3. Include error handling
4. Add validation using Zod schemas
5. Update documentation
6. Test your changes thoroughly
7. Follow the commit message convention
