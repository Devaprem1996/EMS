import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helpers";
import { EMS_CONFIG } from "@/config/ems-config";

function parseCSVDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const cleaned = dateStr.trim();
  if (!cleaned) return null;

  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) {
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) return d;
  }

  // dd/mm/yyyy
  const parts = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (parts) {
    const day = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10) - 1;
    const year = parseInt(parts[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  const fallback = new Date(cleaned);
  return isNaN(fallback.getTime()) ? null : fallback;
}

async function resolveTechnicians(techNamesOrPhones: string | null | undefined): Promise<string[]> {
  if (!techNamesOrPhones) return [];
  const items = techNamesOrPhones.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
  if (items.length === 0) return [];

  const technicians = await prisma.user.findMany({
    where: { role: "TECHNICIAN" },
  });

  const matchedIds: string[] = [];
  for (const item of items) {
    const match = technicians.find(t => 
      (t.fullName && t.fullName.toLowerCase().includes(item)) || 
      (t.phone && t.phone.includes(item)) ||
      t.username.toLowerCase() === item
    );
    if (match) {
      matchedIds.push(match.id);
    }
  }
  return Array.from(new Set(matchedIds));
}

export async function POST(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { rows } = body;

    if (!Array.isArray(rows)) {
      return NextResponse.json({ error: "Invalid data format: rows must be an array" }, { status: 400 });
    }

    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Find the latest job number to start auto-incrementing
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

    let lastNum = 0;
    if (lastJob) {
      const match = lastJob.jobNumber.match(/EQ(\d+)/);
      if (match) {
        lastNum = parseInt(match[1], 10);
      }
    }

    // Process each row
    for (let index = 0; index < rows.length; index++) {
      const rawRow = rows[index];
      try {
        // Map raw headers to keys based on ems-config
        const mappedRow: any = {};
        const mappings = EMS_CONFIG.importMappings;

        for (const [key, aliases] of Object.entries(mappings)) {
          const matchKey = Object.keys(rawRow).find(k => 
            aliases.includes(k.toLowerCase().trim())
          );
          mappedRow[key] = matchKey !== undefined && rawRow[matchKey] !== null && rawRow[matchKey] !== undefined
            ? String(rawRow[matchKey]).trim()
            : null;
        }

        const customerName = mappedRow.customerName;
        const phone = mappedRow.phone;
        const serialNumber = mappedRow.serialNumber;

        // Validation: Client Name/Company is required
        if (!customerName) {
          throw new Error("Client/Company Name is required.");
        }

        // Resolve or create Customer
        let customer = null;
        if (phone) {
          customer = await prisma.customer.findFirst({
            where: { phone },
          });
        }

        if (!customer) {
          customer = await prisma.customer.findFirst({
            where: {
              companyName: customerName,
            },
          });
        }

        if (customer) {
          // Update customer fields if provided
          const updateData: any = {};
          if (mappedRow.contactPerson && mappedRow.contactPerson !== customer.contactPerson) updateData.contactPerson = mappedRow.contactPerson;
          if (mappedRow.phone2 && mappedRow.phone2 !== customer.phone2) updateData.phone2 = mappedRow.phone2;
          if (mappedRow.email && mappedRow.email !== customer.email) updateData.email = mappedRow.email;
          if (mappedRow.address && mappedRow.address !== customer.address) updateData.address = mappedRow.address;
          
          if (Object.keys(updateData).length > 0) {
            customer = await prisma.customer.update({
              where: { id: customer.id },
              data: updateData,
            });
          }
        } else {
          // Create new customer
          customer = await prisma.customer.create({
            data: {
              companyName: customerName,
              contactPerson: mappedRow.contactPerson || customerName,
              phone: phone || `TEMP-${Date.now()}-${index}`,
              phone2: mappedRow.phone2 || null,
              email: mappedRow.email || null,
              address: mappedRow.address || null,
            },
          });
        }

        // Date Parsing
        const enqDate = parseCSVDate(mappedRow.enquiryDate) ?? new Date();
        const reqDelDate = parseCSVDate(mappedRow.requestedDeliveryDate);
        const valFollowUpDate = parseCSVDate(mappedRow.followUpDate);
        const valVisitDate = parseCSVDate(mappedRow.visitDate);
        const valDeliveredDate = parseCSVDate(mappedRow.deliveredDate);
        const valAmcYears = mappedRow.amcYears ? parseInt(mappedRow.amcYears, 10) : null;

        // Calculate AMC Date if Delivered Date & Years exist
        let calculatedAmcDate: Date | null = null;
        if (valDeliveredDate && valAmcYears && valAmcYears > 0) {
          calculatedAmcDate = new Date(valDeliveredDate);
          calculatedAmcDate.setFullYear(calculatedAmcDate.getFullYear() + valAmcYears);
        }

        // Validation constraint: Requested Delivery Date cannot be before Enquiry Date
        if (reqDelDate && reqDelDate < enqDate) {
          throw new Error("Requested Delivery Date cannot be before Enquiry Date.");
        }

        // Resolve Assigned Technicians
        const techIds = await resolveTechnicians(mappedRow.assignedTechnicians);

        // Check if there is an existing job matching serialNumber + customerName combination
        let existingJob = null;
        if (serialNumber) {
          existingJob = await prisma.job.findFirst({
            where: {
              serialNumber,
              customer: {
                companyName: customerName,
              },
            },
            include: { customer: true },
          });
        }

        if (existingJob) {
          // Update existing job details
          const jobUpdateData: any = {
            capacity: mappedRow.capacity || existingJob.capacity,
            extinguisherType: mappedRow.extinguisherType || existingJob.extinguisherType,
            itemDescription: mappedRow.itemDescription || existingJob.itemDescription,
            requirementCategory: mappedRow.requirementCategory || existingJob.requirementCategory,
            enquirySource: mappedRow.enquirySource || existingJob.enquirySource,
            requirementDetails: mappedRow.itemDescription || existingJob.requirementDetails,
            requestedDeliveryDate: reqDelDate || existingJob.requestedDeliveryDate,
            followUpDate: valFollowUpDate || existingJob.followUpDate,
            latestFollowUpNotes: mappedRow.followUpRemarks || existingJob.latestFollowUpNotes,
            visitDate: valVisitDate || existingJob.visitDate,
            adminInstructions: mappedRow.adminInstructions || existingJob.adminInstructions,
            technicianInstructions: mappedRow.technicianInstructions || existingJob.technicianInstructions,
            customerLocation: mappedRow.customerLocation || existingJob.customerLocation,
          };

          if (mappedRow.enquiryStatus) {
            jobUpdateData.currentStatus = mappedRow.enquiryStatus;
          }

          if (valDeliveredDate) {
            jobUpdateData.deliveredDate = valDeliveredDate;
          }
          if (valAmcYears !== null) {
            jobUpdateData.amcYears = valAmcYears;
          }
          if (calculatedAmcDate) {
            jobUpdateData.amcDate = calculatedAmcDate;
          }

          const updatedJob = await prisma.job.update({
            where: { id: existingJob.id },
            data: jobUpdateData,
          });

          // Update assignments if specified
          if (techIds.length > 0) {
            await prisma.jobAssignment.deleteMany({ where: { jobId: updatedJob.id } });
            await prisma.jobAssignment.createMany({
              data: techIds.map(techId => ({
                jobId: updatedJob.id,
                technicianId: techId,
                status: "ASSIGNED",
              })),
            });
          }

          // Create follow-up history record if remarks provided
          if (mappedRow.followUpRemarks) {
            await prisma.enquiryFollowUp.create({
              data: {
                jobId: updatedJob.id,
                remarks: mappedRow.followUpRemarks,
              },
            });
          }

          // Log history
          await prisma.jobHistory.create({
            data: {
              jobId: existingJob.id,
              changedById: session.userId,
              fromStage: existingJob.currentStage,
              toStage: existingJob.currentStage,
              fromStatus: existingJob.currentStatus,
              toStatus: updatedJob.currentStatus,
              remarks: "Job updated via Bulk Import",
            },
          });

          results.updated++;
        } else {
          // Generate next Job Number
          lastNum++;
          const nextJobNumber = `EQ${String(lastNum).padStart(3, "0")}`;

          // Create new job
          const newJob = await prisma.job.create({
            data: {
              jobNumber: nextJobNumber,
              customerId: customer.id,
              currentStage: "ENQUIRY",
              currentStatus: mappedRow.enquiryStatus || "Enquiry Registered",
              serialNumber: serialNumber || null,
              capacity: mappedRow.capacity || null,
              extinguisherType: mappedRow.extinguisherType || null,
              itemDescription: mappedRow.itemDescription || null,
              requirementCategory: mappedRow.requirementCategory || null,
              enquirySource: mappedRow.enquirySource || null,
              requirementDetails: mappedRow.itemDescription || null,
              requestedDeliveryDate: reqDelDate || null,
              followUpDate: valFollowUpDate || null,
              latestFollowUpNotes: mappedRow.followUpRemarks || null,
              deliveredDate: valDeliveredDate || null,
              amcYears: valAmcYears || null,
              amcDate: calculatedAmcDate || null,
              visitDate: valVisitDate || null,
              adminInstructions: mappedRow.adminInstructions || null,
              technicianInstructions: mappedRow.technicianInstructions || null,
              customerLocation: mappedRow.customerLocation || null,
              createdAt: enqDate,
            },
          });

          // Add assignments if specified
          if (techIds.length > 0) {
            await prisma.jobAssignment.createMany({
              data: techIds.map(techId => ({
                jobId: newJob.id,
                technicianId: techId,
                status: "ASSIGNED",
              })),
            });
          }

          // Create follow-up history record if remarks provided
          if (mappedRow.followUpRemarks) {
            await prisma.enquiryFollowUp.create({
              data: {
                jobId: newJob.id,
                remarks: mappedRow.followUpRemarks,
              },
            });
          }

          // Log history
          await prisma.jobHistory.create({
            data: {
              jobId: newJob.id,
              changedById: session.userId,
              fromStage: "ENQUIRY",
              toStage: "ENQUIRY",
              fromStatus: "Enquiry Registered",
              toStatus: newJob.currentStatus,
              remarks: "Job created via Bulk Import",
            },
          });

          results.created++;
        }
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Row ${index + 1} (${rawRow.customerName || rawRow["Client Name"] || "Unknown"}): ${err.message}`);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("[Bulk Import API] Error:", error);
    return NextResponse.json({ error: "Failed to process bulk import" }, { status: 500 });
  }
}
