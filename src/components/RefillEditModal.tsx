"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp, Zap, Calendar, MessageSquare, Settings } from "lucide-react";

interface FollowUp {
  id: string;
  remarks: string;
  createdAt: string;
}

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
  amcYears: number | null;
  amcDate: string | null;
  followUpDate: string | null;
  stageData?: string | null;
  followUps: FollowUp[];
  serialNumber?: string | null;
  capacity?: string | null;
  extinguisherType?: string | null;
  itemDescription?: string | null;
}

interface RefillEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJob: Job;
  config: any;
  onSuccess: () => void;
  onError: (err: string) => void;
}

export default function RefillEditModal({
  isOpen,
  onClose,
  selectedJob,
  config,
  onSuccess,
  onError,
}: RefillEditModalProps) {
  // Accordion state — only one section open at a time
  const [activeSection, setActiveSection] = useState<string | null>("status");
  const toggleSection = (key: string) => setActiveSection(prev => prev === key ? null : key);

  // Form Fields
  const [serialNumber, setSerialNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [extinguisherType, setExtinguisherType] = useState("");
  const [itemDescription, setItemDescription] = useState("");

  const [deliveredDate, setDeliveredDate] = useState("");
  const [amcYears, setAmcYears] = useState("1");
  const [calculatedAmcDate, setCalculatedAmcDate] = useState("");
  const [currentStatus, setCurrentStatus] = useState("Refilling Order Received");

  const [followUpDate, setFollowUpDate] = useState("");
  const [newRemarks, setNewRemarks] = useState("");
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (selectedJob) {
      setSerialNumber(selectedJob.serialNumber || "");
      setCapacity(selectedJob.capacity || "");
      setExtinguisherType(selectedJob.extinguisherType || "");
      setItemDescription(selectedJob.itemDescription || "");

      setDeliveredDate(selectedJob.deliveredDate ? selectedJob.deliveredDate.split("T")[0] : "");
      setAmcYears(String(selectedJob.amcYears || 1));
      setCalculatedAmcDate(selectedJob.amcDate ? selectedJob.amcDate.split("T")[0] : "");
      setCurrentStatus(selectedJob.currentStatus || "Refilling Order Received");

      setFollowUpDate(selectedJob.followUpDate ? selectedJob.followUpDate.split("T")[0] : "");
      setNewRemarks("");

      let parsedStageData: Record<string, any> = {};
      if (selectedJob.stageData) {
        try {
          parsedStageData = JSON.parse(selectedJob.stageData);
        } catch (e) {}
      }
      setCustomFieldsData(parsedStageData);

      setActiveSection("status");
    }
  }, [selectedJob]);

  // Recalculate AMC date dynamically
  useEffect(() => {
    if (deliveredDate && amcYears) {
      const delDateObj = new Date(deliveredDate);
      if (!isNaN(delDateObj.getTime())) {
        const yearsNum = parseInt(amcYears, 10);
        delDateObj.setFullYear(delDateObj.getFullYear() + yearsNum);
        setCalculatedAmcDate(delDateObj.toISOString().split("T")[0]);
      } else {
        setCalculatedAmcDate("");
      }
    } else {
      setCalculatedAmcDate("");
    }
  }, [deliveredDate, amcYears]);

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

    try {
      const res = await fetch(`/api/jobs/${selectedJob.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveredDate: deliveredDate || null,
          amcYears: parseInt(amcYears, 10),
          currentStatus,
          followUpDate: followUpDate || null,
          newRemarks: newRemarks.trim() || null,
          stageData: customFieldsData,
          serialNumber: serialNumber || null,
          capacity: capacity || null,
          extinguisherType: extinguisherType || null,
          itemDescription: itemDescription || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update refilling details");

      onSuccess();
    } catch (err: any) {
      onError(err.message || "Failed to update details");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="slide-over-backdrop modal-animate-backdrop" style={{ zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="slide-over-card theme-modal-card modal-animate-card" style={{ maxWidth: "600px", maxHeight: "95%", position: "relative" }}>
        <div className="modal-header-accent-bar" />
        
        <div className="slide-over-header theme-modal-card-header">
          <h2 style={{ fontSize: "17px", margin: 0, fontWeight: "bold", color: "var(--text-primary)" }}>Edit Refilling Details: <span style={{ color: "var(--accent)" }}>{selectedJob.jobNumber}</span></h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center" }}><X size={18} /></button>
        </div>

        <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div style={{ padding: "20px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* Card 1: Customer Information */}
            <div className="modal-section-card">
              <div 
                onClick={() => toggleSection("customer")}
                className="modal-section-header"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Zap size={16} style={{ color: "var(--accent)" }} />
                  <span style={{ fontWeight: "600", fontSize: "13px", color: "var(--text-primary)" }}>Customer & Site Information</span>
                </div>
                {activeSection === "customer" ? <ChevronUp size={14} style={{ color: "var(--text-primary)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-primary)" }} />}
              </div>

              {activeSection === "customer" && (
                <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--border-glass)" }}>
                  <div className="responsive-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Company / client</label>
                      <input type="text" value={selectedJob.customer?.companyName || "N/A"} readOnly className="theme-input-disabled" style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-secondary)" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Contact Person</label>
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

            {/* Card 2: Equipment / Cylinder Details */}
            <div className="modal-section-card">
              <div 
                onClick={() => toggleSection("equipment")}
                className="modal-section-header"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Zap size={16} style={{ color: "#a855f7" }} />
                  <span style={{ fontWeight: "600", fontSize: "13px", color: "var(--text-primary)" }}>Item & Equipment Specifications</span>
                </div>
                {activeSection === "equipment" ? <ChevronUp size={14} style={{ color: "var(--text-primary)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-primary)" }} />}
              </div>

              {activeSection === "equipment" && (
                <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--border-glass)" }}>
                  <div className="responsive-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>{config?.brand?.labels?.serialNumber || "Cylinder Tag / Serial No"}</label>
                      <input type="text" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} placeholder="e.g. CYL-99823" style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-primary)" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>{config?.brand?.labels?.extinguisherType || "Extinguisher Type"}</label>
                      <select value={extinguisherType} onChange={e => setExtinguisherType(e.target.value)} style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-primary)" }}>
                        <option value="">Select Type</option>
                        <option value="CO2">CO2</option>
                        <option value="DCP">DCP</option>
                        <option value="Water">Water</option>
                        <option value="Foam">Foam</option>
                        <option value="Clean Agent">Clean Agent</option>
                      </select>
                    </div>
                  </div>
                  <div className="responsive-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>{config?.brand?.labels?.capacity || "Cylinder Capacity"}</label>
                      <input type="text" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="e.g. 2 Kg, 9 Kg" style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-primary)" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>{config?.brand?.labels?.itemDescription || "Item Description"}</label>
                      <input type="text" value={itemDescription} onChange={e => setItemDescription(e.target.value)} placeholder="e.g. Model X-100" style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-primary)" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Card 3: Refilling Status & AMC Dates */}
            <div className="modal-section-card">
              <div 
                onClick={() => toggleSection("status")}
                className="modal-section-header"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Calendar size={16} style={{ color: "var(--accent)" }} />
                  <span style={{ fontWeight: "600", fontSize: "13px", color: "var(--text-primary)" }}>Refilling Status & AMC Dates</span>
                </div>
                {activeSection === "status" ? <ChevronUp size={14} style={{ color: "var(--text-primary)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-primary)" }} />}
              </div>

              {activeSection === "status" && (
                <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--border-glass)" }}>
                  <div className="responsive-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>{config?.brand?.labels?.deliveredDate || "Delivered Date"}*</label>
                      <input type="date" value={deliveredDate} onChange={e => setDeliveredDate(e.target.value)} required style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-primary)" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>{config?.brand?.labels?.amcYears || "No. of Years"}*</label>
                      <select value={amcYears} onChange={e => setAmcYears(e.target.value)} required style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-primary)" }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(y => (
                          <option key={y} value={String(y)}>{y} {y === 1 ? "Year" : "Years"}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="responsive-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>{config?.brand?.labels?.amcDate || "Next Refilling Date (Calculated)"}*</label>
                      <input type="date" value={calculatedAmcDate} readOnly style={{ width: "100%", padding: "7px", borderRadius: "6px", color: "#10b981", fontWeight: "bold", cursor: "not-allowed", background: "var(--bg-input)", border: "1px solid var(--border-glass)" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Current Refilling Status*</label>
                      <select value={currentStatus} onChange={e => setCurrentStatus(e.target.value)} required style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-primary)" }}>
                        <option value="Refilling Order Received">Refilling Order Received</option>
                        <option value="Quotation Sent">Quotation Sent</option>
                        <option value="Follow-up In Progress">Follow-up In Progress</option>
                        <option value="Order Confirmed">Order Confirmed</option>
                        <option value="Order Delivered">Order Delivered</option>
                        <option value="Order Dropped">Order Dropped</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Card 4: Requirement Notes Context */}
            {selectedJob.requirementDetails && (
              <div className="modal-section-card">
                <div className="modal-section-header" style={{ cursor: "default" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <MessageSquare size={16} style={{ color: "var(--accent)" }} />
                    <span style={{ fontWeight: "600", fontSize: "13px", color: "var(--text-primary)" }}>Original Enquiry Context</span>
                  </div>
                </div>
                <div style={{ padding: "12px", borderTop: "1px solid var(--border-glass)" }}>
                  <textarea value={selectedJob.requirementDetails} readOnly className="theme-input-disabled" rows={2} style={{ width: "100%", padding: "7px", borderRadius: "6px", resize: "none", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-secondary)", fontFamily: "inherit" }} />
                </div>
              </div>
            )}

            {/* Card 5: Follow Up */}
            <div className="modal-section-card">
              <div 
                onClick={() => toggleSection("followup")}
                className="modal-section-header"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <MessageSquare size={16} style={{ color: "var(--accent)" }} />
                  <span style={{ fontWeight: "600", fontSize: "13px", color: "var(--text-primary)" }}>Follow Up Notes</span>
                </div>
                {activeSection === "followup" ? <ChevronUp size={14} style={{ color: "var(--text-primary)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-primary)" }} />}
              </div>

              {activeSection === "followup" && (
                <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--border-glass)" }}>
                  <div>
                    <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Scheduled Follow-up Date</label>
                    <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-primary)" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Add Remarks / New Note</label>
                    <textarea value={newRemarks} onChange={e => setNewRemarks(e.target.value)} rows={3} placeholder="Add follow-up notes updates here..." style={{ width: "100%", padding: "7px", borderRadius: "6px", resize: "none", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-primary)", fontFamily: "inherit" }} />
                  </div>
                  
                  <div style={{ marginTop: "5px" }}>
                    <h4 style={{ fontSize: "12px", fontWeight: "bold", borderBottom: "1px solid var(--border-glass)", paddingBottom: "4px", marginBottom: "6px" }}>Followup History</h4>
                    <div style={{ maxHeight: "150px", overflowY: "auto", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      {selectedJob.followUps.length === 0 ? (
                        <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>No prior follow-up history logs.</div>
                      ) : (
                        selectedJob.followUps.map(f => (
                          <div key={f.id} style={{ fontSize: "12px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "4px" }}>
                            <span style={{ color: "var(--accent)", fontWeight: "500" }}>{formatDate(f.createdAt)}</span>: {f.remarks}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Fields in Edit modal */}
            {config?.stages?.REFILLING?.fields && config.stages.REFILLING.fields.length > 0 && (
              <div className="modal-section-card">
                <div 
                  onClick={() => toggleSection("customfields")}
                  className="modal-section-header"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Settings size={16} style={{ color: "var(--accent)" }} />
                    <span style={{ fontWeight: "600", fontSize: "13px", color: "var(--text-primary)" }}>Custom Fields</span>
                  </div>
                  {activeSection === "customfields" ? <ChevronUp size={14} style={{ color: "var(--text-primary)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-primary)" }} />}
                </div>

                {activeSection === "customfields" && (
                  <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--border-glass)" }}>
                    {config.stages.REFILLING.fields.map((field: any) => {
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
                            <select value={val} onChange={e => onChange(e.target.value)} required={field.required} style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-primary)" }}>
                              <option value="">SELECT</option>
                              {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          ) : field.type === "multi-select" ? (
                            <input type="text" value={val} onChange={e => onChange(e.target.value)} placeholder="Comma-separated values" required={field.required} style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-primary)" }} />
                          ) : (
                            <input type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"} value={val} onChange={e => onChange(e.target.value)} required={field.required} style={{ width: "100%", padding: "7px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-primary)" }} />
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