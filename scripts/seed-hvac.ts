import { prisma } from "../src/lib/db";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

async function main() {
  // Clean up existing tenant to allow fresh seed
  const existingTenant = await prisma.tenant.findFirst({
    where: { subdomain: "arctic" }
  });

  if (existingTenant) {
    console.log("🧹 Cleaning up existing 'arctic' tenant and its child records...");
    await prisma.ticket.deleteMany({ where: { tenantId: existingTenant.id } });
    await prisma.customer.deleteMany({ where: { tenantId: existingTenant.id } });
    await prisma.employee.deleteMany({ where: { tenantId: existingTenant.id } });
    await prisma.systemConfig.deleteMany({ where: { tenantId: existingTenant.id } });
    await prisma.tenant.delete({ where: { id: existingTenant.id } });
  }

  // 1. Create Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: "Arctic HVAC Solutions",
      subdomain: "arctic",
    }
  });

  // 2. Read template configuration
  const templatePath = path.join(process.cwd(), "src/config/templates", "hvac-repair.json");
  const templateConfig = fs.readFileSync(templatePath, "utf-8");

  // 3. Save SystemConfig
  await prisma.systemConfig.create({
    data: {
      id: "arctic-config",
      tenantId: tenant.id,
      config: templateConfig,
    }
  });

  // 4. Create HVAC Admin
  const adminHash = bcrypt.hashSync("admin123", 10);
  await prisma.employee.create({
    data: {
      tenantId: tenant.id,
      mobileNumber: "8888888888",
      passwordHash: adminHash,
      role: "ADMIN",
      fullName: "James Arctic Admin",
    }
  });

  // 5. Create HVAC Technician
  const techHash = bcrypt.hashSync("tech123", 10);
  await prisma.employee.create({
    data: {
      tenantId: tenant.id,
      mobileNumber: "7777777777",
      passwordHash: techHash,
      role: "TECHNICIAN",
      fullName: "Robert HVAC Technician",
    }
  });

  // 6. Create Customer
  const customer = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      companyName: "Blue Ocean Hotel",
      contactName: "Marcus Ocean Manager",
      primaryPhone: "9000000001",
      address: "12 Marina Boulevard, Sector 4",
    }
  });

  // 7. Create Enquiry Ticket
  await prisma.ticket.create({
    data: {
      tenantId: tenant.id,
      ticketNumber: "EQ8001",
      customerId: customer.id,
      currentStage: "ENQUIRY",
      currentStatus: "Enquiry Registered",
      requirementCategory: "Emergency Breakdown",
      requirementDetails: "Central Chiller AC unit is blowing warm air on the 3rd floor.",
      serialNumber: "CHILL-49202",
      capacity: "15 Tons",
      extinguisherType: "R410A Refrigerant Gas",
      itemDescription: "Carrier Central Chiller Unit V3",
      stageData: JSON.stringify({
        notes: "Urgently requires service before the evening guest rush.",
      })
    }
  });

  console.log("✅ Arctic HVAC Tenant successfully seeded!");
  console.log(`- Tenant ID: ${tenant.id}`);
  console.log("- Admin login: Phone '8888888888', Password 'admin123'");
  console.log("- Technician login: Phone '7777777777', Password 'tech123'");
}

main()
  .catch(e => console.error("❌ Seed failed:", e))
  .finally(() => prisma.$disconnect());
