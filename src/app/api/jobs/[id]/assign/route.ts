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

    // 1. Find ticket
    const job = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // 2. Perform Transaction to update assignments and ticket details
    const updatedJob = await prisma.$transaction(async (tx) => {
      // Soft-delete existing assignments for this ticket
      await tx.ticketAssignment.updateMany({
        where: { ticketId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      });

      // Create or restore assignments
      for (const techId of technicianIds) {
        const existing = await tx.ticketAssignment.findFirst({
          where: { ticketId: id, employeeId: techId },
        });

        if (existing) {
          await tx.ticketAssignment.update({
            where: { id: existing.id },
            data: {
              deletedAt: null,
              status: "ASSIGNED",
              completedAt: null,
              notes: null,
            },
          });
        } else {
          await tx.ticketAssignment.create({
            data: {
              ticketId: id,
              employeeId: techId,
              status: "ASSIGNED",
            },
          });
        }
      }

      // Update ticket fields
      const updated = await tx.ticket.update({
        where: { id },
        data: {
          scheduledVisitDate: visitDate ? new Date(visitDate) : null,
          adminNotes: adminInstructions || null,
          technicianNotes: technicianInstructions || null,
          locationCoordinates: customerLocation || null,
          assignmentType: assignFor || "DELIVERY",
        },
        include: {
          customer: true,
          assignments: {
            where: {
              deletedAt: null,
            },
            include: {
              employee: {
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
      await tx.ticketHistory.create({
        data: {
          ticketId: id,
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

    const mappedJob = {
      ...updatedJob,
      jobNumber: updatedJob.ticketNumber,
      visitDate: updatedJob.scheduledVisitDate,
      adminInstructions: updatedJob.adminNotes,
      technicianInstructions: updatedJob.technicianNotes,
      customerLocation: updatedJob.locationCoordinates,
      assignFor: updatedJob.assignmentType,
      customer: updatedJob.customer ? {
        ...updatedJob.customer,
        contactPerson: updatedJob.customer.contactName,
        phone: updatedJob.customer.primaryPhone,
        phone2: updatedJob.customer.secondaryPhone,
      } : null,
      assignments: updatedJob.assignments.map(a => ({
        id: a.id,
        technicianId: a.employeeId,
        technician: a.employee ? {
          id: a.employee.id,
          fullName: a.employee.fullName,
        } : null,
      })),
    };

    return NextResponse.json(mappedJob);
  } catch (error) {
    console.error("[Job Assignment API] Error:", error);
    return NextResponse.json({ error: "Failed to update technician assignment" }, { status: 500 });
  }
}
