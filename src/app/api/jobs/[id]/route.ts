import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helpers";
import { invalidateJobsAndTasks } from "@/lib/cache";


// PUT /api/jobs/[id] - Edit details of an enquiry
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
      // Client Details
      companyName,
      contactPerson,
      phone,
      phone2,
      email,
      address,

      // Requirement Info
      requirementCategory,
      enquirySource,
      requirementDetails,

      // Enquiry Status & Dates
      requestedDeliveryDate,
      currentStatus,
      enquiryDate,

      // Follow Up Details
      followUpDate,
      newRemarks, // If provided, add a follow-up history record

      // Delivery & AMC
      deliveredDate,
      amcYears,

      // Service Date
      visitDate,
      stageData,

      // Cylinder / Equipment Specs
      serialNumber,
      capacity,
      extinguisherType,
      itemDescription,
    } = body;

    // 1. Find existing Job
    // 1. Find existing Job (Ticket)
    const existingJob = await prisma.ticket.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // 2. Update Customer details if linked
    if (existingJob.customerId) {
      await prisma.customer.update({
        where: { id: existingJob.customerId },
        data: {
          companyName: companyName !== undefined ? companyName : undefined,
          contactName: contactPerson !== undefined ? contactPerson : undefined,
          primaryPhone: phone !== undefined ? phone : undefined,
          secondaryPhone: phone2 !== undefined ? phone2 : undefined,
          email: email !== undefined ? email : undefined,
          address: address !== undefined ? address : undefined,
          updatedBy: session.userId,
        },
      });
    }

    // 3. Prepare Job Update Payload
    const jobUpdateData: any = {};

    if (requirementCategory !== undefined) jobUpdateData.requirementCategory = requirementCategory === "SELECT" ? null : requirementCategory;
    if (enquirySource !== undefined) jobUpdateData.enquirySource = enquirySource === "SELECT" ? null : enquirySource;
    if (requirementDetails !== undefined) jobUpdateData.requirementDetails = requirementDetails;
    
    const finalEnquiryDate = enquiryDate !== undefined
      ? (enquiryDate ? new Date(enquiryDate) : new Date())
      : new Date(existingJob.createdAt);
    const finalRequestedDeliveryDate = requestedDeliveryDate !== undefined
      ? (requestedDeliveryDate ? new Date(requestedDeliveryDate) : null)
      : existingJob.requestedDeliveryDate;

    if (finalRequestedDeliveryDate) {
      const d1 = new Date(finalEnquiryDate.getFullYear(), finalEnquiryDate.getMonth(), finalEnquiryDate.getDate());
      const d2 = new Date(finalRequestedDeliveryDate.getFullYear(), finalRequestedDeliveryDate.getMonth(), finalRequestedDeliveryDate.getDate());
      if (d2 < d1) {
        return NextResponse.json({ error: "Requested Delivery Date cannot be before the Enquiry Date" }, { status: 400 });
      }
    }

    if (requestedDeliveryDate !== undefined) {
      jobUpdateData.requestedDeliveryDate = requestedDeliveryDate ? new Date(requestedDeliveryDate) : null;
    }

    if (enquiryDate !== undefined) {
      jobUpdateData.createdAt = enquiryDate ? new Date(enquiryDate) : undefined;
    }

    if (currentStatus !== undefined) {
      // Write history if status is changing
      if (currentStatus !== existingJob.currentStatus) {
        await prisma.ticketHistory.create({
          data: {
            ticketId: id,
            changedById: session.userId,
            fromStage: existingJob.currentStage,
            toStage: existingJob.currentStage,
            fromStatus: existingJob.currentStatus,
            toStatus: currentStatus,
            remarks: "Status updated in Edit Enquiry modal",
            createdBy: session.userId,
            updatedBy: session.userId,
          },
        });
      }
      jobUpdateData.currentStatus = currentStatus;
    }

    if (followUpDate !== undefined) {
      jobUpdateData.followUpDate = followUpDate ? new Date(followUpDate) : null;
    }

    if (visitDate !== undefined) {
      jobUpdateData.scheduledVisitDate = visitDate ? new Date(visitDate) : null;
    }

    // Handle Follow-up new remarks
    if (newRemarks && newRemarks.trim() !== "") {
      // Add follow-up history record
      await prisma.ticketFollowUp.create({
        data: {
          ticketId: id,
          remarks: newRemarks,
          createdBy: session.userId,
          updatedBy: session.userId,
        },
      });
      jobUpdateData.latestFollowUpNotes = newRemarks;
    }

    // Handle Delivery & AMC calculation
    if (deliveredDate !== undefined) {
      jobUpdateData.deliveredDate = deliveredDate ? new Date(deliveredDate) : null;
    }

    if (amcYears !== undefined) {
      jobUpdateData.amcYears = amcYears ? parseInt(amcYears, 10) : null;
    }

    // Calculate AMC date: deliveredDate + amcYears
    const finalDeliveredDate = deliveredDate !== undefined ? (deliveredDate ? new Date(deliveredDate) : null) : existingJob.deliveredDate;
    const finalAmcYears = amcYears !== undefined ? (amcYears ? parseInt(amcYears, 10) : null) : existingJob.amcYears;

    if (finalDeliveredDate && finalAmcYears) {
      const calculatedAmcDate = new Date(finalDeliveredDate);
      calculatedAmcDate.setFullYear(calculatedAmcDate.getFullYear() + finalAmcYears);
      jobUpdateData.amcDate = calculatedAmcDate;
    } else {
      jobUpdateData.amcDate = null;
    }

    if (stageData !== undefined) {
      jobUpdateData.stageData = stageData ? (typeof stageData === "string" ? stageData : JSON.stringify(stageData)) : null;
    }

    if (serialNumber !== undefined) {
      jobUpdateData.serialNumber = serialNumber;
    }
    if (capacity !== undefined) {
      jobUpdateData.capacity = capacity;
    }
    if (extinguisherType !== undefined) {
      jobUpdateData.extinguisherType = extinguisherType;
    }
    if (itemDescription !== undefined) {
      jobUpdateData.itemDescription = itemDescription;
    }

    jobUpdateData.updatedBy = session.userId;

    // 4. Perform Update
    const updatedJob = await prisma.ticket.update({
      where: { id },
      data: jobUpdateData,
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
        followUps: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
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
      assignments: updatedJob.assignments.map((a: any) => ({
        id: a.id,
        technicianId: a.employeeId,
        technician: a.employee ? {
          id: a.employee.id,
          fullName: a.employee.fullName,
        } : null,
      })),
    };

    // Invalidate cached lists
    invalidateJobsAndTasks();

    return NextResponse.json(mappedJob);
  } catch (error) {
    console.error("[Job PUT API] Error:", error);
    return NextResponse.json({ error: "Failed to update job details" }, { status: 500 });
  }
}
