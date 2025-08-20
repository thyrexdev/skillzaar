# Frivico Media Service

A Cloudflare Workers-based media service for handling file uploads in the Frivico freelancing platform. This service manages three main scenarios:

1. **ID Verification Documents** - Front, back, and selfie photos for user verification
2. **Job Assets** - Files uploaded when posting jobs (requirements, references, mockups)
3. **Chat Attachments** - Files shared between clients and freelancers in chat

## Features

- ✅ **Multi-bucket R2 Storage** - Separate buckets for verification docs and general media
- ✅ **JWT Authentication** - Integrates with auth-service for user verification
- ✅ **File Validation** - Type and size validation based on upload context
- ✅ **Access Control** - Proper permissions for private vs public files
- ✅ **Database Integration** - Uses shared Prisma schema for metadata storage
- ✅ **CORS Support** - Configured for frontend integration
- ✅ **Error Handling** - Comprehensive error handling and logging

## Architecture

### Technology Stack
- **Runtime**: Cloudflare Workers
- **Framework**: Hono.js
- **Storage**: Cloudflare R2 (two buckets)
- **Database**: PostgreSQL via shared Prisma client
- **Authentication**: JWT tokens from auth-service
- **Language**: TypeScript

### File Upload Scenarios

#### 1. ID Verification (`/api/verification/*`)
- **Purpose**: Government ID verification (front, back, selfie)
- **File Types**: Images only (JPEG, PNG, WebP)
- **Max Size**: 10MB per file
- **Storage**: Private verification bucket
- **Access**: Owner and admins only
- **Workflow**: Upload → Pending → Admin Review → Approved/Rejected

#### 2. Job Assets (`/api/jobs/*`)
- **Purpose**: Files attached to job postings
- **File Types**: Images, Documents (PDF, Word, Text)
- **Max Size**: 50MB per file
- **Max Files**: 10 files per upload
- **Storage**: General media bucket
- **Access**: Job owner, public if marked as such
- **Categories**: requirements, reference, mockup, etc.

#### 3. Chat Attachments (`/api/chat/*`)
- **Purpose**: File sharing in chat conversations
- **File Types**: Images, Documents, Videos
- **Max Size**: 100MB per file
- **Max Files**: Unlimited files per message
- **Storage**: General media bucket
- **Access**: Chat participants only
- **Features**: Message linking, conversation organization

## API Endpoints

### General Upload
```bash
# Generic file upload
POST /api/upload
# Body: multipart/form-data
# - file: File
# - type: 'verification' | 'job' | 'chat' | 'profile' | 'other'
# - category?: string
# - isPublic?: boolean

# Profile picture upload
POST /api/upload/profile
# Body: multipart/form-data
# - file: File (images only, max 5MB)

# Bulk upload (max 20 files)
POST /api/upload/bulk
# Body: multipart/form-data
# - files: File[]
# - type: 'job' | 'chat' | 'other'
# - category?: string
# - isPublic?: boolean

# Get upload configuration
GET /api/upload/config?type=job
```

### ID Verification
```bash
# Upload verification document
POST /api/verification/upload
# Body: multipart/form-data
# - file: File (image)
# - docType: 'front' | 'back' | 'selfie'

# Get verification status
GET /api/verification/status

# Delete verification document (for re-upload)
DELETE /api/verification/:docType
```

### Job Assets
```bash
# Upload job assets
POST /api/jobs/upload
# Body: multipart/form-data
# - files: File[] (max 10)
# - jobId?: string
# - category?: string
# - isPublic?: boolean

# Get job assets
GET /api/jobs/:jobId/assets

# Get user's job assets
GET /api/jobs/my-assets?page=1&limit=20

# Update asset metadata
PUT /api/jobs/:assetId
# Body: { category?: string, isPublic?: boolean }

# Delete job asset
DELETE /api/jobs/:assetId
```

### Chat Attachments
```bash
# Upload chat attachments
POST /api/chat/upload
# Body: multipart/form-data
# - files: File[] (max 5)
# - chatId: string
# - messageId?: string

# Get chat file (authenticated)
GET /api/chat/files/:fileId

# Get chat attachments
GET /api/chat/:chatId/attachments?page=1&limit=20

# Get attachment info
GET /api/chat/attachments/:attachmentId/info

# Delete attachment
DELETE /api/chat/attachments/:attachmentId
```

### File Management
```bash
# Serve private file
GET /api/files/:fileId

# Get file metadata
GET /api/files/:fileId/info

# Update file metadata
PUT /api/files/:fileId

# Delete file
DELETE /api/files/:fileId

# List user files
GET /api/files?page=1&limit=20&type=job&category=reference

# Generate signed URL
POST /api/files/:fileId/signed-url
# Body: { expiresIn?: number }
```

## Setup & Deployment

### Prerequisites
1. Cloudflare account with R2 storage
2. Two R2 buckets: `frevix-media-files` and `frevix-verification-docs`
3. Database access (shared Prisma schema)
4. Auth service running for JWT verification

### Environment Variables
```bash
# Required
DATABASE_URL=postgresql://...
JWT_SECRET=your-jwt-secret
AUTH_SERVICE_URL=http://localhost:3001

# Optional
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,image/gif,application/pdf,video/mp4
MAX_FILE_SIZE=104857600  # 100MB in bytes
```

### Development
```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Run tests
bun run test

# Generate Prisma types
bun run cf-typegen
```

### Deployment
```bash
# Deploy to Cloudflare Workers
bun run deploy

# Set secrets
wrangler secret put JWT_SECRET
wrangler secret put DATABASE_URL
```

### Database Schema
The media service uses the shared Prisma schema with these new models:
- `VerificationDocument` - ID verification files
- `JobAsset` - Job posting attachments
- `ChatAttachment` - Chat file attachments
- `MediaFile` - General file metadata

```bash
# Run migrations (from server root)
bun run --cwd server prisma migrate dev
bun run --cwd server prisma generate
```

## File Validation Rules

| Upload Type | Allowed Types | Max Size | Max Files |
|-------------|---------------|----------|-----------|
| Verification | Images (JPEG, PNG, WebP) | 10MB | 3 (front, back, selfie) |
| Job | Images + Documents | 50MB | 10 |
| Chat | Images + Documents + Videos | 100MB | Unlimited |
| Profile | Images only | 5MB | 1 |
| Other | Images | 10MB | 5 |

## Security Features

- **JWT Authentication**: All endpoints require valid JWT tokens
- **File Type Validation**: Strict MIME type checking
- **Size Limits**: Configurable per upload type
- **Access Control**: Users can only access their own files or public files
- **Private Storage**: Verification documents stored in separate private bucket
- **CORS Protection**: Configured origins for frontend access

## Error Handling

The service provides detailed error responses:

```json
{
  "error": "File type image/gif not allowed for verification uploads",
  "details": {
    "allowedTypes": ["image/jpeg", "image/png", "image/webp"],
    "uploadType": "verification"
  }
}
```

## Integration Example

```javascript
// Frontend integration example
const uploadVerificationDoc = async (file, docType) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('docType', docType);
  
  const response = await fetch('/api/verification/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return await response.json();
};
```

## Monitoring & Logging

- All uploads are logged with user ID, file type, and size
- Errors include stack traces and context
- Verification status changes are tracked
- File access attempts are logged for security

## Future Enhancements

- [ ] Image optimization and resizing
- [ ] Virus scanning integration
- [ ] CDN integration for public files
- [ ] File encryption for sensitive documents
- [ ] Automated backup and archival
- [ ] Advanced analytics and reporting
