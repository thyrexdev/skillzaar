# Frevix Admin Service

A comprehensive admin service for managing the Frevix freelancing platform. This service provides complete administrative control over users, jobs, financial operations, content moderation, and platform analytics.

## Features

### 🔐 User Management (إدارة المستخدمين)
- **User Overview**: Complete statistics and activity monitoring for clients and freelancers
- **User Actions**: Suspend, ban, verify, and manage user accounts
- **Verification Documents**: Approve/reject ID verification documents
- **User Search & Filtering**: Advanced filtering by role, verification status, date ranges
- **User Details**: Comprehensive user profiles with activity history

### 💼 Job & Proposal Management
- **Job Monitoring**: Track all jobs across the platform with advanced filtering
- **Job Categories**: Manage and update job categories
- **Job Status Management**: Update job statuses and handle reported jobs
- **Proposal Analytics**: Monitor proposal statistics and success rates
- **Performance Metrics**: Job completion rates and platform statistics

### 🛡️ Content Moderation
- **Automated Flagging**: AI-powered content detection for suspicious messages, jobs, and files
- **Manual Review**: Admin tools for reviewing flagged content
- **Content Actions**: Remove messages, jobs, and files with audit trails
- **User Warnings**: Issue warnings to users for policy violations
- **Bulk Moderation**: Process multiple flagged items efficiently

### 💰 Financial Oversight
- **Transaction Monitoring**: Real-time transaction tracking and analytics
- **Withdrawal Management**: Approve/reject freelancer withdrawal requests
- **Escrow Management**: Monitor funds in escrow for active projects
- **Fee Settings**: Configure platform fees and revenue sharing
- **Financial Analytics**: Revenue reports and growth metrics

### 📊 Platform Analytics
- **User Growth Metrics**: Track user acquisition and engagement
- **Job Completion Analytics**: Monitor platform success rates
- **Revenue Analytics**: Financial performance and projections
- **System Health**: Monitor platform performance and uptime
- **Top Performers**: Identify most successful users and categories

## API Endpoints

### Authentication
All endpoints require admin authentication via JWT token in the Authorization header.

### Dashboard
```
GET    /dashboard                               # Complete admin dashboard overview
```

### User Management
```
GET    /users/stats                             # User statistics
GET    /users/activity                          # User activity tracking
GET    /users                                   # List users with filtering
GET    /users/:userId                           # Get user details
POST   /users/action                            # Perform user actions
POST   /users/:userId/suspend                   # Suspend user
POST   /users/:userId/ban                       # Ban user
POST   /users/:userId/verify                    # Verify user
GET    /users/verification/documents            # Get verification documents
POST   /users/verification/handle               # Handle verification documents
```

### Job Management
```
GET    /jobs/stats                              # Job statistics
GET    /jobs/proposals/stats                    # Proposal statistics
GET    /jobs                                    # List jobs with filtering
GET    /jobs/:jobId                             # Get job details
PUT    /jobs/:jobId/status                      # Update job status
GET    /jobs/proposals                          # Get proposals with filtering
GET    /jobs/categories                         # Get job categories
PUT    /jobs/categories                         # Update job categories
```

### Financial Operations
```
GET    /financial/stats                         # Financial overview
GET    /financial/escrow/stats                  # Escrow statistics
GET    /financial/transactions                  # Transaction history
GET    /financial/withdrawals                   # Withdrawal requests
POST   /financial/withdrawals/:id/approve       # Approve withdrawal
POST   /financial/withdrawals/:id/reject        # Reject withdrawal
GET    /financial/users/:userId/summary         # User financial summary
PUT    /financial/fees                          # Update platform fees
```

