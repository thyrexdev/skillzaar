# Frevix API Documentation

This document provides comprehensive documentation for all API endpoints across all services in the Frevix platform.

## Base URLs

- **Auth Service**: `http://localhost:5000` (assumed port)
- **Core Service**: `http://localhost:5001` 
- **Chat Service**: `ws://localhost:5002` (WebSocket)
- **Payment Service**: `http://localhost:5003`
- **Media Service**: Cloudflare Worker URL

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 1. AUTH SERVICE

### 1.1 Authentication Routes (`/auth`)

#### Register User
- **POST** `/auth/register`
- **Auth Required**: No
- **Description**: Create a new user account

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com", 
  "password": "MyPassword123",
  "role": "CLIENT"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "CLIENT"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Validation Rules:**
- `name`: min 2 characters
- `email`: valid email format  
- `password`: min 8 chars, at least 1 lowercase, 1 uppercase, 1 number
- `role`: must be "CLIENT", "FREELANCER", or "ADMIN"

#### Login User  
- **POST** `/auth/login`
- **Auth Required**: No

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "MyPassword123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "user_123",
    "name": "John Doe", 
    "email": "john.doe@example.com",
    "role": "CLIENT"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Forgot Password
- **POST** `/auth/forgot-password`
- **Auth Required**: No

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset OTP sent to email"
}
```

#### Reset Password
- **POST** `/auth/reset-password`
- **Auth Required**: No

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "otp": "123456",
  "newPassword": "NewPassword123"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

### 1.2 OTP Routes (`/otp`)

#### Request OTP
- **POST** `/otp/request`  
- **Auth Required**: No

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "type": "EMAIL_VERIFICATION"
}
```

**Response (200):**
```json
{
  "message": "OTP sent successfully."
}
```

**OTP Types:** `EMAIL_VERIFICATION`, `PASSWORD_RESET`, `TWO_FACTOR`

#### Verify OTP
- **POST** `/otp/verify`
- **Auth Required**: No

**Request Body:**
```json
{
  "email": "john.doe@example.com", 
  "otp": "123456",
  "type": "EMAIL_VERIFICATION"
}
```

**Response (200):**
```json
{
  "message": "OTP verified successfully."
}
```

### 1.3 OAuth Routes (`/oauth`)

#### Get OAuth Configuration
- **GET** `/oauth/config`
- **Auth Required**: No

**Response (200):**
```json
{
  "googleClientId": "your-google-client-id",
  "redirectUrl": "http://localhost:3000/auth/callback"
}
```

#### Google OAuth Login
- **POST** `/oauth/google`
- **Auth Required**: No

