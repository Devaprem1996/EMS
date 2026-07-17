"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Edit2, 
  Trash2, 
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

interface SiblingAssignment {
  id: string;
  technician: {
    id: string;
    fullName: string;
  };
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
  assignments: SiblingAssignment[];
  stageData?: string | null;
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

export default function TechnicianViewPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAsg, setSelectedAsg] = useState<Assignment | null>(null);

  // Form Fields
  const [visitDate, setVisitDate] = useState("");
  const [adminInstructions, setAdminInstructions] = useState("");
  const [technicianInstructions, setTechnicianInstructions] = useState("");
  const [customerLocation, setCustomerLocation] = useState("");
  const [completedStatus, setCompletedStatus] = useState("Pending");
  const [existingSignature, setExistingSignature] = useState<string | null>(null);

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
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType]);

  // Handle Edit Action Click
  const handleOpenEdit = (asg: Assignment) => {
    setSelectedAsg(asg);
    setVisitDate(asg.job.visitDate ? asg.job.visitDate.split("T")[0] : "");
    setAdminInstructions(asg.job.adminInstructions || "");
    setTechnicianInstructions(asg.job.technicianInstructions || "");
    setCustomerLocation(asg.job.customerLocation || "");
    
    // Map initial ASSIGNED status to Pending for UI consistency
    const currentAsgStatus = asg.status === "ASSIGNED" ? "Pending" : asg.status;
    setCompletedStatus(currentAsgStatus);

    let existingSign: string | null = null;
    if (asg.job.stageData) {
      try {
        const parsed = JSON.parse(asg.job.stageData);
        if (parsed.signature) {
          existingSign = parsed.signature;
        }
      } catch (e) {}
    }
    setExistingSignature(existingSign);
    
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
          adminInstructions,
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

  // Soft Delete Action Click
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this technician assignment?")) return;

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete assignment");

      setSuccessMsg("Assignment soft-deleted successfully.");
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // Helper date formatter: dd-MM-yyyy
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
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

  const totalAsgs = filteredAssignments.length;
  const completedAsgs = filteredAssignments.filter(a => a.status === "Completed").length;
  const pendingAsgs = totalAsgs - completedAsgs;

  return (
    <div style={{ padding: "10px", color: "#e2e8f0" }}>
      {/* Title */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>Technician View</h1>
      </div>

      {/* KPI Summary Cards */}
      <div className="kpi-grid" style={{ marginBottom: "25px" }}>
        <div className="kpi-card-glass" style={{ borderLeft: "4px solid #3b82f6" }}>
          <div>
            <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Assignments</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#fff", marginTop: "6px", fontFamily: "monospace" }}>{totalAsgs}</div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>Assigned Tasks</div>
          </div>
          <div style={{ background: "rgba(59, 130, 246, 0.1)", padding: "10px", borderRadius: "12px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
            <span style={{ fontSize: "20px" }}>📋</span>
          </div>
        </div>

        <div className="kpi-card-glass" style={{ borderLeft: "4px solid #f59e0b" }}>
          <div>
            <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pending Tasks</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#fff", marginTop: "6px", fontFamily: "monospace" }}>{pendingAsgs}</div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px", display: "flex", alignItems: "center", gap: "3px" }}>
              <span className="status-pulse-dot pulse-amber" style={{ margin: 0 }}></span> Needs Attention
            </div>
          </div>
          <div style={{ background: "rgba(245, 158, 11, 0.1)", padding: "10px", borderRadius: "12px", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
            <span style={{ fontSize: "20px" }}>⚡</span>
          </div>
        </div>

        <div className="kpi-card-glass" style={{ borderLeft: "4px solid #10b981" }}>
          <div>
            <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Completed Tasks</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#fff", marginTop: "6px", fontFamily: "monospace" }}>{completedAsgs}</div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px", display: "flex", alignItems: "center", gap: "3px" }}>
              <span className="status-pulse-dot pulse-green" style={{ margin: 0 }}></span> Done & Verified
            </div>
          </div>
          <div style={{ background: "rgba(16, 185, 129, 0.15)", padding: "10px", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            <span style={{ fontSize: "20px" }}>🚛</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div style={{ padding: "12px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10b981", borderRadius: "8px", color: "#10b981", marginBottom: "15px", display: "flex", gap: "8px", alignItems: "center" }}>
          <Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: "12px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: "8px", color: "#ef4444", marginBottom: "15px", display: "flex", gap: "8px", alignItems: "center" }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search Input */}
      <div style={{ position: "relative", width: "100%", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", padding: "12px 15px 12px 40px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "14px" }}
        />
        <Search size={18} style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
      </div>

      {/* Assignment Type Filter Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "12px" }}>
        {[
          { key: "all", label: "All Assignments" },
          { key: "DELIVERY", label: "Delivery" },
          { key: "REFILLING", label: "Refilling" },
          { key: "SERVICE", label: "Service" }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedType(tab.key)}
            className={`premium-tab-btn ${selectedType === tab.key ? "active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Centralized Grid table */}
      <div className="table-container" style={{ overflowX: "auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>Loading assignments...</div>
        ) : filteredAssignments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No assignments found matching this type.</div>
        ) : (
          <table className="premium-table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-glass)" }}>
                <th style={{ padding: "15px", position: "sticky", top: 0, zIndex: 10, background: "var(--bg-input)", borderBottom: "1px solid var(--border-glass)" }}>S.No</th>
                <th style={{ padding: "15px", position: "sticky", top: 0, zIndex: 10, background: "var(--bg-input)", borderBottom: "1px solid var(--border-glass)" }}>Client Name</th>
                <th style={{ padding: "15px", position: "sticky", top: 0, zIndex: 10, background: "var(--bg-input)", borderBottom: "1px solid var(--border-glass)" }}>Contact No1</th>
                <th style={{ padding: "15px", position: "sticky", top: 0, zIndex: 10, background: "var(--bg-input)", borderBottom: "1px solid var(--border-glass)" }}>Employee Name</th>
                <th style={{ padding: "15px", position: "sticky", top: 0, zIndex: 10, background: "var(--bg-input)", borderBottom: "1px solid var(--border-glass)" }}>Completed Status</th>
                <th style={{ padding: "15px", position: "sticky", top: 0, zIndex: 10, background: "var(--bg-input)", borderBottom: "1px solid var(--border-glass)" }}>Technician Names</th>
                <th style={{ padding: "15px", position: "sticky", top: 0, zIndex: 10, background: "var(--bg-input)", borderBottom: "1px solid var(--border-glass)" }}>Assignment Type</th>
                <th style={{ padding: "15px", position: "sticky", top: 0, zIndex: 10, background: "var(--bg-input)", borderBottom: "1px solid var(--border-glass)" }}>Customer Location</th>
                <th style={{ padding: "15px", position: "sticky", top: 0, zIndex: 10, background: "var(--bg-input)", borderBottom: "1px solid var(--border-glass)" }}>Assigned On</th>
                <th style={{ padding: "15px", textAlign: "center", position: "sticky", top: 0, zIndex: 10, background: "var(--bg-input)", borderBottom: "1px solid var(--border-glass)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAssignments.map((asg, index) => {
                const siblingNames = asg.job.assignments.map(sa => sa.technician.fullName).join(", ");
                const displayStatus = asg.status === "ASSIGNED" ? "Pending" : asg.status;
                const locUrl = asg.job.customerLocation;

                return (
                  <tr key={asg.id} style={{ borderBottom: "1px solid var(--border-glass)" }}>
                    <td style={{ padding: "15px" }}>{startIndex + index + 1}</td>
                    <td style={{ padding: "15px" }}>{asg.job.customer?.companyName || "N/A"}</td>
                    <td style={{ padding: "15px" }}>{asg.job.customer?.phone}</td>
                    <td style={{ padding: "15px", fontWeight: "600" }}>{asg.technician.fullName}</td>
                    <td style={{ padding: "15px" }}>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        background: 
                          displayStatus === "Completed" 
                            ? "rgba(16, 185, 129, 0.15)" 
                            : displayStatus === "Assign For Service" 
                              ? "rgba(59, 130, 246, 0.15)" 
                              : "rgba(245, 158, 11, 0.15)",
                        color:
                          displayStatus === "Completed" 
                            ? "#10b981" 
                            : displayStatus === "Assign For Service" 
                              ? "#3b82f6" 
                              : "#f59e0b",
                      }}>
                        {displayStatus}
                      </span>
                    </td>
                    <td style={{ padding: "15px" }}>{siblingNames || "N/A"}</td>
                    <td style={{ padding: "15px", fontWeight: "bold", color: "#a0aec0" }}>{asg.job.assignFor || "DELIVERY"}</td>
                    <td style={{ padding: "15px" }}>
                      {locUrl ? (
                        <a 
                          href={locUrl.startsWith("http") ? locUrl : `https://google.com/maps/search/?api=1&query=${encodeURIComponent(locUrl)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: "#3b82f6", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                          View Location <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ color: "#718096" }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: "15px" }}>{formatDate(asg.assignedAt)}</td>
                    <td style={{ padding: "15px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                        <button
                          onClick={() => handleOpenEdit(asg)}
                          style={{ background: "#ff4d80", border: "none", color: "#fff", padding: "6px", borderRadius: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                          title="Task Details"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(asg.id)}
                          style={{ background: "rgba(239, 68, 68, 0.2)", border: "1px solid #ef4444", color: "#ef4444", padding: "6px", borderRadius: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                          title="Delete Assignment"
                        >
                          <Trash2 size={14} />
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
        <div className="pagination-container" style={{ position: "relative", zIndex: 1, marginTop: "20px" }}>
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

      {/* Task View Modal */}
      {isModalOpen && selectedAsg && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "15px" }}>
          <div className="modal-card theme-modal-card" style={{ width: "100%", maxWidth: "650px", maxHeight: "95%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            
            <div className="modal-header theme-modal-card-header" style={{ padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "18px", margin: 0 }}>Task View</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div style={{ padding: "20px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "15px" }}>
                
                {/* Client / Contact Person / Phone */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Client Name*</label>
                    <input type="text" value={selectedAsg.job.customer?.companyName || ""} readOnly style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#718096", cursor: "not-allowed" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Contact Person*</label>
                    <input type="text" value={selectedAsg.job.customer?.contactPerson || ""} readOnly style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#718096", cursor: "not-allowed" }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Contact Number*</label>
                    <input type="text" value={selectedAsg.job.customer?.phone || ""} readOnly style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#718096", cursor: "not-allowed" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Visit/Service Date*</label>
                    <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Address</label>
                  <textarea value={selectedAsg.job.customer?.address || ""} readOnly rows={2} style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#718096", cursor: "not-allowed", resize: "none" }} />
                </div>

                {/* Instructions */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Admin Instructions</label>
                    <textarea value={adminInstructions} onChange={e => setAdminInstructions(e.target.value)} rows={2} style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff", resize: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Technician Instructions</label>
                    <textarea value={technicianInstructions} onChange={e => setTechnicianInstructions(e.target.value)} rows={2} style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff", resize: "none" }} />
                  </div>
                </div>

                {/* Customer Location */}
                <div>
                  <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Customer Location</label>
                  <input type="text" value={customerLocation} onChange={e => setCustomerLocation(e.target.value)} placeholder="Maps link or coordinates..." style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                </div>

                {/* Assigned For & Completed Status */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Assigned For*</label>
                    <input type="text" value={selectedAsg.job.assignFor || "DELIVERY"} readOnly style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#718096", cursor: "not-allowed" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Completed Status*</label>
                    <select value={completedStatus} onChange={e => setCompletedStatus(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }}>
                      {getStatusOptions(selectedAsg.job.assignFor).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Dynamic Signature Block */}
                {existingSignature && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Customer Signature Preview</label>
                    <div style={{ padding: "10px", background: "#0c0c10", borderRadius: "8px", border: "1px dashed #2d2d3a", display: "flex", justifyContent: "center" }}>
                      <img src={existingSignature} alt="Customer Signature" style={{ maxHeight: "100px", maxWidth: "100%", objectFit: "contain" }} />
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div style={{ padding: "15px 20px", borderTop: "1px solid #2d2d3a", display: "flex", justifyContent: "flex-end", gap: "10px", background: "#14141c" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: "8px 16px", background: "transparent", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#a0aec0", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", background: "#ff4d80", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer" }}>Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
