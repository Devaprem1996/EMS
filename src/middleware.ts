import { NextRequest, NextResponse } from "next/server";

const SESSION_SECRET = process.env.SESSION_SECRET || "safeway_ems_super_secure_fallback_key_for_dev_32_chars";

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad) {
    base64 += "=".repeat(4 - pad);
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function verifySessionLite(cookieValue: string): Promise<{ role: string; exp?: number } | null> {
  try {
    const parts = cookieValue.split(".");
    if (parts.length !== 2) return null;

    const [sessionDataStr, signature] = parts;
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SESSION_SECRET);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: { name: "SHA-256" } },
      false,
      ["verify"]
    );
    
    const sigBytes = base64UrlToUint8Array(signature);
    const dataBytes = encoder.encode(sessionDataStr);
    
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes as any,
      dataBytes as any
    );

    if (!isValid) {
      return null;
    }

    const decoded = JSON.parse(atob(sessionDataStr));

    // Check expiry
    if (decoded.exp && Date.now() > decoded.exp) {
      return null;
    }

    return { role: decoded.role, exp: decoded.exp };
  } catch (e) {
    console.error("[Middleware verify] Error:", e);
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip middleware for public routes and API routes (API routes handle their own auth)
  if (
    pathname === "/" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/config/") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".json")
  ) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get("ems_session");
  if (!sessionCookie || !sessionCookie.value) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const session = await verifySessionLite(sessionCookie.value);
  if (!session) {
    // Clear the invalid/expired cookie and redirect
    const response = NextResponse.redirect(new URL("/", req.url));
    response.cookies.delete("ems_session");
    return response;
  }

  // Role-based route access
  const role = session.role;

  if (pathname.startsWith("/admin") || pathname.startsWith("/platform")) {
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      const redirectPath = role === "TECHNICIAN" ? "/technician/tasks" : role === "CUSTOMER" ? "/portal" : "/";
      return NextResponse.redirect(new URL(redirectPath, req.url));
    }
  }

  if (pathname.startsWith("/technician")) {
    if (role !== "TECHNICIAN" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (pathname.startsWith("/portal")) {
    if (role !== "CUSTOMER" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
