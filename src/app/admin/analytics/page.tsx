import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helpers";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BarChart2, TrendingUp, Users, Activity } from "lucide-react";
import ExportButton from "./ExportButton";

export const dynamic = "force-dynamic";

export default async function AnalyticsDashboard() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get("ems_session");
  const sessionValue = sessionCookie?.value;

  if (!sessionValue) {
    redirect("/login");
  }

  // Fetch all tickets for analysis
  const allTickets = await prisma.ticket.findMany({
    include: {
      customer: true,
      assignments: {
        include: { employee: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const totalTickets = allTickets.length;
  const completedTickets = allTickets.filter(t => t.currentStatus === "COMPLETED");
  const completionRate = totalTickets > 0 ? Math.round((completedTickets.length / totalTickets) * 100) : 0;

  // Breakdown by Stage
  const stageCounts = {
    ENQUIRY: allTickets.filter(t => t.currentStage === "ENQUIRY").length,
    REFILLING: allTickets.filter(t => t.currentStage === "REFILLING").length,
    SERVICES: allTickets.filter(t => t.currentStage === "SERVICES").length,
  };

  // Prepare CSV Export Data
  const exportData = allTickets.map(t => ({
    TicketID: t.ticketNumber,
    Stage: t.currentStage,
    Status: t.currentStatus,
    Customer: t.customer?.companyName || t.customer?.contactName || "Unknown",
    CreatedAt: t.createdAt,
    CompletedAt: t.currentStatus === "COMPLETED" ? t.updatedAt : null,
  }));

  return (
    <div style={{ padding: "30px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "var(--text-primary)", margin: "0 0 8px 0" }}>Analytics & Reporting</h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0 }}>Gain insights into your operational performance.</p>
        </div>
        <ExportButton data={exportData} filename="EMS_Operational_Report" />
      </div>

      {/* Top Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        <div style={{ background: "var(--bg-card-glass)", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-glass)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-secondary)", marginBottom: "15px" }}>
            <Activity size={20} style={{ color: "var(--primary)" }} />
            <span style={{ fontSize: "14px", fontWeight: "600" }}>Total Volume</span>
          </div>
          <div style={{ fontSize: "36px", fontWeight: "700", color: "var(--text-primary)" }}>{totalTickets}</div>
        </div>

        <div style={{ background: "var(--bg-card-glass)", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-glass)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-secondary)", marginBottom: "15px" }}>
            <TrendingUp size={20} style={{ color: "#10b981" }} />
            <span style={{ fontSize: "14px", fontWeight: "600" }}>Completion Rate</span>
          </div>
          <div style={{ fontSize: "36px", fontWeight: "700", color: "#10b981" }}>{completionRate}%</div>
        </div>

        <div style={{ background: "var(--bg-card-glass)", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-glass)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-secondary)", marginBottom: "15px" }}>
            <Users size={20} style={{ color: "#f59e0b" }} />
            <span style={{ fontSize: "14px", fontWeight: "600" }}>Active Customers</span>
          </div>
          <div style={{ fontSize: "36px", fontWeight: "700", color: "var(--text-primary)" }}>
            {new Set(allTickets.filter(t => t.customerId).map(t => t.customerId)).size}
          </div>
        </div>
      </div>

      {/* Visual Charts (CSS-based) */}
      <div style={{ background: "var(--bg-card-glass)", borderRadius: "16px", padding: "30px", border: "1px solid var(--border-glass)" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "25px", display: "flex", alignItems: "center", gap: "8px" }}>
          <BarChart2 size={20} style={{ color: "var(--accent)" }} />
          Volume by Operational Stage
        </h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          {/* Enquiry Bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: "var(--text-secondary)" }}>
              <span>Enquiry</span>
              <span>{stageCounts.ENQUIRY} tickets</span>
            </div>
            <div style={{ width: "100%", background: "rgba(255,255,255,0.05)", height: "12px", borderRadius: "6px", overflow: "hidden" }}>
              <div style={{ width: \`\${totalTickets > 0 ? (stageCounts.ENQUIRY / totalTickets) * 100 : 0}%\`, background: "#3b82f6", height: "100%", borderRadius: "6px" }}></div>
            </div>
          </div>

          {/* Refilling Bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: "var(--text-secondary)" }}>
              <span>Refilling / Inventory</span>
              <span>{stageCounts.REFILLING} tickets</span>
            </div>
            <div style={{ width: "100%", background: "rgba(255,255,255,0.05)", height: "12px", borderRadius: "6px", overflow: "hidden" }}>
              <div style={{ width: \`\${totalTickets > 0 ? (stageCounts.REFILLING / totalTickets) * 100 : 0}%\`, background: "#f59e0b", height: "100%", borderRadius: "6px" }}></div>
            </div>
          </div>

          {/* Services Bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: "var(--text-secondary)" }}>
              <span>Services / Field Ops</span>
              <span>{stageCounts.SERVICES} tickets</span>
            </div>
            <div style={{ width: "100%", background: "rgba(255,255,255,0.05)", height: "12px", borderRadius: "6px", overflow: "hidden" }}>
              <div style={{ width: \`\${totalTickets > 0 ? (stageCounts.SERVICES / totalTickets) * 100 : 0}%\`, background: "#8b5cf6", height: "100%", borderRadius: "6px" }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
