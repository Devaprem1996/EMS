import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helpers";
import { invalidateJobsAndTasks } from "@/lib/cache";

// POST /api/jobs/bulk-assign - Bulk assign technicians to a list of jobs
export async function POST(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      jobIds,
      technicianIds,
      visitDate,
      adminInstructions,
      technicianInstructions,
      customerLocation,
      assignFor,
    } = body;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json({ error: "jobIds must be a non-empty array" }, { status: 400 });
    }

    if (!Array.isArray(technicianIds)) {
      return NextResponse.json({ error: "technicianIds must be an array" }, { status: 400 });
    }

    // Perform transaction
    await prisma.$transaction(async (tx: any) => {
      for (const id of jobIds) {
        // 1. Find ticket
        const job = await tx.ticket.findUnique({
          where: { id },
        });
        if (!job) continue;

        // 2. Delete existing assignments
        await tx.ticketAssignment.deleteMany({
          where: { ticketId: id },
        });

        // 3. Create new assignments
        if (technicianIds.length > 0) {
          await tx.ticketAssignment.createMany({
            data: technicianIds.map((techId: string) => ({
              ticketId: id,
              employeeId: techId,
              status: "ASSIGNED",
              createdBy: session.userId,
              updatedBy: session.userId,
            })),
          });
        }

        // 4. Update ticket details
        await tx.ticket.update({
          where: { id },
          data: {
            scheduledVisitDate: visitDate ? new Date(visitDate) : null,
            adminNotes: adminInstructions || null,
            technicianNotes: technicianInstructions || null,
            locationCoordinates: customerLocation || null,
            assignmentType: assignFor || "DELIVERY",
            updatedBy: session.userId,
          },
        });

        // 5. Add to history log
        await tx.ticketHistory.create({
          data: {
            ticketId: id,
            changedById: session.userId,
            fromStage: job.currentStage,
            toStage: job.currentStage,
            fromStatus: job.currentStatus,
            toStatus: job.currentStatus,
            remarks: `Technician assignments bulk updated. Assigned technicians: ${technicianIds.length}`,
            createdBy: session.userId,
            updatedBy: session.userId,
          },
        });
      }
    });

    // Invalidate cached lists
    invalidateJobsAndTasks();

    return NextResponse.json({ success: true, count: jobIds.length });
  } catch (error) {
    console.error("[Bulk Assignment API] Error:", error);
    return NextResponse.json({ error: "Failed to perform bulk assignment" }, { status: 500 });
  }
}

