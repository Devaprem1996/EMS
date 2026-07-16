import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession, isAdmin } from "@/lib/auth-helpers";
import { getDbConfig } from "@/lib/config-loader";
import { serverCache } from "@/lib/cache";
import { rateLimit } from "@/lib/rate-limiter";

const CONFIG_CACHE_KEY = "system_config";
const CONFIG_CACHE_TTL = 3600000; // 1 hour

// GET /api/config - Retrieve the system configuration (Public)
export async function GET(req: NextRequest) {
  try {
    // 1. Rate Limiting Check
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const limiter = rateLimit(ip, 100);
    if (limiter.isLimited) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429, 
          headers: { "Retry-After": String(Math.ceil((limiter.reset - Date.now()) / 1000)) } 
        }
      );
    }

    // 2. Cache hit check
    const cachedConfig = serverCache.get(CONFIG_CACHE_KEY);
    if (cachedConfig) {
      return NextResponse.json(cachedConfig);
    }

    // Cache miss, load from DB
    const config = await getDbConfig();
    serverCache.set(CONFIG_CACHE_KEY, config, CONFIG_CACHE_TTL);
    
    return NextResponse.json(config);
  } catch (error) {
    console.error("[Config GET API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch configuration" }, { status: 500 });
  }
}

// POST /api/config - Save system configuration (Admin Only)
export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Check
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const limiter = rateLimit(ip, 30); // Lower limit for mutative admin config updates
    if (limiter.isLimited) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429, 
          headers: { "Retry-After": String(Math.ceil((limiter.reset - Date.now()) / 1000)) } 
        }
      );
    }

    const session = getAuthSession(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 401 });
    }

    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid configuration payload" }, { status: 400 });
    }

    // Persist config stringified in DB
    const updatedRecord = await prisma.systemConfig.upsert({
      where: { id: "default" },
      update: {
        config: JSON.stringify(body),
        updatedBy: session.userId,
      },
      create: {
        id: "default",
        config: JSON.stringify(body),
        createdBy: session.userId,
        updatedBy: session.userId,
      },
    });

    const config = JSON.parse(updatedRecord.config);

    // Invalidate and refresh cache
    serverCache.set(CONFIG_CACHE_KEY, config, CONFIG_CACHE_TTL);

    return NextResponse.json(config);
  } catch (error) {
    console.error("[Config POST API] Error saving configuration:", error);
    return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 });
  }
}

