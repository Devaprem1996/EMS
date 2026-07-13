import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helpers";

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
    await prisma.$transaction(async (tx) => {
      for (const id of jobIds) {
        // 1. Find job
        const job = await tx.job.findUnique({
          where: { id },
        });
        if (!job) continue;

        // 2. Delete existing assignments
        await tx.jobAssignment.deleteMany({
          where: { jobId: id },
        });

        // 3. Create new assignments
        if (technicianIds.length > 0) {
          await tx.jobAssignment.createMany({
            data: technicianIds.map((techId: string) => ({
              jobId: id,
              technicianId: techId,
              status: "ASSIGNED",
            })),
          });
        }

        // 4. Update job details
        await tx.job.update({
          where: { id },
          data: {
            visitDate: visitDate ? new Date(visitDate) : null,
            adminInstructions: adminInstructions || null,
            technicianInstructions: technicianInstructions || null,
            customerLocation: customerLocation || null,
            assignFor: assignFor || "DELIVERY",
          },
        });

        // 5. Add to history log
        await tx.jobHistory.create({
          data: {
            jobId: id,
            changedById: session.userId,
            fromStage: job.currentStage,
            toStage: job.currentStage,
            fromStatus: job.currentStatus,
            toStatus: job.currentStatus,
            remarks: `Technician assignments bulk updated. Assigned technicians: ${technicianIds.length}`,
          },
        });
      }
    });

    return NextResponse.json({ success: true, count: jobIds.length });
  } catch (error) {
    console.error("[Bulk Assignment API] Error:", error);
    return NextResponse.json({ error: "Failed to perform bulk assignment" }, { status: 500 });
  }
}
