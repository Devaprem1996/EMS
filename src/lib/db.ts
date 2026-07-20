import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// Ensure we have a valid database URL, defaulting to local SQLite file
const rawUrl = process.env.DATABASE_URL ?? "file:dev.db";

// Detect if the URL is remote (e.g. Turso)
const isRemote =
  rawUrl.startsWith("libsql://") ||
  rawUrl.startsWith("https://") ||
  rawUrl.startsWith("http://") ||
  rawUrl.startsWith("wss://") ||
  rawUrl.startsWith("ws://");

// libSQL requires file: path format for local files, let's ensure it is well formed
const url = isRemote || rawUrl.startsWith("file:") ? rawUrl : `file:${rawUrl}`;
const authToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  (() => {
    console.log("[Prisma DB] Initializing singleton with URL:", url, isRemote ? "(Remote Connection)" : "(Local SQLite)");
    const adapter = new PrismaLibSql({
      url: url,
      authToken: authToken,
    });
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  })();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

