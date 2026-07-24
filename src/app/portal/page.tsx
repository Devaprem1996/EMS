import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import PortalRequestList from "@/components/PortalRequestList";

export const dynamic = "force-dynamic";

export default async function CustomerPortalDashboard() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("ems_session");
  const session = sessionCookie ? verifySession(sessionCookie.value) : null;

  if (!session || session.role !== "CUSTOMER") {
    return <div style={{ padding: "30px", textAlign: "center" }}>Unauthorized. Please log in to the portal.</div>;
  }

  // Fetch all tickets for this customer
  const tickets = await prisma.ticket.findMany({
    where: {
      customerId: session.userId,
      deletedAt: null,
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  const activeTickets = tickets.filter(t => t.currentStage !== "COMPLETED" && t.currentStatus !== "COMPLETED" && t.currentStatus !== "Service Done" && t.currentStatus !== "Order Delivered");
  const completedTickets = tickets.filter(t => t.currentStage === "COMPLETED" || t.currentStatus === "COMPLETED" || t.currentStatus === "Service Done" || t.currentStatus === "Order Delivered");
  const upcomingMaintenance = tickets.filter(t => t.amcDate && new Date(t.amcDate) >= new Date());

  return (
    <div>
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "var(--text-primary)", margin: "0 0 8px 0" }}>
          Welcome back, {session.fullName.split(" ")[0]}
        </h1>
        <p style={{ fontSize: "15px", color: "var(--text-secondary)", margin: 0 }}>
          Track your service requests, scheduled maintenance, and history.
        </p>
      </div>

      <PortalRequestList
        activeTickets={activeTickets as any}
        completedTickets={completedTickets as any}
        upcomingMaintenance={upcomingMaintenance as any}
        clientName={session.fullName}
      />
    </div>
  );
}

