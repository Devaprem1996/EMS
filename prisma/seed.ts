import { prisma } from "../src/lib/db";
import * as bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding database...");

  // Clear existing users
  await prisma.user.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.job.deleteMany({});

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const techPasswordHash = await bcrypt.hash("tech123", 10);

  // 1. Create Admins
  const admin = await prisma.user.create({
    data: {
      username: "9876543210",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      fullName: "Super Admin",
      phone: "9876543210",
      employeeNumber: "E001",
      email: "admin@safeway.com",
      isActive: true,
    },
  });

  // 2. Create Technicians
  const tech1 = await prisma.user.create({
    data: {
      username: "9111111111",
      passwordHash: techPasswordHash,
      role: "TECHNICIAN",
      fullName: "John Doe (Lead Tech)",
      phone: "9111111111",
      employeeNumber: "E002",
      email: "john.doe@safeway.com",
      isActive: true,
    },
  });

  const tech2 = await prisma.user.create({
    data: {
      username: "9222222222",
      passwordHash: techPasswordHash,
      role: "TECHNICIAN",
      fullName: "Jane Smith (Junior Tech)",
      phone: "9222222222",
      employeeNumber: "E003",
      email: "jane.smith@safeway.com",
      isActive: true,
    },
  });

  // 3. Create Sample Customers
  const customerA = await prisma.customer.create({
    data: {
      companyName: "KH Chemicals",
      contactPerson: "Karamad Begum",
      phone: "9840135355",
      phone2: "9840135356",
      email: "karamad@khchem.com",
      address: "Tambaram, Chennai",
    },
  });

  const customerB = await prisma.customer.create({
    data: {
      companyName: "Siva Clinicals",
      contactPerson: "Manikrishnan",
      phone: "9944332106",
      email: "contact@sivaclinicals.com",
      address: "Adyar, Chennai",
    },
  });

  const customerC = await prisma.customer.create({
    data: {
      companyName: "Leena Enterprises",
      contactPerson: "Leena",
      phone: "9003332197",
      email: "leena@leenaent.com",
      address: "Guindy, Chennai",
    },
  });

  const customerD = await prisma.customer.create({
    data: {
      companyName: "Madhesh Trades",
      contactPerson: "Madhesh",
      phone: "9789077788",
      email: "madhesh@trades.com",
      address: "Velachery, Chennai",
    },
  });

  const customerE = await prisma.customer.create({
    data: {
      companyName: "Kavitha Agency",
      contactPerson: "Kavitha",
      phone: "9032111222",
      email: "kavitha@agency.com",
      address: "T Nagar, Chennai",
    },
  });

  // 4. Create Sample Enquiries (Jobs)
  const job1 = await prisma.job.create({
    data: {
      jobNumber: "EQ001",
      customerId: customerE.id,
      currentStage: "ENQUIRY",
      currentStatus: "Order Delivered",
      requirementCategory: "New Fire Extinguisher",
      enquirySource: "Existing Customers",
      requirementDetails: "ABC 9 kg - 2 Nos",
      createdAt: new Date("2026-02-28T10:00:00Z"),
      deliveredDate: new Date("2026-03-01T10:00:00Z"),
      amcYears: 1,
      amcDate: new Date("2027-03-01T10:00:00Z"),
    },
  });

  const job2 = await prisma.job.create({
    data: {
      jobNumber: "EQ002",
      customerId: customerD.id,
      currentStage: "ENQUIRY",
      currentStatus: "Order Delivered",
      requirementCategory: "Refilling",
      enquirySource: "Social Media",
      requirementDetails: "Refill 4 DCP cylinders",
      createdAt: new Date("2026-02-27T14:30:00Z"),
    },
  });

  const job3 = await prisma.job.create({
    data: {
      jobNumber: "EQ003",
      customerId: customerC.id,
      currentStage: "ENQUIRY",
      currentStatus: "Order Delivered",
      requirementCategory: "New Fire Extinguisher",
      enquirySource: "Walk-in",
      requirementDetails: "ABC 9 kg - 2 Nos",
      createdAt: new Date("2026-03-18T09:15:00Z"),
    },
  });

  const job4 = await prisma.job.create({
    data: {
      jobNumber: "EQ004",
      customerId: customerB.id,
      currentStage: "ENQUIRY",
      currentStatus: "Order Delivered",
      requirementCategory: "Refilling",
      enquirySource: "Phone Call",
      requirementDetails: "Refill job",
      createdAt: new Date("2026-03-18T11:45:00Z"),
    },
  });

  const job5 = await prisma.job.create({
    data: {
      jobNumber: "EQ005",
      customerId: customerA.id,
      currentStage: "ENQUIRY",
      currentStatus: "Order Delivered",
      requirementCategory: "New Fire Extinguisher",
      enquirySource: "Existing Customers",
      requirementDetails: "New fire extinguisher order",
      createdAt: new Date("2026-03-18T16:20:00Z"),
    },
  });

  // 5. Create Assignments
  await prisma.jobAssignment.create({
    data: {
      jobId: job5.id,
      technicianId: tech1.id, // John Doe
      status: "ASSIGNED",
    },
  });

  await prisma.jobAssignment.create({
    data: {
      jobId: job5.id,
      technicianId: tech2.id, // Jane Smith
      status: "ASSIGNED",
    },
  });

  await prisma.jobAssignment.create({
    data: {
      jobId: job4.id,
      technicianId: tech1.id, // John Doe
      status: "ASSIGNED",
    },
  });

  await prisma.jobAssignment.create({
    data: {
      jobId: job3.id,
      technicianId: tech1.id, // John Doe
      status: "ASSIGNED",
    },
  });

  await prisma.jobAssignment.create({
    data: {
      jobId: job2.id,
      technicianId: tech2.id, // Jane Smith
      status: "ASSIGNED",
    },
  });

  await prisma.jobAssignment.create({
    data: {
      jobId: job1.id,
      technicianId: tech2.id, // Jane Smith
      status: "ASSIGNED",
    },
  });

  console.log("Seeding completed successfully!");
  console.log("---------------------------------");
  console.log("Default Admin: 9876543210 / admin123");
  console.log("Default Tech 1: 9111111111 / tech123");
  console.log("Default Tech 2: 9222222222 / tech123");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
