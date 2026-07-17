import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    const sessionData = getAuthSession(req);

    if (!sessionData) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
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

