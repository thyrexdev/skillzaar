# Frevix Backend Architecture

## Project Overview
Frevix is a freelance marketplace platform built with a microservices architecture. The backend is a Bun monorepo with services using Hono for HTTP APIs and native Bun WebSockets for realtime chat. TypeScript is used across all services.

## Architecture Overview

### Monorepo Structure
```
frevix/server/
├── auth-service/          # Auth + OTP + user management (Hono HTTP)
├── core-service/          # Main business logic (Hono HTTP)
├── chat-service/          # Realtime chat over WebSockets (Bun WS)
├── admin-service/         # Admin panel API with role-based access (Hono HTTP)
├── media-service/         # File uploads & media handling (Cloudflare Workers + R2)
├── payment-service/       # Payments endpoints (Hono HTTP)
├── packages/
│   ├── config/            # Shared env parsing, logger, constants, headers
│   └── shared/            # Prisma client, auth helpers (JWT), shared types
└── package.json           # Bun workspaces root
```

## Shared Packages

### packages/config
- `env.ts`: Parses and validates environment variables with `zod`.
- `logger.ts`: Centralized logger used by services.
- `constants.ts`, `headers.ts`: Shared constants and header helpers.

### packages/shared
- `prisma/`: Prisma client wrapper shared by all services (single DB schema).
- `auth/jwt.ts`: JWT sign/verify helpers with `jose`.
- `types/`: Shared TypeScript types.

## Auth Service (`auth-service`)

### Technology Stack
- Runtime: Bun
- Framework: Hono
- Database: PostgreSQL via shared Prisma client (`@frevix/shared`)
- Auth: JWT with `jose`; password hashing with `bcryptjs`
- Email: `nodemailer` (SMTP) for OTP and notifications
- Validation: `zod` (env and request schema validation)

### Project Structure
```
auth-service/
└── src/
    ├── index.ts         # Service entry point
    ├── config/          # Environment and other configurations
    ├── controllers/     # Request handlers
    ├── interfaces/      # Service-specific types
    ├── middlewares/     # Hono middleware
    ├── routes/          # API routes
    ├── services/        # Business logic
    ├── utils/           # Utility functions
    └── validators/      # Zod validation schemas
```

### Email on Bun (Nodemailer)
- Nodemailer works on Bun (Node-compatible runtime) when using SMTP (e.g., Gmail, SES SMTP, Mailgun SMTP).
- Configure via `src/config/nodemailer.ts` using `EMAIL_FROM` and `EMAIL_PASSWORD`.
- If deploying to an Edge runtime in the future, prefer an HTTP email API (Resend, Postmark, SendGrid, SES) instead of SMTP.

## Core Service (`core-service`)

### Technology Stack
- Runtime: Bun
- Framework: Hono
- Database: PostgreSQL via shared Prisma client (`@frevix/shared`)
- Auth: JWT verification with `jose`
- Validation: `zod`

### Project Structure
```
core-service/
└── src/
    ├── controllers/
    ├── interfaces/
    ├── middlewares/
    ├── routes/
    ├── services/
    └── validators/
```

## Chat Service (`chat-service`)

### Technology Stack
- Runtime: Bun
- Framework: Native Bun WebSocket server (no Hono in this service)
- Database: PostgreSQL via shared Prisma client (`@frevix/shared`)
- Auth: JWT verification with `jose` during WebSocket upgrade

### Project Structure
```
chat-service/
├── index.ts
└── src/
    ├── handlers/        # WebSocket message handlers
    ├── services/        # Chat-related business logic
    └── types/           # TypeScript types for chat
```

## Admin Service (`admin-service`)

### Technology Stack
- Runtime: Bun
- Framework: Hono
- Database: PostgreSQL via shared Prisma client (`@frevix/shared`)
- Auth: JWT verification with `jose` and admin role enforcement
- Validation: `zod`
- Port: 3005 (configurable via ADMIN_PORT environment variable)

