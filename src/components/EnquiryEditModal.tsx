"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

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

interface Enquiry {
  id: string;
  jobNumber: string;
  customerId?: string | null;
  customer: Customer | null;
  currentStage?: string;
  currentStatus: string;
  requirementCategory: string | null;
  enquirySource: string | null;
  requirementDetails: string | null;
  requestedDeliveryDate: string | null;
  followUpDate: string | null;
  latestFollowUpNotes?: string | null;
  deliveredDate: string | null;
  amcYears: number | null;
  amcDate?: string | null;
  visitDate?: string | null;
  adminInstructions?: string | null;
  technicianInstructions?: string | null;
  customerLocation?: string | null;
  assignFor?: string | null;
  assignments?: any[];
  followUps: FollowUp[];
  stageData?: string | null;
  createdAt: string;
  enquiryDate?: string | null;
}

interface EnquiryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEnquiry: Enquiry;
  config: any;
  onSuccess: () => void;
  onError: (err: string) => void;
}

export default function EnquiryEditModal({
  isOpen,
  onClose,
  selectedEnquiry,
  config,
  onSuccess,
  onError,
}: EnquiryEditModalProps) {
  const [activeTab, setActiveTab] = useState<"client" | "requirement" | "status" | "followup" | "amc">("client");

  // Client Details fields
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [phone2, setPhone2] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // Requirement fields
  const [requirementCategory, setRequirementCategory] = useState("SELECT");
  const [enquirySource, setEnquirySource] = useState("SELECT");
  const [requirementDetails, setRequirementDetails] = useState("");
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, any>>({});

  // Status & Dates fields
  const [enquiryDate, setEnquiryDate] = useState("");
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState("");
  const [currentStatus, setCurrentStatus] = useState("Enquiry Registered");

  // Follow Up fields
  const [followUpDate, setFollowUpDate] = useState("");
  const [newRemarks, setNewRemarks] = useState("");

  // Delivery & AMC fields
  const [deliveredDate, setDeliveredDate] = useState("");
  const [amcYears, setAmcYears] = useState("1");
  const [calculatedAmcDate, setCalculatedAmcDate] = useState("");

  useEffect(() => {
    if (selectedEnquiry) {
      setCompanyName(selectedEnquiry.customer?.companyName || "");
      setContactPerson(selectedEnquiry.customer?.contactPerson || "");
      setPhone(selectedEnquiry.customer?.phone || "");
      setPhone2(selectedEnquiry.customer?.phone2 || "");
      setEmail(selectedEnquiry.customer?.email || "");
      setAddress(selectedEnquiry.customer?.address || "");

      setRequirementCategory(selectedEnquiry.requirementCategory || "SELECT");
      setEnquirySource(selectedEnquiry.enquirySource || "SELECT");
      setRequirementDetails(selectedEnquiry.requirementDetails || "");

      let parsedStageData: Record<string, any> = {};
      if (selectedEnquiry.stageData) {
        try {
          parsedStageData = JSON.parse(selectedEnquiry.stageData);
        } catch (e) {}
      }
      setCustomFieldsData(parsedStageData);

      const dateToUse = selectedEnquiry.enquiryDate || selectedEnquiry.createdAt || "";
      setEnquiryDate(dateToUse ? dateToUse.split("T")[0] : "");
      setRequestedDeliveryDate(selectedEnquiry.requestedDeliveryDate ? selectedEnquiry.requestedDeliveryDate.split("T")[0] : "");
      setCurrentStatus(selectedEnquiry.currentStatus || "Enquiry Registered");

      setFollowUpDate(selectedEnquiry.followUpDate ? selectedEnquiry.followUpDate.split("T")[0] : "");
      setNewRemarks("");

      setDeliveredDate(selectedEnquiry.deliveredDate ? selectedEnquiry.deliveredDate.split("T")[0] : "");
      setAmcYears(String(selectedEnquiry.amcYears || 1));
      
      setActiveTab("client");
    }
  }, [selectedEnquiry]);

  // Handle AMC Date recalculation
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
    return `${day}/${month}/${year}`;
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (requestedDeliveryDate && enquiryDate && new Date(requestedDeliveryDate) < new Date(enquiryDate)) {
      onError("Requested Delivery Date cannot be before the Enquiry Date");
      return;
    }

    try {
      const res = await fetch(`/api/jobs/${selectedEnquiry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          contactPerson,
          phone,
          phone2: phone2 || null,
          email: email || null,
          address,
          requirementCategory,
          enquirySource,
          requirementDetails,
          requestedDeliveryDate: requestedDeliveryDate || null,
          enquiryDate: enquiryDate || null,
          currentStatus,
          followUpDate: followUpDate || null,
          newRemarks: newRemarks.trim() || null,
          deliveredDate: deliveredDate || null,
          amcYears: parseInt(amcYears, 10),
          stageData: customFieldsData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update enquiry");

      onSuccess();
    } catch (err: any) {
      onError(err.message || "Failed to update enquiry");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="slide-over-backdrop modal-animate-backdrop" style={{ zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="slide-over-card theme-modal-card modal-animate-card" style={{ maxWidth: "660px", maxHeight: "95%", position: "relative" }}>
        <div className="modal-header-accent-bar" />
        
        {/* Modal Header */}
        <div className="slide-over-header theme-modal-card-header">
          <h2 style={{ fontSize: "18px", margin: 0, fontWeight: "bold", color: "var(--text-primary)" }}>Edit Enquiry: <span style={{ color: "var(--accent)" }}>{selectedEnquiry.jobNumber}</span></h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center" }}><X size={20} /></button>
        </div>

        {/* Tabs List */}
        <div style={{ display: "flex", gap: "6px", background: "rgba(0,0,0,0.3)", padding: "6px 12px", borderBottom: "1px solid var(--border-glass)", overflowX: "auto" }}>
          {(["client", "requirement", "status", "followup", "amc"] as const).map((tab) => {
            if (tab === "amc" && currentStatus !== "Order Delivered") return null;
            
            const labels = {
              client: "Client Details",
              requirement: "Requirement Info",
              status: "Enquiry Status & Dates",
              followup: "Follow Up",
              amc: "Delivery & AMC",
            };

            const isActive = activeTab === tab;

            return (
              <button 
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "8px 14px",
                  background: isActive ? "linear-gradient(135deg, var(--accent) 0%, #ff6b4a 100%)" : "transparent",
                  border: "none",
                  borderRadius: "8px",
                  color: isActive ? "var(--bg-dark)" : "var(--text-secondary)",
                  cursor: "pointer",
                  fontWeight: "700",
                  fontSize: "12.5px",
                  whiteSpace: "nowrap",
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: isActive ? "0 4px 12px rgba(163, 230, 53, 0.2)" : "none"
                }}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div style={{ padding: "20px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* 1. Client Details Tab */}
            {activeTab === "client" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Client / Company Name *</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} required style={{ width: "100%", padding: "8px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-primary)" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Contact Person Name *</label>
                    <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} required style={{ width: "100%", padding: "8px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-primary)" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Contact No 1 *</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required style={{ width: "100%", padding: "8px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-primary)" }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Contact No 2</label>
                    <input type="tel" value={phone2} onChange={e => setPhone2(e.target.value)} style={{ width: "100%", padding: "8px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-primary)" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Email ID</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%", padding: "8px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-primary)" }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Address *</label>
                  <textarea value={address} onChange={e => setAddress(e.target.value)} required rows={3} style={{ width: "100%", padding: "8px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-primary)", resize: "none", fontFamily: "inherit" }} />
                </div>
              </div>
            )}

            {/* 2. Requirement Info Tab */}
            {activeTab === "requirement" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Requirement Category *</label>
                    <select value={requirementCategory} onChange={e => setRequirementCategory(e.target.value)} required style={{ width: "100%", padding: "8px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-primary)" }}>
                      <option value="SELECT">SELECT</option>
                      {(config?.categories || ["CCTV", "New Fire Extinguisher", "Refilling"]).map((cat: string) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Source of Enquiry *</label>
                    <select value={enquirySource} onChange={e => setEnquirySource(e.target.value)} required style={{ width: "100%", padding: "8px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-primary)" }}>
                      <option value="SELECT">SELECT</option>
                      {(config?.sources || ["Existing Customers", "Social Media", "Phone Call", "Walk-in", "Email Enquiry", "Field Agent", "Website"]).map((src: string) => (
                        <option key={src} value={src}>{src}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Requirement</label>
                  <textarea value={requirementDetails} onChange={e => setRequirementDetails(e.target.value)} rows={4} placeholder="Requirement details, item count, specifications..." style={{ width: "100%", padding: "8px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-primary)", resize: "none", fontFamily: "inherit" }} />
                </div>
                {/* Custom Fields in Edit modal */}
                {config?.stages?.ENQUIRY?.fields && config.stages.ENQUIRY.fields.length > 0 && (
                  <div style={{ marginTop: "15px", padding: "15px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px" }}>
                    <h3 style={{ fontSize: "12px", fontWeight: "bold", color: "var(--accent)", marginBottom: "12px" }}>Custom Fields</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {config.stages.ENQUIRY.fields.map((field: any) => {
                        const val = customFieldsData[field.key] ?? "";
                        const onChange = (newVal: any) => setCustomFieldsData({ ...customFieldsData, [field.key]: newVal });
                        return (
                          <div key={field.key}>
                            <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                              {field.label} {field.required ? "*" : ""}
                            </label>
                            {field.type === "boolean" ? (
                              <input type="checkbox" checked={!!val} onChange={e => onChange(e.target.checked)} style={{ accentColor: "var(--primary)", transform: "scale(1.1)", cursor: "pointer" }} />
                            ) : field.type === "select" ? (
                              <select value={val} onChange={e => onChange(e.target.value)} required={field.required} style={{ width: "100%", padding: "8px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-primary)" }}>
                                <option value="">SELECT</option>
                                {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            ) : field.type === "multi-select" ? (
                              <input type="text" value={val} onChange={e => onChange(e.target.value)} placeholder="Comma-separated values" required={field.required} style={{ width: "100%", padding: "8px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-primary)" }} />
                            ) : (
                              <input type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"} value={val} onChange={e => onChange(e.target.value)} required={field.required} style={{ width: "100%", padding: "8px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-primary)" }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. Enquiry Status & Dates Tab */}
            {activeTab === "status" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Enquiry Date *</label>
                    <input type="date" value={enquiryDate} onChange={e => setEnquiryDate(e.target.value)} required style={{ width: "100%", padding: "8px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-primary)" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Requested Delivery Date</label>
                    <input type="date" value={requestedDeliveryDate} onChange={e => setRequestedDeliveryDate(e.target.value)} style={{ width: "100%", padding: "8px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-primary)" }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Enquiry Status *</label>
                  <select value={currentStatus} onChange={e => setCurrentStatus(e.target.value)} required style={{ width: "100%", padding: "8px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-primary)" }}>
                    <option value="Enquiry Registered">Enquiry Registered</option>
                    <option value="Order Confirmed">Order Confirmed</option>
                    <option value="Order Delivered">Order Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "10px", lineHeight: "1.4" }}>
                    💡 Changing status updates task flow logic:
                    <br />• <b>Order Confirmed</b> enables the Assign Technicians button.
                    <br />• <b>Order Delivered</b> displays the Delivery & AMC setup tab.
                  </p>
                </div>
              </div>
            )}

            {/* 4. Follow Up Tab */}
            {activeTab === "followup" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Next Follow-up Date</label>
                  <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} style={{ width: "100%", padding: "8px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-primary)" }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>New Follow-up Notes / Remarks</label>
                  <textarea value={newRemarks} onChange={e => setNewRemarks(e.target.value)} rows={3} placeholder="Add follow-up notes updates here..." style={{ width: "100%", padding: "8px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-primary)", resize: "none", fontFamily: "inherit" }} />
                </div>

                <div style={{ marginTop: "10px" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid var(--border-glass)", paddingBottom: "6px", marginBottom: "8px" }}>Follow-up History</h4>
                  <div style={{ maxHeight: "150px", overflowY: "auto", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {selectedEnquiry.followUps.length === 0 ? (
                      <div style={{ color: "#718096", fontSize: "12px" }}>No prior follow-up history logs.</div>
                    ) : (
                      selectedEnquiry.followUps.map(f => (
                        <div key={f.id} style={{ fontSize: "12px", borderBottom: "1px solid #1a1a24", paddingBottom: "6px" }}>
                          <span style={{ color: "#ff4d80", fontWeight: "500" }}>{formatDate(f.createdAt)}</span>: {f.remarks}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 5. Delivery & AMC Tab */}
            {activeTab === "amc" && currentStatus === "Order Delivered" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Delivered Date</label>
                  <input type="date" value={deliveredDate} onChange={e => setDeliveredDate(e.target.value)} style={{ width: "100%", padding: "8px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-primary)" }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>No. of Years</label>
                  <select value={amcYears} onChange={e => setAmcYears(e.target.value)} style={{ width: "100%", padding: "8px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-primary)" }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(y => (
                      <option key={y} value={String(y)}>{y} {y === 1 ? "Year" : "Years"}</option>
                    ))}
                  </select>
                </div>
                <div style={{ background: "var(--bg-input)", border: "1px solid var(--border-glass)", padding: "12px", borderRadius: "6px", marginTop: "10px" }}>
                  <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", textTransform: "uppercase" }}>Calculated AMC Date</label>
                  <span style={{ fontSize: "18px", color: "#10b981", fontWeight: "bold", fontFamily: "monospace" }}>
                    {calculatedAmcDate ? formatDate(calculatedAmcDate) : "Please select Delivered Date"}
                  </span>
                </div>
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border-glass)", display: "flex", justifyContent: "flex-end", gap: "10px", background: "var(--bg-input)" }}>
            <button type="button" onClick={onClose} style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-secondary)", cursor: "pointer", fontWeight: "500", fontSize: "13px" }}>Cancel</button>
            <button type="submit" style={{ padding: "8px 16px", background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)", border: "none", borderRadius: "6px", color: "#ffffff", cursor: "pointer", fontWeight: "500", fontSize: "13px" }}>Update</button>
          </div>
        </form>
      </div>
    </div>
  );
}