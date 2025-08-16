// packages/shared/prisma/client.ts
import { env } from "@vync/config";
import { PrismaClient } from "../src/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
