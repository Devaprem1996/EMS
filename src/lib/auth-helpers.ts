import { NextRequest } from "next/server";

export interface SessionData {
  userId: string;
  username: string;
  fullName: string;
  role: "ADMIN" | "TECHNICIAN";
}

/**
 * Parses and decodes the HTTP-only session cookie from the request.
 */
export function getAuthSession(req: NextRequest): SessionData | null {
  try {
    const sessionCookie = req.cookies.get("ems_session");
    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }

    const decodedString = Buffer.from(sessionCookie.value, "base64").toString("utf-8");
    const sessionData = JSON.parse(decodedString);
    
    if (!sessionData.userId || !sessionData.role) {
      return null;
    }

    return sessionData as SessionData;
  } catch (error) {
    console.error("[Auth Helper] Error decoding session:", error);
    return null;
  }
}

/**
 * Checks if the current session belongs to an Admin user.
 */
export function isAdmin(req: NextRequest): boolean {
  const session = getAuthSession(req);
  return session !== null && session.role === "ADMIN";
}

/**
 * Checks if the current session belongs to a Technician user.
 */
export function isTechnician(req: NextRequest): boolean {
  const session = getAuthSession(req);
  return session !== null && session.role === "TECHNICIAN";
}
