import { prisma } from "../src/lib/db";
import * as bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding database with realistic, high-quality demonstration models...");

  // 1. Clear existing records in correct topological order
  await prisma.ticketHistory.deleteMany({});
  await prisma.ticketAssignment.deleteMany({});
  await prisma.ticketFollowUp.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.employee.deleteMany({});

  // 2. Hash passwords
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const techPasswordHash = await bcrypt.hash("tech123", 10);
  const customerPasswordHash = await bcrypt.hash("portal123", 10);

  // 3. Create Admins (Employees)
  const superAdmin = await prisma.employee.create({
    data: {
      mobileNumber: "9876543210",
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
      fullName: "Devaprem (Super Administrator)",
      contactPhone: "9876543210",
      employeeNumber: "E000",
      email: "super@safeway.com",
      isActive: true,
    },
  });

  const admin = await prisma.employee.create({
    data: {
      mobileNumber: "9876543211",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      fullName: "Devaprem (Lead Administrator)",
      contactPhone: "9876543211",
      employeeNumber: "E001",
      email: "admin@safeway.com",
      isActive: true,
    },
  });

  // 4. Create Technicians (Employees)
  const tech1 = await prisma.employee.create({
    data: {
      mobileNumber: "9111111111",
      passwordHash: techPasswordHash,
      role: "TECHNICIAN",
      fullName: "Alex Rivera (Senior Inspector)",
      contactPhone: "9111111111",
      employeeNumber: "E002",
      email: "alex.rivera@safeway.com",
      isActive: true,
    },
  });

  const tech2 = await prisma.employee.create({
    data: {
      mobileNumber: "9222222222",
      passwordHash: techPasswordHash,
      role: "TECHNICIAN",
      fullName: "Jane Smith (Technical Specialist)",
      contactPhone: "9222222222",
      employeeNumber: "E003",
      email: "jane.smith@safeway.com",
      isActive: true,
    },
  });

  // 5. Create Realistic Customers with passwordHash set up
  const customerA = await prisma.customer.create({
    data: {
      companyName: "KH Chemicals",
      contactName: "Karamad Begum",
      primaryPhone: "9840135355",
      secondaryPhone: "9840135356",
      email: "facilities@khchem.com",
      address: "Mepz Tambaram, Chennai",
      passwordHash: customerPasswordHash,
    },
  });

  const customerB = await prisma.customer.create({
    data: {
      companyName: "Apollo Hospitals",
      contactName: "Dr. Manikrishnan",
      primaryPhone: "9944332106",
      email: "maintenance@apollohospitals.com",
      address: "Greams Road, Chennai",
      passwordHash: customerPasswordHash,
    },
  });

  const customerC = await prisma.customer.create({
    data: {
      companyName: "Taj Connemara",
      contactName: "Ravi Shankar",
      primaryPhone: "9003332197",
      email: "concierge@tajhotels.com",
      address: "Egmore, Binny Road, Chennai",
      passwordHash: customerPasswordHash,
    },
  });

  const customerD = await prisma.customer.create({
    data: {
      companyName: "Phoenix Marketcity",
      contactName: "Senthil Kumar",
      primaryPhone: "9789077788",
      email: "security@phoenixmall.com",
      address: "Velachery Main Road, Chennai",
      passwordHash: customerPasswordHash,
    },
  });

  const customerE = await prisma.customer.create({
    data: {
      companyName: "IIT Madras Campus",
      contactName: "Prof. Ramachandran",
      primaryPhone: "9032111222",
      email: "facilities@iitm.ac.in",
      address: "Adyar, Chennai",
      passwordHash: customerPasswordHash,
    },
  });

  // 6. Generate ~70 Realistic Tickets distributed over the past year (up to Aug 4, 2026)
  const now = new Date("2026-08-04T12:00:00Z");
  const customers = [customerA, customerB, customerC, customerD, customerE];
  const categories = ["Refilling", "New Fire Extinguisher", "Services", "CCTV"];
  const sources = ["Existing Customers", "Phone Call", "Walk-in", "Social Media", "Website"];
  const types = ["CO2", "DCP", "ABC Dry Powder", "Clean Agent", "Water"];
  const capacities = ["2 Kg", "4.5 Kg", "6 Kg", "9 Kg"];

  const TOTAL_TICKETS = 70;
  const daysAgoList = Array.from({ length: TOTAL_TICKETS }, (_, idx) => Math.floor((idx / TOTAL_TICKETS) * 360));
  // Deterministic shuffle using Math.sin
  const shuffledDaysAgo = [...daysAgoList].sort((a, b) => Math.sin(a) - Math.sin(b));

  for (let i = 1; i <= TOTAL_TICKETS; i++) {
    const customer = customers[i % customers.length];
    const category = categories[i % categories.length];
    const source = sources[i % sources.length];
    const extType = types[i % types.length];
    const capacity = capacities[i % capacities.length];

    // Shuffled creation dates over the last 360 days
    const daysAgo = shuffledDaysAgo[i - 1];
    const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Determine stage (25 Completed, 15 Services, 15 Refilling, 15 Enquiry)
    let stage = "COMPLETED";
    if (i > 55) {
      stage = "ENQUIRY";
    } else if (i > 40) {
      stage = "REFILLING";
    } else if (i > 25) {
      stage = "SERVICES";
    }

    // Determine status based on stage
    let status = "PENDING";
    if (stage === "COMPLETED") {
      status = "COMPLETED";
    } else if (stage === "ENQUIRY") {
      status = i % 2 === 0 ? "Enquiry Registered" : "Order Confirmed";
    } else if (stage === "REFILLING") {
      const refillStatuses = ["Refilling Order Received", "Quotation Sent", "Follow-up In Progress", "Order Confirmed"];
      status = refillStatuses[i % refillStatuses.length];
    } else if (stage === "SERVICES") {
      const serviceStatuses = ["Pending Service", "Technician Dispatched", "Service In Progress"];
      status = serviceStatuses[i % serviceStatuses.length];
    }

    // Scheduled visit date: 2 to 4 days after creation
    const scheduledVisitDate = new Date(createdAt.getTime() + (2 + (i % 3)) * 24 * 60 * 60 * 1000);

    // Delivered date: 3 to 6 days after creation (if completed)
    // Introduce some delayed completions (20% of tickets) to show realistic SLA compliance
    const isDelayed = i % 5 === 0;
    const daysToComplete = isDelayed ? (5 + (i % 4)) : (2 + (i % 2));
    const deliveredDate = stage === "COMPLETED"
      ? new Date(createdAt.getTime() + daysToComplete * 24 * 60 * 60 * 1000)
      : null;

    const ticketNumber = `EQ${String(i).padStart(3, "0")}`;

    const assignmentType = stage === "SERVICES" ? "SERVICE" : stage === "REFILLING" ? "REFILLING" : stage === "ENQUIRY" ? "ENQUIRY" : "DELIVERY";

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        customerId: customer.id,
        currentStage: stage,
        currentStatus: status,
        requirementCategory: category,
        enquirySource: source,
        requirementDetails: `${category} request for ${capacity} ${extType} cylinder.`,
        itemDescription: `${extType} Extinguisher ${capacity}`,
        serialNumber: `CYL-2026-${8000 + i}`,
        capacity,
        extinguisherType: extType,
        createdAt,
        scheduledVisitDate: stage !== "ENQUIRY" ? scheduledVisitDate : null,
        deliveredDate,
        amcYears: stage === "COMPLETED" ? 1 : null,
        amcDate: stage === "COMPLETED" && deliveredDate ? new Date(deliveredDate.getTime() + 365 * 24 * 60 * 60 * 1000) : null,
        adminNotes: `Admin notes for ${ticketNumber}.`,
        technicianNotes: stage === "COMPLETED" ? `Job completed successfully for ${ticketNumber}.` : null,
        assignmentType,
      },
    });

    // Create Assignment if refilling, services, or completed
    if (stage === "REFILLING" || stage === "SERVICES" || stage === "COMPLETED") {
      const technician = i % 2 === 0 ? tech1 : tech2;
      const completedAt = stage === "COMPLETED" ? deliveredDate : null;
      const assignStatus = stage === "COMPLETED" ? "Completed" : "Pending";

      await prisma.ticketAssignment.create({
        data: {
          ticketId: ticket.id,
          employeeId: technician.id,
          assignedAt: new Date(createdAt.getTime() + 1 * 24 * 60 * 60 * 1000), // Assigned 1 day after creation
          completedAt,
          status: assignStatus,
          notes: stage === "COMPLETED" ? "Assigned technician finished task successfully." : "Please inspect client site.",
          createdBy: admin.id,
        },
      });
    }

    // Create history logs
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        changedById: admin.id,
        fromStage: null,
        toStage: "ENQUIRY",
        fromStatus: null,
        toStatus: "PENDING",
        remarks: "Ticket registered in system",
        createdAt,
      },
    });

    if (stage !== "ENQUIRY") {
      await prisma.ticketHistory.create({
        data: {
          ticketId: ticket.id,
          changedById: admin.id,
          fromStage: "ENQUIRY",
          toStage: stage === "COMPLETED" ? "REFILLING" : stage,
          fromStatus: "PENDING",
          toStatus: stage === "COMPLETED" ? "ASSIGNED" : status,
          remarks: "Transitioned stage and status",
          createdAt: new Date(createdAt.getTime() + 1 * 24 * 60 * 60 * 1000),
        },
      });
    }

    if (stage === "COMPLETED" && deliveredDate) {
      await prisma.ticketHistory.create({
        data: {
          ticketId: ticket.id,
          changedById: (i % 2 === 0 ? tech1 : tech2).id,
          fromStage: "REFILLING",
          toStage: "COMPLETED",
          fromStatus: "ASSIGNED",
          toStatus: "COMPLETED",
          remarks: "Completed work and delivered order",
          createdAt: deliveredDate,
        },
      });
    }

    // 7. Create Invoices for completed tickets
    if (stage === "COMPLETED" && deliveredDate) {
      const invoiceNumber = `INV-2026-${String(i).padStart(3, "0")}`;
      await prisma.invoice.create({
        data: {
          ticketId: ticket.id,
          invoiceNumber,
          totalAmount: 1500.0 + (i * 10),
          status: "PAID",
          dueDate: new Date(deliveredDate.getTime() + 30 * 24 * 60 * 60 * 1000),
          createdAt: deliveredDate,
        }
      });
    }
  }

  console.log("Seeding completed successfully with new database models!");
  console.log("---------------------------------");
  console.log("Admins & Techs Accounts:");
  console.log("  Super Admin: 9876543210 / admin123");
  console.log("  Admin User:  9876543211 / admin123");
  console.log("  Default Tech 1: 9111111111 / tech123");
  console.log("  Default Tech 2: 9222222222 / tech123");
  console.log("Customer Accounts (Portal):");
  console.log("  KH Chemicals: 9840135355 / portal123");
  console.log("  Apollo Hospitals: 9944332106 / portal123");
  console.log("  Taj Connemara: 9003332197 / portal123");
  console.log("  Phoenix Marketcity: 9789077788 / portal123");
  console.log("  IIT Madras Campus: 9032111222 / portal123");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
