"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp, Zap, Calendar, MessageSquare, Settings } from "lucide-react";

interface Customer {
  id: string;
  companyName: string | null;
  contactPerson: string;
  phone: string;
  phone2: string | null;
  email: string | null;
  address: string | null;
}

interface Job {
  id: string;
  jobNumber: string;
  customer: Customer | null;
  currentStatus: string;
  requirementDetails: string | null;
  deliveredDate: string | null;
  visitDate: string | null;
  stageData?: string | null;
  serialNumber?: string | null;
  capacity?: string | null;
  extinguisherType?: string | null;
  itemDescription?: string | null;
  amcYears?: number | null;
  amcDate?: string | null;
}

interface ServiceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJob: Job;
  config: any;
  onSuccess: () => void;
  onError: (err: string) => void;
}

export default function ServiceEditModal({
  isOpen,
  onClose,
  selectedJob,
  config,
  onSuccess,
  onError,
}: ServiceEditModalProps) {
  // Collapsible cards state
  const [isCustomerCardOpen, setIsCustomerCardOpen] = useState(true);
  const [isEquipmentCardOpen, setIsEquipmentCardOpen] = useState(true);
  const [isRequirementCardOpen, setIsRequirementCardOpen] = useState(true);
  const [isStatusCardOpen, setIsStatusCardOpen] = useState(true);
  const [isCustomFieldsCardOpen, setIsCustomFieldsCardOpen] = useState(true);

  // Form Fields
  const [visitDate, setVisitDate] = useState("");
  const [currentStatus, setCurrentStatus] = useState("Pending");
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (selectedJob) {
      setVisitDate(selectedJob.visitDate ? selectedJob.visitDate.split("T")[0] : "");
      setCurrentStatus(selectedJob.currentStatus === "Pending Service" ? "Pending" : (selectedJob.currentStatus || "Pending"));

      let parsedStageData: Record<string, any> = {};
      if (selectedJob.stageData) {
        try {
          parsedStageData = JSON.parse(selectedJob.stageData);
        } catch (e) {}
      }
      setCustomFieldsData(parsedStageData);

      setIsCustomerCardOpen(true);
      setIsEquipmentCardOpen(true);
      setIsRequirementCardOpen(true);
      setIsStatusCardOpen(true);
      setIsCustomFieldsCardOpen(true);
    }
  }, [selectedJob]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStatus === "Select") {
      onError("Please select a valid Service Status");
      return;
    }

    try {
      const res = await fetch(`/api/jobs/${selectedJob.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitDate: visitDate || null,
          currentStatus,
          stageData: customFieldsData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update service details");

      onSuccess();
    } catch (err: any) {
      onError(err.message || "Failed to update details");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="slide-over-backdrop" style={{ zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="slide-over-card theme-modal-card" style={{ maxWidth: "600px", maxHeight: "95%" }}>
        
        <div className="slide-over-header theme-modal-card-header">
          <h2 style={{ fontSize: "17px", margin: 0, fontWeight: "bold", color: "#fff" }}>Edit Service Details: <span style={{ color: "var(--accent)" }}>{selectedJob.jobNumber}</span></h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center" }}><X size={18} /></button>
        </div>

        <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div style={{ padding: "20px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* Card 1: Customer Information */}
            <div style={{ border: "1px solid var(--border-glass)", borderRadius: "8px", overflow: "hidden" }}>
              <div 
                onClick={() => setIsCustomerCardOpen(!isCustomerCardOpen)}
                style={{ padding: "10px 12px", background: "var(--bg-input)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Zap size={16} style={{ color: "var(--accent)" }} />
                  <span style={{ fontWeight: "600", fontSize: "13px", color: "var(--text-primary)" }}>Customer & Site Information</span>
                </div>
                {isCustomerCardOpen ? <ChevronUp size={14} style={{ color: "var(--text-primary)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-primary)" }} />}
              </div>

              {isCustomerCardOpen && (
                <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--border-glass)" }}>
                  <div className="responsive-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Client (Company Name)</label>
                      <input type="text" value={selectedJob.customer?.companyName || "N/A"} readOnly className="theme-input-disabled" style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-secondary)" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Contact Person Name</label>
                      <input type="text" value={selectedJob.customer?.contactPerson || "N/A"} readOnly className="theme-input-disabled" style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-secondary)" }} />
                    </div>
                  </div>
                  <div className="responsive-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Contact Phone 1</label>
                      <input type="text" value={selectedJob.customer?.phone || ""} readOnly className="theme-input-disabled" style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-secondary)" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Contact Phone 2</label>
                      <input type="text" value={selectedJob.customer?.phone2 || "N/A"} readOnly className="theme-input-disabled" style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-secondary)" }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Email Address</label>
                    <input type="text" value={selectedJob.customer?.email || "N/A"} readOnly className="theme-input-disabled" style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-secondary)" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Site Address</label>
                    <textarea value={selectedJob.customer?.address || "No site address logged."} readOnly className="theme-input-disabled" rows={2} style={{ width: "100%", padding: "7px", borderRadius: "6px", resize: "none", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-secondary)", fontFamily: "inherit" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Equipment & AMC Context */}
            <div style={{ border: "1px solid var(--border-glass)", borderRadius: "8px", overflow: "hidden" }}>
              <div 
                onClick={() => setIsEquipmentCardOpen(!isEquipmentCardOpen)}
                style={{ padding: "10px 12px", background: "var(--bg-input)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Calendar size={16} style={{ color: "var(--accent)" }} />
                  <span style={{ fontWeight: "600", fontSize: "13px", color: "var(--text-primary)" }}>Equipment & AMC Reference</span>
                </div>
                {isEquipmentCardOpen ? <ChevronUp size={14} style={{ color: "var(--text-primary)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-primary)" }} />}
              </div>

              {isEquipmentCardOpen && (
                <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--border-glass)" }}>
                  <div className="responsive-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>{config?.brand?.labels?.serialNumber || "Cylinder Serial No"}</label>
                      <input type="text" value={selectedJob.serialNumber || "N/A"} readOnly className="theme-input-disabled" style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-secondary)" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>{config?.brand?.labels?.extinguisherType || "Extinguisher Type"}</label>
                      <input type="text" value={selectedJob.extinguisherType || "N/A"} readOnly className="theme-input-disabled" style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-secondary)" }} />
                    </div>
                  </div>
                  <div className="responsive-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>{config?.brand?.labels?.capacity || "Cylinder Capacity"}</label>
                      <input type="text" value={selectedJob.capacity || "N/A"} readOnly className="theme-input-disabled" style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-secondary)" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>{config?.brand?.labels?.deliveredDate || "Delivered Date"}</label>
                      <input type="text" value={selectedJob.deliveredDate ? formatDate(selectedJob.deliveredDate) : "N/A"} readOnly className="theme-input-disabled" style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-secondary)" }} />
                    </div>
                  </div>
                  <div className="responsive-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>{config?.brand?.labels?.amcYears || "AMC Years Coverage"}</label>
                      <input type="text" value={selectedJob.amcYears ? `${selectedJob.amcYears} Year(s)` : "N/A"} readOnly className="theme-input-disabled" style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-secondary)" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>{config?.brand?.labels?.amcDate || "AMC Renewal Date"}</label>
                      <input type="text" value={selectedJob.amcDate ? formatDate(selectedJob.amcDate) : "N/A"} readOnly className="theme-input-disabled" style={{ width: "100%", padding: "7px", borderRadius: "6px", color: "#10b981", fontWeight: "bold", background: "var(--bg-input)", border: "1px solid var(--border-glass)" }} />
                    </div>
                  </div>
                  {selectedJob.itemDescription && (
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>{config?.brand?.labels?.itemDescription || "Item Description"}</label>
                      <input type="text" value={selectedJob.itemDescription} readOnly className="theme-input-disabled" style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-secondary)" }} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Card 3: Original Requirement Context */}
            {selectedJob.requirementDetails && (
              <div style={{ border: "1px solid var(--border-glass)", borderRadius: "8px", overflow: "hidden" }}>
                <div 
                  onClick={() => setIsRequirementCardOpen(!isRequirementCardOpen)}
                  style={{ padding: "10px 12px", background: "var(--bg-input)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <MessageSquare size={16} style={{ color: "var(--accent)" }} />
                    <span style={{ fontWeight: "600", fontSize: "13px", color: "var(--text-primary)" }}>Original Enquiry Context</span>
                  </div>
                  {isRequirementCardOpen ? <ChevronUp size={14} style={{ color: "var(--text-primary)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-primary)" }} />}
                </div>
                {isRequirementCardOpen && (
                  <div style={{ padding: "12px", borderTop: "1px solid var(--border-glass)" }}>
                    <textarea value={selectedJob.requirementDetails} readOnly className="theme-input-disabled" rows={2} style={{ width: "100%", padding: "7px", borderRadius: "6px", resize: "none", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-secondary)", fontFamily: "inherit" }} />
                  </div>
                )}
              </div>
            )}

            {/* Card 4: Service Schedule & Status */}
            <div style={{ border: "1px solid var(--border-glass)", borderRadius: "8px", overflow: "hidden" }}>
              <div 
                onClick={() => setIsStatusCardOpen(!isStatusCardOpen)}
                style={{ padding: "10px 12px", background: "var(--bg-input)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Calendar size={16} style={{ color: "var(--accent)" }} />
                  <span style={{ fontWeight: "600", fontSize: "13px", color: "var(--text-primary)" }}>Service Schedule & Status</span>
                </div>
                {isStatusCardOpen ? <ChevronUp size={14} style={{ color: "var(--text-primary)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-primary)" }} />}
              </div>

              {isStatusCardOpen && (
                <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--border-glass)" }}>
                  <div className="responsive-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Service Date*</label>
                      <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} required style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "#111116", border: "1px solid #2d2d3a", color: "#fff" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Service Status*</label>
                      <select value={currentStatus} onChange={e => setCurrentStatus(e.target.value)} required style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "#111116", border: "1px solid #2d2d3a", color: "#fff" }}>
                        <option value="Select">Select</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Fields in Edit modal */}
            {config?.stages?.SERVICES?.fields && config.stages.SERVICES.fields.length > 0 && (
              <div style={{ border: "1px solid var(--border-glass)", borderRadius: "8px", overflow: "hidden" }}>
                <div 
                  onClick={() => setIsCustomFieldsCardOpen(!isCustomFieldsCardOpen)}
                  style={{ padding: "10px 12px", background: "var(--bg-input)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Settings size={16} style={{ color: "var(--accent)" }} />
                    <span style={{ fontWeight: "600", fontSize: "13px", color: "var(--text-primary)" }}>Custom Fields</span>
                  </div>
                  {isCustomFieldsCardOpen ? <ChevronUp size={14} style={{ color: "var(--text-primary)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-primary)" }} />}
                </div>

                {isCustomFieldsCardOpen && (
                  <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--border-glass)" }}>
                    {config.stages.SERVICES.fields.map((field: any) => {
                      const val = customFieldsData[field.key] ?? "";
                      const onChange = (newVal: any) => setCustomFieldsData({ ...customFieldsData, [field.key]: newVal });
                      return (
                        <div key={field.key}>
                          <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>
                            {field.label} {field.required ? "*" : ""}
                          </label>
                          {field.type === "boolean" ? (
                            <input type="checkbox" checked={!!val} onChange={e => onChange(e.target.checked)} style={{ accentColor: "var(--primary)", transform: "scale(1.1)", cursor: "pointer" }} />
                          ) : field.type === "select" ? (
                            <select value={val} onChange={e => onChange(e.target.value)} required={field.required} style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "#111116", border: "1px solid #2d2d3a", color: "#fff" }}>
                              <option value="">SELECT</option>
                              {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          ) : field.type === "multi-select" ? (
                            <input type="text" value={val} onChange={e => onChange(e.target.value)} placeholder="Comma-separated values" required={field.required} style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "#111116", border: "1px solid #2d2d3a", color: "#fff" }} />
                          ) : (
                            <input type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"} value={val} onChange={e => onChange(e.target.value)} required={field.required} style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "#111116", border: "1px solid #2d2d3a", color: "#fff" }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border-glass)", display: "flex", justifyContent: "flex-end", gap: "10px", background: "var(--bg-input)" }}>
            <button type="button" onClick={onClose} style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-secondary)", cursor: "pointer", fontWeight: "500", fontSize: "13px" }}>Cancel</button>
            <button type="submit" style={{ padding: "8px 16px", background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)", border: "none", borderRadius: "6px", color: "#ffffff", cursor: "pointer", fontWeight: "500", fontSize: "13px" }}>Update Details</button>
          </div>
        </form>
      </div>
    </div>
  );
}