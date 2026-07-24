import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const history = await prisma.ticketHistory.findMany({
      where: {
        ticketId: id,
        deletedAt: null,
      },
      include: {
        changedBy: {
          select: {
            fullName: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Map fields to match what the AuditLogModal expects
    const mappedLogs = history.map((log: any) => ({
      id: log.id,
      action: log.fromStatus === log.toStatus 
        ? `Stage changed from '${log.fromStage}' to '${log.toStage}'`
        : `Status changed from '${log.fromStatus}' to '${log.toStatus}'`,
      user: log.changedBy?.fullName || "System",
      role: log.changedBy?.role || "SYSTEM",
      timestamp: new Date(log.createdAt).toLocaleString("en-GB", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true,
      }),
      remarks: log.remarks || "",
    }));

    return NextResponse.json(mappedLogs);
  } catch (error) {
    console.error("[Job History GET API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch audit log history" }, { status: 500 });
  }
}
