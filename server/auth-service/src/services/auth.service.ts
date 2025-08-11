import bcrypt from "bcryptjs";
import * as jose from 'jose';
import { prisma } from "@frevix/shared";
import { env } from "@frevix/config";
import { logger } from "@frevix/config/dist/logger";
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
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: normalizedRole,
        isVerified: false,
      },
    });

    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const alg = 'HS256';

    const token = await new jose.SignJWT({ sub: user.id, role: user.role })
      .setProtectedHeader({ alg })
      .setExpirationTime('7d')
      .sign(secret);

    // Remove password from user object before returning
    const { password: _, ...userWithoutPassword } = user;

    logger.info(`User registered: ${user.email}`);
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