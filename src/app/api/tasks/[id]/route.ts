import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helpers";

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
      asgWhere.technicianId = session.userId;
    }

    // 1. Fetch assignment
    const assignment = await prisma.jobAssignment.findFirst({
      where: asgWhere,
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // 2. Perform updates in a transaction
    const updatedAssignment = await prisma.$transaction(async (tx) => {
      // Update JobAssignment record
      const updatedAsg = await tx.jobAssignment.update({
        where: { id },
        data: {
          status: status !== undefined ? status : undefined,
          completedAt: status === "Completed" ? new Date() : null,
        },
      });

      // Update related Job fields
      await tx.job.update({
        where: { id: assignment.jobId },
        data: {
          visitDate: visitDate !== undefined ? (visitDate ? new Date(visitDate) : null) : undefined,
          adminInstructions: adminInstructions !== undefined ? adminInstructions : undefined,
          technicianInstructions: technicianInstructions !== undefined ? technicianInstructions : undefined,
          customerLocation: customerLocation !== undefined ? customerLocation : undefined,
        },
      });

      return updatedAsg;
    });

    return NextResponse.json(updatedAssignment);
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
    const assignment = await prisma.jobAssignment.findFirst({
      where: { id, deletedAt: null },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // 2. Soft-delete
    const deletedAsg = await prisma.jobAssignment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, deletedId: deletedAsg.id });
  } catch (error) {
    console.error("[Tasks DELETE API] Error:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
