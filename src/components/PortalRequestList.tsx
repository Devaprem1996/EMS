"use client";

import React, { useState } from "react";
import { Calendar, Package, Wrench, CheckCircle, Clock, History } from "lucide-react";
import AuditLogModal from "./AuditLogModal";

interface Ticket {
  id: string;
  ticketNumber: string;
  currentStage: string;
  currentStatus: string;
  requirementCategory: string | null;
  itemDescription: string | null;
  serialNumber: string | null;
  capacity: string | null;
  extinguisherType: string | null;
  scheduledVisitDate: Date | null;
  amcDate: Date | null;
  updatedAt: Date;
}

interface PortalRequestListProps {
  activeTickets: Ticket[];
  completedTickets: Ticket[];
  upcomingMaintenance: Ticket[];
  clientName: string;
}

export default function PortalRequestList({
  activeTickets,
  completedTickets,
  upcomingMaintenance,
  clientName
}: PortalRequestListProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStageIcon = (stage: string) => {
    if (stage === "ENQUIRY") return <Clock size={20} />;
    if (stage === "REFILLING") return <Package size={20} />;
    if (stage === "SERVICES") return <Wrench size={20} />;
    return <CheckCircle size={20} />;
  };

  const getStageColor = (stage: string) => {
    if (stage === "ENQUIRY") return "#3b82f6";
    if (stage === "REFILLING") return "#f59e0b";
    if (stage === "SERVICES") return "#8b5cf6";
    return "#10b981";
  };

  const getProgressPercentage = (stage: string, status: string) => {
    const s = status ? status.toUpperCase() : "";
    if (stage === "COMPLETED" || s === "COMPLETED" || s === "SERVICE DONE" || s === "ORDER DELIVERED") return 100;
    if (stage === "SERVICES") return s === "IN_PROGRESS" ? 85 : 70;
    if (stage === "REFILLING") return s === "IN_PROGRESS" ? 50 : 40;
    return s === "ASSIGNED" ? 25 : 15;
  };

  const handleOpenAudit = (id: string) => {
    setSelectedJobId(id);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "25px", marginBottom: "40px" }}>
        {/* Active Requests Card */}
        <div style={{ background: "var(--bg-card-glass)", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-glass)", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }}></div>
            Active Requests
          </h2>
          
          {activeTickets.length === 0 ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-secondary)", fontSize: "14px" }}>
              No active requests at the moment.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {activeTickets.map(ticket => (
                <div key={ticket.id} style={{ padding: "15px", borderRadius: "12px", background: "var(--bg-input)", border: "1px solid var(--border-glass)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "bold", color: getStageColor(ticket.currentStage), display: "flex", alignItems: "center", gap: "6px" }}>
                      {getStageIcon(ticket.currentStage)}
                      {ticket.currentStage}
                    </span>
                    <button
                      onClick={() => handleOpenAudit(ticket.id)}
                      style={{
                        background: "rgba(56, 189, 248, 0.1)",
                        color: "#38bdf8",
                        border: "none",
                        borderRadius: "6px",
                        padding: "3px 8px",
                        fontSize: "11px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <History size={12} />
                      Logs
                    </button>
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "10px" }}>
                    {ticket.itemDescription || ticket.requirementCategory || "Service Request"}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>
                      Status: <strong style={{ color: "var(--text-primary)" }}>{ticket.currentStatus}</strong>
                    </span>
                    {ticket.scheduledVisitDate && (
                      <span style={{ color: "var(--accent)" }}>
                        Scheduled: {new Date(ticket.scheduledVisitDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {/* Dynamic Progress Bar */}
                  <div style={{ height: "4px", width: "100%", background: "rgba(255,255,255,0.1)", borderRadius: "2px", marginTop: "12px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${getProgressPercentage(ticket.currentStage, ticket.currentStatus)}%`, background: getStageColor(ticket.currentStage), borderRadius: "2px", transition: "width 0.5s ease" }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Maintenance (AMC) */}
        <div style={{ background: "var(--bg-card-glass)", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-glass)", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={20} style={{ color: "var(--accent)" }} />
            Upcoming Maintenance
          </h2>
          
          {upcomingMaintenance.length === 0 ? (
            <div style={{ padding: "30px 0", textAlign: "center", color: "var(--text-secondary)", fontSize: "14px", border: "1px dashed var(--border-glass)", borderRadius: "12px" }}>
              No upcoming scheduled maintenance for your registered equipment.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {upcomingMaintenance.map(ticket => (
                <div key={ticket.id} style={{ padding: "15px", borderRadius: "12px", background: "var(--bg-input)", border: "1px solid var(--border-glass)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Tag: <strong>{ticket.serialNumber || "N/A"}</strong></span>
                    <span style={{ fontSize: "11px", background: "rgba(163, 230, 53, 0.12)", color: "#a3e635", padding: "2px 8px", borderRadius: "4px", fontWeight: "bold" }}>AMC ACTIVE</span>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px" }}>
                    {ticket.itemDescription || "Fire Extinguisher Maintenance"} ({ticket.capacity || "N/A"})
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Next Refilling Date: <strong style={{ color: "var(--text-primary)" }}>{new Date(ticket.amcDate!).toLocaleDateString()}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Service History */}
      <div>
        <h2 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "20px" }}>Service History</h2>
        
        {completedTickets.length === 0 ? (
          <div style={{ background: "var(--bg-card-glass)", padding: "30px", borderRadius: "16px", border: "1px solid var(--border-glass)", textAlign: "center", color: "var(--text-secondary)" }}>
            You have no completed service history.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {completedTickets.map(ticket => (
              <div key={ticket.id} style={{ background: "var(--bg-card-glass)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "4px" }}>
                    {ticket.itemDescription || ticket.requirementCategory || "Service Request"}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "12px" }}>
                    <span>{ticket.ticketNumber}</span>
                    <span>•</span>
                    <span>Completed on {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button
                    onClick={() => handleOpenAudit(ticket.id)}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid var(--border-glass)",
                      color: "var(--text-primary)",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                    onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                  >
                    <History size={14} />
                    View Timeline
                  </button>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#10b981", fontSize: "14px", fontWeight: "bold" }}>
                    <CheckCircle size={18} />
                    Done
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AuditLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        jobId={selectedJobId}
        clientName={clientName}
      />
    </div>
  );
}
