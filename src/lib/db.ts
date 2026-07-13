import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// Ensure we have a valid database URL, defaulting to local SQLite file
const rawUrl = process.env.DATABASE_URL ?? "file:dev.db";

// libSQL requires file: path format for local files, let's ensure it is well formed
const url = rawUrl.startsWith("file:") ? rawUrl : `file:${rawUrl}`;

console.log("[Prisma DB] Initializing with URL:", url);

const adapter = new PrismaLibSql({
  url: url,
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
