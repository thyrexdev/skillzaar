import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../../config/prisma"; 
import { JWT_SECRET } from "../../../config/env";
import { 
  RegisterRequest, 
  LoginRequest, 
  AuthServiceRegisterResult, 
  AuthServiceLoginResult,
  JWTPayload 
} from "../interfaces/auth.interfaces";

export const AuthService = {
register: async ({ name, email, password, role }: RegisterRequest): Promise<AuthServiceRegisterResult> => {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error("User already exists");

    const hashed = await bcrypt.hash(password, 10);
    const normalizedRole = role.toUpperCase() as 'CLIENT' | 'FREELANCER' | 'ADMIN';
    
    // Use transaction to ensure both User and profile records are created together
    const result = await prisma.$transaction(async (tx) => {
      // Create the user
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
            fullName: name,
            // Optional fields can be filled later by the user
            companyName: null,
            bio: null,
            website: null,
            location: null,
          },
        });
      } else if (normalizedRole === 'FREELANCER') {
        await tx.freelancer.create({
          data: {
            userId: user.id,
            fullName: user.name,
            experienceLevel: 'BEGINNER', // Default value, can be updated later
            hourlyRate: null,
            bio: null,
          },
        });
      }

      return user;
    });

    // Generate JWT token
    const token = jwt.sign({ userId: result.id, role: result.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // Remove password from user object before returning
    const { password: _, ...userWithoutPassword } = result;

    return { user: userWithoutPassword, token };
  },

login: async ({ email, password }: LoginRequest): Promise<AuthServiceLoginResult> => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("User not found");

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error("Invalid credentials");

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // Remove password from user object before returning
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  },
};
