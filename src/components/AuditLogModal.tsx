"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, History, X, Loader } from "lucide-react";

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
  clientName: string | null;
}

interface AuditLog {
  id: string;
  action: string;
  user: string;
  role: string;
  timestamp: string;
  remarks?: string;
}

export default function AuditLogModal({ isOpen, onClose, jobId, clientName }: AuditLogModalProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !jobId) return;

    async function fetchHistory() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/jobs/${jobId}/history`);
        if (!res.ok) throw new Error("Failed to load audit history");
        const data = await res.json();
        setLogs(data);
      } catch (err: any) {
        console.error("Error loading audit history:", err);
        setError(err.message || "Failed to load audit trail.");
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [isOpen, jobId]);

  if (!isOpen || !jobId) return null;

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
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
              <div className="spinner" style={{ width: "30px", height: "30px", borderWidth: "2px" }}></div>
            </div>
          ) : error ? (
            <div style={{ padding: "1.5rem", color: "#ef4444", fontSize: "0.85rem", textAlign: "center" }}>
              {error}
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: "2rem", color: "#a1a1aa", fontSize: "0.85rem", textAlign: "center" }}>
              No audit trail events recorded for this ticket yet.
            </div>
          ) : (
            logs.map((log, index) => (
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
                  <div style={{ fontSize: "0.75rem", color: "#a1a1aa", display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: log.remarks ? "4px" : "0" }}>
                    <span>👤 {log.user} ({log.role})</span>
                    <span>🕒 {log.timestamp}</span>
                  </div>
                  {log.remarks && (
                    <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", background: "rgba(255,255,255,0.02)", padding: "4px 8px", borderRadius: "6px", borderLeft: "2px solid var(--accent)" }}>
                      {log.remarks}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
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
