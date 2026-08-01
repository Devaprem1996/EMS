"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface Technician {
  id: string;
  fullName: string | null;
  phone?: string | null;
  contactPhone?: string | null;
  role?: string;
}

interface Customer {
  id: string;
  companyName: string | null;
  contactPerson: string;
  phone: string;
  address: string | null;
}

interface Job {
  id: string;
  ticketNumber?: string;
  jobNumber?: string;
  customer: Customer | null;
  visitDate?: string | null;
  scheduledVisitDate?: string | null;
  adminInstructions?: string | null;
  adminNotes?: string | null;
  technicianInstructions?: string | null;
  technicianNotes?: string | null;
  customerLocation?: string | null;
  locationCoordinates?: string | null;
  assignments?: Array<{ id: string; technicianId: string }>;
}

interface AssignTechnicianModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJob: Job | null;
  technicians: Technician[];
  assignFor: "ENQUIRY" | "REFILLING" | "SERVICE";
  onSuccess: () => void;
  onError: (err: string) => void;
  isBulkAssign?: boolean;
  selectedJobIds?: string[];
}

export default function AssignTechnicianModal({
  isOpen,
  onClose,
  selectedJob,
  technicians,
  assignFor,
  onSuccess,
  onError,
  isBulkAssign = false,
  selectedJobIds = [],
}: AssignTechnicianModalProps) {
  const [assignVisitDate, setAssignVisitDate] = useState("");
  const [adminInstructions, setAdminInstructions] = useState("");
  const [technicianInstructions, setTechnicianInstructions] = useState("");
  const [customerLocation, setCustomerLocation] = useState("");
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);

  useEffect(() => {
    if (selectedJob) {
      const initialDate = selectedJob.visitDate || selectedJob.scheduledVisitDate;
      setAssignVisitDate(initialDate ? initialDate.split("T")[0] : "");
      
      setAdminInstructions(selectedJob.adminInstructions || selectedJob.adminNotes || "");
      setTechnicianInstructions(selectedJob.technicianInstructions || selectedJob.technicianNotes || "");
      setCustomerLocation(selectedJob.customerLocation || selectedJob.locationCoordinates || "");
      
      const activeTechIds = selectedJob.assignments?.map(a => a.technicianId) || [];
      setSelectedTechIds(activeTechIds);
    } else {
      setAssignVisitDate("");
      setAdminInstructions("");
      setTechnicianInstructions("");
      setCustomerLocation("");
      setSelectedTechIds([]);
    }
  }, [selectedJob, isOpen]);

  const handleTechToggle = (techId: string) => {
    setSelectedTechIds(prev =>
      prev.includes(techId) ? prev.filter(id => id !== techId) : [...prev, techId]
    );
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBulkAssign && !selectedJob) return;

    try {
      const url = isBulkAssign ? "/api/jobs/bulk-assign" : `/api/jobs/${selectedJob!.id}/assign`;
      const payload = isBulkAssign
        ? {
            jobIds: selectedJobIds,
            technicianIds: selectedTechIds,
            visitDate: assignVisitDate || null,
            adminInstructions,
            technicianInstructions,
            customerLocation,
            assignFor,
          }
        : {
            visitDate: assignVisitDate || null,
            adminInstructions,
            technicianInstructions,
            customerLocation,
            technicianIds: selectedTechIds,
            assignFor,
          };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign technician");

      onSuccess();
    } catch (err: any) {
      onError(err.message || "Failed to assign technician");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="slide-over-backdrop modal-animate-backdrop" style={{ zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="slide-over-card theme-modal-card modal-animate-card" style={{ maxWidth: "600px", maxHeight: "95%", position: "relative" }}>
        <div className="modal-header-accent-bar" />
        
        <div className="slide-over-header theme-modal-card-header">
          <h2 style={{ fontSize: "17px", margin: 0, fontWeight: "bold", color: "var(--text-primary)" }}>
            {isBulkAssign ? `Bulk Assign (${selectedJobIds.length} Jobs)` : "Assign Technician"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center" }}><X size={18} /></button>
        </div>

        <form onSubmit={handleAssignSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div style={{ padding: "20px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* Client info summary */}
            {!isBulkAssign && selectedJob ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", background: "var(--bg-input)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
                <div>
                  <span style={{ fontSize: "10px", color: "var(--text-secondary)", display: "block" }}>CLIENT NAME</span>
                  <span style={{ fontSize: "12px", fontWeight: "bold" }}>{selectedJob.customer?.companyName || "N/A"}</span>
                </div>
                <div>
                  <span style={{ fontSize: "10px", color: "var(--text-secondary)", display: "block" }}>CONTACT PERSON</span>
                  <span style={{ fontSize: "12px" }}>{selectedJob.customer?.contactPerson || "N/A"}</span>
                </div>
                <div>
                  <span style={{ fontSize: "10px", color: "var(--text-secondary)", display: "block" }}>CONTACT NUMBER</span>
                  <span style={{ fontSize: "12px" }}>{selectedJob.customer?.phone || "N/A"}</span>
                </div>
              </div>
            ) : (
              <div style={{ background: "rgba(59, 130, 246, 0.15)", padding: "12px", borderRadius: "6px", border: "1px solid #3b82f6", color: "#60a5fa", fontSize: "13px" }}>
                ℹ️ You are assigning technicians to <b>{selectedJobIds.length}</b> selected jobs at once.
              </div>
            )}

            <div className="responsive-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-card)" }}>
                <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-card)", padding: "0 4px", fontSize: "11px", color: "var(--accent)", fontWeight: "600" }}>Visit/Service Date *</span>
                <input type="date" value={assignVisitDate} onChange={e => setAssignVisitDate(e.target.value)} required style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "var(--text-primary)", cursor: "pointer" }} />
              </div>
              <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-input)" }}>
                <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-input)", padding: "0 4px", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600" }}>Assign For</span>
                <input type="text" value={assignFor} readOnly style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "var(--text-secondary)", cursor: "not-allowed" }} />
              </div>
            </div>

            {!isBulkAssign && selectedJob && (
              <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-input)" }}>
                <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-input)", padding: "0 4px", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600" }}>Address</span>
                <textarea value={selectedJob.customer?.address || ""} readOnly rows={2} style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "var(--text-secondary)", cursor: "not-allowed", resize: "none", fontFamily: "inherit" }} />
              </div>
            )}

            <div className="responsive-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-card)" }}>
                <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-card)", padding: "0 4px", fontSize: "11px", color: "var(--accent)", fontWeight: "600" }}>Admin Instructions</span>
                <textarea value={adminInstructions} onChange={e => setAdminInstructions(e.target.value)} rows={2} style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "var(--text-primary)", resize: "none", fontFamily: "inherit" }} />
              </div>
              <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-card)" }}>
                <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-card)", padding: "0 4px", fontSize: "11px", color: "var(--accent)", fontWeight: "600" }}>Technician Instructions</span>
                <textarea value={technicianInstructions} onChange={e => setTechnicianInstructions(e.target.value)} rows={2} style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "var(--text-primary)", resize: "none", fontFamily: "inherit" }} />
              </div>
            </div>

            <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-card)" }}>
              <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-card)", padding: "0 4px", fontSize: "11px", color: "var(--accent)", fontWeight: "600" }}>Customer Location</span>
              <input type="text" value={customerLocation} onChange={e => setCustomerLocation(e.target.value)} placeholder="Coordinates or URL..." style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "var(--text-primary)" }} />
            </div>

            <div>
              <label style={{ fontSize: "11px", color: "var(--accent)", display: "block", marginBottom: "6px", fontWeight: "bold" }}>Assign To (Technicians) *</label>
              <div style={{ background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "8px", maxHeight: "120px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
                {technicians.length === 0 ? (
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", padding: "4px" }}>No active technicians found.</div>
                ) : (
                  technicians.map(tech => (
                    <label key={tech.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", cursor: "pointer", color: "var(--text-primary)" }}>
                      <input
                        type="checkbox"
                        checked={selectedTechIds.includes(tech.id)}
                        onChange={() => handleTechToggle(tech.id)}
                        style={{ width: "15px", height: "15px", cursor: "pointer", accentColor: "var(--primary)" }}
                      />
                      <span>{tech.fullName} ({tech.phone || tech.contactPhone || "No phone"})</span>
                    </label>
                  ))
                )}
              </div>
              <p style={{ fontSize: "10px", color: "#ff6c37", marginTop: "6px", lineHeight: "1.3", marginBlockEnd: 0 }}>
                * Deselect existing technician (if any) for new assignment
                <br />* Delete existing assignment from technician view screen
              </p>
            </div>

          </div>

          <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border-glass)", display: "flex", justifyContent: "flex-end", gap: "10px", background: "var(--bg-input)" }}>
            <button type="button" onClick={onClose} style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-secondary)", cursor: "pointer", fontWeight: "500", fontSize: "13px" }}>Cancel</button>
            <button type="submit" style={{ padding: "8px 16px", background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)", border: "none", borderRadius: "6px", color: "#ffffff", cursor: "pointer", fontWeight: "500", fontSize: "13px" }}>Assign</button>
          </div>
        </form>
      </div>
    </div>
  );
}