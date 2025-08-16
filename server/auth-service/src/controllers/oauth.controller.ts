import { Context } from 'hono';
import axios from 'axios';
import { OAuthService, OAuthUserProfile } from '../services/oauth.service';
import { logger } from '@vync/config';
import { env } from '@vync/config';
export const googleOAuth = async (c: Context) => {
  try {
    const { code, role } = await c.req.json();
    
    if (!code || !role) {
      return c.json({ error: 'Code and role are required' }, 400);
    }

    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      return c.json({ error: 'Google OAuth not configured' }, 500);
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${env.CLIENT_URL}/auth/google/callback`
    });

    const { access_token } = tokenResponse.data;

    // Get user profile
    const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const googleProfile = profileResponse.data;
    
    const profile: OAuthUserProfile = {
      id: googleProfile.id,
      email: googleProfile.email,
      name: googleProfile.name,
      profilePicture: googleProfile.picture,
      provider: 'GOOGLE'
    };

    const result = await OAuthService.handleOAuthCallback(profile, role.toUpperCase());
    
    return c.json(result, 200);
  } catch (error: any) {
    logger.error(`Google OAuth error: ${error.message}`);
    return c.json({ error: 'Google authentication failed' }, 400);
  }
};


export const getOAuthConfig = async (c: Context) => {
  return c.json({
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      enabled: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
    },
    redirectUri: {
      google: `${env.CLIENT_URL}/auth/google/callback`
    }
  });
};

export const unlinkGoogleProvider = async (c: Context) => {
  try {
    const userId = c.get('user')?.id;

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    await OAuthService.unlinkGoogleProvider(userId);
    
    return c.json({ message: 'Google account unlinked successfully' });
  } catch (error: any) {
    logger.error(`Unlink Google provider error: ${error.message}`);
    return c.json({ error: error.message }, 400);
  }
};
