import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.tenantId;
    const whereBase: any = tenantId ? { tenantId } : {};

    // 1. Fetch counts of tickets in each active stage
    const enquiries = await prisma.ticket.count({
      where: {
        ...whereBase,
        currentStage: "ENQUIRY",
        deletedAt: null,
      },
    });

    const refills = await prisma.ticket.count({
      where: {
        ...whereBase,
        currentStage: "REFILLING",
        deletedAt: null,
      },
    });

    const services = await prisma.ticket.count({
      where: {
        ...whereBase,
        currentStage: "SERVICES",
        deletedAt: null,
      },
    });

    // 2. Fetch count of active technicians
    const techs = await prisma.employee.count({
      where: {
        ...whereBase,
        role: "TECHNICIAN",
        isActive: true,
        deletedAt: null,
      },
    });

    return NextResponse.json({
      enquiries,
      refills,
      services,
      techs,
    });
  } catch (error) {
    console.error("[Operations Stats API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch operational stats" }, { status: 500 });
  }
}
