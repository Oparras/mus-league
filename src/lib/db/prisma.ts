import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { getServerEnv } from "@/lib/config/server-env";

const globalForPrisma = globalThis as typeof globalThis & {
  prismaAdapter?: PrismaPg;
  prismaClient?: PrismaClient;
};

export function getPrismaClient() {
  const { DATABASE_URL } = getServerEnv();

  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!globalForPrisma.prismaAdapter) {
    globalForPrisma.prismaAdapter = new PrismaPg({
      connectionString: DATABASE_URL,
    });
  }

  if (!globalForPrisma.prismaClient) {
    globalForPrisma.prismaClient = new PrismaClient({
      adapter: globalForPrisma.prismaAdapter,
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }

  return globalForPrisma.prismaClient;
}
