"use client";

import React from "react";
import { ShieldCheck, History, X, UserCheck, Clock, Layers } from "lucide-react";

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
  clientName: string | null;
}

export default function AuditLogModal({ isOpen, onClose, jobId, clientName }: AuditLogModalProps) {
  if (!isOpen || !jobId) return null;

  // Sample Audit History entries for compliance tracking
  const mockAuditLogs = [
    {
      id: "1",
      action: "Status Updated to 'Order Delivered'",
      user: "Admin (Devaprem)",
      role: "ADMINISTRATOR",
      timestamp: new Date().toLocaleString(),
      ip: "192.168.1.45"
    },
    {
      id: "2",
      action: "Technician Assigned: 'Alex Rivera'",
      user: "System Dispatcher",
      role: "SYSTEM",
      timestamp: new Date(Date.now() - 3600000 * 2).toLocaleString(),
      ip: "192.168.1.1"
    },
    {
      id: "3",
      action: "Hydro-Test Result Logged: 99.2% Pressure Passed",
      user: "Alex Rivera",
      role: "TECHNICIAN",
      timestamp: new Date(Date.now() - 3600000 * 5).toLocaleString(),
      ip: "172.16.0.88"
    },
    {
      id: "4",
      action: "Job Record Created",
      user: "Admin (Devaprem)",
      role: "ADMINISTRATOR",
      timestamp: new Date(Date.now() - 3600000 * 24).toLocaleString(),
      ip: "192.168.1.45"
    }
  ];

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.85)",
      backdropFilter: "blur(12px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem"
    }}>
      <div style={{
        background: "#111116",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: "24px",
        width: "100%",
        maxWidth: "540px",
        padding: "1.5rem",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
        color: "#ffffff"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", padding: "8px", borderRadius: "12px" }}>
              <History size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", margin: 0 }}>Immutable Audit Trail Log</h3>
              <p style={{ fontSize: "0.75rem", color: "#a1a1aa", margin: 0 }}>Record #{jobId.substring(0, 8)} - {clientName}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#a1a1aa", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {/* Audit Timeline List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "340px", overflowY: "auto", paddingRight: "4px" }}>
          {mockAuditLogs.map((log, index) => (
            <div key={log.id} style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "14px",
              padding: "0.85rem 1rem",
              display: "flex",
              gap: "12px",
              alignItems: "flex-start"
            }}>
              <div style={{
                background: index === 0 ? "rgba(163, 230, 53, 0.15)" : "rgba(255,255,255,0.06)",
                color: index === 0 ? "#a3e635" : "#71717a",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <ShieldCheck size={16} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#ffffff", marginBottom: "2px" }}>
                  {log.action}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#a1a1aa", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <span>👤 {log.user} ({log.role})</span>
                  <span>🕒 {log.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: "1.25rem", textAlign: "right" }}>
          <button onClick={onClose} className="btn-secondary" style={{ fontSize: "0.85rem", borderRadius: "9999px", padding: "0.5rem 1.25rem" }}>
            Close Audit Log
          </button>
        </div>
      </div>
    </div>
  );
}
