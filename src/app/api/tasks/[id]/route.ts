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
      signature,
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
    const updatedAssignment = await prisma.$transaction(async (tx: any) => {
      // Fetch parent ticket detail to inspect current status and stage
      const ticket = await tx.ticket.findUnique({
        where: { id: assignment.ticketId },
        select: { currentStage: true, currentStatus: true, assignmentType: true, amcYears: true },
      });

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

      if (signature !== undefined) {
        // Fetch current ticket stageData to merge signature
        const currentTicket = await tx.ticket.findUnique({
          where: { id: assignment.ticketId },
          select: { stageData: true }
        });
        let currentData: any = {};
        if (currentTicket && currentTicket.stageData) {
          try {
            currentData = JSON.parse(currentTicket.stageData);
          } catch (e) {}
        }
        currentData.signature = signature;
        ticketUpdateData.stageData = JSON.stringify(currentData);
      }

      if (ticket) {
        // Sync parent ticket status based on assignment status
        if (status === "Completed") {
          ticketUpdateData.currentStage = "COMPLETED";
          const type = ticket.assignmentType || "DELIVERY";
          if (type === "REFILLING") {
            ticketUpdateData.currentStatus = "Order Delivered";
          } else if (type === "SERVICE") {
            ticketUpdateData.currentStatus = "Service Done";
          } else {
            ticketUpdateData.currentStatus = "Completed";
          }

          // Log delivered date and calculate AMC Date
          const deliveredDate = new Date();
          ticketUpdateData.deliveredDate = deliveredDate;
          if (ticket.amcYears && ticket.amcYears > 0) {
            const calculatedAmcDate = new Date(deliveredDate);
            calculatedAmcDate.setFullYear(calculatedAmcDate.getFullYear() + ticket.amcYears);
            ticketUpdateData.amcDate = calculatedAmcDate;
          }
        } else if (status === "Assign For Service") {
          if (ticket.currentStage === "REFILLING") {
            ticketUpdateData.currentStage = "SERVICES";
            ticketUpdateData.currentStatus = "Pending Service";
            // Log the stage transition in TicketHistory
            await tx.ticketHistory.create({
              data: {
                ticketId: assignment.ticketId,
                changedById: assignment.employeeId,
                fromStage: "REFILLING",
                toStage: "SERVICES",
                fromStatus: ticket.currentStatus,
                toStatus: "Pending Service",
                remarks: "Auto-transitioned: Technician set status to 'Assign For Service'",
                createdBy: session.userId,
                updatedBy: session.userId,
              },
            });
          }
        } else if (status === "Pending") {
          if (ticket.currentStage === "SERVICES") {
            ticketUpdateData.currentStatus = "Pending Service";
          } else {
            ticketUpdateData.currentStatus = "Order Confirmed";
          }
        }

        // Write status history record if changed
        if (ticketUpdateData.currentStatus && ticketUpdateData.currentStatus !== ticket.currentStatus) {
          await tx.ticketHistory.create({
            data: {
              ticketId: assignment.ticketId,
              changedById: session.userId,
              fromStage: ticket.currentStage,
              toStage: ticketUpdateData.currentStage || ticket.currentStage,
              fromStatus: ticket.currentStatus,
              toStatus: ticketUpdateData.currentStatus,
              remarks: `Assignment status updated to '${status}' by technician`,
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

