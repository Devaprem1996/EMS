import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helpers";
import { rateLimit } from "@/lib/rate-limiter";
import { EMS_CONFIG } from "@/config/ems-config";

// POST /api/platform/tenants - Provision a new Tenant instance
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const limiter = rateLimit(ip, 30);
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
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Super Admin role required." }, { status: 401 });
    }

    const body = await req.json();
    const { name, subdomain } = body;

    if (!name || !subdomain) {
      return NextResponse.json({ error: "Tenant Name and Subdomain are required." }, { status: 400 });
    }

    const cleanSubdomain = subdomain.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");

    if (!cleanSubdomain) {
      return NextResponse.json({ error: "Invalid subdomain format." }, { status: 400 });
    }

    // Check unique subdomain
    const existing = await prisma.tenant.findUnique({
      where: { subdomain: cleanSubdomain },
    });

    if (existing) {
      return NextResponse.json({ error: "Subdomain is already taken." }, { status: 400 });
    }

    // Create the Tenant and initialize SystemConfig with template config
    const tenant = await prisma.tenant.create({
      data: {
        name,
        subdomain: cleanSubdomain,
        configs: {
          create: {
            id: `config_${cleanSubdomain}`,
            config: JSON.stringify({
              ...EMS_CONFIG,
              brand: {
                ...EMS_CONFIG.brand,
                title: name,
                subtitle: `${name} operational workspace`,
              },
            }),
          },
        },
      },
      include: {
        configs: true,
      },
    });

    return NextResponse.json(tenant);
  } catch (error) {
    console.error("[Platform Tenant POST] Error:", error);
    return NextResponse.json({ error: "Failed to provision tenant." }, { status: 500 });
  }
}