### Content Moderation
```
GET    /moderation/stats                        # Moderation statistics
GET    /moderation/analytics                    # Content analytics
GET    /moderation/reports                      # Get reported content
POST   /moderation/moderate                     # Moderate content
GET    /moderation/flagged/messages             # Flagged messages
GET    /moderation/flagged/jobs                 # Flagged jobs
GET    /moderation/flagged/files                # Flagged files
POST   /moderation/remove/message/:id           # Remove message
POST   /moderation/remove/job/:id               # Remove job
POST   /moderation/remove/file/:id              # Remove file
POST   /moderation/warn/:userId                 # Warn user
GET    /moderation/queue/:contentType           # Bulk moderation queue
```

### Analytics
```
GET    /analytics/platform                      # Platform metrics
GET    /analytics/engagement                    # User engagement
GET    /analytics/top-performers                # Top users/categories
GET    /analytics/system-health                 # System health metrics
```

## Query Parameters

### Filtering Examples

**User Management:**
```
GET /users?role=CLIENT&isVerified=true&search=john&page=1&limit=20
GET /users?startDate=2024-01-01&endDate=2024-12-31
```

**Job Management:**
```
GET /jobs?status=OPEN&category=web-development&minBudget=100&maxBudget=1000
GET /jobs?startDate=2024-01-01&endDate=2024-12-31&reported=true
```

**Financial:**
```
GET /financial/transactions?type=DEPOSIT&userId=123&minAmount=50&maxAmount=500
GET /financial/withdrawals?status=PENDING&page=1&limit=10
```

**Analytics:**
```
GET /analytics/platform?timeRange=monthly
GET /analytics/engagement?startDate=2024-01-01&endDate=2024-01-31
```

## Request/Response Examples

### User Action Example
```json
POST /users/action
{
  "userId": "user-uuid-here",
  "action": "suspend",
  "reason": "Violation of terms of service",
  "duration": 30
}

Response:
{
  "success": true,
  "data": {
    "success": true,
    "message": "User suspend action completed successfully"
  }
}
```

### Verification Document Handling
```json
POST /users/verification/handle
{
  "documentId": "doc-uuid-here",
  "action": "approve",
  "reason": "Document verified successfully"
}
```

### Withdrawal Approval
```json
POST /financial/withdrawals/withdrawal-uuid/approve
{
  "notes": "Withdrawal approved after verification"
}
```

### Content Moderation
```json
POST /moderation/remove/message/message-uuid
{
  "reason": "Inappropriate content violating community guidelines"
}
```

## Environment Variables

```bash
PORT=3005                    # Admin service port
DATABASE_URL=               # PostgreSQL connection string
JWT_SECRET=                 # JWT secret for token verification
ADMIN_PORT=3005            # Optional: Override default port
```

## Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# The service will be available at http://localhost:3005
```

## Security Features

- **Admin-Only Access**: All endpoints require ADMIN role
- **JWT Authentication**: Secure token-based authentication
- **Action Logging**: All admin actions are logged for audit trails
- **Input Validation**: Comprehensive input validation using Zod schemas
- **CORS Protection**: Configured CORS for secure API access

## Service Architecture

The admin service is built with:

- **Hono Framework**: Fast and lightweight web framework
- **TypeScript**: Type-safe development
- **Prisma ORM**: Database operations with type safety
- **Zod Validation**: Runtime type checking and validation
- **Modular Design**: Separated services for different admin functions

## Integration with Other Services

The admin service integrates with:
- **Auth Service**: User authentication and role verification
- **Core Service**: Job and proposal management
- **Chat Service**: Message moderation
- **Media Service**: File content moderation
- **Shared Package**: Database models and utilities

## Deployment

The service is designed to be deployed as a microservice alongside other Frevix services. It requires:

- PostgreSQL database access
- Redis (optional, for caching)
- Environment variables configured
- Admin users created in the database

## Future Enhancements

- **Real-time Notifications**: WebSocket connections for real-time admin alerts
- **Advanced Analytics**: Machine learning insights and predictions
- **Automated Moderation**: AI-powered content moderation
- **Audit Logging**: Comprehensive admin action logging
- **Role-based Permissions**: Granular admin permissions
- **Export/Import**: Data export and configuration import features
