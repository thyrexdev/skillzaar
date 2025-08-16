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

export const AuthService = {
register: async ({ name, email, password, role }: RegisterRequest): Promise<AuthServiceRegisterResult> => {
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

    logger.info(`User registered: ${result.email}`);
    return { user: userWithoutPassword, token };
  },

login: async ({ email, password }: LoginRequest): Promise<AuthServiceLoginResult> => {
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

    logger.info(`User logged in: ${user.email}`);
    return { user: userWithoutPassword, token };
  },
};