import { NextRequest } from "next/server";
import { getAuthSession } from "./auth-helpers";
import { prisma } from "./db";

/**
 * Resolves the tenant ID context dynamically.
 * 1. Checks active user session first.
 * 2. Falls back to request host header subdomains.
 */
export async function getTenantIdFromRequest(req: NextRequest): Promise<string | null> {
  try {
    // 1. Try to resolve from logged-in session data
    const session = getAuthSession(req);
    if (session && session.tenantId) {
      return session.tenantId;
    }

    // 2. Try to resolve from hostname subdomain
    const host = req.headers.get("host") || "";
    const parts = host.split(".");
    if (parts.length > 1) {
      const subdomain = parts[0].toLowerCase();
      // Exclude generic subdomains/hosts
      if (subdomain !== "www" && subdomain !== "localhost" && subdomain !== "ems" && subdomain !== "127") {
        const tenant = await prisma.tenant.findUnique({
          where: { subdomain },
          select: { id: true }
        });
        if (tenant) {
          return tenant.id;
        }
      }
    }
  } catch (error) {
    console.error("[Tenant Resolver] Error resolving tenant:", error);
  }
  return null;
}
