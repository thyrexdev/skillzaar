# Google & Facebook OAuth Setup Guide

This guide will help you implement Google and Facebook OAuth authentication in your Frevix application.

## Overview

The OAuth implementation provides:
- **Seamless sign-in/sign-up** with Google and Facebook
- **User-friendly UX** with minimal friction
- **Role-based authentication** (Client/Freelancer)
- **Account linking** for existing email users
- **Secure token management**

## Backend Setup

### 1. Database Schema Updates

The Prisma schema has been updated to support OAuth:

```prisma
model User {
  // ... existing fields
  
  // OAuth fields
  googleId       String?        @unique
  facebookId     String?        @unique
  profilePicture String?
  authProvider   AuthProvider   @default(EMAIL)
  password       String?        // Now optional for OAuth users
}

enum AuthProvider {
  EMAIL
  GOOGLE
  FACEBOOK
}
```

### 2. Environment Configuration

Create/update your `.env` file with OAuth credentials:

```env
# Google OAuth (Get from https://console.developers.google.com/)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Facebook OAuth (Get from https://developers.facebook.com/)
FACEBOOK_APP_ID="your-facebook-app-id"
FACEBOOK_APP_SECRET="your-facebook-app-secret"

# URLs
CLIENT_URL="http://localhost:3000"
SERVER_URL="http://localhost:5001"
```

### 3. Google Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API or Google OAuth2 API
4. Go to "Credentials" > "Create Credentials" > "OAuth 2.0 Client ID"
5. Set Application type to "Web application"
6. Add Authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)

### 4. Facebook Developers Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select existing one
3. Add "Facebook Login" product
4. In Facebook Login settings, add Valid OAuth Redirect URIs:
   - `http://localhost:3000/auth/facebook/callback` (development)
   - `https://yourdomain.com/auth/facebook/callback` (production)
5. Note your App ID and App Secret

### 5. Install Dependencies

```bash
cd server/auth-service
bun install
```

The following dependencies have been added:
- `@hono/node-server`: For Node.js compatibility
- `passport`: OAuth strategy handler
- `passport-google-oauth20`: Google OAuth strategy
- `passport-facebook`: Facebook OAuth strategy
- `axios`: HTTP client

## Frontend Setup

### 1. Install Dependencies

Dependencies are already included in the existing `package.json`.

### 2. OAuth Components

The implementation includes:
- `OAuthButtons`: Renders Google/Facebook sign-in buttons
- `GoogleCallbackPage`: Handles Google OAuth callback
- `FacebookCallbackPage`: Handles Facebook OAuth callback
- `oauthService`: Manages OAuth API calls

## API Endpoints

### OAuth Configuration
```http
GET /oauth/config
```
Returns OAuth configuration and availability status.

### Google Authentication
```http
POST /oauth/google
Content-Type: application/json

{
  "code": "authorization_code_from_google",
  "role": "CLIENT" // or "FREELANCER"
}
```

### Facebook Authentication
```http
POST /oauth/facebook
Content-Type: application/json

{
  "code": "authorization_code_from_facebook", 
  "role": "CLIENT" // or "FREELANCER"
}
```

### Unlink Provider
```http
DELETE /oauth/unlink/{provider}
Authorization: Bearer {jwt_token}
```

## User Experience Flow

### New User Registration
1. User selects role (Client/Freelancer)
2. Clicks "Continue with Google/Facebook"
3. Redirected to provider's consent screen
4. After consent, redirected back with authorization code
5. Backend exchanges code for user profile
6. New account created with OAuth provider info
7. User redirected to dashboard

### Existing User Login
1. User clicks OAuth button
2. System detects existing account by email
3. Links OAuth provider to existing account
4. User logged in successfully

### Account Linking
- If user has email account but signs in with OAuth, accounts are automatically linked
- OAuth becomes primary auth method
- User can still use email/password if they had one originally

## Security Features

### Token Management
- JWT tokens with 7-day expiration
- Secure HTTP-only cookies (recommended for production)
- Provider tokens are not stored (only profile info)

### Data Protection
- User passwords are bcrypt hashed
- OAuth provider IDs are stored securely
- Profile pictures loaded via HTTPS

### Validation
- Email verification through OAuth providers
- Role validation on both frontend and backend
- CSRF protection through state parameters

## Error Handling

### Common Errors
- **Provider not configured**: OAuth credentials missing
- **Invalid authorization code**: Code expired or tampered
- **Network errors**: Provider API unavailable
- **Account conflicts**: Rare edge cases handled gracefully

### User-Friendly Messages
- "Google/Facebook sign-in temporarily unavailable"
- "Please try signing in with your email instead"
- "Account linking successful"

## Production Considerations

### Environment Variables
```env
# Production URLs
CLIENT_URL="https://yourdomain.com"
SERVER_URL="https://api.yourdomain.com"

# OAuth credentials (production keys)
GOOGLE_CLIENT_ID="prod-google-client-id"
GOOGLE_CLIENT_SECRET="prod-google-client-secret"
FACEBOOK_APP_ID="prod-facebook-app-id"  
FACEBOOK_APP_SECRET="prod-facebook-app-secret"
```

### SSL/HTTPS
- OAuth providers require HTTPS in production
- Update redirect URIs to use HTTPS
- Ensure SSL certificate is valid

### Performance
- OAuth config is cached on frontend
- Minimal database queries per authentication
- Optimized user profile fetching

## Testing

### Development Testing
1. Set up test OAuth apps with localhost URLs
2. Test both new user and existing user flows
3. Verify role selection works correctly
4. Test error scenarios (denied access, network issues)

### Production Testing  
1. Create separate OAuth apps for staging
2. Test with real Google/Facebook accounts
3. Verify HTTPS redirect URIs work
4. Monitor authentication success rates

## Troubleshooting

### Common Issues

**OAuth buttons not showing:**
- Check if provider is enabled in config
- Verify environment variables are set
- Check browser console for errors

**"Redirect URI mismatch" error:**
- Verify redirect URIs match exactly in provider console
- Check for trailing slashes or http vs https
- Ensure URLs are publicly accessible

**User not being created:**
- Check database connection
- Verify Prisma schema is up to date
- Check server logs for detailed errors

**Token errors:**
- Verify JWT_SECRET is set
- Check token expiration settings
- Ensure auth middleware is working

## Future Enhancements

### Planned Features
- [ ] Apple Sign-In support
- [ ] LinkedIn OAuth for professionals
- [ ] Twitter/X authentication
- [ ] Multi-account linking UI
- [ ] OAuth provider management in user settings

### Scalability
- [ ] Redis caching for OAuth configs
- [ ] Rate limiting for OAuth endpoints
- [ ] Analytics for OAuth usage
- [ ] A/B testing for different OAuth flows

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs in `auth-service`
3. Test OAuth flows in isolation
4. Verify provider console configurations

The OAuth implementation follows industry best practices for security and user experience. Users can seamlessly sign up or log in with their preferred social media accounts while maintaining the flexibility of email-based authentication.
