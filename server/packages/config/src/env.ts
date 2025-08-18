import { config } from "dotenv";

config();

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  // Database
  DATABASE_URL: process.env.DATABASE_URL!,
  // JWT
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,

  // File Upload
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE,

  // Email
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,

  // OAuth URLs
  CLIENT_URL: process.env.CLIENT_URL,
  SERVER_URL: process.env.SERVER_URL,

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

  // Redis
  REDIS_HOST: process.env.REDIS_HOST || 'redis',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379'),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,

  // Services URLs
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL,
  CORE_SERVICE_URL: process.env.CORE_SERVICE_URL,
  CHAT_SERVICE_URL: process.env.CHAT_SERVICE_URL, // ws:// allowed
  PAYMENT_SERVICE_URL: process.env.PAYMENT_SERVICE_URL,
  ADMIN_SERVICE_URL: process.env.ADMIN_SERVICE_URL,

  // Services Ports
  AUTH_SERVICE_PORT: 5000,
  CORE_SERVICE_PORT: 5001,
  CHAT_SERVICE_PORT: 5002,
  PAYMENT_SERVICE_PORT: 5003,
  ADMIN_SERVICE_PORT: 5004,
};
