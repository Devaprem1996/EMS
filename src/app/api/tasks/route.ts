import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helpers";

// GET /api/tasks - Retrieve all active technician assignments
export async function GET(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const whereClause: any = {
      deletedAt: null,
    };

    if (session.role === "TECHNICIAN") {
      whereClause.employeeId = session.userId;
    }

    if (search) {
      whereClause.OR = [
        {
          employee: {
            fullName: { contains: search },
          },
        },
        {
          ticket: {
            OR: [
              { ticketNumber: { contains: search } },
              {
                customer: {
                  OR: [
                    { companyName: { contains: search } },
                    { contactName: { contains: search } },
                    { primaryPhone: { contains: search } },
                  ],
                },
              },
            ],
          },
        },
      ];
    }

    const assignments = await prisma.ticketAssignment.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            contactPhone: true,
          },
        },
        ticket: {
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
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
    });

    const mappedAssignments = assignments.map(asg => ({
      id: asg.id,
      technicianId: asg.employeeId,
      technician: asg.employee ? {
        id: asg.employee.id,
        fullName: asg.employee.fullName,
        phone: asg.employee.contactPhone,
      } : null,
      job: asg.ticket ? {
        ...asg.ticket,
        jobNumber: asg.ticket.ticketNumber,
        visitDate: asg.ticket.scheduledVisitDate,
        adminInstructions: asg.ticket.adminNotes,
        technicianInstructions: asg.ticket.technicianNotes,
        customerLocation: asg.ticket.locationCoordinates,
        assignFor: asg.ticket.assignmentType,
        customer: asg.ticket.customer ? {
          ...asg.ticket.customer,
          contactPerson: asg.ticket.customer.contactName,
          phone: asg.ticket.customer.primaryPhone,
          phone2: asg.ticket.customer.secondaryPhone,
        } : null,
        assignments: asg.ticket.assignments.map(otherAsg => ({
          id: otherAsg.id,
          technicianId: otherAsg.employeeId,
          technician: otherAsg.employee ? {
            id: otherAsg.employee.id,
            fullName: otherAsg.employee.fullName,
          } : null,
        })),
      } : null,
      status: asg.status,
      assignedAt: asg.assignedAt,
      completedAt: asg.completedAt,
    }));

    return NextResponse.json(mappedAssignments);
  } catch (error) {
    console.error("[Tasks GET API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}
