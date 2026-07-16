"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Edit2, 
  X, 
  Check, 
  AlertCircle,
  ExternalLink,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight
} from "lucide-react";

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
  currentStage: string;
  currentStatus: string;
  visitDate: string | null;
  adminInstructions: string | null;
  technicianInstructions: string | null;
  customerLocation: string | null;
  assignFor: string | null;
}

interface Assignment {
  id: string;
  jobId: string;
  technicianId: string;
  status: string;
  assignedAt: string;
  technician: {
    id: string;
    fullName: string;
    phone: string;
  };
  job: Job;
}

export default function TechnicianTasksPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAsg, setSelectedAsg] = useState<Assignment | null>(null);

  // Form Fields
  const [visitDate, setVisitDate] = useState("");
  const [technicianInstructions, setTechnicianInstructions] = useState("");
  const [customerLocation, setCustomerLocation] = useState("");
  const [completedStatus, setCompletedStatus] = useState("Pending");

  // Fetch data
  const fetchData = async () => {
    try {
      const res = await fetch(`/api/tasks?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);
      }
    } catch (err) {
      console.error("Error loading task data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchData();
      setCurrentPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  // Handle Edit Action Click
  const handleOpenEdit = (asg: Assignment) => {
    setSelectedAsg(asg);
    setVisitDate(asg.job.visitDate ? asg.job.visitDate.split("T")[0] : "");
    setTechnicianInstructions(asg.job.technicianInstructions || "");
    setCustomerLocation(asg.job.customerLocation || "");
    
    // Map initial ASSIGNED status to Pending for UI consistency
    const currentAsgStatus = asg.status === "ASSIGNED" ? "Pending" : asg.status;
    setCompletedStatus(currentAsgStatus);
    
    setIsModalOpen(true);
  };

  // Submit edits
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsg) return;

    try {
      const res = await fetch(`/api/tasks/${selectedAsg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: completedStatus,
          visitDate: visitDate || null,
          technicianInstructions,
          customerLocation,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update task details");

      setSuccessMsg("Task details updated successfully!");
      setIsModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // Helper date formatter: dd/MM/yyyy
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Generate Status Options dynamically based on job.assignFor
  const getStatusOptions = (assignFor: string | null) => {
    if (assignFor === "REFILLING") {
      return ["Pending", "Assign For Service", "Completed"];
    }
    return ["Pending", "Completed"];
  };

  const filteredAssignments = assignments.filter((asg) => {
    if (selectedType === "all") return true;
    const type = asg.job?.assignFor || "DELIVERY";
    return type.toUpperCase() === selectedType.toUpperCase();
  });

  // Client-side pagination calculations
  const totalItems = filteredAssignments.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedAssignments = filteredAssignments.slice(startIndex, endIndex);

  return (
    <div style={{ padding: "20px", position: "relative", minHeight: "100%" }}>
      {/* Background Accent Glow Spots */}
      <div className="glow-spot-bg" style={{ width: "400px", height: "400px", top: "-10%", left: "30%" }}></div>
      <div className="glow-spot-bg" style={{ width: "300px", height: "300px", bottom: "10%", right: "10%", background: "radial-gradient(circle, rgba(239, 68, 68, 0.03) 0%, rgba(0, 0, 0, 0) 70%)" }}></div>

      {/* Page Title */}
      <div style={{ marginBottom: "20px", position: "relative", zIndex: 1 }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "var(--text-primary)", margin: 0 }}>Technician View</h1>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div style={{ padding: "12px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "8px", color: "#10b981", marginBottom: "15px", display: "flex", gap: "8px", alignItems: "center", position: "relative", zIndex: 1 }}>
          <Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: "12px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", color: "#ef4444", marginBottom: "15px", display: "flex", gap: "8px", alignItems: "center", position: "relative", zIndex: 1 }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search Input Card */}
      <div style={{ position: "relative", width: "100%", marginBottom: "20px", zIndex: 1 }} className="search-container">
        <input
          type="text"
          placeholder="Search client name, assignment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <Search size={18} className="search-icon-inside" />
      </div>

      {/* Assignment Type Filter Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "12px", position: "relative", zIndex: 1 }}>
        {[
          { key: "all", label: "All Assignments" },
          { key: "DELIVERY", label: "Delivery" },
          { key: "REFILLING", label: "Refilling" },
          { key: "SERVICE", label: "Service" }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setSelectedType(tab.key);
              setCurrentPage(1); // Reset page to 1 when changing tabs
            }}
            className={`premium-tab-btn ${selectedType === tab.key ? "active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table Data Grid Card */}
      <div className="table-container" style={{ overflowX: "auto", position: "relative", zIndex: 1 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>Loading assignments...</div>
        ) : paginatedAssignments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>No assignments found matching this type.</div>
        ) : (
          <table className="premium-table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Client Name</th>
                <th>Contact No1</th>
                <th>Completed Status</th>
                <th>Assignment Type</th>
                <th>Customer Location</th>
                <th>Assigned On</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAssignments.map((asg, index) => {
                const displayStatus = asg.status === "ASSIGNED" ? "Pending" : asg.status;
                const locUrl = asg.job.customerLocation;

                const statusDotClass = 
                  displayStatus === "Completed" ? "pulse-green" :
                  displayStatus === "Assign For Service" ? "pulse-blue" : "pulse-amber";

                const statusColor =
                  displayStatus === "Completed" ? "#10b981" :
                  displayStatus === "Assign For Service" ? "#60a5fa" : "#fbbf24";

                return (
                  <tr key={asg.id}>
                    <td>{startIndex + index + 1}</td>
                    <td style={{ fontWeight: "600" }}>{asg.job.customer?.companyName || "N/A"}</td>
                    <td style={{ fontFamily: "monospace" }}>{asg.job.customer?.phone}</td>
                    <td>
                      <div style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: "8px", background: "rgba(30, 30, 45, 0.4)", border: "1px solid rgba(255,255,255,0.03)", fontSize: "12px", color: statusColor, fontWeight: "700" }}>
                        <span className={`status-pulse-dot ${statusDotClass}`} />
                        {displayStatus}
                      </div>
                    </td>
                    <td style={{ fontWeight: "bold" }}>{asg.job.assignFor || "DELIVERY"}</td>
                    <td>
                      {locUrl ? (
                        <a 
                          href={locUrl.startsWith("http") ? locUrl : `https://google.com/maps/search/?api=1&query=${encodeURIComponent(locUrl)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: "var(--accent)", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                          View Location <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ color: "var(--text-secondary)" }}>-</span>
                      )}
                    </td>
                    <td>{formatDate(asg.assignedAt)}</td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                        <button
                          onClick={() => handleOpenEdit(asg)}
                          style={{ 
                            background: "rgba(255, 255, 255, 0.04)", 
                            border: "1px solid rgba(255, 255, 255, 0.08)", 
                            color: "var(--text-primary)", 
                            padding: "8px", 
                            borderRadius: "6px", 
                            cursor: "pointer", 
                            display: "inline-flex", 
                            alignItems: "center",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220, 38, 38, 0.15)"; e.currentTarget.style.borderColor = "rgba(220, 38, 38, 0.3)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)"; }}
                          title="Task Details"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && totalItems > 0 && (
        <div className="pagination-container" style={{ position: "relative", zIndex: 1 }}>
          <span className="pagination-info">
            Showing {startIndex + 1} to {endIndex} of {totalItems} entries
          </span>
          <div className="pagination-controls">
            <button 
              onClick={() => setCurrentPage(1)} 
              disabled={currentPage === 1}
              className="pagination-btn"
              title="First Page"
            >
              <ChevronsLeft size={14} />
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
              disabled={currentPage === 1}
              className="pagination-btn"
              title="Previous Page"
            >
              <ChevronLeft size={14} />
            </button>
            
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", minWidth: "80px", textAlign: "center" }}>
              Page {currentPage} of {totalPages}
            </span>

            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
              disabled={currentPage === totalPages}
              className="pagination-btn"
              title="Next Page"
            >
              <ChevronRight size={14} />
            </button>
            <button 
              onClick={() => setCurrentPage(totalPages)} 
              disabled={currentPage === totalPages}
              className="pagination-btn"
              title="Last Page"
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal Dialog */}
      {isModalOpen && selectedAsg && (
        <div className="slide-over-backdrop" style={{ zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="slide-over-card theme-modal-card" style={{ maxWidth: "650px", maxHeight: "95%" }}>
            
            {/* Modal Header */}
            <div className="slide-over-header theme-modal-card-header">
              <h2 style={{ fontSize: "18px", margin: 0, fontWeight: "700", color: "#fff" }}>Task Details</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", display: "inline-flex" }}><X size={20} /></button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div style={{ padding: "20px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "18px" }}>
                
                {/* Client / Contact Person */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {/* Client Name */}
                  <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-input)" }}>
                    <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-input)", padding: "0 4px", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600" }}>Client Name*</span>
                    <input type="text" value={selectedAsg.job.customer?.companyName || ""} readOnly style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "var(--text-secondary)", cursor: "not-allowed" }} />
                  </div>
                  {/* Contact Person */}
                  <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-input)" }}>
                    <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-input)", padding: "0 4px", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600" }}>Contact Person*</span>
                    <input type="text" value={selectedAsg.job.customer?.contactPerson || ""} readOnly style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "var(--text-secondary)", cursor: "not-allowed" }} />
                  </div>
                </div>

                {/* Contact Number / Visit Date */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {/* Contact Number */}
                  <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-input)" }}>
                    <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-input)", padding: "0 4px", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600" }}>Contact Number*</span>
                    <input type="text" value={selectedAsg.job.customer?.phone || ""} readOnly style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "var(--text-secondary)", cursor: "not-allowed" }} />
                  </div>
                  {/* Visit/Service Date */}
                  <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-card)" }}>
                    <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-card)", padding: "0 4px", fontSize: "11px", color: "var(--accent)", fontWeight: "600" }}>Visit/Service Date*</span>
                    <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} required style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "var(--text-primary)", cursor: "pointer" }} />
                  </div>
                </div>

                {/* Address */}
                <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-input)" }}>
                  <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-input)", padding: "0 4px", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600" }}>Address</span>
                  <textarea value={selectedAsg.job.customer?.address || ""} readOnly rows={2} style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "var(--text-secondary)", cursor: "not-allowed", resize: "none", fontFamily: "inherit" }} />
                </div>

                {/* Instructions */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {/* Admin Instructions */}
                  <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-input)" }}>
                    <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-input)", padding: "0 4px", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600" }}>Admin Instructions</span>
                    <textarea value={selectedAsg.job.adminInstructions || ""} readOnly rows={2} style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "var(--text-secondary)", cursor: "not-allowed", resize: "none", fontFamily: "inherit" }} />
                  </div>
                  {/* Technician Instructions */}
                  <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-card)" }}>
                    <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-card)", padding: "0 4px", fontSize: "11px", color: "var(--accent)", fontWeight: "600" }}>Technician Instructions</span>
                    <textarea value={technicianInstructions} onChange={e => setTechnicianInstructions(e.target.value)} rows={2} style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "var(--text-primary)", resize: "none", fontFamily: "inherit" }} />
                  </div>
                </div>

                {/* Customer Location */}
                <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-card)" }}>
                  <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-card)", padding: "0 4px", fontSize: "11px", color: "var(--accent)", fontWeight: "600" }}>Customer Location</span>
                  <input type="text" value={customerLocation} onChange={e => setCustomerLocation(e.target.value)} placeholder="Maps link or coordinates..." style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "var(--text-primary)" }} />
                </div>

                {/* Assigned For & Completed Status */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {/* Assigned For */}
                  <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-input)" }}>
                    <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-input)", padding: "0 4px", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600" }}>Assigned For*</span>
                    <input type="text" value={selectedAsg.job.assignFor || "DELIVERY"} readOnly style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "var(--text-secondary)", cursor: "not-allowed" }} />
                  </div>
                  {/* Completed Status */}
                  <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-card)" }}>
                    <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-card)", padding: "0 4px", fontSize: "11px", color: "var(--accent)", fontWeight: "600" }}>Completed Status*</span>
                    <select value={completedStatus} onChange={e => setCompletedStatus(e.target.value)} required style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "var(--text-primary)", cursor: "pointer" }}>
                      {getStatusOptions(selectedAsg.job.assignFor).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border-glass)", display: "flex", justifyContent: "flex-end", gap: "10px", background: "var(--bg-input)" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-secondary)", cursor: "pointer", fontWeight: "500", fontSize: "13px" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)", border: "none", borderRadius: "6px", color: "#ffffff", cursor: "pointer", fontWeight: "500", fontSize: "13px" }}>Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