### Project Structure
```
admin-service/
└── src/
    ├── index.ts         # Service entry point
    ├── controllers/     # Function-based request handlers
    │   ├── analytics.controller.ts
    │   ├── content-moderation.controller.ts
    │   ├── dashboard.controller.ts
    │   ├── financial-oversight.controller.ts
    │   ├── job-management.controller.ts
    │   └── user-management.controller.ts
    ├── interfaces/      # Service-specific TypeScript types
    ├── middleware/      # Admin authentication and authorization
    │   └── admin.middleware.ts
    ├── routes/          # API route definitions
    │   ├── analytics.routes.ts
    │   ├── content-moderation.routes.ts
    │   ├── dashboard.routes.ts
    │   ├── financial-oversight.routes.ts
    │   ├── job-management.routes.ts
    │   └── user-management.routes.ts
    └── validators/      # Zod validation schemas
```

### Admin Authorization
The admin service implements strict role-based access control:

- **Authentication**: All endpoints require valid JWT tokens
- **Authorization**: Users must have the `ADMIN` role in their JWT payload
- **Middleware**: Custom `requireAdmin` and `optionalAdmin` middleware functions
- **Error Handling**: Proper HTTP status codes (401 Unauthorized, 403 Forbidden)
- **Logging**: Comprehensive audit logging for admin actions

### API Endpoints
All endpoints are prefixed with `/api` and require admin authentication:

- **Dashboard** (`/api/dashboard`): System overview and statistics
- **User Management** (`/api/users`): User account administration
- **Job Management** (`/api/jobs`): Job posting oversight and moderation
- **Financial Oversight** (`/api/financial`): Payment and transaction monitoring
- **Analytics** (`/api/analytics`): Platform metrics and reporting
- **Content Moderation** (`/api/moderation`): Content review and moderation tools

### Function-Based Architecture
The admin service uses a consistent function-based controller pattern:

```typescript
// Example controller structure
export const getDashboardStats = async (c: Context) => {
  const user = c.get('user'); // Admin user from middleware
  // Business logic here
  return c.json({ success: true, data: stats });
};
```

This pattern ensures:
- Consistency with other services in the monorepo
- Easy testing and maintainability
- Clear separation of concerns
- Simplified dependency injection

## Payment Service (`payment-service`)

### Technology Stack
- Runtime: Bun
- Framework: Hono
- Validation: (optional) `zod` if/when request schemas are added

### Project Structure
```
payment-service/
└── src/
    └── index.ts         # Service entry point
```

## Media Service (`media-service`)

### Technology Stack
- Runtime: Cloudflare Workers
- Framework: Hono
- Storage: Cloudflare R2 (dual buckets for different file types)
- Database: PostgreSQL via shared Prisma client (`@frevix/shared`)
- Auth: JWT verification with auth-service integration
- Validation: Custom file validation based on upload context

### Project Structure
```
media-service/
├── src/
│   ├── index.ts         # Worker entry point with Hono app
│   ├── types/
│   │   └── bindings.ts  # Cloudflare bindings & interfaces
│   ├── utils/
│   │   └── fileUtils.ts # File validation & utility functions
│   └── routes/
│       ├── upload.routes.ts      # Generic upload endpoints
│       ├── verification.routes.ts # ID verification uploads
│       ├── job.routes.ts         # Job asset uploads
│       ├── chat.routes.ts        # Chat attachment uploads
│       └── file.routes.ts        # File serving & management
├── wrangler.jsonc       # Cloudflare Worker configuration
├── package.json
└── README.md           # Comprehensive service documentation
```

### File Upload Scenarios
The media service handles three primary upload scenarios:

1. **ID Verification** (`/api/verification/*`)
   - **Purpose**: Government ID verification (front, back, selfie with ID)
   - **Files**: 3 images max (one for each document type)
   - **Size**: 10MB per file
   - **Types**: Images only (JPEG, PNG, WebP)
   - **Storage**: Private verification bucket (`frivico-verification-docs`)
   - **Access**: Owner and admins only
   - **Workflow**: Upload → Pending → Admin Review → Approved/Rejected

2. **Job Assets** (`/api/jobs/*`)
   - **Purpose**: Files attached to job postings
   - **Files**: 10 files max per upload
   - **Size**: 50MB per file
   - **Types**: Images + Documents (PDF, Word, Text)
   - **Storage**: General media bucket (`frivico-media-files`)
   - **Access**: Job owner, public if marked as such
   - **Categories**: requirements, reference, mockup, etc.

