"use client";

import React from "react";
import { 
  Edit2, 
  UserPlus, 
  MapPin, 
  Calendar, 
  AlertCircle, 
  User, 
  Trash2,
  AlertTriangle,
  Zap,
  Info
} from "lucide-react";

interface KanbanColumn {
  key: string;
  label: string;
  color?: string;
  badgeBg?: string;
}

interface KanbanBoardProps {
  tickets: any[];
  columns: KanbanColumn[];
  statusKey: string;
  onEdit: (ticket: any) => void;
  onAssign?: (ticket: any) => void;
  onDelete?: (ticket: any) => void;
  onStatusChange?: (ticket: any, newStatus: string) => void;
  stageName: "ENQUIRY" | "REFILLING" | "SERVICES";
}

export default function KanbanBoard({
  tickets,
  columns,
  statusKey,
  onEdit,
  onAssign,
  onDelete,
  onStatusChange,
  stageName
}: KanbanBoardProps) {

  // Group tickets by status
  const groupedTickets = React.useMemo(() => {
    const groups: Record<string, any[]> = {};
    columns.forEach(col => {
      groups[col.key] = [];
    });
    
    // Add a fallback for unknown/unmapped statuses
    groups["unmapped"] = [];

    tickets.forEach(ticket => {
      const statusValue = ticket[statusKey] || "unmapped";
      if (groups[statusValue]) {
        groups[statusValue].push(ticket);
      } else {
        // Safe mapping or partial case-insensitive match
        const matchedCol = columns.find(
          c => c.key.toLowerCase() === String(statusValue).toLowerCase()
        );
        if (matchedCol) {
          groups[matchedCol.key].push(ticket);
        } else {
          groups["unmapped"].push(ticket);
        }
      }
    });

    return groups;
  }, [tickets, columns, statusKey]);

  // Safe JSON parse for stageData dynamic fields
  const parseStageData = (dataStr: string | null | undefined) => {
    if (!dataStr) return {};
    try {
      return JSON.parse(dataStr);
    } catch {
      return {};
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (String(urgency).toLowerCase()) {
      case "critical":
        return { text: "#ef4444", bg: "rgba(239, 68, 68, 0.12)" };
      case "high":
        return { text: "#f97316", bg: "rgba(249, 115, 22, 0.12)" };
      case "medium":
        return { text: "#eab308", bg: "rgba(234, 179, 8, 0.12)" };
      default:
        return { text: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)" };
    }
  };

  return (
    <div 
      className="kanban-wrapper" 
      style={{ 
        display: "flex", 
        gap: "1.25rem", 
        overflowX: "auto", 
        paddingBottom: "1.5rem",
        minHeight: "65vh",
        alignItems: "flex-start",
        scrollSnapType: "x mandatory"
      }}
    >
      {columns.map((column) => {
        const columnTickets = groupedTickets[column.key] || [];
        const isUnmapped = column.key === "unmapped";
        if (isUnmapped && columnTickets.length === 0) return null;

        return (
          <div 
            key={column.key}
            className="kanban-column"
            style={{
              flex: "0 0 310px",
              background: "rgba(21, 22, 30, 0.35)",
              border: "1px solid var(--border-glass)",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              maxHeight: "650px",
              boxShadow: "var(--shadow-glass)",
              backdropFilter: "blur(10px)",
              scrollSnapAlign: "start"
            }}
          >
            {/* Column Header */}
            <div 
              style={{
                padding: "1rem 1.25rem",
                borderBottom: "1px solid var(--border-glass)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "rgba(255, 255, 255, 0.01)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span 
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: column.color || "var(--accent)"
                  }} 
                />
                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                  {column.label}
                </h3>
              </div>
              <span 
                style={{
                  fontSize: "11px",
                  fontWeight: "800",
                  color: "#ffffff",
                  background: column.badgeBg || "var(--border-glass)",
                  padding: "2px 8px",
                  borderRadius: "20px"
                }}
              >
                {columnTickets.length}
              </span>
            </div>

            {/* Column Card Container */}
            <div 
              style={{
                padding: "1rem",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem",
                flexGrow: 1
              }}
            >
              {columnTickets.length === 0 ? (
                <div 
                  style={{
                    padding: "2rem 1rem",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: "13px",
                    border: "1px dashed var(--border-glass)",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.01)"
                  }}
                >
                  No items in this stage
                </div>
              ) : (
                columnTickets.map((ticket) => {
                  const cust = ticket.customer;
                  const clientName = cust?.companyName || cust?.contactPerson || ticket.customerName || "Walk-in Customer";
                  const contactPerson = cust?.companyName ? cust.contactPerson : null;
                  const stageData = parseStageData(ticket.stageData);
                  
                  return (
                    <div 
                      key={ticket.id}
                      className="kanban-card card-glow"
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-glass)",
                        borderRadius: "12px",
                        padding: "1.1rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.8rem",
                        position: "relative",
                        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                        cursor: "pointer"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.borderColor = "var(--border-focus)";
                        e.currentTarget.style.boxShadow = "var(--shadow-glow)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.borderColor = "var(--border-glass)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {/* Top Row: Ticket Tag and Urgency */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span 
                          style={{
                            fontSize: "11px",
                            fontWeight: "800",
                            color: "var(--accent)",
                            background: "rgba(163, 230, 53, 0.1)",
                            padding: "2px 8px",
                            borderRadius: "4px"
                          }}
                        >
                          {ticket.ticketNumber || ticket.jobNumber}
                        </span>
                        
                        {stageData.urgency && (
                          <span 
                            style={{
                              fontSize: "10px",
                              fontWeight: "800",
                              textTransform: "uppercase",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              ...getUrgencyColor(stageData.urgency)
                            }}
                          >
                            {stageData.urgency}
                          </span>
                        )}
                      </div>

                      {/* Customer Info */}
                      <div>
                        <h4 
                          style={{
                            fontSize: "14px",
                            fontWeight: "700",
                            color: "var(--text-primary)",
                            margin: "0 0 3px 0",
                            lineHeight: "1.3"
                          }}
                        >
                          {clientName}
                        </h4>
                        {contactPerson && (
                          <div style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "5px" }}>
                            <User size={12} />
                            <span>{contactPerson}</span>
                          </div>
                        )}
                      </div>

                      {/* Equipment parameters (Cylinder detail) */}
                      {(ticket.serialNumber || ticket.extinguisherType) && (
                        <div 
                          style={{
                            padding: "8px 10px",
                            background: "var(--bg-input)",
                            borderRadius: "8px",
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                            border: "1px solid rgba(255, 255, 255, 0.03)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "3px"
                          }}
                        >
                          {ticket.extinguisherType && (
                            <div>
                              <strong>Type:</strong> {ticket.extinguisherType} {ticket.capacity ? `(${ticket.capacity})` : ""}
                            </div>
                          )}
                          {ticket.serialNumber && (
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <strong>S/N:</strong> <code style={{ color: "#a3e635" }}>{ticket.serialNumber}</code>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Dynamic Stage details (e.g. pressure test check or weight logs) */}
                      {stageName === "REFILLING" && stageData.grossWeight && (
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          ⚡ Gross: <strong>{stageData.grossWeight}kg</strong> | Gas: <strong>{stageData.refillMediumQty}kg</strong>
                        </div>
                      )}
                      
                      {stageName === "SERVICES" && stageData.serviceType && (
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          🔧 Service Done: <strong>{stageData.serviceType}</strong>
                        </div>
                      )}

                      {/* Date & Location */}
                      <div 
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          fontSize: "11.5px",
                          color: "var(--text-muted)",
                          borderTop: "1px solid var(--border-glass)",
                          paddingTop: "8px",
                          marginTop: "2px"
                        }}
                      >
                        {ticket.requirementCategory && (
                          <div style={{ fontWeight: "600", color: "var(--text-secondary)" }}>
                            Category: {ticket.requirementCategory}
                          </div>
                        )}
                        
                        {(ticket.requestedDeliveryDate || ticket.followUpDate || ticket.visitDate) && (
                          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <Calendar size={12} />
                            <span>
                              {new Date(
                                ticket.requestedDeliveryDate || ticket.followUpDate || ticket.visitDate
                              ).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        )}

                        {ticket.customerLocation && (
                          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <MapPin size={12} />
                            <span 
                              style={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "230px"
                              }}
                            >
                              {ticket.customerLocation}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Assigned Technicians list */}
                      {ticket.assignments && ticket.assignments.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
                          <span style={{ fontSize: "10.5px", color: "var(--text-muted)", marginRight: "4px" }}>Techs:</span>
                          {ticket.assignments.map((asg: any) => (
                            <span 
                              key={asg.id} 
                              title={asg.technician?.fullName}
                              style={{
                                fontSize: "10px",
                                background: "rgba(192, 132, 252, 0.15)",
                                color: "#c084fc",
                                padding: "2px 6px",
                                borderRadius: "9999px",
                                fontWeight: "600"
                              }}
                            >
                              {asg.technician?.fullName.split(" ")[0]}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action buttons (Edit / Assign / Delete) */}
                      <div 
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "8px",
                          borderTop: "1px solid var(--border-glass)",
                          paddingTop: "8px",
                          marginTop: "2px"
                        }}
                      >
                        {onAssign && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAssign(ticket);
                            }}
                            title="Assign technicians"
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--text-secondary)",
                              cursor: "pointer",
                              padding: "4px",
                              borderRadius: "4px",
                              display: "flex",
                              alignItems: "center"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent)"}
                            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
                          >
                            <UserPlus size={14} />
                          </button>
                        )}
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(ticket);
                          }}
                          title="Edit details"
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-secondary)",
                            cursor: "pointer",
                            padding: "4px",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent)"}
                          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
                        >
                          <Edit2 size={14} />
                        </button>

                        {onDelete && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(ticket);
                            }}
                            title="Delete"
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--text-secondary)",
                              cursor: "pointer",
                              padding: "4px",
                              borderRadius: "4px",
                              display: "flex",
                              alignItems: "center"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
