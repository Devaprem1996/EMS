import { prisma } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  // Hash password
  const passwordHash = bcrypt.hashSync("admin123", 10);

  // Check if it already exists
  const existing = await prisma.employee.findUnique({
    where: { mobileNumber: "9999999999" }
  });

  if (existing) {
    // If it exists, make sure the role is updated to SUPER_ADMIN
    await prisma.employee.update({
      where: { id: existing.id },
      data: { role: "SUPER_ADMIN" }
    });
    console.log("✅ Existing account updated to SUPER_ADMIN!");
  } else {
    // Create new developer super-admin
    await prisma.employee.create({
      data: {
        mobileNumber: "9999999999",
        passwordHash: passwordHash,
        role: "SUPER_ADMIN",
        fullName: "Platform Developer",
        employeeNumber: "DEV001",
        email: "dev@platform.com",
        isActive: true,
      }
    });
    console.log("✅ Platform Developer (SUPER_ADMIN) account created!");
  }

  console.log("- Phone: '9999999999'");
  console.log("- Password: 'admin123'");
}

main()
  .catch(e => console.error("❌ Failed to create super-admin:", e))
  .finally(() => prisma.$disconnect());
