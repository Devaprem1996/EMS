import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth-helpers";
import * as bcrypt from "bcryptjs";

// GET /api/employees - Fetch all employees (Admin Only)
export async function GET(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: "Forbidden: Access restricted to admins" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all"; // "all" | "active" | "inactive"

    // Construct query filters
    const whereClause: any = {};

    if (status === "active") {
      whereClause.isActive = true;
    } else if (status === "inactive") {
      whereClause.isActive = false;
    }

    if (search) {
      whereClause.OR = [
        { fullName: { contains: search } },
        { phone: { contains: search } },
        { employeeNumber: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const employees = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        role: true,
        fullName: true,
        phone: true,
        employeeNumber: true,
        email: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("[Employees API GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

// POST /api/employees - Create new employee (Admin Only)
export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: "Forbidden: Access restricted to admins" }, { status: 403 });
    }

    const body = await req.json();
    const { fullName, employeeNumber, phone, email, password, role, isActive } = body;

    // Validate inputs
    if (!fullName || !employeeNumber || !phone || !password || !role) {
      return NextResponse.json(
        { error: "Name, Employee Number, Contact Number, Password and Role are required fields" },
        { status: 400 }
      );
    }

    if (role !== "ADMIN" && role !== "TECHNICIAN") {
      return NextResponse.json({ error: "Invalid role value" }, { status: 400 });
    }

    // Check contact number (username) uniqueness
    const existingPhone = await prisma.user.findUnique({
      where: { username: phone },
    });
    if (existingPhone) {
      return NextResponse.json(
        { error: "Contact number is already registered to another employee" },
        { status: 400 }
      );
    }

    // Check employee number uniqueness
    const existingEmpNo = await prisma.user.findUnique({
      where: { employeeNumber },
    });
    if (existingEmpNo) {
      return NextResponse.json(
        { error: "Employee Number is already assigned" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user record
    const newEmployee = await prisma.user.create({
      data: {
        username: phone, // phone is used as username
        passwordHash,
        role,
        fullName,
        phone,
        employeeNumber,
        email: email || null,
        isActive: isActive !== undefined ? isActive : true,
      },
      select: {
        id: true,
        username: true,
        role: true,
        fullName: true,
        phone: true,
        employeeNumber: true,
        email: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newEmployee, { status: 201 });
  } catch (error) {
    console.error("[Employees API POST] Error:", error);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
