import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth-helpers";
import * as bcrypt from "bcryptjs";

// PUT /api/employees/[id] - Update employee details (Admin Only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: "Forbidden: Access restricted to admins" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { fullName, employeeNumber, phone, email, password, role, isActive } = body;

    // Find existing employee
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const updateData: any = {};

    // Apply updates if defined
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    if (role !== undefined) {
      if (role !== "ADMIN" && role !== "TECHNICIAN") {
        return NextResponse.json({ error: "Invalid role value" }, { status: 400 });
      }
      updateData.role = role;
    }

    // Check contact number uniqueness if changing
    if (phone !== undefined && phone !== existingEmployee.contactPhone) {
      const phoneTaken = await prisma.employee.findFirst({
        where: {
          mobileNumber: phone,
          id: { not: id },
        },
      });
      if (phoneTaken) {
        return NextResponse.json(
          { error: "Contact number is already registered to another employee" },
          { status: 400 }
        );
      }
      updateData.contactPhone = phone;
      updateData.mobileNumber = phone; // mobileNumber must sync with phone
    }

    // Check employee number uniqueness if changing
    if (employeeNumber !== undefined && employeeNumber !== existingEmployee.employeeNumber) {
      const empNoTaken = await prisma.employee.findFirst({
        where: {
          employeeNumber,
          id: { not: id },
        },
      });
      if (empNoTaken) {
        return NextResponse.json(
          { error: "Employee number is already assigned to another employee" },
          { status: 400 }
        );
      }
      updateData.employeeNumber = employeeNumber;
    }

    // Hash and update password only if a new password is provided
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    // Perform database update
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        mobileNumber: true,
        role: true,
        fullName: true,
        contactPhone: true,
        employeeNumber: true,
        email: true,
        isActive: true,
        createdAt: true,
      },
    });

    const mapped = {
      ...updatedEmployee,
      username: updatedEmployee.mobileNumber,
      phone: updatedEmployee.contactPhone,
    };

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("[Employee PUT API] Error:", error);
    return NextResponse.json({ error: "Failed to update employee details" }, { status: 500 });
  }
}
