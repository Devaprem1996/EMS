import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helpers";
import { serverCache } from "@/lib/cache";
import { rateLimit } from "@/lib/rate-limiter";

// GET /api/jobs - List jobs/enquiries
export async function GET(req: NextRequest) {
  try {
    // 1. Rate Limiting Check
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const limiter = rateLimit(ip, 120);
    if (limiter.isLimited) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429, 
          headers: { "Retry-After": String(Math.ceil((limiter.reset - Date.now()) / 1000)) } 
        }
      );
    }

    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.tenantId;

    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage") || "ENQUIRY";
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";

    // 2. Cache Hit Check
    const cacheKey = tenantId ? `jobs:${stage}:${status}:${search}:tenant:${tenantId}` : `jobs:${stage}:${status}:${search}`;
    const cachedJobs = serverCache.get(cacheKey);
    if (cachedJobs) {
      return NextResponse.json(cachedJobs);
    }

    const whereClause: any = {
      currentStage: stage,
    };

    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    if (status !== "all") {
      whereClause.currentStatus = status;
    }

    if (search) {
      whereClause.OR = [
        { ticketNumber: { contains: search } },
        { requirementCategory: { contains: search } },
        {
          customer: {
            OR: [
              { companyName: { contains: search } },
              { contactName: { contains: search } },
              { primaryPhone: { contains: search } },
            ],
          },
        },
      ];
    }

    const jobs = await prisma.ticket.findMany({
      where: whereClause,
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
                contactPhone: true,
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

    const mappedJobs = jobs.map(job => ({
      ...job,
      jobNumber: job.ticketNumber,
      visitDate: job.scheduledVisitDate,
      adminInstructions: job.adminNotes,
      technicianInstructions: job.technicianNotes,
      customerLocation: job.locationCoordinates,
      assignFor: job.assignmentType,
      customer: job.customer ? {
        ...job.customer,
        contactPerson: job.customer.contactName,
        phone: job.customer.primaryPhone,
        phone2: job.customer.secondaryPhone,
      } : null,
      assignments: job.assignments.map(a => ({
        id: a.id,
        technicianId: a.employeeId,
        technician: a.employee ? {
          id: a.employee.id,
          fullName: a.employee.fullName,
          phone: a.employee.contactPhone,
        } : null,
      })),
    }));

    // Cache results for 1 minute
    serverCache.set(cacheKey, mappedJobs, 60000);

    return NextResponse.json(mappedJobs);
  } catch (error) {
    console.error("[Jobs GET API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}

// POST /api/jobs - Create manual job/enquiry
export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Check
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const limiter = rateLimit(ip, 60);
    if (limiter.isLimited) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429, 
          headers: { "Retry-After": String(Math.ceil((limiter.reset - Date.now()) / 1000)) } 
        }
      );
    }

    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.tenantId;

    const body = await req.json();
    const { 
      companyName, 
      contactPerson, // will map to contactName
      phone, // will map to primaryPhone
      phone2, // will map to secondaryPhone
      email, 
      address,
      requirementCategory,
      enquirySource,
      requirementDetails,
      currentStatus,
      enquiryDate,
      requestedDeliveryDate,
      stageData
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
      where: { primaryPhone: phone, tenantId },
    });

    if (customer) {
      // Update existing customer fields if provided
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          companyName: companyName || customer.companyName,
          contactName: contactPerson || customer.contactName,
          secondaryPhone: phone2 || customer.secondaryPhone,
          email: email || customer.email,
          address: address || customer.address,
          updatedBy: session.userId,
        },
      });
    } else {
      // Create new customer
      customer = await prisma.customer.create({
        data: {
          tenantId,
          companyName: companyName || null,
          contactName: contactPerson,
          primaryPhone: phone,
          secondaryPhone: phone2 || null,
          email: email || null,
          address: address || null,
          createdBy: session.userId,
          updatedBy: session.userId,
        },
      });
    }

    // 2. Generate unique Ticket Number / Enquiry ID (e.g. EQ006)
    const lastTicket = await prisma.ticket.findFirst({
      where: {
        ticketNumber: {
          startsWith: "EQ",
        },
        tenantId,
      },
      orderBy: {
        ticketNumber: "desc",
      },
    });

    let nextTicketNumber = "EQ001";
    if (lastTicket) {
      const match = lastTicket.ticketNumber.match(/EQ(\d+)/);
      if (match) {
        const lastNum = parseInt(match[1], 10);
        nextTicketNumber = `EQ${String(lastNum + 1).padStart(3, "0")}`;
      }
    }

    // 3. Create Ticket
    const newJob = await prisma.ticket.create({
      data: {
        tenantId,
        ticketNumber: nextTicketNumber,
        customerId: customer.id,
        currentStage: "ENQUIRY",
        currentStatus: currentStatus || "Enquiry Registered",
        requirementCategory: requirementCategory || null,
        enquirySource: enquirySource || null,
        requirementDetails: requirementDetails || null,
        requestedDeliveryDate: requestedDeliveryDate ? new Date(requestedDeliveryDate) : null,
        createdAt: finalEnquiryDate,
        stageData: stageData ? (typeof stageData === "string" ? stageData : JSON.stringify(stageData)) : null,
        createdBy: session.userId,
        updatedBy: session.userId,
      },
      include: {
        customer: true,
      },
    });

    const mappedJob = {
      ...newJob,
      jobNumber: newJob.ticketNumber,
      visitDate: newJob.scheduledVisitDate,
      adminInstructions: newJob.adminNotes,
      technicianInstructions: newJob.technicianNotes,
      customerLocation: newJob.locationCoordinates,
      assignFor: newJob.assignmentType,
      customer: newJob.customer ? {
        ...newJob.customer,
        contactPerson: newJob.customer.contactName,
        phone: newJob.customer.primaryPhone,
        phone2: newJob.customer.secondaryPhone,
      } : null,
      assignments: [],
    };

    // Invalidate cached job lists
    serverCache.invalidatePattern(/^jobs:/);

    return NextResponse.json(mappedJob, { status: 201 });
  } catch (error) {
    console.error("[Jobs POST API] Error:", error);
    return NextResponse.json({ error: "Failed to create enquiry" }, { status: 500 });
  }
}

