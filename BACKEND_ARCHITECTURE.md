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

## Database Schema (`packages/shared/prisma/schema.prisma`)

A single Prisma schema defines the entire database structure, including:
- User Management: `User`, `Otp`
- Profiles: `Client`, `Freelancer`
- Job Marketplace: `Job`, `Proposal`, `Contract`, `Review`
- Skills & Portfolio: `Skill`, `PortfolioLink`
- Chat: `Conversation`, `Message`

## Inter-Service Communication

### Database Strategy
- Shared Database: All services connect to the same PostgreSQL instance via the shared Prisma client in `packages/shared`.
- Schema Synchronization: A single `schema.prisma` ensures consistency across all services.

### Authentication Flow
1. A user authenticates via the Auth Service.
2. A JWT token is issued by the Auth Service.
3. The Core Service and Chat Service validate the JWT token using helpers from `packages/shared/auth`.
4. A shared secret (JWT_SECRET), provided via environment variables, ensures token compatibility across all services.

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

# Payment Service
cd server/payment-service && bun run dev
```

### Prisma CLI (run from server root)
```bash
bun run --cwd server prisma generate
```
