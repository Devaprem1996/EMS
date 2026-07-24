import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helpers";
import { rateLimit } from "@/lib/rate-limiter";

// GET /api/billing - Retrieve invoices or unbilled completed tickets
export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const limiter = rateLimit(ip, 120);
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
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 401 });
    }

    const tenantId = session.tenantId;
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "invoices";

    if (scope === "unbilled") {
      const unbilledTickets = await prisma.ticket.findMany({
        where: {
          currentStatus: {
            in: ["COMPLETED", "Completed", "Service Done", "Order Delivered"],
          },
          tenantId,
          invoice: null,
          deletedAt: null,
        },
        include: {
          customer: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
      return NextResponse.json(unbilledTickets);
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
      },
      include: {
        ticket: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("[Billing GET API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch billing data" }, { status: 500 });
  }
}

// POST /api/billing - Generate a new invoice for a completed ticket
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const limiter = rateLimit(ip, 60);
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
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 401 });
    }

    const tenantId = session.tenantId;
    const body = await req.json();
    const { ticketId, amount } = body;

    if (!ticketId) {
      return NextResponse.json({ error: "ticketId is required" }, { status: 400 });
    }

    // Retrieve and validate ticket
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (ticket.currentStatus !== "COMPLETED") {
      return NextResponse.json({ error: "Invoice can only be generated for COMPLETED tickets" }, { status: 400 });
    }

    // Check if an invoice already exists for this ticket
    const existingInvoice = await prisma.invoice.findFirst({
      where: { ticketId },
    });

    if (existingInvoice) {
      return NextResponse.json({ error: "An invoice already exists for this ticket" }, { status: 400 });
    }

    // Generate unique Invoice ID (e.g. INV-001)
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: "INV-",
        },
        tenantId,
      },
      orderBy: {
        invoiceNumber: "desc",
      },
    });

    let nextInvoiceNumber = "INV-001";
    if (lastInvoice) {
      const match = lastInvoice.invoiceNumber.match(/INV-(\d+)/);
      if (match) {
        const lastNum = parseInt(match[1], 10);
        nextInvoiceNumber = `INV-${String(lastNum + 1).padStart(3, "0")}`;
      }
    }

    const finalAmount = typeof amount === "number" ? amount : 150.00;

    // Create Invoice record
    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        ticketId,
        invoiceNumber: nextInvoiceNumber,
        totalAmount: finalAmount,
        status: "SENT",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Due in 14 days
      },
      include: {
        ticket: {
          include: {
            customer: true,
          },
        },
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("[Billing POST API] Error:", error);
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}
