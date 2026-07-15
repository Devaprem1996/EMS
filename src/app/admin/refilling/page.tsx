"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Edit2, 
  UserPlus, 
  X, 
  Check, 
  AlertCircle,
  Calendar,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  RotateCcw
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

interface Assignment {
  id: string;
  technicianId: string;
  technician: {
    id: string;
    fullName: string;
    phone: string;
  };
}

interface FollowUp {
  id: string;
  remarks: string;
  createdAt: string;
}

interface Job {
  id: string;
  jobNumber: string;
  customerId: string | null;
  customer: Customer | null;
  currentStage: string;
  currentStatus: string;
  requirementCategory: string | null;
  enquirySource: string | null;
  requirementDetails: string | null;
  requestedDeliveryDate: string | null;
  followUpDate: string | null;
  latestFollowUpNotes: string | null;
  deliveredDate: string | null;
  amcYears: number | null;
  amcDate: string | null;
  visitDate: string | null;
  adminInstructions: string | null;
  technicianInstructions: string | null;
  customerLocation: string | null;
  assignFor: string | null;
  assignments: Assignment[];
  followUps: FollowUp[];
  createdAt: string;
}

interface Technician {
  id: string;
  fullName: string;
  phone: string;
  isActive: boolean;
  role: string;
}

export default function RefillingDashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  // Notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  // Modals Control
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Collapsible cards state in edit modal
  const [isStatusCardOpen, setIsStatusCardOpen] = useState(true);
  const [isFollowUpCardOpen, setIsFollowUpCardOpen] = useState(true);

  // --- Form Fields ---
  // Update Refilling Form fields
  const [deliveredDate, setDeliveredDate] = useState("");
  const [amcYears, setAmcYears] = useState("1");
  const [calculatedAmcDate, setCalculatedAmcDate] = useState("");
  const [currentStatus, setCurrentStatus] = useState("Refilling Order Received");
  const [followUpDate, setFollowUpDate] = useState("");
  const [newRemarks, setNewRemarks] = useState("");

  // Assign Technician Form fields
  const [visitDate, setVisitDate] = useState("");
  const [adminInstructions, setAdminInstructions] = useState("");
  const [technicianInstructions, setTechnicianInstructions] = useState("");
  const [customerLocation, setCustomerLocation] = useState("");
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);

  // Fetch all data
  const fetchData = async () => {
    try {
      // 1. Fetch refilling jobs
      const jobsRes = await fetch(`/api/jobs?stage=REFILLING&status=${statusFilter}&search=${encodeURIComponent(search)}`);
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData);
      }

      // 2. Fetch active technicians
      const techRes = await fetch("/api/employees?status=active");
      if (techRes.ok) {
        const techData = await techRes.json();
        setTechnicians(techData.filter((t: any) => t.role === "TECHNICIAN"));
      }
    } catch (err) {
      console.error("Error loading refilling dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter]);

  // Handle Edit Refilling Modal Open
  const handleOpenEdit = (job: Job) => {
    setSelectedJob(job);
    setDeliveredDate(job.deliveredDate ? job.deliveredDate.split("T")[0] : "");
    setAmcYears(String(job.amcYears || 1));
    setCalculatedAmcDate(job.amcDate ? job.amcDate.split("T")[0] : "");
    setCurrentStatus(job.currentStatus || "Refilling Order Received");
    setFollowUpDate(job.followUpDate ? job.followUpDate.split("T")[0] : "");
    setNewRemarks("");
    setIsStatusCardOpen(true);
    setIsFollowUpCardOpen(true);
    setIsEditModalOpen(true);
  };

  // Recalculate AMC/Refilling Date dynamically in edit view
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

  // Submit Update Refilling Form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

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
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update refilling details");

      setSuccessMsg("Refilling details updated successfully!");
      setIsEditModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // Handle Assign Technician Modal Open
  const handleOpenAssign = (job: Job) => {
    setSelectedJob(job);
    setVisitDate(job.visitDate ? job.visitDate.split("T")[0] : "");
    setAdminInstructions(job.adminInstructions || "");
    setTechnicianInstructions(job.technicianInstructions || "");
    setCustomerLocation(job.customerLocation || "");
    setSelectedTechIds(job.assignments.map(a => a.technicianId));
    setIsAssignModalOpen(true);
  };

  // Submit Technician Assignment
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    try {
      const res = await fetch(`/api/jobs/${selectedJob.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitDate: visitDate || null,
          adminInstructions,
          technicianInstructions,
          customerLocation,
          technicianIds: selectedTechIds,
          assignFor: "REFILLING",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign technician");

      setSuccessMsg("Technician assigned successfully!");
      setIsAssignModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // Handle tech checkbox toggle
  const handleTechToggle = (techId: string) => {
    setSelectedTechIds(prev => 
      prev.includes(techId) ? prev.filter(id => id !== techId) : [...prev, techId]
    );
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

  // Extract unique years from deliveredDate or amcDate for the filter dropdown
  const getFilterYears = () => {
    const yearsSet = new Set<string>();
    jobs.forEach(job => {
      if (job.amcDate) {
        const year = new Date(job.amcDate).getFullYear().toString();
        yearsSet.add(year);
      }
    });
    // Add current year as fallback if empty
    if (yearsSet.size === 0) {
      yearsSet.add(new Date().getFullYear().toString());
    }
    return Array.from(yearsSet).sort();
  };

  // Filter jobs by year locally
  const filteredJobs = jobs.filter(job => {
    if (yearFilter === "all") return true;
    if (!job.amcDate) return false;
    const jobYear = new Date(job.amcDate).getFullYear().toString();
    return jobYear === yearFilter;
  });

  return (
    <div style={{ padding: "20px", color: "#e2e8f0", position: "relative", minHeight: "100%" }}>
      {/* Background Accent Glow Spots */}
      <div className="glow-spot-bg" style={{ width: "400px", height: "400px", top: "-10%", left: "20%" }}></div>
      <div className="glow-spot-bg" style={{ width: "300px", height: "300px", bottom: "10%", right: "5%", background: "radial-gradient(circle, rgba(239, 68, 68, 0.02) 0%, rgba(0, 0, 0, 0) 70%)" }}></div>

      {/* Page Title & Subtitle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", position: "relative", zIndex: 1 }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "800", margin: 0, letterSpacing: "-0.03em", background: "linear-gradient(to right, #fff 40%, #cbd5e1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Refilling Control Center</h1>
          <p style={{ fontSize: "13.5px", color: "#94a3b8", margin: "4px 0 0 0" }}>Manage high-pressure testing, gas refilling schedules, and compliance validation</p>
        </div>
      </div>

      {/* Toast Notification Stack */}
      <div className="toast-stack">
        {successMsg && (
          <div className="toast-card success-toast">
            <Check size={18} style={{ color: "#10b981", marginTop: "2px", flexShrink: 0 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "13px", fontWeight: "bold", color: "#fff" }}>Success</span>
              <span style={{ fontSize: "12px", color: "#a0aec0", lineHeight: "1.4" }}>{successMsg}</span>
            </div>
            <button 
              onClick={() => setSuccessMsg(null)} 
              style={{ background: "none", border: "none", color: "#718096", cursor: "pointer", marginLeft: "auto", display: "flex", alignSelf: "flex-start", padding: "2px" }}
            >
              <X size={14} />
            </button>
          </div>
        )}
        {errorMsg && (
          <div className="toast-card error-toast">
            <AlertCircle size={18} style={{ color: "#ef4444", marginTop: "2px", flexShrink: 0 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "13px", fontWeight: "bold", color: "#fff" }}>Error</span>
              <span style={{ fontSize: "12px", color: "#a0aec0", lineHeight: "1.4" }}>{errorMsg}</span>
            </div>
            <button 
              onClick={() => setErrorMsg(null)} 
              style={{ background: "none", border: "none", color: "#718096", cursor: "pointer", marginLeft: "auto", display: "flex", alignSelf: "flex-start", padding: "2px" }}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Premium KPI Metrics Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card-glass" style={{ borderLeft: "4px solid #3b82f6" }}>
          <div>
            <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Refilling Jobs</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#fff", marginTop: "6px", fontFamily: "monospace" }}>{jobs.length}</div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Gas Refilling Contracts</div>
          </div>
          <div style={{ background: "rgba(59, 130, 246, 0.1)", padding: "10px", borderRadius: "12px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
            <span style={{ fontSize: "20px" }}>🎛️</span>
          </div>
        </div>

        <div className="kpi-card-glass" style={{ borderLeft: "4px solid #f59e0b" }}>
          <div>
            <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Active Queue</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#fff", marginTop: "6px", fontFamily: "monospace" }}>{jobs.filter(j => !["Order Delivered", "Order Dropped"].includes(j.currentStatus)).length}</div>
            <div style={{ fontSize: "11px", color: "#f59e0b", marginTop: "4px", display: "flex", alignItems: "center", gap: "3px" }}>
              <span className="status-pulse-dot pulse-amber" style={{ margin: 0 }}></span> In Production Pipeline
            </div>
          </div>
          <div style={{ background: "rgba(245, 158, 11, 0.1)", padding: "10px", borderRadius: "12px", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
            <span style={{ fontSize: "20px" }}>⚡</span>
          </div>
        </div>

        <div className="kpi-card-glass" style={{ borderLeft: "4px solid #10b981" }}>
          <div>
            <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Delivered Contracts</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#fff", marginTop: "6px", fontFamily: "monospace" }}>{jobs.filter(j => j.currentStatus === "Order Delivered").length}</div>
            <div style={{ fontSize: "11px", color: "#10b981", marginTop: "4px", display: "flex", alignItems: "center", gap: "3px" }}>
              <span className="status-pulse-dot pulse-green" style={{ margin: 0 }}></span> Dispatched & Verified
            </div>
          </div>
          <div style={{ background: "rgba(16, 185, 129, 0.1)", padding: "10px", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            <span style={{ fontSize: "20px" }}>🚛</span>
          </div>
        </div>

        <div className="kpi-card-glass" style={{ borderLeft: "4px solid #ef4444" }}>
          <div>
            <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Dropped Orders</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#fff", marginTop: "6px", fontFamily: "monospace" }}>{jobs.filter(j => j.currentStatus === "Order Dropped").length}</div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Cancelled Refilling</div>
          </div>
          <div style={{ background: "rgba(239, 68, 68, 0.1)", padding: "10px", borderRadius: "12px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
            <span style={{ fontSize: "20px" }}>❌</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Row Toolbar */}
      <div className="floating-toolbar" style={{ gap: "15px" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", flex: 1, minWidth: "260px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              placeholder="Search client, contact details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "11px 12px 11px 38px", background: "rgba(30, 30, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "#fff", fontSize: "13.5px", transition: "all 0.2s" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.boxShadow = "0 0 10px rgba(220, 38, 38, 0.15)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
            />
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            style={{ padding: "11px 15px", background: "rgba(30, 30, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "#fff", cursor: "pointer", fontSize: "13.5px", outline: "none" }}
          >
            <option value="all">All Years</option>
            {getFilterYears().map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "11px 15px", background: "rgba(30, 30, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "#fff", cursor: "pointer", fontSize: "13.5px", outline: "none" }}
          >
            <option value="all">All Statuses</option>
            <option value="Refilling Order Received">Refilling Order Received</option>
            <option value="Quotation Sent">Quotation Sent</option>
            <option value="Follow-up In Progress">Follow-up In Progress</option>
            <option value="Order Confirmed">Order Confirmed</option>
            <option value="Order Delivered">Order Delivered</option>
            <option value="Order Dropped">Order Dropped</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div style={{ background: "rgba(18, 18, 26, 0.45)", backdropFilter: "blur(20px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)", padding: "10px", overflowX: "auto", boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
            <div style={{ display: "inline-block", width: "24px", height: "24px", border: "3px solid rgba(220,38,38,0.2)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <div style={{ marginTop: "10px", fontSize: "14px" }}>Synchronizing gas inventory log...</div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "45px 20px", color: "#94a3b8" }}>
            <span style={{ fontSize: "28px" }}>📭</span>
            <div style={{ marginTop: "10px", fontSize: "14px", fontWeight: "600" }}>No refilling records matched</div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Adjust search terms or year/status dropdown values</div>
          </div>
        ) : (
          <table className="glass-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Client Name</th>
                <th>Contact Name</th>
                <th>Contact Phone</th>
                <th>Category</th>
                <th>Delivery Date</th>
                <th>Refilling Date</th>
                <th>Status</th>
                <th>Technicians</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job, index) => {
                const statusDotClass = 
                  job.currentStatus === "Order Delivered" ? "pulse-green" :
                  job.currentStatus === "Order Confirmed" ? "pulse-blue" :
                  job.currentStatus === "Order Dropped" ? "pulse-red" : "pulse-amber";

                const statusColor =
                  job.currentStatus === "Order Delivered" ? "#10b981" :
                  job.currentStatus === "Order Confirmed" ? "#60a5fa" :
                  job.currentStatus === "Order Dropped" ? "#f87171" : "#fbbf24";

                return (
                  <tr key={job.id}>
                    <td style={{ color: "#64748b", fontWeight: "600" }}>{index + 1}</td>
                    <td style={{ fontWeight: "600", color: "#fff" }}>{job.customer?.companyName || "N/A"}</td>
                    <td>{job.customer?.contactPerson}</td>
                    <td style={{ fontFamily: "monospace", color: "#94a3b8" }}>{job.customer?.phone}</td>
                    <td>
                      <span style={{ fontSize: "11px", textTransform: "uppercase", background: "rgba(255,255,255,0.05)", padding: "3px 6px", borderRadius: "5px", border: "1px solid rgba(255,255,255,0.04)" }}>
                        {job.requirementCategory || "SELECT"}
                      </span>
                    </td>
                    <td>{formatDate(job.deliveredDate)}</td>
                    <td style={{ color: "#10b981", fontWeight: "700" }}>{formatDate(job.amcDate)}</td>
                    <td>
                      <div style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: "8px", background: "rgba(30, 30, 45, 0.4)", border: "1px solid rgba(255,255,255,0.03)", fontSize: "12px", color: statusColor, fontWeight: "700" }}>
                        <span className={`status-pulse-dot ${statusDotClass}`} />
                        {job.currentStatus}
                      </div>
                    </td>
                    <td>
                      {job.assignments.length === 0 ? (
                        <span style={{ color: "#475569", fontSize: "12px", fontStyle: "italic" }}>Unassigned</span>
                      ) : (
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {job.assignments.map(a => (
                            <span key={a.id} style={{ fontSize: "11px", background: "rgba(59, 130, 246, 0.1)", color: "#93c5fd", padding: "2px 6px", borderRadius: "5px", border: "1px solid rgba(59,130,246,0.15)" }}>
                              {a.technician.fullName}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          onClick={() => handleOpenEdit(job)}
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "#fff",
                            padding: "7px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220, 38, 38, 0.15)"; e.currentTarget.style.borderColor = "rgba(220, 38, 38, 0.3)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                          title="Update Refilling details"
                        >
                          <Edit2 size={13} />
                        </button>
                        
                        <button
                          onClick={() => handleOpenAssign(job)}
                          style={{
                            background: "rgba(245, 158, 11, 0.08)",
                            border: "1px solid rgba(245, 158, 11, 0.2)",
                            color: "#f59e0b",
                            padding: "7px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(245, 158, 11, 0.18)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(245, 158, 11, 0.08)"; }}
                          title="Assign Technician"
                        >
                          <UserPlus size={13} />
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


      {/* Update Refilling Modal */}
      {isEditModalOpen && selectedJob && (
        <div className="slide-over-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setIsEditModalOpen(false); }}>
          <div className="slide-over-card">
            
            <div className="slide-over-header">
              <h2 style={{ fontSize: "18px", margin: 0, fontWeight: "bold", color: "#fff" }}>Update Refilling</h2>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: "none", border: "none", color: "#718096", cursor: "pointer", display: "flex", alignItems: "center" }}><X size={20} /></button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div className="slide-over-body" style={{ gap: "15px" }}>
                
                {/* Collapsible Card 1: Enquiry Status & Dates */}
                <div style={{ border: "1px solid #2d2d3a", borderRadius: "8px", overflow: "hidden" }}>
                  <div 
                    onClick={() => setIsStatusCardOpen(!isStatusCardOpen)}
                    style={{ padding: "12px 15px", background: "#13131c", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Calendar size={18} style={{ color: "#f59e0b" }} />
                      <span style={{ fontWeight: "600", fontSize: "14px" }}>Enquiry Status & Dates</span>
                    </div>
                    {isStatusCardOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>

                  {isStatusCardOpen && (
                    <div style={{ padding: "15px", background: "#181822", display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid #2d2d3a" }}>
                      <div>
                        <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Client (Company Name)*</label>
                        <input type="text" value={selectedJob.customer?.companyName || ""} readOnly style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#718096", cursor: "not-allowed" }} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                          <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Contact Person Name*</label>
                          <input type="text" value={selectedJob.customer?.contactPerson || ""} readOnly style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#718096", cursor: "not-allowed" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Contact No 1*</label>
                          <input type="text" value={selectedJob.customer?.phone || ""} readOnly style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#718096", cursor: "not-allowed" }} />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                          <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Delivered Date*</label>
                          <input type="date" value={deliveredDate} onChange={e => setDeliveredDate(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>No. of Years*</label>
                          <select value={amcYears} onChange={e => setAmcYears(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(y => (
                              <option key={y} value={String(y)}>{y} {y === 1 ? "Year" : "Years"}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Refilling Date*</label>
                        <input type="date" value={calculatedAmcDate} readOnly style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#10b981", fontWeight: "bold", cursor: "not-allowed" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Current Year Refilling Status*</label>
                        <select value={currentStatus} onChange={e => setCurrentStatus(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }}>
                          <option value="Refilling Order Received">Refilling Order Received</option>
                          <option value="Quotation Sent">Quotation Sent</option>
                          <option value="Follow-up In Progress">Follow-up In Progress</option>
                          <option value="Order Confirmed">Order Confirmed</option>
                          <option value="Order Delivered">Order Delivered</option>
                          <option value="Order Dropped">Order Dropped</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Collapsible Card 2: Follow Up */}
                <div style={{ border: "1px solid #2d2d3a", borderRadius: "8px", overflow: "hidden" }}>
                  <div 
                    onClick={() => setIsFollowUpCardOpen(!isFollowUpCardOpen)}
                    style={{ padding: "12px 15px", background: "#13131c", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <MessageSquare size={18} style={{ color: "#f59e0b" }} />
                      <span style={{ fontWeight: "600", fontSize: "14px" }}>Follow Up</span>
                    </div>
                    {isFollowUpCardOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>

                  {isFollowUpCardOpen && (
                    <div style={{ padding: "15px", background: "#181822", display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid #2d2d3a" }}>
                      <div>
                        <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Follow up Date*</label>
                        <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Followup Notes / Remarks*</label>
                        <textarea value={newRemarks} onChange={e => setNewRemarks(e.target.value)} rows={3} placeholder="Add follow-up notes updates here..." style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff", resize: "none" }} />
                      </div>
                      
                      <div style={{ marginTop: "10px" }}>
                        <h4 style={{ fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid #2d2d3a", paddingBottom: "6px", marginBottom: "8px" }}>Followup History</h4>
                        <div style={{ maxHeight: "150px", overflowY: "auto", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                          {selectedJob.followUps.length === 0 ? (
                            <div style={{ color: "#718096", fontSize: "12px" }}>No prior follow-up history logs.</div>
                          ) : (
                            selectedJob.followUps.map(f => (
                              <div key={f.id} style={{ fontSize: "12px", borderBottom: "1px solid #1a1a24", paddingBottom: "6px" }}>
                                <span style={{ color: "#ff4d80", fontWeight: "500" }}>{formatDate(f.createdAt)}</span>: {f.remarks}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="slide-over-footer">
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ padding: "8px 16px", background: "transparent", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#a0aec0", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", background: "#ff4d80", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer" }}>Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Technician Modal */}
      {isAssignModalOpen && selectedJob && (
        <div className="slide-over-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setIsAssignModalOpen(false); }}>
          <div className="slide-over-card">
            
            <div className="slide-over-header">
              <h2 style={{ fontSize: "18px", margin: 0, fontWeight: "bold", color: "#fff" }}>Assign Technician</h2>
              <button onClick={() => setIsAssignModalOpen(false)} style={{ background: "none", border: "none", color: "#718096", cursor: "pointer", display: "flex", alignItems: "center" }}><X size={20} /></button>
            </div>

            <form onSubmit={handleAssignSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div className="slide-over-body">
                
                {/* Client info */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", background: "#111116", padding: "10px", borderRadius: "6px", border: "1px solid #1a1a24" }}>
                  <div>
                    <span style={{ fontSize: "10px", color: "#718096", display: "block" }}>CLIENT NAME*</span>
                    <span style={{ fontSize: "12px", fontWeight: "bold" }}>{selectedJob.customer?.companyName || "N/A"}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", color: "#718096", display: "block" }}>CONTACT PERSON*</span>
                    <span style={{ fontSize: "12px" }}>{selectedJob.customer?.contactPerson}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", color: "#718096", display: "block" }}>CONTACT NUMBER*</span>
                    <span style={{ fontSize: "12px" }}>{selectedJob.customer?.phone}</span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Visit/Service Date *</label>
                    <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Assign For</label>
                    <input type="text" value="REFILLING" readOnly style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#718096", cursor: "not-allowed" }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Address</label>
                  <textarea value={selectedJob.customer?.address || ""} readOnly rows={2} style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#718096", cursor: "not-allowed", resize: "none" }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Admin Instructions</label>
                    <textarea value={adminInstructions} onChange={e => setAdminInstructions(e.target.value)} rows={2} style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff", resize: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Technician Instructions</label>
                    <textarea value={technicianInstructions} onChange={e => setTechnicianInstructions(e.target.value)} rows={2} style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff", resize: "none" }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Customer Location</label>
                  <input type="text" value={customerLocation} onChange={e => setCustomerLocation(e.target.value)} placeholder="Coordinates or URL..." style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "6px", fontWeight: "bold" }}>Assign REFILLING To (Technicians) *</label>
                  <div style={{ background: "#111116", border: "1px solid #2d2d3a", borderRadius: "8px", padding: "10px", maxHeight: "120px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {technicians.length === 0 ? (
                      <div style={{ fontSize: "12px", color: "#718096" }}>No active technicians found.</div>
                    ) : (
                      technicians.map(tech => (
                        <label key={tech.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={selectedTechIds.includes(tech.id)}
                            onChange={() => handleTechToggle(tech.id)}
                            style={{ width: "16px", height: "16px", cursor: "pointer" }}
                          />
                          <span>{tech.fullName} ({tech.phone})</span>
                        </label>
                      ))
                    )}
                  </div>
                  <p style={{ fontSize: "11px", color: "#ff6c37", marginTop: "8px", lineHeight: "1.4", marginBlockEnd: 0 }}>
                    * Deselect existing technician (if any) for new assignment
                    <br />* Delete existing assignment from technician view screen
                  </p>
                </div>

              </div>

              <div className="slide-over-footer">
                <button type="button" onClick={() => setIsAssignModalOpen(false)} style={{ padding: "8px 16px", background: "transparent", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#a0aec0", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", background: "#ff6c37", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer" }}>Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
