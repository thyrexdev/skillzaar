import { prisma } from '@frevix/shared';
import * as jose from 'jose';
import { env } from '../config/env';
import { logger } from '@frevix/config/dist/logger';

export interface OAuthUserProfile {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  provider: 'GOOGLE';
}

export interface OAuthResult {
  user: any;
  token: string;
  isNewUser: boolean;
}

export const OAuthService = {
  async handleOAuthCallback(profile: OAuthUserProfile, role: 'CLIENT' | 'FREELANCER'): Promise<OAuthResult> {
    try {
      const { id, email, name, profilePicture, provider } = profile;
      
      // Check if user exists by Google OAuth ID
      let user = await prisma.user.findUnique({
        where: { googleId: id }
      });

      let isNewUser = false;

      if (!user) {
        // Check if user exists by email
        user = await prisma.user.findUnique({ where: { email } });

        if (user) {
          // User exists with email but not connected to this OAuth provider
          // Update user to link Google OAuth
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              googleId: id,
              profilePicture: profilePicture || user.profilePicture,
              authProvider: provider,
            }
          });
        } else {
          // Create new user
          user = await prisma.user.create({
            data: {
              email,
              name,
              role: role.toUpperCase() as 'CLIENT' | 'FREELANCER',
              isVerified: true, // OAuth accounts are considered verified
              profilePicture,
              authProvider: provider,
              googleId: id,
            }
          });
          isNewUser = true;
        }
      }

      // Generate JWT token
      const secret = new TextEncoder().encode(env.JWT_SECRET);
      const alg = 'HS256';

      const token = await new jose.SignJWT({ 
        sub: user.id, 
        role: user.role,
        provider: user.authProvider 
      })
        .setProtectedHeader({ alg })
        .setExpirationTime('7d')
        .sign(secret);

      // Remove password from user object (should be null for OAuth users anyway)
      const { password: _, ...userWithoutPassword } = user;

      logger.info(`OAuth ${provider} ${isNewUser ? 'registration' : 'login'} successful: ${user.email}`);

      return {
        user: userWithoutPassword,
        token,
        isNewUser
      };
    } catch (error: any) {
      logger.error(`OAuth callback error: ${error.message}`);
      throw new Error('OAuth authentication failed');
    }
  },

  async unlinkGoogleProvider(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          googleId: null,
          // If this was the primary auth method, ensure user has password
          authProvider: 'EMAIL'
        }
      });

      logger.info(`Google OAuth unlinked for user: ${userId}`);
    } catch (error: any) {
      logger.error(`Google OAuth unlink error: ${error.message}`);
      throw new Error('Failed to unlink Google account');
    }
  }
};
