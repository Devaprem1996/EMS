import { NextRequest } from "next/server";
import crypto from "crypto";

export interface SessionData {
  userId: string;
  username: string;
  mobileNumber: string;
  fullName: string;
  role: "ADMIN" | "TECHNICIAN" | "SUPER_ADMIN" | "CUSTOMER";
  tenantId?: string | null;
}

const SESSION_SECRET = process.env.SESSION_SECRET || "safeway_ems_super_secure_fallback_key_for_dev_32_chars";

/**
 * Signs session data using HMAC-SHA256.
 * Returns the base64-encoded session data appended with its signature.
 */
export function signSession(data: SessionData): string {
  const sessionDataStr = Buffer.from(JSON.stringify(data)).toString("base64");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(sessionDataStr)
    .digest("base64url");
  return `${sessionDataStr}.${signature}`;
}

/**
 * Verifies the signature of the session cookie value.
 * Uses constant-time comparison to prevent timing attacks.
 */
export function verifySession(cookieValue: string): SessionData | null {
  try {
    const parts = cookieValue.split(".");
    if (parts.length !== 2) {
      return null;
    }
    const [sessionDataStr, signature] = parts;
    
    // Recompute expected signature
    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(sessionDataStr)
      .digest("base64url");
    
    const sigBuffer = Buffer.from(signature, "base64url");
    const expBuffer = Buffer.from(expectedSignature, "base64url");
    
    // Constant-time comparison to protect against timing attacks
    if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
      console.warn("[Auth Helper] Session cookie signature mismatch or tampered!");
      return null;
    }
    
    const decodedString = Buffer.from(sessionDataStr, "base64").toString("utf-8");
    return JSON.parse(decodedString) as SessionData;
  } catch (error) {
    console.error("[Auth Helper] Error verifying session signature:", error);
    return null;
  }
}

/**
 * Parses, decodes, and cryptographically verifies the session cookie from the request.
 */
export function getAuthSession(req: NextRequest): SessionData | null {
  try {
    const sessionCookie = req.cookies.get("ems_session");
    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }

    const sessionData = verifySession(sessionCookie.value);
    if (!sessionData) {
      return null;
    }
    
    if (!sessionData.userId || !sessionData.role) {
      return null;
    }

    return sessionData;
  } catch (error) {
    console.error("[Auth Helper] Error getting auth session:", error);
    return null;
  }
}

/**
 * Checks if the current session belongs to an Admin user.
 */
export function isAdmin(req: NextRequest): boolean {
  const session = getAuthSession(req);
  return session !== null && (session.role === "ADMIN" || session.role === "SUPER_ADMIN");
}

/**
 * Checks if the current session belongs to a Technician user.
 */
export function isTechnician(req: NextRequest): boolean {
  const session = getAuthSession(req);
  return session !== null && session.role === "TECHNICIAN";
}