3. **Chat Attachments** (`/api/chat/*`)
   - **Purpose**: File sharing in chat conversations
   - **Files**: Unlimited files per message
   - **Size**: 100MB per file
   - **Types**: Images + Documents + Videos
   - **Storage**: General media bucket (`frivico-media-files`)
   - **Access**: Chat participants only
   - **Features**: Message linking, conversation organization

### Storage Architecture
- **Dual R2 Buckets**: 
  - `frivico-verification-docs`: Private bucket for sensitive ID documents
  - `frivico-media-files`: General bucket for job assets and chat files
- **Access Control**: File-level permissions based on upload type and user roles
- **Metadata Storage**: File metadata stored in PostgreSQL via shared Prisma schema

### Authentication Integration
- JWT token validation with auth-service
- User context injection for all protected endpoints
- Service-to-service communication for token verification

## Database Schema (`packages/shared/prisma/schema.prisma`)

A single Prisma schema defines the entire database structure, including:
- **User Management**: `User`, `Otp`
- **Profiles**: `Client`, `Freelancer`
- **Job Marketplace**: `Job`, `Proposal`, `Contract`, `Review`
- **Skills & Portfolio**: `Skill`, `PortfolioLink`
- **Chat**: `Conversation`, `Message`
- **Media & Files**: `VerificationDocument`, `JobAsset`, `ChatAttachment`, `MediaFile`
- **Financial**: `Wallet`, `WalletTransaction`, `Payment`, `Withdrawal`

### Media Service Models
The media service introduces four new models to handle different file upload scenarios:

- `VerificationDocument`: ID verification files with approval workflow
- `JobAsset`: Files attached to job postings with public/private access
- `ChatAttachment`: Files shared in chat conversations with participant access
- `MediaFile`: General file metadata for other upload types

## Inter-Service Communication

### Database Strategy
- Shared Database: All services connect to the same PostgreSQL instance via the shared Prisma client in `packages/shared`.
- Schema Synchronization: A single `schema.prisma` ensures consistency across all services.

### Authentication Flow
1. A user authenticates via the Auth Service.
2. A JWT token is issued by the Auth Service.
3. The Core Service, Chat Service, and Admin Service validate the JWT token using helpers from `packages/shared/auth`.
4. The Admin Service additionally enforces role-based access control, requiring users to have the `ADMIN` role.
5. A shared secret (JWT_SECRET), provided via environment variables, ensures token compatibility across all services.

## Environment Variables
- Each service can have its own `.env` for local development (e.g., `server/auth-service/.env`).
- Shared parsing/validation lives in `packages/config/env.ts`.
- Common vars: `DATABASE_URL`, `JWT_SECRET`, `EMAIL_FROM`, `EMAIL_PASSWORD`, `NODE_ENV`, `PORT`.

## Dependency Cleanup (Bun migration)
- Chat Service: remove unused packages — `hono`, `@elysiajs/jwt`, `@prisma/client` (uses shared Prisma).
- Payment Service: remove `zod` if not used in handlers yet.
- After edits, run your package manager to prune lockfiles and node_modules.

## Development Commands
To run services in development with hot reload:

```bash
# Auth Service
cd server/auth-service && bun run dev

# Core Service
cd server/core-service && bun run dev

# Chat Service (WebSocket)
cd server/chat-service && bun run dev

# Admin Service (Admin Panel API)
cd server/admin-service && bun run dev

# Media Service (Cloudflare Workers)
cd server/media-service && bun run dev

# Payment Service
cd server/payment-service && bun run dev
```

### Media Service Deployment
```bash
# Deploy to Cloudflare Workers
cd server/media-service && bun run deploy

# View real-time logs
wrangler tail frivico-media-service

# Set secrets
wrangler secret put JWT_SECRET
wrangler secret put DATABASE_URL
wrangler secret put AUTH_SERVICE_URL
```

### Prisma CLI (run from server root)
```bash
bun run --cwd server prisma generate
```
