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
      whereClause.technicianId = session.userId;
    }

    if (search) {
      whereClause.OR = [
        {
          technician: {
            fullName: { contains: search },
          },
        },
        {
          job: {
            OR: [
              { jobNumber: { contains: search } },
              {
                customer: {
                  OR: [
                    { companyName: { contains: search } },
                    { contactPerson: { contains: search } },
                    { phone: { contains: search } },
                  ],
                },
              },
            ],
          },
        },
      ];
    }

    const assignments = await prisma.jobAssignment.findMany({
      where: whereClause,
      include: {
        technician: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        job: {
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
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("[Tasks GET API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}
