import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET is too short"),
  DATABASE_URL: z.string().url("Invalid DATABASE_URL"),
  PORT: z.string().optional(), 
});

export const env = envSchema.parse(process.env);
