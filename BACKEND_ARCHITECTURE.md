# Frevix Backend Architecture

## Project Overview
Frevix is a freelance marketplace platform (competitor to Upwork, Mostaql, etc.) built with a microservices architecture consisting of two main backend services: a core service built with Node.js/Express and a real-time chat service built with Bun and WebSockets.

## Architecture Overview

### Microservices Structure
```
frevix/server/
├── core-service/          # Main business logic service (Node.js + Express)
├── chat-service/          # Real-time messaging service (Bun + WebSocket)
```

## Core Service (Node.js + Express)

### Technology Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js v5.1.0
- **Database**: PostgreSQL with Prisma ORM v6.12.0
- **Authentication**: JWT with bcryptjs for password hashing
- **Email**: Nodemailer for OTP and notifications
- **Validation**: Zod for request validation
- **Development**: ts-node-dev for hot reloading

### Port Configuration
- **Development**: Port 5000
- **Environment**: Configurable via `PORT` environment variable

### Project Structure
```
core-service/
├── src/
│   ├── app.ts                    # Express app configuration
│   ├── config/
│   │   ├── env.ts               # Environment variables
│   │   ├── otpConfig.ts         # OTP configuration
│   │   └── prisma.ts            # Prisma client setup
│   ├── middlewares/
│   │   └── auth.middleware.ts   # JWT authentication middleware
│   ├── modules/                 # Feature-based modules
│   │   ├── auth/               # Authentication & authorization
│   │   ├── client/             # Client profile management
│   │   ├── freelancer/         # Freelancer profile & portfolio
│   │   ├── job/                # Job posting & management
│   │   ├── otp/                # OTP verification system
│   │   └── proposal/           # Proposal submission & management
│   ├── routes/
│   │   └── index.ts            # Main router configuration
│   └── utils/
│       ├── generateOtp.ts      # OTP generation utility
│       └── sendOtpEmail.ts     # Email sending utility
├── prisma/
│   └── schema.prisma           # Database schema
└── package.json
```

### Module Architecture
Each module follows a consistent structure:
```
module/
├── controllers/        # HTTP request handlers
├── services/          # Business logic layer
├── routes/            # Route definitions
├── validators/        # Request validation schemas
├── interfaces/        # TypeScript interfaces
└── index.ts          # Module exports
```

### Database Schema (PostgreSQL)

#### Core Entities
- **User**: Base user entity with role-based access (CLIENT, FREELANCER, ADMIN)
- **Client**: Client profile with company information
- **Freelancer**: Freelancer profile with skills, portfolio, and rates
- **Job**: Job postings with budget, category, and status
- **Proposal**: Freelancer proposals for jobs
- **Contract**: Active work agreements
- **Review**: Rating and feedback system
- **OTP**: One-time password verification system

#### Key Features
- **Role-based Authentication**: JWT-based auth with role differentiation
- **Profile Management**: Separate profiles for clients and freelancers
- **Job Marketplace**: Complete job posting and proposal system
- **Portfolio System**: Freelancer portfolio with links and images
- **Skills Management**: Many-to-many relationship for freelancer skills
- **Contract Management**: Full contract lifecycle
- **Review System**: Rating and feedback mechanism
- **OTP Verification**: Email verification and password reset

### API Endpoints Structure
```
/api                    # Health check
/auth                   # Authentication routes
/otp                    # OTP verification routes
/jobs                   # Job management
/client/*               # Client-specific routes
/freelancer/*           # Freelancer-specific routes
/proposals              # Proposal management
```

### Security Features
- JWT token authentication (7-day expiration)
- Password hashing with bcryptjs
- Role-based access control
- Email verification via OTP
- CORS protection
- Cookie parser for secure token handling

## Chat Service (Bun + WebSocket)

### Technology Stack
- **Runtime**: Bun (high-performance JavaScript runtime)
- **Protocol**: WebSocket for real-time communication
- **Framework**: Hono.js for HTTP handling
- **Database**: PostgreSQL with Prisma ORM v6.13.0
- **Authentication**: JWT verification with jose library
- **WebSocket**: Native Bun WebSocket server

### Port Configuration
- **Default**: Port 3000
- **WebSocket**: ws://localhost:3000

### Project Structure
```
chat-service/
├── index.ts                       # Main WebSocket server with enhanced message routing
├── src/
│   ├── db.ts                     # Prisma client configuration
│   ├── handlers/
│   │   └── messageHandlers.ts    # Message type handlers (chat, typing, read receipts)
│   ├── services/
│   │   ├── message.service.ts    # Message persistence service
│   │   ├── readReceipt.service.ts # Read receipt operations
│   │   └── conversation.service.ts # Conversation management service
│   └── types/
│       └── message.types.ts      # TypeScript definitions for all message types
├── prisma/
│   └── schema.prisma            # Enhanced schema with conversations and readAt field
└── package.json
```

