import { describe, it, expect, beforeEach } from "vitest";
import { signSession, verifySession, isAdmin, isTechnician, SessionData } from "./lib/auth-helpers";
import { rateLimit } from "./lib/rate-limiter";
import { serverCache } from "./lib/cache";
import { NextRequest } from "next/server";

describe("Security Reinforcements Tests", () => {
  const dummyAdminSession: SessionData = {
    userId: "admin-uuid-1234",
    username: "9944332106",
    mobileNumber: "9944332106",
    fullName: "Manikrishnan Admin",
    role: "ADMIN",
  };

  const dummyTechSession: SessionData = {
    userId: "tech-uuid-5678",
    username: "8822114400",
    mobileNumber: "8822114400",
    fullName: "Suresh Technician",
    role: "TECHNICIAN",
  };

  beforeEach(() => {
    serverCache.clear();
  });

  describe("Session Cryptographic Signature Validation", () => {
    it("should correctly sign and verify a valid session cookie", () => {
      const signedCookie = signSession(dummyAdminSession);
      expect(signedCookie).toContain(".");
      
      const verifiedData = verifySession(signedCookie);
      expect(verifiedData).not.toBeNull();
      expect(verifiedData?.userId).toBe(dummyAdminSession.userId);
      expect(verifiedData?.role).toBe("ADMIN");
    });

    it("should reject plain base64 session cookies without signature", () => {
      const plainBase64 = Buffer.from(JSON.stringify(dummyAdminSession)).toString("base64");
      const verified = verifySession(plainBase64);
      expect(verified).toBeNull();
    });

    it("should reject session cookies that have been tampered with", () => {
      const signedCookie = signSession(dummyAdminSession);
      const [, signature] = signedCookie.split(".");
      
      // User is technician but tries to escalalate by editing payload to ADMIN
      const escalSession = { ...dummyTechSession, role: "ADMIN" };
      const tamperedDataStr = Buffer.from(JSON.stringify(escalSession)).toString("base64");
      
      const tamperedCookie = `${tamperedDataStr}.${signature}`;
      const verified = verifySession(tamperedCookie);
      expect(verified).toBeNull();
    });

    it("should reject session cookies with forged/fake signatures", () => {
      const sessionDataStr = Buffer.from(JSON.stringify(dummyAdminSession)).toString("base64");
      const fakeCookie = `${sessionDataStr}.invalid_signature_string`;
      const verified = verifySession(fakeCookie);
      expect(verified).toBeNull();
    });
  });

  describe("Role-based Authorization Logic Helpers", () => {
    it("should validate admin vs technician role helpers", () => {
      // Create request mock with signed cookies
      const mockAdminReq = new NextRequest("http://localhost/api/employees", {
        headers: {
          cookie: `ems_session=${signSession(dummyAdminSession)}`,
        },
      });

      const mockTechReq = new NextRequest("http://localhost/api/employees", {
        headers: {
          cookie: `ems_session=${signSession(dummyTechSession)}`,
        },
      });

      expect(isAdmin(mockAdminReq)).toBe(true);
      expect(isTechnician(mockAdminReq)).toBe(false);

      expect(isAdmin(mockTechReq)).toBe(false);
      expect(isTechnician(mockTechReq)).toBe(true);
    });
  });

  describe("IP Rate Limiting System", () => {
    it("should track request count and allow requests within limit", () => {
      const ip = "192.168.1.50";
      
      // Make 3 requests
      const res1 = rateLimit(ip, 5);
      rateLimit(ip, 5);
      const res3 = rateLimit(ip, 5);
      
      expect(res1.isLimited).toBe(false);
      expect(res1.remaining).toBe(4);
      expect(res3.isLimited).toBe(false);
      expect(res3.remaining).toBe(2);
    });

    it("should block requests and return rate-limited state once threshold is exceeded", () => {
      const ip = "10.0.0.99";
      const limit = 3;
      
      // Call 3 times (hits the limit)
      rateLimit(ip, limit);
      rateLimit(ip, limit);
      const res3 = rateLimit(ip, limit);
      expect(res3.isLimited).toBe(false);
      expect(res3.remaining).toBe(0);

      // 4th call exceeds the limit
      const res4 = rateLimit(ip, limit);
      expect(res4.isLimited).toBe(true);
      expect(res4.remaining).toBe(0);
    });
  });
});
