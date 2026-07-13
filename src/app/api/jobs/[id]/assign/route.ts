import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helpers";

// POST /api/jobs/[id]/assign - Assign technicians to an enquiry
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const {
      visitDate,
      adminInstructions,
      technicianInstructions,
      customerLocation,
      technicianIds, // Array of technician user IDs
      assignFor,
    } = body;

    // Validate request
    if (!Array.isArray(technicianIds)) {
      return NextResponse.json({ error: "technicianIds must be an array" }, { status: 400 });
    }

    // 1. Find job
    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // 2. Perform Transaction to update assignments and job details
    const updatedJob = await prisma.$transaction(async (tx) => {
      // Soft-delete existing assignments for this job
      await tx.jobAssignment.updateMany({
        where: { jobId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      });

      // Create or restore assignments
      for (const techId of technicianIds) {
        const existing = await tx.jobAssignment.findFirst({
          where: { jobId: id, technicianId: techId },
        });

        if (existing) {
          await tx.jobAssignment.update({
            where: { id: existing.id },
            data: {
              deletedAt: null,
              status: "ASSIGNED",
              completedAt: null,
              notes: null,
            },
          });
        } else {
          await tx.jobAssignment.create({
            data: {
              jobId: id,
              technicianId: techId,
              status: "ASSIGNED",
            },
          });
        }
      }

      // Update job fields
      const updated = await tx.job.update({
        where: { id },
        data: {
          visitDate: visitDate ? new Date(visitDate) : null,
          adminInstructions: adminInstructions || null,
          technicianInstructions: technicianInstructions || null,
          customerLocation: customerLocation || null,
          assignFor: assignFor || "DELIVERY",
        },
        include: {
          customer: true,
          assignments: {
            where: {
              deletedAt: null,
            },
            include: {
              technician: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
        },
      });

      // Add to history log
      await tx.jobHistory.create({
        data: {
          jobId: id,
          changedById: session.userId,
          fromStage: job.currentStage,
          toStage: job.currentStage,
          fromStatus: job.currentStatus,
          toStatus: job.currentStatus,
          remarks: `Technician assignments updated. Assigned technicians: ${technicianIds.length}`,
        },
      });

      return updated;
    });

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error("[Job Assignment API] Error:", error);
    return NextResponse.json({ error: "Failed to update technician assignment" }, { status: 500 });
  }
}