**Request Body:**
```json
{
  "code": "google_auth_code",
  "state": "random_state_string"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "CLIENT"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Unlink Google Provider
- **DELETE** `/oauth/unlink/google`
- **Auth Required**: Yes

**Response (200):**
```json
{
  "message": "Google account unlinked successfully"
}
```

### 1.4 Client Routes (`/client`)

All client routes require authentication.

#### Get Client Profile
- **GET** `/client/:userId`
- **Auth Required**: Yes

**Response (200):**
```json
{
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "CLIENT",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "profile": {
      "company": "Tech Corp",
      "website": "https://techcorp.com",
      "location": "New York, USA"
    }
  }
}
```

#### Get Client Jobs
- **GET** `/client/:userId/jobs`
- **Auth Required**: Yes

**Response (200):**
```json
{
  "jobs": [
    {
      "id": "job_123",
      "title": "Build a React App",
      "status": "OPEN",
      "budget": 1500,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25
  }
}
```

#### Update Client Profile
- **PUT** `/client/:userId`
- **Auth Required**: Yes

**Request Body:**
```json
{
  "name": "John Smith",
  "company": "Updated Tech Corp",
  "website": "https://updatedtechcorp.com",
  "location": "San Francisco, USA"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "user_123",
    "name": "John Smith",
    "email": "john.doe@example.com"
  }
}
```

#### Get Client Stats
- **GET** `/client/:userId/stats`
- **Auth Required**: Yes

**Response (200):**
```json
{
  "stats": {
    "totalJobs": 15,
    "activeJobs": 3,
    "completedJobs": 12,
    "totalSpent": 25000,
    "avgJobBudget": 1666.67
  }
}
```

### 1.5 Freelancer Routes (`/freelancer`)

#### Get Public Freelancer Profile  
- **GET** `/freelancer/public-profile/:userId`
- **Auth Required**: No

**Response (200):**
```json
{
  "profile": {
    "id": "user_456",
    "name": "Jane Smith",
    "title": "Full Stack Developer",
    "description": "Experienced developer...",
    "skills": ["React", "Node.js", "Python"],
    "hourlyRate": 50,
    "completedProjects": 25,
    "rating": 4.8,
    "portfolio": [
      {
        "id": "project_123",
        "title": "E-commerce Platform",
        "description": "Built a full-stack e-commerce...",
        "technologies": ["React", "Node.js", "MongoDB"],
        "imageUrl": "https://example.com/image.jpg",
        "projectUrl": "https://example-project.com"
      }
    ]
  }
}
```

#### Get Freelancer Profile (Authenticated)
- **GET** `/freelancer/profile/:userId`
- **Auth Required**: Yes

**Response (200):**
```json
{
  "profile": {
    "id": "user_456",
    "name": "Jane Smith", 
    "email": "jane@example.com",
    "title": "Full Stack Developer",
    "description": "Experienced developer...",
    "hourlyRate": 50,
    "availability": "AVAILABLE",
    "location": "Remote",
    "skills": ["React", "Node.js", "Python"],
    "experience": "INTERMEDIATE",
    "languages": ["English", "Spanish"]
  }
}
```

#### Update Freelancer Profile
- **PUT** `/freelancer/profile/:userId`
- **Auth Required**: Yes

**Request Body:**
```json
{
  "title": "Senior Full Stack Developer",
  "description": "Updated description...",
  "hourlyRate": 65,
  "availability": "AVAILABLE",
  "location": "Remote Worldwide",
  "experience": "EXPERT",
  "languages": ["English", "Spanish", "French"]
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "id": "user_456",
    "title": "Senior Full Stack Developer",
    "hourlyRate": 65
  }
}
```

#### Update Freelancer Skills
- **PUT** `/freelancer/skills/:userId`
- **Auth Required**: Yes

**Request Body:**
```json
{
  "skills": [
    {
      "name": "React",
      "level": "EXPERT",
      "yearsOfExperience": 5
    },
    {
      "name": "Node.js", 
      "level": "ADVANCED",
      "yearsOfExperience": 4
    }
  ]
}
```

**Response (200):**
```json
{
  "message": "Skills updated successfully",
  "skills": [
    {
      "id": "skill_123",
      "name": "React",
      "level": "EXPERT",
      "yearsOfExperience": 5
    }
  ]
}
```

#### Create Portfolio Project
- **POST** `/freelancer/portfolio/:userId`
- **Auth Required**: Yes

**Request Body:**
```json
{
  "title": "E-commerce Platform",
  "description": "Built a full-stack e-commerce platform...",
  "technologies": ["React", "Node.js", "MongoDB", "Stripe"],
  "projectUrl": "https://my-ecommerce-project.com",
  "repositoryUrl": "https://github.com/user/ecommerce-project",
  "imageUrls": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
  "startDate": "2024-01-01",
  "endDate": "2024-03-01",
  "category": "WEB_DEVELOPMENT"
}
```

**Response (201):**
```json
{
  "message": "Portfolio project created successfully",
  "project": {
    "id": "project_123",
    "title": "E-commerce Platform",
    "description": "Built a full-stack e-commerce platform...",
    "technologies": ["React", "Node.js", "MongoDB", "Stripe"],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Update Portfolio Project
- **PUT** `/freelancer/portfolio/:userId/:projectId`
- **Auth Required**: Yes

**Request Body:**
```json
{
  "title": "Updated E-commerce Platform",
  "description": "Updated description...",
  "technologies": ["React", "Node.js", "MongoDB", "Stripe", "Redis"]
}
```

**Response (200):**
```json
{
  "message": "Portfolio project updated successfully",
  "project": {
    "id": "project_123",
    "title": "Updated E-commerce Platform"
  }
}
```

#### Delete Portfolio Project
- **DELETE** `/freelancer/portfolio/:userId/:projectId`
- **Auth Required**: Yes

**Response (200):**
```json
{
  "message": "Portfolio project deleted successfully"
}
```

---

## 2. CORE SERVICE

### 2.1 Job Routes (`/job`)

#### Browse Jobs (Public)
- **GET** `/job/browse`
- **Auth Required**: No

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `category` (optional): Job category
- `minBudget` (optional): Minimum budget
- `maxBudget` (optional): Maximum budget  
- `status` (optional): Job status
- `search` (optional): Search term

**Response (200):**
```json
{
  "jobs": [
    {
      "id": "job_123",
      "title": "Build a React App",
      "description": "Looking for a React developer...",
      "budget": 1500,
      "category": "WEB_DEVELOPMENT",
      "status": "OPEN",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "client": {
        "id": "user_123",
        "name": "John Doe",
        "rating": 4.5
      },
      "proposalCount": 12
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15
  }
}
```

#### Get Featured Jobs
- **GET** `/job/featured`
- **Auth Required**: No

**Query Parameters:**
- `limit` (optional): Number of jobs to return (default: 6)

**Response (200):**
```json
{
  "jobs": [
    {
      "id": "job_123",
      "title": "Build a React App",
      "budget": 1500,
      "category": "WEB_DEVELOPMENT",
      "featured": true,
      "proposalCount": 12
    }
  ]
}
```

#### Get Job Market Stats
- **GET** `/job/market-stats`
- **Auth Required**: No

**Response (200):**
```json
{
  "stats": {
    "totalJobs": 1250,
    "activeJobs": 850,
    "completedJobs": 400,
    "averageBudget": 2500,
    "topCategories": [
      {
        "category": "WEB_DEVELOPMENT",
        "count": 450
      },
      {
        "category": "MOBILE_DEVELOPMENT", 
        "count": 200
      }
    ]
  }
}
```

#### Get Public Job Details
- **GET** `/job/public/:jobId`
- **Auth Required**: No

**Response (200):**
```json
{
  "job": {
    "id": "job_123",
    "title": "Build a React App",
    "description": "Looking for an experienced React developer...",
    "budget": 1500,
    "category": "WEB_DEVELOPMENT",
    "status": "OPEN",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "client": {
      "id": "user_123",
      "name": "John Doe",
      "rating": 4.5,
      "completedJobs": 25
    },
    "skills": ["React", "JavaScript", "CSS"],
    "proposalCount": 12,
    "deadline": "2024-02-01T00:00:00.000Z"
  }
}
```

#### Create Job
- **POST** `/job/post`
- **Auth Required**: Yes

**Request Body:**
```json
{
  "title": "Build a React App",
  "description": "I need an experienced React developer to build a modern web application. The project includes user authentication, data visualization, and payment integration.",
  "budget": 1500,
  "category": "WEB_DEVELOPMENT"
}
```

**Response (201):**
```json
{
  "message": "Job created successfully",
  "job": {
    "id": "job_123",
    "title": "Build a React App",
    "description": "I need an experienced React developer...",
    "budget": 1500,
    "category": "WEB_DEVELOPMENT",
    "status": "OPEN",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get Client's Jobs
- **GET** `/job/`
- **Auth Required**: Yes

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page  
- `status` (optional): Job status filter
- `category` (optional): Category filter

**Response (200):**
```json
{
  "jobs": [
    {
      "id": "job_123",
      "title": "Build a React App", 
      "status": "OPEN",
      "budget": 1500,
      "proposalCount": 12,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5
  }
}
```

#### Get Job Details (Authenticated)
- **GET** `/job/:jobId`
- **Auth Required**: Yes

**Response (200):**
```json
{
  "job": {
    "id": "job_123",
    "title": "Build a React App",
    "description": "Full job description...",
    "budget": 1500,
    "status": "OPEN",
    "category": "WEB_DEVELOPMENT",
    "proposals": [
      {
        "id": "proposal_456",
        "freelancer": {
          "name": "Jane Smith",
          "rating": 4.8
        },
        "bidAmount": 1200,
        "estimatedDuration": "2 weeks"
      }
    ]
  }
}
```

#### Update Job
- **PUT** `/job/:jobId`
- **Auth Required**: Yes

**Request Body:**
```json
{
  "title": "Updated Job Title",
  "description": "Updated description...",
  "budget": 1800
}
```

**Response (200):**
```json
{
  "message": "Job updated successfully", 
  "job": {
    "id": "job_123",
    "title": "Updated Job Title",
    "budget": 1800
  }
}
```

#### Delete Job
- **DELETE** `/job/:jobId`
- **Auth Required**: Yes

**Response (200):**
```json
{
  "message": "Job deleted successfully"
}
```

#### Update Job Status
- **PATCH** `/job/:jobId/status`
- **Auth Required**: Yes

**Request Body:**
```json
{
  "status": "IN_PROGRESS"
}
```

**Valid Status Values:** `OPEN`, `IN_PROGRESS`, `COMPLETED`, `CANCELED`

**Response (200):**
```json
{
  "message": "Job status updated successfully",
  "job": {
    "id": "job_123",
    "status": "IN_PROGRESS"
  }
}
```

#### Get Job Proposals
- **GET** `/job/:jobId/proposals`
- **Auth Required**: Yes

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "proposals": [
    {
      "id": "proposal_456",
      "freelancer": {
        "id": "user_789",
        "name": "Jane Smith",
        "rating": 4.8,
        "completedProjects": 45
      },
      "bidAmount": 1200,
      "estimatedDuration": "2 weeks",
      "coverLetter": "I have extensive experience...",
      "status": "PENDING",
      "submittedAt": "2024-01-02T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 12
  }
}
```

#### Get Client Job Stats  
- **GET** `/job/stats/client`
- **Auth Required**: Yes

**Response (200):**
```json
{
  "stats": {
    "totalJobs": 15,
    "openJobs": 3,
    "inProgressJobs": 2,
    "completedJobs": 10,
    "totalSpent": 25000,
    "avgBudget": 1666.67,
    "totalProposals": 180
  }
}
```

### 2.2 Proposal Routes (`/proposals`)

All proposal routes require authentication.

#### Create Proposal
- **POST** `/proposals/proposals`
- **Auth Required**: Yes

**Request Body:**
```json
{
  "jobId": "job_123",
  "bidAmount": 1200,
  "estimatedDuration": "2 weeks",
  "coverLetter": "Dear client, I have extensive experience in React development and would love to work on this project. I have built similar applications and can deliver high-quality results within the timeline.",
  "attachments": ["file_url_1", "file_url_2"]
}
```

**Response (201):**
```json
{
  "message": "Proposal submitted successfully",
  "proposal": {
    "id": "proposal_456",
    "jobId": "job_123", 
    "freelancerId": "user_789",
    "bidAmount": 1200,
    "status": "PENDING",
    "submittedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

#### Get All Proposals  
- **GET** `/proposals/proposals`
- **Auth Required**: Yes

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Filter by status

**Response (200):**
```json
{
  "proposals": [
    {
      "id": "proposal_456",
      "job": {
        "id": "job_123",
        "title": "Build a React App",
        "budget": 1500
      },
      "bidAmount": 1200,
      "status": "PENDING",
      "submittedAt": "2024-01-02T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10, 
    "total": 25
  }
}
```

#### Get Proposal Details
- **GET** `/proposals/proposals/:id`
- **Auth Required**: Yes

**Response (200):**
```json
{
  "proposal": {
    "id": "proposal_456",
    "job": {
      "id": "job_123",
      "title": "Build a React App",
      "description": "Looking for React developer...",
      "budget": 1500,
      "client": {
        "name": "John Doe",
        "rating": 4.5
      }
    },
    "freelancer": {
      "id": "user_789",
      "name": "Jane Smith",
      "rating": 4.8
    },
    "bidAmount": 1200,
    "estimatedDuration": "2 weeks",
    "coverLetter": "Dear client, I have extensive experience...",
    "status": "PENDING",
    "submittedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

#### Update Proposal Status
- **PATCH** `/proposals/proposals/:id/status`
- **Auth Required**: Yes

**Request Body:**
```json
{
  "status": "ACCEPTED"
}
```

**Valid Status Values:** `PENDING`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`

**Response (200):**
```json
{
  "message": "Proposal status updated successfully",
  "proposal": {
    "id": "proposal_456",
    "status": "ACCEPTED"
  }
}
```

#### Delete Proposal
- **DELETE** `/proposals/proposals/:id`
- **Auth Required**: Yes

**Response (200):**
```json
{
  "message": "Proposal deleted successfully"
}
```

#### Get Proposals by Job ID
- **GET** `/proposals/jobs/:jobId/proposals`
- **Auth Required**: Yes

**Response (200):**
```json
{
  "proposals": [
    {
      "id": "proposal_456",
      "freelancer": {
        "name": "Jane Smith",
        "rating": 4.8
      },
      "bidAmount": 1200,
      "status": "PENDING"
    }
  ]
}
```

#### Get My Proposals (Freelancer)
- **GET** `/proposals/my-proposals`
- **Auth Required**: Yes

**Response (200):**
```json
{
  "proposals": [
    {
      "id": "proposal_456",
      "job": {
        "title": "Build a React App",
        "budget": 1500,
        "client": {
          "name": "John Doe"
        }
      },
      "bidAmount": 1200,
      "status": "PENDING",
      "submittedAt": "2024-01-02T00:00:00.000Z"
    }
  ]
}
```

---

## 3. MEDIA SERVICE (Cloudflare Worker)

### 3.1 Upload Routes (`/api/upload`)

#### Generic Upload
- **POST** `/api/upload/`
- **Auth Required**: Yes
- **Content-Type**: `multipart/form-data`

**Form Data:**
- `file`: File to upload
- `type`: Upload type (`verification`, `job`, `chat`, `profile`, `other`)
- `category`: Category (optional)
- `isPublic`: "true" or "false" (optional)

**Response (200):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "id": "file_123",
    "fileName": "generated_file_name.jpg",
    "originalName": "my_image.jpg",
    "fileSize": 1024000,
    "fileType": "image/jpeg",
    "uploadType": "job",
    "category": "general",
    "url": "/api/files/file_123",
    "isPublic": false,
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Upload Profile Picture
- **POST** `/api/upload/profile`
- **Auth Required**: Yes

**Form Data:**
- `file`: Image file

**Response (200):**
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "profilePictureUrl": "https://your-bucket-url.com/profile_pic.jpg"
}
```

#### Bulk Upload
- **POST** `/api/upload/bulk`
- **Auth Required**: Yes

**Form Data:**
- `files[]`: Multiple files
- `type`: Upload type (`job`, `chat`, `other`)
- `category`: Category (optional)
- `isPublic`: "true" or "false" (optional)

**Response (200):**
```json
{
  "success": true,
  "message": "5 files uploaded successfully",
  "files": [
    {
      "id": "file_123",
      "fileName": "file1.jpg",
      "originalName": "image1.jpg",
      "fileSize": 1024000,
      "fileType": "image/jpeg",
      "url": "/api/files/file_123",
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "errors": [
    {
      "file": "invalid_file.txt",
      "error": "File type not allowed"
    }
  ]
}
```

#### Get Upload Configuration
- **GET** `/upload/config`
- **Auth Required**: No

**Query Parameters:**
- `type` (optional): Upload type

**Response (200):**
```json
{
  "uploadType": "job",
  "maxFileSize": {
    "verification": 10485760,
    "job": 52428800,
    "chat": 104857600,
    "profile": 5242880,
    "other": 10485760
  },
  "allowedTypes": {
    "verification": ["image/jpeg", "image/png", "image/webp"],
    "job": ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"],
    "chat": ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "video/mp4", "video/quicktime", "video/webm"],
    "profile": ["image/jpeg", "image/png", "image/webp"],
    "other": ["image/jpeg", "image/png", "image/webp", "image/gif"]
  },
  "maxFiles": {
    "verification": 3,
    "job": 10,
    "chat": 0,
    "profile": 1,
    "other": 5
  }
}
```

### 3.2 File Routes (`/api/files`)

#### Get File
- **GET** `/api/files/:fileId`
- **Auth Required**: Yes

**Response**: File content with appropriate headers

#### Get File Info
- **GET** `/api/files/:fileId/info`  
- **Auth Required**: Yes

**Response (200):**
```json
{
  "id": "file_123",
  "originalName": "my_document.pdf",
  "fileType": "application/pdf",
  "fileSize": 2048000,
  "uploadedAt": "2024-01-01T00:00:00.000Z",
  "uploadedBy": "user_456"
}
```

#### Delete File
- **DELETE** `/api/files/:fileId`
- **Auth Required**: Yes

**Response (200):**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

#### List User Files
- **GET** `/api/files/`
- **Auth Required**: Yes

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `type` (optional): Upload type filter
- `category` (optional): Category filter

**Response (200):**
```json
{
  "files": [
    {
      "id": "file_123",
      "originalName": "document.pdf",
      "fileType": "application/pdf",
      "uploadType": "job",
      "category": "general",
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50
  }
}
```

#### Update File Metadata
- **PUT** `/api/files/:fileId`
- **Auth Required**: Yes

**Request Body:**
```json
{
  "category": "updated_category",
  "isPublic": false,
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "File metadata updated successfully"
}
```

#### Generate Signed URL
- **POST** `/api/files/:fileId/signed-url`
- **Auth Required**: Yes

**Request Body:**
```json
{
  "expiresIn": 3600
}
```

**Response (200):**
```json
{
  "signedUrl": "https://bucket-url.com/file?signature=...",
  "expiresAt": "2024-01-01T01:00:00.000Z"
}
```

### 3.3 Verification Routes (`/api/verification`)

#### Upload ID Document
- **POST** `/api/verification/upload`
- **Auth Required**: Yes

**Form Data:**
- `file`: Image file
- `docType`: Document type (`front`, `back`, `selfie`)

**Response (200):**
```json
{
  "success": true,
  "message": "front document uploaded successfully",
  "file": {
    "id": "doc_123",
    "docType": "front",
    "fileName": "id_front_user123.jpg",
    "originalName": "id_front.jpg",
    "fileSize": 2048000,
    "uploadedAt": "2024-01-01T00:00:00.000Z",
    "status": "pending"
  }
}
```

#### Get Verification Status
- **GET** `/api/verification/status`
- **Auth Required**: Yes

**Response (200):**
```json
{
  "overallStatus": "pending",
  "documents": [
    {
      "doc_type": "front",
      "file_name": "id_front_user123.jpg",
      "original_name": "id_front.jpg",
      "file_size": 2048000,
      "status": "approved",
      "uploaded_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "doc_type": "back",
      "file_name": "id_back_user123.jpg",
      "original_name": "id_back.jpg",
      "file_size": 1876543,
      "status": "pending",
      "uploaded_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "missingDocs": ["selfie"],
  "requiredDocs": ["front", "back", "selfie"]
}
```

**Status Values:** `incomplete`, `pending`, `approved`, `rejected`

#### Delete Verification Document
- **DELETE** `/api/verification/:docType`
- **Auth Required**: Yes

**Response (200):**
```json
{
  "success": true,
  "message": "front document deleted successfully"
}
```

### 3.4 Chat Routes (`/api/chat`)

#### Upload Chat Attachment
- **POST** `/api/chat/upload`
- **Auth Required**: Yes

**Form Data:**
- `files[]`: Multiple files
- `chatId`: Chat ID
- `messageId`: Message ID (optional)

**Response (200):**
```json
{
  "success": true,
  "message": "3 files uploaded successfully",
  "files": [
    {
      "id": "attachment_123",
      "fileName": "chat_file_123.jpg",
      "originalName": "screenshot.jpg",
      "fileSize": 1024000,
      "fileType": "image/jpeg",
      "url": "/api/chat/files/attachment_123",
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Get Chat File
- **GET** `/api/chat/files/:fileId`
- **Auth Required**: Yes

**Response**: File content with appropriate headers

#### Get Chat Attachments
- **GET** `/api/chat/:chatId/attachments`
- **Auth Required**: Yes

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "attachments": [
    {
      "id": "attachment_123",
      "user_id": "user_456",
      "message_id": "msg_789",
      "original_name": "document.pdf",
      "file_type": "application/pdf",
      "file_size": 2048000,
      "url": "/api/chat/files/attachment_123",
      "uploaded_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

#### Delete Chat Attachment
- **DELETE** `/api/chat/attachments/:attachmentId`
- **Auth Required**: Yes

**Response (200):**
```json
{
  "success": true,
  "message": "Attachment deleted successfully"
}
```

#### Get Attachment Info
- **GET** `/api/chat/attachments/:attachmentId/info`
- **Auth Required**: Yes

**Response (200):**
```json
{
  "id": "attachment_123",
  "originalName": "screenshot.jpg",
  "fileType": "image/jpeg",
  "fileSize": 1024000,
  "uploadedAt": "2024-01-01T00:00:00.000Z",
  "uploadedBy": "user_456"
}
```

### 3.5 Job Media Routes (`/api/jobs`)

#### Upload Job Assets  
- **POST** `/api/jobs/upload`
- **Auth Required**: Yes

**Form Data:**
- `files[]`: Multiple files  
- `jobId`: Job ID (optional)
- `category`: Category (optional, default: "general")
- `isPublic`: "true" or "false" (optional)

**Response (200):**
```json
{
  "success": true,
  "message": "3 files uploaded successfully",
  "files": [
    {
      "id": "asset_123",
      "fileName": "job_asset_123.jpg",
      "originalName": "project_mockup.jpg",
      "fileSize": 1024000,
      "fileType": "image/jpeg",
      "category": "mockup",
      "url": "https://bucket-url.com/job_asset_123.jpg",
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Get Job Assets
- **GET** `/api/jobs/:jobId/assets`
- **Auth Required**: No (shows public assets) / Yes (shows all assets if owner)

**Response (200):**
```json
{
  "assets": [
    {
      "id": "asset_123",
      "file_name": "job_asset_123.jpg",
      "original_name": "project_mockup.jpg",
      "file_type": "image/jpeg",
      "file_size": 1024000,
      "category": "mockup",
      "url": "https://bucket-url.com/job_asset_123.jpg",
      "uploaded_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Get User's Job Assets
- **GET** `/api/jobs/my-assets`
- **Auth Required**: Yes

**Query Parameters:**
- `page` (optional): Page number  
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "assets": [
    {
      "id": "asset_123",
      "job_id": "job_456",
      "file_name": "job_asset_123.jpg",
      "original_name": "project_mockup.jpg",
      "file_type": "image/jpeg",
      "file_size": 1024000,
      "category": "mockup",
      "is_public": 1,
      "url": "https://bucket-url.com/job_asset_123.jpg",
      "uploaded_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "pages": 2
  }
}
```

#### Delete Job Asset
- **DELETE** `/api/jobs/:assetId`
- **Auth Required**: Yes

**Response (200):**
```json
{
  "success": true,
  "message": "Asset deleted successfully"
}
```

#### Update Job Asset  
- **PUT** `/api/jobs/:assetId`
- **Auth Required**: Yes

**Request Body:**
```json
{
  "category": "updated_category",
  "isPublic": false
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Asset updated successfully"
}
```

---

## 4. CHAT SERVICE (WebSocket)

**Connection URL**: `ws://localhost:5002`
**Auth Required**: Yes (JWT token in Authorization header)

### Connection Headers:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### 4.1 WebSocket Message Types

#### Chat Message
**Send:**
```json
{
  "type": "chat",
  "recipientId": "user_456",
  "message": "Hello, how are you?"
}
```

**Receive:**
```json
{
  "type": "chat",
  "id": "msg_123",
  "senderId": "user_789",
  "recipientId": "user_456", 
  "message": "Hello, how are you?",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "status": "sent"
}
```

#### Typing Indicators
**Start Typing:**
```json
{
  "type": "typing_start",
  "recipientId": "user_456"
}
```

**Stop Typing:**
```json
{
  "type": "typing_stop", 
  "recipientId": "user_456"
}
```

**Receive Typing:**
```json
{
  "type": "typing_start",
  "senderId": "user_789",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Read Receipts
**Mark as Read:**
```json
{
  "type": "mark_read",
  "messageId": "msg_123",
  "recipientId": "user_456"
}
```

**Receive Read Receipt:**
```json
{
  "type": "message_read",
  "messageId": "msg_123",
  "readBy": "user_456",
  "readAt": "2024-01-01T00:00:00.000Z"
}
```

### 4.2 Message Status Values:
- `sent`: Message delivered to server
- `delivered`: Message delivered to recipient
- `read`: Message read by recipient

---

## 5. PAYMENT SERVICE

**Base URL**: `http://localhost:5003`

Currently minimal implementation. Expected endpoints would include:

#### Process Payment
- **POST** `/payment/process`
- **Auth Required**: Yes

**Request Body:**
```json
{
  "amount": 1500,
  "currency": "USD",
  "jobId": "job_123",
  "freelancerId": "user_456",
  "paymentMethod": "card",
  "cardToken": "stripe_token_123"
}
```

#### Get Payment History
- **GET** `/payment/history`
- **Auth Required**: Yes

#### Create Escrow
- **POST** `/payment/escrow`
- **Auth Required**: Yes

#### Release Escrow  
- **POST** `/payment/escrow/:escrowId/release`
- **Auth Required**: Yes

---

## Error Responses

All services return consistent error responses:

```json
{
  "error": "Error message description",
  "details": {
    "field": "Specific field error"
  }
}
```

### Common HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (access denied)
- `404`: Not Found
- `500`: Internal Server Error

---

## Rate Limits

- Authentication endpoints: 5 requests per minute per IP
- Upload endpoints: 10 requests per minute per user
- Other endpoints: 100 requests per minute per user

---

## Testing Examples

### Authentication Flow:
1. Register: `POST /auth/register`
2. Verify email: `POST /otp/verify`  
3. Login: `POST /auth/login`
4. Use token in subsequent requests

### Job Creation Flow:
1. Login to get token
2. Upload job assets: `POST /api/jobs/upload`
3. Create job: `POST /job/post`
4. Browse public jobs: `GET /job/browse`

### Freelancer Profile Setup:
1. Login as freelancer
2. Upload profile picture: `POST /api/upload/profile`
3. Update profile: `PUT /freelancer/profile/:userId`
4. Add skills: `PUT /freelancer/skills/:userId`
5. Add portfolio: `POST /freelancer/portfolio/:userId`

### Proposal Workflow:
1. Browse jobs: `GET /job/browse`
2. View job details: `GET /job/public/:jobId`
3. Submit proposal: `POST /proposals/proposals`
4. Check proposal status: `GET /proposals/my-proposals`

This documentation covers all major endpoints across the Frevix platform services. Each endpoint includes authentication requirements, request/response examples, and validation rules to help with frontend integration and testing.
