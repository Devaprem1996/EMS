import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helpers";
import { rateLimit } from "@/lib/rate-limiter";

export async function GET(req: NextRequest) {
  try {
    // 1. Rate Limiter
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

    // 2. Auth Session Check
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    // Start window from 7 days ago (to catch recently expired/grace period AMCs)
    const graceStartDate = new Date();
    graceStartDate.setDate(today.getDate() - 7);

    // End window at 30 days from now (upcoming renewals before/during the next month)
    const renewalEndDate = new Date();
    renewalEndDate.setDate(today.getDate() + 30);

    const renewals = await prisma.ticket.findMany({
      where: {
        amcDate: {
          gte: graceStartDate,
          lte: renewalEndDate,
        },
        deletedAt: null,
      },
      include: {
        customer: true,
      },
      orderBy: {
        amcDate: "asc",
      },
    });

    const formattedRenewals = renewals.map(ticket => ({
      id: ticket.id,
      jobNumber: ticket.ticketNumber,
      companyName: ticket.customer?.companyName || "N/A",
      contactPerson: ticket.customer?.contactName || "N/A",
      phone: ticket.customer?.primaryPhone || "N/A",
      amcDate: ticket.amcDate,
      itemDescription: ticket.itemDescription || "Fire Extinguishers AMC",
      capacity: ticket.capacity || "",
      extinguisherType: ticket.extinguisherType || "",
      currentStatus: ticket.currentStatus,
    }));

    return NextResponse.json(formattedRenewals);
  } catch (error) {
    console.error("[AMC Renewals GET API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch AMC renewals" }, { status: 500 });
  }
}
