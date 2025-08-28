import bcrypt from "bcryptjs";
import * as jose from 'jose';
import { prisma } from "@vync/shared";
import { env } from "@vync/config";
import { logger } from "@vync/config";
import {
  RegisterRequest,
  LoginRequest,
  AuthServiceRegisterResult,
  AuthServiceLoginResult,
} from "../interfaces/auth.interfaces";
import { cachedUserSession, clearUserSession } from "../cahce/auth.cache";

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

export const AuthService = {
  register: async ({ name, email, phoneNumber, country, password, role }: RegisterRequest): Promise<AuthServiceRegisterResult> => {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error("User already exists");

    const hashed = await bcrypt.hash(password, 10);
    const normalizedRole = role.toUpperCase() as 'CLIENT' | 'FREELANCER' | 'ADMIN';

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

      const { password: _, ...userWithoutPassword } = user;

      await cachedUserSession(
        {
          id: userWithoutPassword.id,
          name: userWithoutPassword.name,
          phoneNumber: userWithoutPassword.phoneNumber,
          country: userWithoutPassword.country,
          email: userWithoutPassword.email,
          isVerified: userWithoutPassword.isVerified,
          role: userWithoutPassword.role,
        },
        60 * 60 * 24 * 7
      )
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

    await cachedUserSession({
      id: userWithoutPassword.id,
      name: userWithoutPassword.name,
      phoneNumber: userWithoutPassword.phoneNumber,
      country: userWithoutPassword.country,
      email: userWithoutPassword.email,
      isVerified: userWithoutPassword.isVerified,
      role: userWithoutPassword.role,
    },
      60 * 60 * 24 * 7
    )
    // Create user session in Redis
    logger.info(`User logged in: ${user.email}`);
    return { user: userWithoutPassword, token };
  },

  logout: async (token: string): Promise<{ message: string }> => {
    try {
      const { payload } = await jose.jwtVerify(token, JWT_SECRET);
      const userId = payload.sub as string;
      await clearUserSession(userId);

      logger.info(`User logged out: ${userId}`);
      return { message: "Successfully logged out" };
    } catch (error) {
      logger.error("Logout error:", error);
      throw new Error("Failed to logout");
    }
  },
};
