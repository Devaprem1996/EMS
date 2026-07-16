import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helpers";
import { invalidateJobsAndTasks } from "@/lib/cache";

// POST /api/jobs/bulk-transition - Bulk transition jobs to a new stage
// Flow 1: Only "Order Confirmed" tickets are eligible to transition to REFILLING.
// Tickets that are not "Order Confirmed" are skipped and reported back to the caller.
export async function POST(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { jobIds, toStage, toStatus, skipStatusCheck } = body;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json({ error: "jobIds must be a non-empty array" }, { status: 400 });
    }

    if (!toStage) {
      return NextResponse.json({ error: "toStage is required" }, { status: 400 });
    }

    let transitioned = 0;
    const skippedTickets: string[] = [];

    // Perform transaction
    await prisma.$transaction(async (tx) => {
      for (const id of jobIds) {
        // 1. Find job (ticket)
        const job = await tx.ticket.findUnique({
          where: { id },
        });
        if (!job) continue;

        // Flow 1 Guard: For REFILLING transitions, only allow "Order Confirmed" tickets.
        // skipStatusCheck=true is used by auto-route (Flow 3) which creates and immediately routes.
        if (toStage === "REFILLING" && !skipStatusCheck && job.currentStatus !== "Order Confirmed") {
          skippedTickets.push(job.ticketNumber);
          continue;
        }

        const nextStatus =
          toStatus ||
          (toStage === "REFILLING"
            ? "Refilling Order Received"
            : toStage === "SERVICES"
            ? "Pending"
            : "Completed");

        // 2. Update stage and status
        await tx.ticket.update({
          where: { id },
          data: {
            currentStage: toStage,
            currentStatus: nextStatus,
            updatedBy: session.userId,
          },
        });

        // 3. Add history record
        await tx.ticketHistory.create({
          data: {
            ticketId: id,
            changedById: session.userId,
            fromStage: job.currentStage,
            toStage: toStage,
            fromStatus: job.currentStatus,
            toStatus: nextStatus,
            remarks: `Transitioned stage from ${job.currentStage} to ${toStage}`,
            createdBy: session.userId,
            updatedBy: session.userId,
          },
        });

        transitioned++;
      }
    });

    // Invalidate cached lists
    invalidateJobsAndTasks();

    return NextResponse.json({
      success: true,
      transitioned,
      skipped: skippedTickets.length,
      skippedTickets,
    });
  } catch (error) {
    console.error("[Bulk Transition API] Error:", error);
    return NextResponse.json({ error: "Failed to perform bulk transition" }, { status: 500 });
  }
}

