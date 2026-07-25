import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getAuthSession } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { signature } = await req.json();
    if (!signature || !signature.startsWith("data:image/png;base64,")) {
      return NextResponse.json({ error: "Invalid signature format" }, { status: 400 });
    }

    // Decode base64
    const base64Data = signature.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", "signatures");
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate unique name
    const filename = `sig_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.png`;
    const filepath = path.join(uploadDir, filename);

    // Save file
    await fs.writeFile(filepath, buffer);

    const fileUrl = `/uploads/signatures/${filename}`;

    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error("[Signature Upload API] Error:", error);
    return NextResponse.json({ error: "Failed to upload signature" }, { status: 500 });
  }
}