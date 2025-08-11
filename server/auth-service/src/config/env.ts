import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string(),
  EMAIL_FROM: z.string().email(),
  EMAIL_PASSWORD: z.string(),
  
  // OAuth credentials
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // OAuth callback URLs
  CLIENT_URL: z.string().url().default('http://localhost:3000'),
  SERVER_URL: z.string().url().default('http://localhost:5001'),
});

export const env = envSchema.parse(process.env);
