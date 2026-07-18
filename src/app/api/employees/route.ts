import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin, getAuthSession } from "@/lib/auth-helpers";
import * as bcrypt from "bcryptjs";
import { serverCache } from "@/lib/cache";
import { rateLimit } from "@/lib/rate-limiter";

// GET /api/employees - Fetch all employees (Admin Only)
export async function GET(req: NextRequest) {
  try {
    // 1. Rate Limiting Check
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const limiter = rateLimit(ip, 100);
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
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Access restricted to admins" }, { status: 403 });
    }

    const tenantId = session.tenantId;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all"; // "all" | "active" | "inactive"

    // Construct Cache Key for active technicians/employees
    const isCacheable = status === "active";
    const cacheKey = tenantId ? `employees:active:tenant:${tenantId}:search:${search}` : `employees:active:search:${search}`;
    
    if (isCacheable) {
      const cachedData = serverCache.get(cacheKey);
      if (cachedData) {
        return NextResponse.json(cachedData);
      }
    }

    // Construct query filters
    const whereClause: any = {};
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    if (status === "active") {
      whereClause.isActive = true;
    } else if (status === "inactive") {
      whereClause.isActive = false;
    }

    if (search) {
      whereClause.OR = [
        { fullName: { contains: search } },
        { contactPhone: { contains: search } },
        { mobileNumber: { contains: search } },
        { employeeNumber: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    const mapped = employees.map((emp: any) => ({
      ...emp,
      username: emp.mobileNumber,
      phone: emp.contactPhone,
    }));

    // Cache the active employees list for 5 minutes
    if (isCacheable) {
      serverCache.set(cacheKey, mapped, 300000);
    }

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("[Employees API GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

// POST /api/employees - Create new employee (Admin Only)
export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Check
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const limiter = rateLimit(ip, 30);
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
    if (!session || session.role !== "ADMIN") {
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

    // Check contact number (mobileNumber) uniqueness
    const existingPhone = await prisma.employee.findUnique({
      where: { mobileNumber: phone },
    });
    if (existingPhone) {
      return NextResponse.json(
        { error: "Contact number is already registered to another employee" },
        { status: 400 }
      );
    }

    // Check employee number uniqueness
    const existingEmpNo = await prisma.employee.findUnique({
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

    // Create employee record
    const newEmployee = await prisma.employee.create({
      data: {
        tenantId: session.tenantId,
        mobileNumber: phone, // phone is used as mobileNumber (login)
        passwordHash,
        role,
        fullName,
        contactPhone: phone,
        employeeNumber,
        email: email || null,
        isActive: isActive !== undefined ? isActive : true,
        createdBy: session.userId,
        updatedBy: session.userId,
      },
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
      ...newEmployee,
      username: newEmployee.mobileNumber,
      phone: newEmployee.contactPhone,
    };

    // Invalidate active employee caches
    serverCache.invalidatePattern(/^employees:/);

    return NextResponse.json(mapped, { status: 201 });
  } catch (error) {
    console.error("[Employees API POST] Error:", error);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}

