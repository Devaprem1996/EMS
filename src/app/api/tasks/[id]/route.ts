import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helpers";
import { invalidateJobsAndTasks } from "@/lib/cache";

// PUT /api/tasks/[id] - Update a specific technician task/assignment status and job instructions
export async function PUT(
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
      status, // Completed Status of assignment
      visitDate,
      adminInstructions,
      technicianInstructions,
      customerLocation,
    } = body;

    const asgWhere: any = { id, deletedAt: null };
    if (session.role === "TECHNICIAN") {
      asgWhere.employeeId = session.userId;
    }

    // 1. Fetch assignment
    const assignment = await prisma.ticketAssignment.findFirst({
      where: asgWhere,
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // 2. Perform updates in a transaction
    const updatedAssignment = await prisma.$transaction(async (tx) => {
      // Update TicketAssignment record
      const updatedAsg = await tx.ticketAssignment.update({
        where: { id },
        data: {
          status: status !== undefined ? status : undefined,
          completedAt: status === "Completed" ? new Date() : null,
          updatedBy: session.userId,
        },
      });

      // Build ticket update payload
      const ticketUpdateData: any = {
        scheduledVisitDate: visitDate !== undefined ? (visitDate ? new Date(visitDate) : null) : undefined,
        adminNotes: adminInstructions !== undefined ? adminInstructions : undefined,
        technicianNotes: technicianInstructions !== undefined ? technicianInstructions : undefined,
        locationCoordinates: customerLocation !== undefined ? customerLocation : undefined,
      };
      ticketUpdateData.updatedBy = session.userId;

      // AUTO-TRANSITION: "Assign For Service" → move ticket from REFILLING to SERVICES stage
      if (status === "Assign For Service") {
        const ticket = await tx.ticket.findUnique({
          where: { id: assignment.ticketId },
          select: { currentStage: true },
        });
        if (ticket?.currentStage === "REFILLING") {
          ticketUpdateData.currentStage = "SERVICES";
          // Log the stage transition in TicketHistory
          await tx.ticketHistory.create({
            data: {
              ticketId: assignment.ticketId,
              changedById: assignment.employeeId,
              fromStage: "REFILLING",
              toStage: "SERVICES",
              remarks: "Auto-transitioned: Technician set status to 'Assign For Service'",
              createdBy: session.userId,
              updatedBy: session.userId,
            },
          });
        }
      }

      // Update related Ticket fields
      await tx.ticket.update({
        where: { id: assignment.ticketId },
        data: ticketUpdateData,
      });

      return updatedAsg;
    });

    const mappedAsg = {
      ...updatedAssignment,
      technicianId: updatedAssignment.employeeId,
    };

    // Invalidate cached lists
    invalidateJobsAndTasks();

    return NextResponse.json(mappedAsg);
  } catch (error) {
    console.error("[Tasks PUT API] Error:", error);
    return NextResponse.json({ error: "Failed to update task details" }, { status: 500 });
  }
}

// DELETE /api/tasks/[id] - Soft-delete a specific assignment record
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const { id } = await params;

    // 1. Fetch assignment
    const assignment = await prisma.ticketAssignment.findFirst({
      where: { id, deletedAt: null },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // 2. Soft-delete
    const deletedAsg = await prisma.ticketAssignment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: session.userId,
      },
    });

    // Invalidate cached lists
    invalidateJobsAndTasks();

    return NextResponse.json({ success: true, deletedId: deletedAsg.id });
  } catch (error) {
    console.error("[Tasks DELETE API] Error:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}

