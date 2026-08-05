import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sessionData = getAuthSession(req);

    if (!sessionData) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Verify the user exists in database to prevent stale session ID foreign key failures
    if (sessionData.role === "CUSTOMER") {
      const customer = await prisma.customer.findUnique({
        where: { id: sessionData.userId }
      });
      if (!customer) {
        const response = NextResponse.json({ authenticated: false }, { status: 401 });
        response.cookies.delete("ems_session");
        return response;
      }
    } else {
      const employee = await prisma.employee.findUnique({
        where: { id: sessionData.userId }
      });
      if (!employee || !employee.isActive) {
        const response = NextResponse.json({ authenticated: false }, { status: 401 });
        response.cookies.delete("ems_session");
        return response;
      }
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: sessionData.userId,
        username: sessionData.mobileNumber,
        mobileNumber: sessionData.mobileNumber,
        fullName: sessionData.fullName,
        role: sessionData.role,
        tenantId: sessionData.tenantId,
      },
    });
  } catch (error) {
    console.error("Session Check Error:", error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

