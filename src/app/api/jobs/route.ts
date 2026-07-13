import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helpers";

// GET /api/jobs - List jobs/enquiries
export async function GET(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage") || "ENQUIRY";
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";

    const whereClause: any = {
      currentStage: stage,
    };

    if (status !== "all") {
      whereClause.currentStatus = status;
    }

    if (search) {
      whereClause.OR = [
        { jobNumber: { contains: search } },
        { requirementCategory: { contains: search } },
        {
          customer: {
            OR: [
              { companyName: { contains: search } },
              { contactPerson: { contains: search } },
              { phone: { contains: search } },
            ],
          },
        },
      ];
    }

    const jobs = await prisma.job.findMany({
      where: whereClause,
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
                phone: true,
              },
            },
          },
        },
        followUps: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("[Jobs GET API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}

// POST /api/jobs - Create manual job/enquiry
export async function POST(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      companyName, 
      contactPerson, 
      phone, 
      phone2, 
      email, 
      address,
      requirementCategory,
      enquirySource,
      requirementDetails,
      currentStatus,
      enquiryDate,
      requestedDeliveryDate
    } = body;

    if (!contactPerson || !phone) {
      return NextResponse.json({ error: "Contact Person and Contact Number are required" }, { status: 400 });
    }

    const finalEnquiryDate = enquiryDate ? new Date(enquiryDate) : new Date();
    if (requestedDeliveryDate) {
      const deliveryDate = new Date(requestedDeliveryDate);
      const d1 = new Date(finalEnquiryDate.getFullYear(), finalEnquiryDate.getMonth(), finalEnquiryDate.getDate());
      const d2 = new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate());
      if (d2 < d1) {
        return NextResponse.json({ error: "Requested Delivery Date cannot be before the Enquiry Date" }, { status: 400 });
      }
    }

    // 1. Resolve or Create Customer by Primary Phone
    let customer = await prisma.customer.findFirst({
      where: { phone },
    });

    if (customer) {
      // Update existing customer fields if provided
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          companyName: companyName || customer.companyName,
          contactPerson: contactPerson || customer.contactPerson,
          phone2: phone2 || customer.phone2,
          email: email || customer.email,
          address: address || customer.address,
        },
      });
    } else {
      // Create new customer
      customer = await prisma.customer.create({
        data: {
          companyName: companyName || null,
          contactPerson,
          phone,
          phone2: phone2 || null,
          email: email || null,
          address: address || null,
        },
      });
    }

    // 2. Generate unique Job Number / Enquiry ID (e.g. EQ006)
    // Find all jobs that start with "EQ"
    const lastJob = await prisma.job.findFirst({
      where: {
        jobNumber: {
          startsWith: "EQ",
        },
      },
      orderBy: {
        jobNumber: "desc",
      },
    });

    let nextJobNumber = "EQ001";
    if (lastJob) {
      const match = lastJob.jobNumber.match(/EQ(\d+)/);
      if (match) {
        const lastNum = parseInt(match[1], 10);
        nextJobNumber = `EQ${String(lastNum + 1).padStart(3, "0")}`;
      }
    }

    // 3. Create Job
    const newJob = await prisma.job.create({
      data: {
        jobNumber: nextJobNumber,
        customerId: customer.id,
        currentStage: "ENQUIRY",
        currentStatus: currentStatus || "Enquiry Registered",
        requirementCategory: requirementCategory || null,
        enquirySource: enquirySource || null,
        requirementDetails: requirementDetails || null,
        requestedDeliveryDate: requestedDeliveryDate ? new Date(requestedDeliveryDate) : null,
        createdAt: finalEnquiryDate,
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json(newJob, { status: 201 });
  } catch (error) {
    console.error("[Jobs POST API] Error:", error);
    return NextResponse.json({ error: "Failed to create enquiry" }, { status: 500 });
  }
}
