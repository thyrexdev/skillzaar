import { Hono } from 'hono';
import { googleOAuth, getOAuthConfig, unlinkGoogleProvider } from '../controllers/oauth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const oauthRoutes = new Hono();

// Get OAuth configuration (public endpoint)
oauthRoutes.get('/config', getOAuthConfig);

// Google OAuth authentication endpoint
oauthRoutes.post('/google', googleOAuth);

// Unlink Google provider (protected endpoint)
oauthRoutes.delete('/unlink/google', authMiddleware, unlinkGoogleProvider);

export default oauthRoutes;
