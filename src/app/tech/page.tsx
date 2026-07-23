import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Calendar, MapPin, Clock, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TechDashboard() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get("ems_session");
  const session = sessionCookie ? verifySession(sessionCookie.value) : null;

  if (!session || session.role !== "TECHNICIAN") {
    return <div style={{ padding: "20px" }}>Unauthorized. Please log in as a technician.</div>;
  }

  // Fetch assignments for this technician
  const assignments = await prisma.ticketAssignment.findMany({
    where: {
      employeeId: session.userId,
      deletedAt: null,
      status: "ASSIGNED", // Only show active assignments
    },
    include: {
      ticket: {
        include: {
          customer: true
        }
      }
    },
    orderBy: {
      ticket: {
        scheduledVisitDate: "asc"
      }
    }
  });

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: "var(--text-primary)", margin: "0 0 5px 0" }}>
          My Tasks
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0 }}>
          You have {assignments.length} pending assignments.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {assignments.length === 0 ? (
          <div style={{ background: "var(--bg-input)", border: "1px dashed var(--border-glass)", borderRadius: "12px", padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>
            <Calendar size={32} style={{ margin: "0 auto 10px auto", opacity: 0.5 }} />
            <p style={{ margin: 0 }}>No tasks assigned right now.</p>
          </div>
        ) : (
          assignments.map((assignment) => (
            <Link 
              key={assignment.id} 
              href={`/tech/ticket/${assignment.ticketId}`}
              style={{ textDecoration: "none" }}
            >
              <div style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-glass)",
                borderRadius: "12px",
                padding: "16px",
                boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                transition: "transform 0.2s"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <span style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "4px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: "bold", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                    {assignment.ticket.currentStage}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>
                    {assignment.ticket.ticketNumber}
                  </span>
                </div>

                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", margin: "0 0 12px 0" }}>
                  {assignment.ticket.itemDescription || "General Service"}
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                  {assignment.ticket.customer && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "13px" }}>
                      <MapPin size={14} style={{ color: "var(--accent)" }} />
                      <span>{assignment.ticket.customer.companyName || assignment.ticket.customer.contactName}</span>
                    </div>
                  )}
                  {assignment.ticket.scheduledVisitDate && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "13px" }}>
                      <Clock size={14} style={{ color: "var(--accent)" }} />
                      <span>{new Date(assignment.ticket.scheduledVisitDate).toLocaleDateString()} at {new Date(assignment.ticket.scheduledVisitDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-glass)", paddingTop: "12px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Tap to view details
                  </span>
                  <ArrowRight size={16} style={{ color: "var(--accent)" }} />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
