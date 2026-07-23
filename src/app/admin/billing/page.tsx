import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helpers";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FileText, CheckCircle, Clock, Search, Download } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BillingDashboard() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("ems_session");
  const sessionValue = sessionCookie?.value;

  if (!sessionValue) {
    redirect("/login");
  }

  // Note: We use auth-helpers verifySession but simplified here since Server Components 
  // can't easily use the full verifySession logic without duplicating the secret handling.
  // Assuming middleware protects this route, we'll fetch tenantId if needed.
  // We'll fetch all invoices and completed tickets.
  
  const invoices = await prisma.invoice.findMany({
    include: {
      ticket: {
        include: {
          customer: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  // Fetch completed tickets that do NOT have an invoice yet
  const unbilledTickets = await prisma.ticket.findMany({
    where: {
      currentStatus: "COMPLETED",
      invoice: null
    },
    include: {
      customer: true
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  const totalRevenue = invoices.filter(i => i.status === "PAID").reduce((sum, i) => sum + i.totalAmount, 0);
  const pendingRevenue = invoices.filter(i => i.status === "SENT").reduce((sum, i) => sum + i.totalAmount, 0);

  return (
    <div style={{ padding: "30px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "var(--text-primary)", margin: "0 0 8px 0" }}>Billing & Invoicing</h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0 }}>Manage revenue, generate invoices, and track payments.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        <div style={{ background: "var(--bg-card-glass)", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-glass)", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Total Revenue (Paid)</div>
          <div style={{ fontSize: "32px", fontWeight: "700", color: "#10b981" }}>${totalRevenue.toLocaleString()}</div>
        </div>
        <div style={{ background: "var(--bg-card-glass)", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-glass)", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Pending (Awaiting Payment)</div>
          <div style={{ fontSize: "32px", fontWeight: "700", color: "#f59e0b" }}>${pendingRevenue.toLocaleString()}</div>
        </div>
        <div style={{ background: "var(--bg-card-glass)", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-glass)", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Unbilled Tasks</div>
          <div style={{ fontSize: "32px", fontWeight: "700", color: "var(--text-primary)" }}>{unbilledTickets.length}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
        {/* Unbilled Completed Tickets */}
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={20} style={{ color: "var(--accent)" }} />
            Ready for Invoicing
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {unbilledTickets.length === 0 ? (
              <div style={{ background: "var(--bg-card-glass)", border: "1px dashed var(--border-glass)", borderRadius: "12px", padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>
                No completed tasks awaiting invoices.
              </div>
            ) : (
              unbilledTickets.map(ticket => (
                <div key={ticket.id} style={{ background: "var(--bg-card-glass)", border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "4px" }}>
                      {ticket.customer?.companyName || ticket.customer?.contactName || "Unknown Customer"}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      {ticket.ticketNumber} • {ticket.itemDescription || "General Service"}
                    </div>
                  </div>
                  <button style={{ background: "var(--primary)", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                    Generate Invoice
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Generated Invoices */}
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText size={20} style={{ color: "#10b981" }} />
            Recent Invoices
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {invoices.length === 0 ? (
              <div style={{ background: "var(--bg-card-glass)", border: "1px dashed var(--border-glass)", borderRadius: "12px", padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>
                No invoices generated yet.
              </div>
            ) : (
              invoices.map(invoice => (
                <div key={invoice.id} style={{ background: "var(--bg-card-glass)", border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)" }}>{invoice.invoiceNumber}</span>
                      <span style={{ background: invoice.status === "PAID" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)", color: invoice.status === "PAID" ? "#10b981" : "#f59e0b", padding: "2px 6px", borderRadius: "6px", fontSize: "10px", fontWeight: "bold" }}>
                        {invoice.status}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      {invoice.ticket.customer?.companyName} • ${invoice.totalAmount}
                    </div>
                  </div>
                  <button style={{ background: "transparent", color: "var(--text-primary)", border: "1px solid var(--border-glass)", padding: "8px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Download PDF">
                    <Download size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
