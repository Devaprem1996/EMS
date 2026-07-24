import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcryptjs";
import { signSession } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const { mobileNumber, password } = await req.json();

    if (!mobileNumber || !password) {
      return NextResponse.json(
        { error: "Mobile number and password are required" },
        { status: 400 }
      );
    }

    // Find the employee in the database
    const employee = await prisma.employee.findUnique({
      where: { mobileNumber },
    });

    if (!employee || !employee.isActive) {
      // Fallback: Check if it's a customer logging in via their primaryPhone
      const customer = await prisma.customer.findFirst({
        where: { primaryPhone: mobileNumber }
      });

      if (customer) {
        let passwordMatch = false;
        if (customer.passwordHash) {
          passwordMatch = await bcrypt.compare(password, customer.passwordHash);
        } else {
          // Reject login for customers without a password hash — they must set one first
          return NextResponse.json({ error: "Account not activated. Please contact support to set your password." }, { status: 401 });
        }

        if (!passwordMatch) {
          return NextResponse.json({ error: "Invalid password" }, { status: 401 });
        }

        const sessionData = {
          userId: customer.id,
          username: customer.primaryPhone,
          mobileNumber: customer.primaryPhone,
          fullName: customer.contactName,
          role: "CUSTOMER" as const,
          tenantId: customer.tenantId,
        };

        const response = NextResponse.json({
          success: true,
          user: {
            id: customer.id,
            username: customer.primaryPhone,
            mobileNumber: customer.primaryPhone,
            fullName: customer.contactName,
            role: "CUSTOMER",
          },
        });

        response.cookies.set("ems_session", signSession(sessionData), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24, // 1 day
          path: "/",
          sameSite: "strict",
        });

        return response;
      }

      return NextResponse.json(
        { error: "Invalid mobile number or inactive account" },
        { status: 401 }
      );
    }

    // Verify the password
    const passwordMatch = await bcrypt.compare(password, employee.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Construct session data
    const sessionData = {
      userId: employee.id,
      username: employee.mobileNumber,
      mobileNumber: employee.mobileNumber,
      fullName: employee.fullName || employee.mobileNumber,
      role: employee.role as "ADMIN" | "TECHNICIAN" | "SUPER_ADMIN",
      tenantId: employee.tenantId,
    };

    // Create a response
    const response = NextResponse.json({
      success: true,
      user: {
        id: employee.id,
        username: employee.mobileNumber,
        mobileNumber: employee.mobileNumber,
        fullName: employee.fullName,
        role: employee.role,
      },
    });

    // Set cryptographically signed session cookie
    const sessionString = signSession(sessionData);
    
    response.cookies.set("ems_session", sessionString, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
      sameSite: "strict",
    });

    return response;
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login" },
      { status: 500 }
    );
  }
}