### WebSocket Architecture

#### Connection Flow
1. Client connects with WebSocket upgrade request
2. JWT token validation via Authorization header
3. User ID extraction from JWT payload
4. WebSocket connection establishment
5. Client registration in active connections map

#### Message Flow
1. Client sends JSON message with `recipientId` and `message`
2. Server validates message format
3. Message saved to database via Prisma
4. Message forwarded to recipient if online
5. Real-time delivery confirmation

#### Connection Management
- **Active Connections**: Map of userId to WebSocket connections
- **Authentication**: JWT-based connection authorization
- **Message Persistence**: All messages stored in PostgreSQL
- **Error Handling**: Graceful handling of invalid messages and disconnections

### Database Schema (Chat-Specific)
```sql
model Conversation {
  id            String    @id @default(uuid())
  user1Id       String    // First participant (always smaller user ID)
  user2Id       String    // Second participant (always larger user ID)
  lastMessageId String?   @unique // Reference to last message
  lastActivity  DateTime  @default(now())
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations and indexes for efficient queries
  @@unique([user1Id, user2Id])
  @@index([user1Id, lastActivity])
  @@index([user2Id, lastActivity])
}

model Message {
  id             String       @id @default(uuid())
  conversationId String       // Belongs to a conversation
  senderId       String
  receiverId     String
  content        String
  timestamp      DateTime     @default(now())
  readAt         DateTime?    // Read receipt timestamp
  
  // Relations and indexes
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  @@index([conversationId, timestamp])
  @@index([receiverId, readAt])
  @@index([senderId, timestamp])
}
```

### Enhanced Message Protocol

#### Message Types
The chat service supports multiple message types for different functionalities:

```typescript
// Chat message (default)
{
  "type": "chat",
  "recipientId": "user_id",
  "message": "Hello world"
}

// Typing indicators
{
  "type": "typing_start",
  "recipientId": "user_id"
}

{
  "type": "typing_stop", 
  "recipientId": "user_id"
}

// Read receipts
{
  "type": "mark_read",
  "messageIds": ["msg1", "msg2"]
}
```

#### Server Responses
```typescript
// Typing status broadcast
{
  "type": "user_typing",
  "from": "sender_id",
  "isTyping": true/false
}

// Read receipt confirmation
{
  "type": "messages_read",
  "messageIds": ["msg1", "msg2"],
  "readBy": "reader_id",
  "readAt": "2025-01-01T12:00:00Z"
}

// Enhanced chat message
{
  "from": "sender_id",
  "message": "Hello",
  "messageId": "unique_id",
  "timestamp": "2025-01-01T12:00:00Z"
}
```

### Typing Status Features
- **Real-time indicators**: Instant typing notifications between users
- **Auto-timeout**: Typing status automatically clears after 5 seconds
- **State management**: Server tracks typing state per user-recipient pair
- **Cleanup on disconnect**: Proper cleanup when users disconnect
- **Multiple conversations**: Supports typing in multiple conversations simultaneously

#### Typing Status Implementation Details
```typescript
// Server maintains global typing state
const typingUsers: Map<string, Set<string>> = new Map(); // recipientId -> Set of typing userIds
const typingTimeouts: Map<string, NodeJS.Timeout> = new Map(); // userId-recipientId -> timeout

// Auto-timeout mechanism (5 seconds)
const timeout = setTimeout(() => {
  handleTypingStop(senderId, recipientId);
}, 5000);

// Cleanup on user disconnect
export const handleUserDisconnect = (userId: string) => {
  // Clear all typing timeouts and states for disconnected user
  // Send typing_stop notifications to all recipients
};
```

### Read Receipts Features
- **Database persistence**: Read status stored with timestamp
- **Batch operations**: Multiple messages can be marked read in single request
- **Sender notifications**: Senders receive confirmation when messages are read
- **Offline compatibility**: Read receipts work across sessions
- **Efficient queries**: Optimized database indexes for read receipt operations

#### Read Receipts Implementation Details
```typescript
// Database schema enhancement
model Message {
  id         String    @id @default(uuid())
  senderId   String
  receiverId String
  content    String
  timestamp  DateTime  @default(now())
  readAt     DateTime? // Added for read receipts
  
  // Optimized indexes for read receipt queries
  @@index([receiverId, readAt])
  @@index([senderId, timestamp])
}

// Batch read receipt service
export const markMessagesAsRead = async ({
  messageIds,
  readerId,
}: ReadReceiptInput): Promise<ReadReceiptResult> => {
  // Update multiple messages atomically
  // Group by sender for efficient notifications
  // Return grouped results for sender notification
};

// Service functions available:
- markMessagesAsRead(messageIds, readerId)
- getUnreadMessageCount(userId)
- getUnreadMessagesBetweenUsers(userId, otherUserId)
```

