import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("ems_session");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Decode session data
    const decodedString = Buffer.from(sessionCookie.value, "base64").toString("utf-8");
    const sessionData = JSON.parse(decodedString);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: sessionData.userId,
        username: sessionData.mobileNumber,
        mobileNumber: sessionData.mobileNumber,
        fullName: sessionData.fullName,
        role: sessionData.role,
      },
    });
  } catch (error) {
    console.error("Session Check Error:", error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
