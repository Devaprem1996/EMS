import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helpers";

// POST /api/jobs/bulk-transition - Bulk transition jobs to a new stage
export async function POST(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { jobIds, toStage, toStatus } = body;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json({ error: "jobIds must be a non-empty array" }, { status: 400 });
    }

    if (!toStage) {
      return NextResponse.json({ error: "toStage is required" }, { status: 400 });
    }

    // Perform transaction
    await prisma.$transaction(async (tx) => {
      for (const id of jobIds) {
        // 1. Find job
        const job = await tx.job.findUnique({
          where: { id },
        });
        if (!job) continue;

        const nextStatus = toStatus || (toStage === "REFILLING" ? "Refilling Order Received" : toStage === "SERVICES" ? "Pending" : "Completed");

        // 2. Update stage and status
        await tx.job.update({
          where: { id },
          data: {
            currentStage: toStage,
            currentStatus: nextStatus,
          },
        });

        // 3. Add history record
        await tx.jobHistory.create({
          data: {
            jobId: id,
            changedById: session.userId,
            fromStage: job.currentStage,
            toStage: toStage,
            fromStatus: job.currentStatus,
            toStatus: nextStatus,
            remarks: `Bulk transitioned stage from ${job.currentStage} to ${toStage}`,
          },
        });
      }
    });

    return NextResponse.json({ success: true, count: jobIds.length });
  } catch (error) {
    console.error("[Bulk Transition API] Error:", error);
    return NextResponse.json({ error: "Failed to perform bulk transition" }, { status: 500 });
  }
}
