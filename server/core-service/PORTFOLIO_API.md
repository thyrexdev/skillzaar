# Portfolio API Documentation

## Overview

The portfolio API allows freelancers to manage their portfolio projects with full CRUD operations.

## Database Schema Updates

### ✅ Fixed Issues:
- **PortfolioLink model**: Updated with proper fields (`title`, `imageUrls`, `githubUrl`, `liveUrl`)
- **Freelancer model**: Added missing fields (`profilePicture`, `isAvailable`, `createdAt`, `updatedAt`)
- **ExperienceLevel enum**: Updated to use `JUNIOR`, `MID`, `SENIOR`
- **Database sync**: All schema changes migrated successfully

## Endpoints

### 0. Get Public Freelancer Profile (NEW!)
- **Method**: `GET`
- **URL**: `/freelancer/public-profile/:userId`
- **Headers**: None (No authentication required)
- **Description**: Get public freelancer profile information that can be viewed by anyone
- **Response**:
```json
{
  "success": true,
  "message": "Public freelancer profile retrieved successfully",
  "data": {
    "fullName": "John Doe",
    "bio": "I am a passionate full-stack developer...",
    "hourlyRate": 75,
    "experienceLevel": "MID",
    "skills": ["JavaScript", "React", "Node.js"],
    "portfolioLinks": [
      {
        "title": "Weather App",
        "description": "A weather forecasting app...",
        "imageUrls": ["url1", "url2"],
        "liveUrl": "https://weather-app.example.com"
      }
    ],
    "contractsCount": 5,
    "reviewsCount": 12
  }
}
```

### 1. Create Portfolio Project
- **Method**: `POST`
- **URL**: `/freelancer/portfolio/:userId`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "title": "My Awesome Web App",
  "description": "A full-stack web application built with React and Node.js",
  "imageUrls": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "githubUrl": "https://github.com/user/project",
  "liveUrl": "https://myproject.vercel.app"
}
```

### 2. Update Portfolio Project
- **Method**: `PUT`
- **URL**: `/freelancer/portfolio/:userId/:projectId`
- **Headers**: `Authorization: Bearer <token>`
- **Body** (all fields optional for partial updates):
```json
{
  "title": "Updated Project Title",
  "description": "Updated description",
  "imageUrls": ["https://example.com/new-image.jpg"],
  "githubUrl": "https://github.com/user/updated-project",
  "liveUrl": "https://updated-project.vercel.app"
}
```

### 3. Delete Portfolio Project
- **Method**: `DELETE`
- **URL**: `/freelancer/portfolio/:userId/:projectId`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: None

## Response Format

### Success Response:
```json
{
  "success": true,
  "message": "Portfolio project created/updated successfully",
  "data": {
    "id": "project-uuid",
    "title": "Project Title",
    "description": "Project description",
    "imageUrls": ["url1", "url2"],
    "githubUrl": "github-url",
    "liveUrl": "live-url",
    "freelancerId": "freelancer-uuid"
  }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error description"
}
```

## Security Features

- ✅ **Authentication Required**: All endpoints require valid JWT token
- ✅ **Ownership Validation**: Users can only modify their own portfolio projects
- ✅ **Input Validation**: Zod schemas validate all incoming data
- ✅ **Error Handling**: Comprehensive error handling with appropriate HTTP status codes

## Testing

The database schema has been successfully updated and tested. All portfolio endpoints are ready for use.

## Example Usage with curl

### Create a portfolio project:
```bash
curl -X POST http://localhost:3000/freelancer/portfolio/USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "E-commerce Platform",
    "description": "A modern e-commerce platform with React and Node.js",
    "imageUrls": ["https://example.com/screenshot1.jpg"],
    "githubUrl": "https://github.com/username/ecommerce",
    "liveUrl": "https://myecommerce.com"
  }'
```

### Update a portfolio project:
```bash
curl -X PUT http://localhost:3000/freelancer/portfolio/USER_ID/PROJECT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated E-commerce Platform",
    "description": "Updated description with new features"
  }'
```

### Delete a portfolio project:
```bash
curl -X DELETE http://localhost:3000/freelancer/portfolio/USER_ID/PROJECT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get public freelancer profile (no authentication required):
```bash
curl -X GET http://localhost:3000/freelancer/public-profile/USER_ID
```