#### Enhanced Message Routing
The WebSocket server now uses type-based message routing:
```typescript
// Main message handler with type routing
switch (messageType) {
  case "chat":
    await handleChatMessage(ws, data);
    break;
  case "typing_start":
  case "typing_stop":
    handleTypingMessage(ws, data);
    break;
  case "mark_read":
    await handleReadReceipt(ws, data);
    break;
  default:
    // Backward compatibility for legacy format
    handleLegacyMessage(ws, data);
}
```

## Inter-Service Communication

### Database Strategy
- **Shared Database**: Both services connect to the same PostgreSQL instance
- **Schema Synchronization**: Both services maintain synchronized User models
- **Data Consistency**: Prisma ensures type safety across services

### Authentication Flow
1. User authenticates via Core Service
2. JWT token issued by Core Service
3. Chat Service validates same JWT token
4. Shared secret ensures token compatibility
```

## Development Commands

### Core Service
```bash
cd server/core-service
npm install
npm run dev        # Start development server with hot reload
```

### Chat Service
```bash
cd server/chat-service
bun install
bun run index.ts   # Start WebSocket server
```

## Key Features & Capabilities

### Business Logic (Core Service)
- Complete user registration and authentication
- Role-based profile management (Client/Freelancer)
- Job posting and browsing with advanced filtering
- Proposal submission and management
- Contract lifecycle management
- Portfolio and skills management
- Review and rating system
- Email-based OTP verification

### Real-time Communication (Chat Service)
- WebSocket-based real-time messaging
- JWT-authenticated connections
- Message persistence
- Online user tracking
- Direct message delivery
- Connection state management
- **Typing indicators** with auto-timeout (5 seconds)
- **Read receipts** with database persistence
- Type-based message routing (chat, typing, read receipts)
- Backward compatibility for legacy message format
- **Detailed Typing Status Mechanics:**
  - Real-time updates with start and stop notifications.
  - Managed by server with per-user timeouts and cleanup on disconnect.

- **Read Receipts Handling:**
  - Efficient database updates with `readAt` timestamp.
  - Batch operations and notifications for senders, ensuring information persistence across sessions.
  - Enhanced query indexes for performance and rapid lookup.

### Conversation System Features
- **WhatsApp-like Structure**: Messages are organized in conversations between two users
- **Automatic Creation**: Conversations are created automatically when first message is sent
- **Consistent Ordering**: User IDs are consistently ordered (smaller ID as user1) for uniqueness
- **Metadata Tracking**: Last message, last activity timestamp, and conversation history
- **Real-time Updates**: Conversation metadata updates in real-time with new messages

#### Conversation Implementation Details
```typescript
// Conversation service functions
export const findOrCreateConversation = async (
  user1Id: string,
  user2Id: string
): Promise<Conversation> => {
  // Ensure consistent ordering for uniqueness
  const [smallerId, largerId] = [user1Id, user2Id].sort();
  
  // Find existing or create new conversation
  // Update lastActivity when messages are sent
};

// Available conversation operations:
- findOrCreateConversation(user1Id, user2Id)
- updateConversationActivity(conversationId, lastMessageId)
- getUserConversations(userId, limit, offset)
- getConversationMessages(conversationId, userId, limit, offset)
- getConversationById(conversationId, userId)
```

#### Conversation Features
- **Chat History**: Complete message history grouped by conversation
- **Unread Counts**: Track unread messages per conversation
- **Last Message Preview**: Display last message in conversation list
- **User Authorization**: Only conversation participants can access messages
- **Efficient Pagination**: Optimized queries for conversation and message lists
- **Cascade Deletion**: Messages are deleted when conversation is deleted

## Scalability Considerations

### Current Architecture Benefits
- **Separation of Concerns**: Business logic separated from real-time features
- **Technology Optimization**: Bun for high-performance WebSocket handling
- **Database Efficiency**: Optimized indexes for job browsing and filtering
- **Stateless Design**: JWT-based authentication enables horizontal scaling

### Future Scaling Opportunities
- **Load Balancing**: Both services can be horizontally scaled
- **Database Sharding**: Message tables can be partitioned by user
- **Caching Layer**: Redis for session management and message caching
- **Message Queuing**: For handling high-volume messaging scenarios

## Development Guidelines

### When to Use Each Service
- **Core Service**: All business logic, CRUD operations, authentication
- **Chat Service**: Real-time messaging, user presence, instant notifications

### Adding New Features
- **Business Features**: Add to core-service following module pattern
- **Real-time Features**: Extend chat-service WebSocket handlers
- **Database Changes**: Update both Prisma schemas if shared models affected

This architecture provides a solid foundation for a scalable freelance marketplace with real-time communication capabilities, following modern microservices patterns while maintaining development simplicity.
