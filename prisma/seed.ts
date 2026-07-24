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

  // 6. Create Realistic Tickets with full histories and parameters
  
  // Ticket 1: Completed Refilling job
  const ticket1 = await prisma.ticket.create({
    data: {
      ticketNumber: "EQ001",
      customerId: customerE.id,
      currentStage: "COMPLETED",
      currentStatus: "Order Delivered",
      requirementCategory: "Refilling",
      enquirySource: "Existing Customers",
      requirementDetails: "Refill 4.5kg CO2 Extinguisher (Lab Area)",
      itemDescription: "CO2 Fire Extinguisher 4.5kg",
      serialNumber: "CYL-2026-8941",
      capacity: "4.5 Kg",
      extinguisherType: "CO2",
      createdAt: new Date("2026-03-01T10:00:00Z"),
      deliveredDate: new Date("2026-03-04T12:00:00Z"),
      amcYears: 1,
      amcDate: new Date("2027-03-04T12:00:00Z"),
      technicianNotes: "Hydrostatic test OK. Refilled 4.5kg gas. Replaced pressure valve seal.",
      stageData: JSON.stringify({
        pressureTestPassed: true,
        refillMediumQty: 4.5,
        tareWeight: 9.2,
        grossWeight: 13.7
      })
    },
  });

  // Ticket 2: Active Refilling job
  const ticket2 = await prisma.ticket.create({
    data: {
      ticketNumber: "EQ002",
      customerId: customerD.id,
      currentStage: "REFILLING",
      currentStatus: "Refilling Order Received",
      requirementCategory: "Refilling",
      enquirySource: "Phone Call",
      requirementDetails: "Refill 9kg DCP Cylinder (Malls East Wing)",
      itemDescription: "DCP Fire Extinguisher 9kg",
      serialNumber: "FE-9921-X4",
      capacity: "9 Kg",
      extinguisherType: "DCP",
      createdAt: new Date("2026-07-20T14:30:00Z"),
      scheduledVisitDate: new Date("2026-07-25T09:00:00Z"),
      adminNotes: "Customer requested morning visit. Verify pressure valve safety clip.",
    },
  });

  // Ticket 3: New Enquiry
  const ticket3 = await prisma.ticket.create({
    data: {
      ticketNumber: "EQ003",
      customerId: customerC.id,
      currentStage: "ENQUIRY",
      currentStatus: "Enquiry Received",
      requirementCategory: "New Fire Extinguisher",
      enquirySource: "Walk-in",
      requirementDetails: "Quotation requested for 15 ABC Dry Powder extinguishers and 5 CO2 extinguishers for hotel lobby upgrade.",
      createdAt: new Date("2026-07-23T09:15:00Z"),
    },
  });

  // Ticket 4: Leaky cylinder transitioned from Refilling to Services
  const ticket4 = await prisma.ticket.create({
    data: {
      ticketNumber: "EQ004",
      customerId: customerB.id,
      currentStage: "SERVICES",
      currentStatus: "Pending Service",
      requirementCategory: "Refilling",
      itemDescription: "ABC Dry Powder Extinguisher 6kg",
      serialNumber: "SAFE-5582-CO2",
      capacity: "6 Kg",
      extinguisherType: "ABC Dry Powder",
      createdAt: new Date("2026-07-15T11:45:00Z"),
      scheduledVisitDate: new Date("2026-07-24T10:00:00Z"),
      adminNotes: "Urgent check: client noted crack on gauge dial.",
      technicianNotes: "Observed faulty valve block causing slow leak. Replaced standard valve block and gauge.",
    },
  });

  // Ticket 5: Active Refilling dispatch
  const ticket5 = await prisma.ticket.create({
    data: {
      ticketNumber: "EQ005",
      customerId: customerA.id,
      currentStage: "REFILLING",
      currentStatus: "Order Confirmed",
      requirementCategory: "Refilling",
      enquirySource: "Social Media",
      requirementDetails: "Clean Agent Extinguisher refilling for server room.",
      itemDescription: "Clean Agent Extinguisher 2kg",
      serialNumber: "CYL-7740-ABC",
      capacity: "2 Kg",
      extinguisherType: "Clean Agent",
      createdAt: new Date("2026-07-22T16:20:00Z"),
      scheduledVisitDate: new Date("2026-07-23T14:00:00Z"),
    },
  });

  // 7. Create Assignments (Technicians allocated to Tickets)
  
  // EQ001 Completed Assignment
  await prisma.ticketAssignment.create({
    data: {
      ticketId: ticket1.id,
      employeeId: tech1.id, // Alex Rivera
      status: "COMPLETED",
      completedAt: new Date("2026-03-04T11:30:00Z"),
      notes: "Hydrostatic test passed. Checked valve mechanism, refilled and resealed.",
      createdBy: admin.id
    }
  });

  // EQ002 Refilling Active Assignment
  await prisma.ticketAssignment.create({
    data: {
      ticketId: ticket2.id,
      employeeId: tech2.id, // Jane Smith
      status: "ASSIGNED",
      createdBy: admin.id
    }
  });

  // EQ004 Services Active Assignment
  await prisma.ticketAssignment.create({
    data: {
      ticketId: ticket4.id,
      employeeId: tech2.id, // Jane Smith
      status: "ASSIGNED",
      createdBy: admin.id
    }
  });

  // EQ005 Refilling Active Assignment
  await prisma.ticketAssignment.create({
    data: {
      ticketId: ticket5.id,
      employeeId: tech1.id, // Alex Rivera
      status: "ASSIGNED",
      createdBy: admin.id
    }
  });

  // 8. Create Realistic Audit Log Entries (TicketHistory)

  // Audit Logs for EQ001 (Completed)
  await prisma.ticketHistory.createMany({
    data: [
      {
        ticketId: ticket1.id,
        changedById: admin.id,
        fromStage: "ENQUIRY",
        toStage: "REFILLING",
        fromStatus: "Enquiry Received",
        toStatus: "Order Confirmed",
        remarks: "Enquiry approved. Quotation confirmed by client.",
        createdAt: new Date("2026-03-02T10:00:00Z"),
      },
      {
        ticketId: ticket1.id,
        changedById: admin.id,
        fromStage: "REFILLING",
        toStage: "REFILLING",
        fromStatus: "Order Confirmed",
        toStatus: "Order Confirmed",
        remarks: "Assigned technician Alex Rivera to refilling order.",
        createdAt: new Date("2026-03-02T10:15:00Z"),
      },
      {
        ticketId: ticket1.id,
        changedById: tech1.id,
        fromStage: "REFILLING",
        toStage: "COMPLETED",
        fromStatus: "Order Confirmed",
        toStatus: "Order Delivered",
        remarks: "Assignment status updated to 'Completed' by technician. Replaced pressure valve seal, refilled 4.5kg CO2.",
        createdAt: new Date("2026-03-04T12:00:00Z"),
      }
    ]
  });

  // Audit Logs for EQ004 (Transitioned from Refilling to Service)
  await prisma.ticketHistory.createMany({
    data: [
      {
        ticketId: ticket4.id,
        changedById: admin.id,
        fromStage: "ENQUIRY",
        toStage: "REFILLING",
        fromStatus: "Enquiry Received",
        toStatus: "Order Confirmed",
        remarks: "Order confirmed by Apollo maintenance team.",
        createdAt: new Date("2026-07-16T09:00:00Z"),
      },
      {
        ticketId: ticket4.id,
        changedById: admin.id,
        fromStage: "REFILLING",
        toStage: "REFILLING",
        fromStatus: "Order Confirmed",
        toStatus: "Order Confirmed",
        remarks: "Assigned technician Jane Smith to order.",
        createdAt: new Date("2026-07-16T09:10:00Z"),
      },
      {
        ticketId: ticket4.id,
        changedById: tech2.id,
        fromStage: "REFILLING",
        toStage: "SERVICES",
        fromStatus: "Order Confirmed",
        toStatus: "Pending Service",
        remarks: "Auto-transitioned: Technician set status to 'Assign For Service' after noting leaky discharge hose.",
        createdAt: new Date("2026-07-24T10:15:00Z"),
      }
    ]
  });

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
