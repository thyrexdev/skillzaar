import bcrypt from "bcryptjs";
import * as jose from 'jose';
import { prisma } from "@vync/shared";
import { env } from "@vync/config";
import { logger } from "@vync/config";
import { authCacheUtils, CachedUser, SessionData } from "../utils/cache.utils";
import { 
  RegisterRequest, 
  LoginRequest, 
  AuthServiceRegisterResult, 
  AuthServiceLoginResult,
} from "../interfaces/auth.interfaces";

export const AuthService = {
register: async ({ name, email, phoneNumber, country, password, role }: RegisterRequest): Promise<AuthServiceRegisterResult> => {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error("User already exists");

    const hashed = await bcrypt.hash(password, 10);
    const normalizedRole = role.toUpperCase() as 'CLIENT' | 'FREELANCER' | 'ADMIN';
    
    // Use a transaction to ensure user and profile creation are atomic
    const result = await prisma.$transaction(async (tx) => {
      // Create user first
      const user = await tx.user.create({
        data: {
          name,
          email,
          phoneNumber,
          country,
          password: hashed,
          role: normalizedRole,
          isVerified: false,
        },
      });

      // Create corresponding profile based on role
      if (normalizedRole === 'CLIENT') {
        await tx.client.create({
          data: {
            userId: user.id,
            fullName: name, // Use the user's name as fullName
          },
        });
        logger.info(`Created Client profile for: ${user.email}`);
      } else if (normalizedRole === 'FREELANCER') {
        await tx.freelancer.create({
          data: {
            userId: user.id,
            fullName: name, // Use the user's name as fullName
            experienceLevel: 'JUNIOR', // Default to JUNIOR, user can update later
          },
        });
        logger.info(`Created Freelancer profile for: ${user.email}`);
      }

      return user;
    });

    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const alg = 'HS256';

    const token = await new jose.SignJWT({ sub: result.id, role: result.role })
      .setProtectedHeader({ alg })
      .setExpirationTime('7d')
      .sign(secret);

    // Remove password from user object before returning
    const { password: _, ...userWithoutPassword } = result;

    // Cache user data in Redis
    try {
      const cachedUser: CachedUser = {
        id: result.id,
        email: result.email,
        phoneNumber: result.phoneNumber,
        country: result.country,
        name: result.name,
        role: result.role,
        isVerified: result.isVerified,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
      };
      await authCacheUtils.cacheUser(cachedUser, 60 * 60); // Cache for 1 hour
    } catch (error) {
      logger.error(`Failed to cache user data for ${result.id}:`, error);
      // Continue without caching
    }

    logger.info(`User registered: ${result.email}`);
    return { user: userWithoutPassword, token };
  },

login: async ({ email, password }: LoginRequest, ipAddress?: string, userAgent?: string): Promise<AuthServiceLoginResult> => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("User not found");

    // Check if user is Google OAuth user without password
    if (!user.password && user.googleId) {
      throw new Error("Please sign in using your Google account");
    }

    if (!user.password) {
      throw new Error("Invalid credentials");
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error("Invalid credentials");

    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const alg = 'HS256';

    const token = await new jose.SignJWT({ sub: user.id, role: user.role })
      .setProtectedHeader({ alg })
      .setExpirationTime('7d')
      .sign(secret);

    // Remove password from user object before returning
    const { password: _, ...userWithoutPassword } = user;

    // Cache user data in Redis
    try {
      const cachedUser: CachedUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };
      await authCacheUtils.cacheUser(cachedUser, 60 * 60); // Cache for 1 hour
    } catch (error) {
      logger.error(`Failed to cache user data for ${user.id}:`, error);
      // Continue without caching
    }

    // Create user session in Redis
    try {
      const sessionData: Omit<SessionData, 'userId'> = {
        email: user.email,
        role: user.role,
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        ipAddress,
        userAgent,
      };
      await authCacheUtils.createSession(user.id, sessionData, 7 * 24 * 60 * 60); // 7 days
    } catch (error) {
      logger.error(`Failed to create session for user ${user.id}:`, error);
      // Continue without session caching
    }

    logger.info(`User logged in: ${user.email}`);
    return { user: userWithoutPassword, token };
  },

  logout: async (userId: string, token: string): Promise<{ message: string }> => {
    try {
      // Blacklist the token
      const decoded = jose.decodeJwt(token);
      const expiryDate = new Date((decoded.exp || 0) * 1000);
      await authCacheUtils.blacklistToken(token, expiryDate);

      // Delete user session
      await authCacheUtils.deleteSession(userId);

      logger.info(`User logged out: ${userId}`);
      return { message: 'Successfully logged out' };
    } catch (error) {
      logger.error(`Logout error for user ${userId}:`, error);
      throw new Error('Failed to logout');
    }
  },

  getUserFromCache: async (userId: string): Promise<CachedUser | null> => {
    try {
      return await authCacheUtils.getCachedUser(userId);
    } catch (error) {
      logger.error(`Failed to get user from cache ${userId}:`, error);
      return null;
    }
  },

  refreshUserCache: async (userId: string): Promise<CachedUser | null> => {
    try {
      // Get fresh user data from database
      const user = await prisma.user.findUnique({ 
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      if (!user) {
        await authCacheUtils.invalidateUserCache(userId);
        return null;
      }

      // Update cache with fresh data
      const cachedUser: CachedUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        country: user.country,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };

      await authCacheUtils.cacheUser(cachedUser, 60 * 60); // Cache for 1 hour
      return cachedUser;
    } catch (error) {
      logger.error(`Failed to refresh user cache for ${userId}:`, error);
      return null;
    }
  },

  invalidateUserSessions: async (userId: string): Promise<void> => {
    try {
      await authCacheUtils.invalidateAllUserSessions(userId);
      logger.info(`All sessions invalidated for user: ${userId}`);
    } catch (error) {
      logger.error(`Failed to invalidate sessions for user ${userId}:`, error);
      throw error;
    }
  },
};
