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

  // Client-side pagination calculations
  const totalItems = assignments.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedAssignments = assignments.slice(startIndex, endIndex);

  return (
    <div style={{ padding: "20px", color: "#1e293b", background: "#f8fafc", minHeight: "100%" }}>
      {/* Dynamic light theme override for layout */}
      <style dangerouslySetInnerHTML={{ __html: `
        .dashboard-container {
          background-color: #f8fafc !important;
        }
        .dashboard-sidebar {
          background: #ffffff !important;
          border-right: 1px solid #e2e8f0 !important;
        }
        .sidebar-logo {
          border-bottom: 1px solid #e2e8f0 !important;
          color: #dc2626 !important;
        }
        .menu-link {
          color: #475569 !important;
        }
        .menu-link:hover {
          background: #f1f5f9 !important;
          color: #0f172a !important;
        }
        .menu-link.active {
          background: #dc2626 !important;
          color: #ffffff !important;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15) !important;
        }
        .sidebar-footer {
          border-top: 1px solid #e2e8f0 !important;
        }
        .dashboard-main {
          background: #f8fafc !important;
        }
        .dashboard-header {
          background: #ffffff !important;
          border-bottom: 1px solid #e2e8f0 !important;
        }
        .header-user {
          color: #334155 !important;
        }
        .header-user-icon {
          background: #f1f5f9 !important;
          color: #475569 !important;
          border: 1px solid #e2e8f0 !important;
        }
        .header-logout-btn {
          color: #64748b !important;
        }
        .header-logout-btn:hover {
          color: #0f172a !important;
        }
      `}} />

      {/* Page Title */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#1e293b", margin: 0 }}>Technician View</h1>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div style={{ padding: "12px", background: "#ecfdf5", border: "1px solid #10b981", borderRadius: "8px", color: "#065f46", marginBottom: "15px", display: "flex", gap: "8px", alignItems: "center" }}>
          <Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: "12px", background: "#fef2f2", border: "1px solid #ef4444", borderRadius: "8px", color: "#991b1b", marginBottom: "15px", display: "flex", gap: "8px", alignItems: "center" }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search Input Card */}
      <div style={{ position: "relative", width: "100%", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ 
            width: "100%", 
            padding: "12px 40px 12px 16px", 
            background: "#ffffff", 
            border: "1px solid #cbd5e1", 
            borderRadius: "8px", 
            color: "#1e293b", 
            fontSize: "14px",
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            outline: "none"
          }}
        />
        <Search size={18} style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
      </div>

      {/* Table Data Grid Card */}
      <div style={{ 
        background: "#ffffff", 
        borderRadius: "12px", 
        border: "1px solid #e2e8f0", 
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading assignments...</div>
          ) : paginatedAssignments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>No assignments found.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#22316c" }}>
                  <th style={{ padding: "14px 16px", color: "#ffffff", fontWeight: "600" }}>S.No</th>
                  <th style={{ padding: "14px 16px", color: "#ffffff", fontWeight: "600" }}>Client Name</th>
                  <th style={{ padding: "14px 16px", color: "#ffffff", fontWeight: "600" }}>Contact No1</th>
                  <th style={{ padding: "14px 16px", color: "#ffffff", fontWeight: "600" }}>Completed Status</th>
                  <th style={{ padding: "14px 16px", color: "#ffffff", fontWeight: "600" }}>Assignment Type</th>
                  <th style={{ padding: "14px 16px", color: "#ffffff", fontWeight: "600" }}>Customer Location</th>
                  <th style={{ padding: "14px 16px", color: "#ffffff", fontWeight: "600" }}>Assigned On</th>
                  <th style={{ padding: "14px 16px", color: "#ffffff", fontWeight: "600", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAssignments.map((asg, index) => {
                  const displayStatus = asg.status === "ASSIGNED" ? "Pending" : asg.status;
                  const locUrl = asg.job.customerLocation;

                  return (
                    <tr key={asg.id} style={{ borderBottom: "1px solid #f1f5f9", background: "#ffffff" }}>
                      <td style={{ padding: "14px 16px", color: "#334155" }}>{startIndex + index + 1}</td>
                      <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: "500" }}>{asg.job.customer?.companyName || "N/A"}</td>
                      <td style={{ padding: "14px 16px", color: "#475569" }}>{asg.job.customer?.phone}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          background: 
                            displayStatus === "Completed" 
                              ? "#e6fffa" 
                              : displayStatus === "Assign For Service" 
                                ? "#ebf8ff" 
                                : "#fffaf0",
                          color:
                            displayStatus === "Completed" 
                              ? "#319795" 
                              : displayStatus === "Assign For Service" 
                                ? "#3182ce" 
                                : "#dd6b20",
                          border:
                            displayStatus === "Completed" 
                              ? "1px solid #b2f5ea" 
                              : displayStatus === "Assign For Service" 
                                ? "1px solid #bee3f8" 
                                : "1px solid #feebc8",
                        }}>
                          {displayStatus}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: "bold", color: "#475569" }}>{asg.job.assignFor || "DELIVERY"}</td>
                      <td style={{ padding: "14px 16px" }}>
                        {locUrl ? (
                          <a 
                            href={locUrl.startsWith("http") ? locUrl : `https://google.com/maps/search/?api=1&query=${encodeURIComponent(locUrl)}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: "#3182ce", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            View Location <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", color: "#475569" }}>{formatDate(asg.assignedAt)}</td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          <button
                            onClick={() => handleOpenEdit(asg)}
                            style={{ 
                              background: "#fff5f5", 
                              border: "1px solid #fed7d7", 
                              color: "#ff4d80", 
                              padding: "8px", 
                              borderRadius: "6px", 
                              cursor: "pointer", 
                              display: "inline-flex", 
                              alignItems: "center" 
                            }}
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
          <div style={{ 
            display: "flex", 
            justifyContent: "flex-end", 
            alignItems: "center", 
            padding: "12px 24px", 
            background: "#ffffff", 
            borderTop: "1px solid #e2e8f0",
            gap: "20px",
            fontSize: "13px",
            color: "#64748b"
          }}>
            {/* Items Per Page */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>Items per page:</span>
              <select 
                value={pageSize} 
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#1e293b",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            {/* Range Info */}
            <div>
              {startIndex + 1} - {endIndex} of {totalItems}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button 
                onClick={() => setCurrentPage(1)} 
                disabled={currentPage === 1}
                style={{
                  background: "none",
                  border: "none",
                  padding: "4px",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  color: currentPage === 1 ? "#cbd5e1" : "#475569",
                  display: "inline-flex",
                  alignItems: "center"
                }}
              >
                <ChevronsLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                disabled={currentPage === 1}
                style={{
                  background: "none",
                  border: "none",
                  padding: "4px",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  color: currentPage === 1 ? "#cbd5e1" : "#475569",
                  display: "inline-flex",
                  alignItems: "center"
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                disabled={currentPage === totalPages}
                style={{
                  background: "none",
                  border: "none",
                  padding: "4px",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  color: currentPage === totalPages ? "#cbd5e1" : "#475569",
                  display: "inline-flex",
                  alignItems: "center"
                }}
              >
                <ChevronRight size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(totalPages)} 
                disabled={currentPage === totalPages}
                style={{
                  background: "none",
                  border: "none",
                  padding: "4px",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  color: currentPage === totalPages ? "#cbd5e1" : "#475569",
                  display: "inline-flex",
                  alignItems: "center"
                }}
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Task View Modal */}
      {isModalOpen && selectedAsg && (
        <div style={{ 
          position: "fixed", 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: "rgba(15, 23, 42, 0.4)", 
          backdropFilter: "blur(4px)",
          zIndex: 1000, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          padding: "15px" 
        }}>
          <div style={{ 
            background: "#ffffff", 
            border: "1px solid #e2e8f0", 
            borderRadius: "12px", 
            width: "100%", 
            maxWidth: "650px", 
            maxHeight: "95%", 
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            overflow: "hidden", 
            display: "flex", 
            flexDirection: "column" 
          }}>
            
            {/* Modal Header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "18px", margin: 0, fontWeight: "700", color: "#22316c" }}>Task View</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", display: "inline-flex" }}><X size={20} /></button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div style={{ padding: "20px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "18px" }}>
                
                {/* Client / Contact Person */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {/* Client Name */}
                  <div style={{ position: "relative", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "6px 12px", background: "#f8fafc" }}>
                    <span style={{ position: "absolute", top: "-8px", left: "10px", background: "#f8fafc", padding: "0 4px", fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Client Name*</span>
                    <input type="text" value={selectedAsg.job.customer?.companyName || ""} readOnly style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "#64748b", cursor: "not-allowed" }} />
                  </div>
                  {/* Contact Person */}
                  <div style={{ position: "relative", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "6px 12px", background: "#f8fafc" }}>
                    <span style={{ position: "absolute", top: "-8px", left: "10px", background: "#f8fafc", padding: "0 4px", fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Contact Person*</span>
                    <input type="text" value={selectedAsg.job.customer?.contactPerson || ""} readOnly style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "#64748b", cursor: "not-allowed" }} />
                  </div>
                </div>

                {/* Contact Number / Visit Date */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {/* Contact Number */}
                  <div style={{ position: "relative", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "6px 12px", background: "#f8fafc" }}>
                    <span style={{ position: "absolute", top: "-8px", left: "10px", background: "#f8fafc", padding: "0 4px", fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Contact Number*</span>
                    <input type="text" value={selectedAsg.job.customer?.phone || ""} readOnly style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "#64748b", cursor: "not-allowed" }} />
                  </div>
                  {/* Visit/Service Date */}
                  <div style={{ position: "relative", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "6px 12px", background: "#ffffff" }}>
                    <span style={{ position: "absolute", top: "-8px", left: "10px", background: "#ffffff", padding: "0 4px", fontSize: "11px", color: "#22316c", fontWeight: "600" }}>Visit/Service Date*</span>
                    <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} required style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "#0f172a", cursor: "pointer" }} />
                  </div>
                </div>

                {/* Address */}
                <div style={{ position: "relative", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "6px 12px", background: "#f8fafc" }}>
                  <span style={{ position: "absolute", top: "-8px", left: "10px", background: "#f8fafc", padding: "0 4px", fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Address</span>
                  <textarea value={selectedAsg.job.customer?.address || ""} readOnly rows={2} style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "#64748b", cursor: "not-allowed", resize: "none", fontFamily: "inherit" }} />
                </div>

                {/* Instructions */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {/* Admin Instructions */}
                  <div style={{ position: "relative", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "6px 12px", background: "#f8fafc" }}>
                    <span style={{ position: "absolute", top: "-8px", left: "10px", background: "#f8fafc", padding: "0 4px", fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Admin Instructions</span>
                    <textarea value={selectedAsg.job.adminInstructions || ""} readOnly rows={2} style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "#64748b", cursor: "not-allowed", resize: "none", fontFamily: "inherit" }} />
                  </div>
                  {/* Technician Instructions */}
                  <div style={{ position: "relative", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "6px 12px", background: "#ffffff" }}>
                    <span style={{ position: "absolute", top: "-8px", left: "10px", background: "#ffffff", padding: "0 4px", fontSize: "11px", color: "#22316c", fontWeight: "600" }}>Technician Instructions</span>
                    <textarea value={technicianInstructions} onChange={e => setTechnicianInstructions(e.target.value)} rows={2} style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "#0f172a", resize: "none", fontFamily: "inherit" }} />
                  </div>
                </div>

                {/* Customer Location */}
                <div style={{ position: "relative", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "6px 12px", background: "#ffffff" }}>
                  <span style={{ position: "absolute", top: "-8px", left: "10px", background: "#ffffff", padding: "0 4px", fontSize: "11px", color: "#22316c", fontWeight: "600" }}>Customer Location</span>
                  <input type="text" value={customerLocation} onChange={e => setCustomerLocation(e.target.value)} placeholder="Maps link or coordinates..." style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "#0f172a" }} />
                </div>

                {/* Assigned For & Completed Status */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {/* Assigned For */}
                  <div style={{ position: "relative", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "6px 12px", background: "#f8fafc" }}>
                    <span style={{ position: "absolute", top: "-8px", left: "10px", background: "#f8fafc", padding: "0 4px", fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Assigned For*</span>
                    <input type="text" value={selectedAsg.job.assignFor || "DELIVERY"} readOnly style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "#64748b", cursor: "not-allowed" }} />
                  </div>
                  {/* Completed Status */}
                  <div style={{ position: "relative", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "6px 12px", background: "#ffffff" }}>
                    <span style={{ position: "absolute", top: "-8px", left: "10px", background: "#ffffff", padding: "0 4px", fontSize: "11px", color: "#22316c", fontWeight: "600" }}>Completed Status*</span>
                    <select value={completedStatus} onChange={e => setCompletedStatus(e.target.value)} required style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "#0f172a", cursor: "pointer" }}>
                      {getStatusOptions(selectedAsg.job.assignFor).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div style={{ padding: "16px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "10px", background: "#f8fafc" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: "8px 16px", background: "transparent", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#475569", cursor: "pointer", fontWeight: "500", fontSize: "13px" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", background: "#ff4d80", border: "none", borderRadius: "6px", color: "#ffffff", cursor: "pointer", fontWeight: "500", fontSize: "13px" }}>Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
