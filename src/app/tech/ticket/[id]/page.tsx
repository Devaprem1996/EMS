"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Clock, MapPin, Phone, Check } from "lucide-react";
import Link from "next/link";

export default function TicketExecutionView() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // In a real app, we'd have a specific GET /api/tech/ticket/[id] route
    // For this prototype, we'll simulate the fetch or fetch from a generic endpoint
    // We can just fetch the ticket directly since we know the ID, but we need the assignment ID too.
    const fetchTicket = async () => {
      try {
        const res = await fetch(`/api/jobs/${ticketId}`);
        if (res.ok) {
          const data = await res.json();
          // Find the active assignment for the current user
          // For simplicity in the UI, we'll just bind the data
          setAssignment({ ticket: data, notes: data.technicianNotes || "" });
          setNotes(data.technicianNotes || "");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [ticketId]);

  const handleComplete = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          currentStatus: "COMPLETED",
          technicianNotes: notes
        })
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/tech"), 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: "20px", textAlign: "center" }}>Loading task details...</div>;
  if (!assignment || !assignment.ticket) return <div style={{ padding: "20px", textAlign: "center" }}>Task not found.</div>;

  const { ticket } = assignment;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Link href="/tech" style={{ color: "var(--text-secondary)", textDecoration: "none", display: "flex", alignItems: "center" }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
          {ticket.ticketNumber}
        </h1>
        <span style={{ marginLeft: "auto", background: ticket.currentStatus === "COMPLETED" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)", color: ticket.currentStatus === "COMPLETED" ? "#10b981" : "#f59e0b", padding: "4px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: "bold" }}>
          {ticket.currentStatus}
        </span>
      </div>

      {/* Customer Info */}
      <div style={{ background: "var(--bg-card-glass)", borderRadius: "12px", padding: "16px", border: "1px solid var(--border-glass)" }}>
        <h3 style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "0 0 10px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Customer Details</h3>
        {ticket.customer ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)" }}>
              {ticket.customer.companyName || ticket.customer.contactName}
            </div>
            {ticket.customer.address && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", color: "var(--text-secondary)", fontSize: "13px" }}>
                <MapPin size={16} style={{ color: "var(--accent)", flexShrink: 0, marginTop: "2px" }} />
                <span>{ticket.customer.address}</span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "13px" }}>
              <Phone size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />
              <a href={`tel:${ticket.customer.primaryPhone}`} style={{ color: "var(--accent)", textDecoration: "none", fontWeight: "500" }}>
                {ticket.customer.primaryPhone}
              </a>
            </div>
          </div>
        ) : (
          <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>No customer linked.</span>
        )}
      </div>

      {/* Task Details */}
      <div style={{ background: "var(--bg-card-glass)", borderRadius: "12px", padding: "16px", border: "1px solid var(--border-glass)" }}>
        <h3 style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "0 0 10px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Task Requirements</h3>
        <div style={{ fontSize: "15px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "10px" }}>
          {ticket.itemDescription || ticket.requirementCategory || "General Maintenance"}
        </div>
        
        {ticket.adminNotes && (
          <div style={{ background: "rgba(255,255,255,0.05)", padding: "10px", borderRadius: "8px", fontSize: "13px", color: "var(--text-secondary)", borderLeft: "3px solid var(--primary)", marginBottom: "10px" }}>
            <strong>Admin Note:</strong> {ticket.adminNotes}
          </div>
        )}
      </div>

      {/* Execution Form */}
      <div style={{ background: "var(--bg-card-glass)", borderRadius: "12px", padding: "16px", border: "1px solid var(--border-glass)" }}>
        <h3 style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "0 0 10px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Execution & Notes</h3>
        
        <textarea 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add completion notes, parts used, or issues found..."
          style={{ 
            width: "100%", 
            minHeight: "100px", 
            padding: "12px", 
            background: "var(--bg-input)", 
            border: "1px solid var(--border-glass)", 
            borderRadius: "8px", 
            color: "var(--text-primary)", 
            resize: "vertical",
            marginBottom: "15px",
            fontFamily: "inherit"
          }} 
          disabled={ticket.currentStatus === "COMPLETED"}
        />

        {success ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "14px", borderRadius: "8px", fontWeight: "bold" }}>
            <CheckCircle size={20} />
            Task Marked as Completed!
          </div>
        ) : (
          <button 
            onClick={handleComplete}
            disabled={saving || ticket.currentStatus === "COMPLETED"}
            style={{ 
              width: "100%", 
              padding: "14px", 
              background: ticket.currentStatus === "COMPLETED" ? "var(--bg-input)" : "var(--primary)", 
              color: ticket.currentStatus === "COMPLETED" ? "var(--text-secondary)" : "#fff", 
              border: "none", 
              borderRadius: "8px", 
              fontWeight: "600",
              fontSize: "15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              cursor: ticket.currentStatus === "COMPLETED" ? "not-allowed" : "pointer"
            }}
          >
            {saving ? "Saving..." : ticket.currentStatus === "COMPLETED" ? "Already Completed" : <><Check size={18} /> Mark Task Complete</>}
          </button>
        )}
      </div>
    </div>
  );
}
