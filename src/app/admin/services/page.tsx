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
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Settings
} from "lucide-react";
import { useConfig } from "@/context/ConfigContext";

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
  deliveredDate: string | null;
  visitDate: string | null;
  adminInstructions: string | null;
  technicianInstructions: string | null;
  customerLocation: string | null;
  assignFor: string | null;
  assignments: Assignment[];
  stageData?: string | null;
  createdAt: string;
  serialNumber?: string | null;
  capacity?: string | null;
  extinguisherType?: string | null;
  itemDescription?: string | null;
  amcYears?: number | null;
  amcDate?: string | null;
}

interface Technician {
  id: string;
  fullName: string;
  phone: string;
  isActive: boolean;
  role: string;
}

export default function ServiceDashboardPage() {
  const { config } = useConfig();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState("all");
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, any>>({});

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
  const [isCustomerCardOpen, setIsCustomerCardOpen] = useState(true);
  const [isEquipmentCardOpen, setIsEquipmentCardOpen] = useState(true);
  const [isRequirementCardOpen, setIsRequirementCardOpen] = useState(true);
  const [isCustomFieldsCardOpen, setIsCustomFieldsCardOpen] = useState(true);

  // --- Form Fields ---
  // Service Update Form fields
  const [visitDate, setVisitDate] = useState("");
  const [currentStatus, setCurrentStatus] = useState("Pending");

  // Read-only reference contexts
  const [serialNumber, setSerialNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [extinguisherType, setExtinguisherType] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone2, setCustomerPhone2] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [deliveredDate, setDeliveredDate] = useState("");
  const [amcYears, setAmcYears] = useState("");
  const [amcDate, setAmcDate] = useState("");
  const [requirementDetails, setRequirementDetails] = useState("");

  // Assign Technician Form fields
  const [assignVisitDate, setAssignVisitDate] = useState("");
  const [adminInstructions, setAdminInstructions] = useState("");
  const [technicianInstructions, setTechnicianInstructions] = useState("");
  const [customerLocation, setCustomerLocation] = useState("");
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);

  // Fetch all data
  const fetchData = async () => {
    try {
      // Fetch services jobs
      const jobsRes = await fetch(`/api/jobs?stage=SERVICES&status=${statusFilter}&search=${encodeURIComponent(search)}`);
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData);
      }

      // Fetch active technicians
      const techRes = await fetch("/api/employees?status=active");
      if (techRes.ok) {
        const techData = await techRes.json();
        setTechnicians(techData.filter((t: any) => t.role === "TECHNICIAN"));
      }
    } catch (err) {
      console.error("Error loading services dashboard data:", err);
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
  }, [search, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategoryTab]);

  // Handle Edit Service Modal Open
  const handleOpenEdit = (job: Job) => {
    setSelectedJob(job);
    setVisitDate(job.visitDate ? job.visitDate.split("T")[0] : "");
    setCurrentStatus(job.currentStatus === "Pending Service" ? "Pending" : (job.currentStatus || "Pending"));
    setIsStatusCardOpen(true);
    setIsCustomerCardOpen(true);
    setIsEquipmentCardOpen(true);
    setIsRequirementCardOpen(true);
    setIsCustomFieldsCardOpen(true);

    // Initialize read-only specs
    setSerialNumber(job.serialNumber || "");
    setCapacity(job.capacity || "");
    setExtinguisherType(job.extinguisherType || "");
    setItemDescription(job.itemDescription || "");
    setRequirementDetails(job.requirementDetails || "");
    
    // Customer
    setCustomerEmail(job.customer?.email || "");
    setCustomerPhone2(job.customer?.phone2 || "");
    setCustomerAddress(job.customer?.address || "");

    // AMC
    setDeliveredDate(job.deliveredDate ? job.deliveredDate.split("T")[0] : "");
    setAmcYears(job.amcYears ? String(job.amcYears) : "");
    setAmcDate(job.amcDate ? job.amcDate.split("T")[0] : "");

    setCustomFieldsData(job.stageData ? JSON.parse(job.stageData) : {});
    setIsEditModalOpen(true);
  };

  // Submit Service Update Form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    if (currentStatus === "Select") {
      setErrorMsg("Please select a valid Service Status");
      setTimeout(() => setErrorMsg(null), 3000);
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

      setSuccessMsg("Service details updated successfully!");
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
    setAssignVisitDate(job.visitDate ? job.visitDate.split("T")[0] : "");
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
          visitDate: assignVisitDate || null,
          adminInstructions,
          technicianInstructions,
          customerLocation,
          technicianIds: selectedTechIds,
          assignFor: "SERVICE",
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

  const filteredJobs = jobs.filter(job => {
    if (selectedCategoryTab === "all") return true;
    return job.requirementCategory === selectedCategoryTab;
  });

  // Client-side pagination calculations
  const totalItems = filteredJobs.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

  return (
    <div style={{ padding: "20px", color: "#e2e8f0", position: "relative", minHeight: "100%" }}>
      {/* Background Accent Glow Spots */}
      <div className="glow-spot-bg" style={{ width: "400px", height: "400px", top: "-10%", left: "20%" }}></div>
      <div className="glow-spot-bg" style={{ width: "300px", height: "300px", bottom: "10%", right: "5%", background: "radial-gradient(circle, rgba(239, 68, 68, 0.02) 0%, rgba(0, 0, 0, 0) 70%)" }}></div>

      {/* Page Title & Subtitle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", position: "relative", zIndex: 1 }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "800", margin: 0, letterSpacing: "-0.03em", background: "linear-gradient(to right, #fff 40%, #cbd5e1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {config?.stages?.SERVICES?.displayName || "Service"} Dispatch
          </h1>
          <p style={{ fontSize: "13.5px", color: "#94a3b8", margin: "4px 0 0 0" }}>Real-time inspector tracking, annual visits schedules, and cylinder inspection tasks</p>
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
            <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Service Visits</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#fff", marginTop: "6px", fontFamily: "monospace" }}>{jobs.length}</div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Cylinder Annual Services</div>
          </div>
          <div style={{ background: "rgba(59, 130, 246, 0.1)", padding: "10px", borderRadius: "12px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
            <span style={{ fontSize: "20px" }}>🛠️</span>
          </div>
        </div>

        <div className="kpi-card-glass" style={{ borderLeft: "4px solid #f59e0b" }}>
          <div>
            <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pending Services</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#fff", marginTop: "6px", fontFamily: "monospace" }}>{jobs.filter(j => j.currentStatus !== "Completed").length}</div>
            <div style={{ fontSize: "11px", color: "#f59e0b", marginTop: "4px", display: "flex", alignItems: "center", gap: "3px" }}>
              <span className="status-pulse-dot pulse-amber" style={{ margin: 0 }}></span> Waiting Inspector Visit
            </div>
          </div>
          <div style={{ background: "rgba(245, 158, 11, 0.1)", padding: "10px", borderRadius: "12px", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
            <span style={{ fontSize: "20px" }}>📆</span>
          </div>
        </div>

        <div className="kpi-card-glass" style={{ borderLeft: "4px solid #10b981" }}>
          <div>
            <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Completed Inspections</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#fff", marginTop: "6px", fontFamily: "monospace" }}>{jobs.filter(j => j.currentStatus === "Completed").length}</div>
            <div style={{ fontSize: "11px", color: "#10b981", marginTop: "4px", display: "flex", alignItems: "center", gap: "3px" }}>
              <span className="status-pulse-dot pulse-green" style={{ margin: 0 }}></span> Fully Audited & Signed
            </div>
          </div>
          <div style={{ background: "rgba(16, 185, 129, 0.1)", padding: "10px", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            <span style={{ fontSize: "20px" }}>✅</span>
          </div>
        </div>

        <div className="kpi-card-glass" style={{ borderLeft: "4px solid #8b5cf6" }}>
          <div>
            <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Active Field Crew</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#fff", marginTop: "6px", fontFamily: "monospace" }}>{jobs.filter(j => j.assignments.length > 0).length}</div>
            <div style={{ fontSize: "11px", color: "#8b5cf6", marginTop: "4px", display: "flex", alignItems: "center", gap: "3px" }}>
              <span className="status-pulse-dot pulse-purple" style={{ margin: 0 }}></span> Assigned Dispatch Tickets
            </div>
          </div>
          <div style={{ background: "rgba(139, 92, 246, 0.1)", padding: "10px", borderRadius: "12px", border: "1px solid rgba(139, 92, 246, 0.2)" }}>
            <span style={{ fontSize: "20px" }}>👷</span>
          </div>
        </div>
      </div>

      {/* Floating Toolbar (Search Bar Row) */}
      <div className="floating-toolbar" style={{ gap: "15px", marginBottom: "20px" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
          <input
            type="text"
            placeholder="Search client name, contact details, service info..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "11px 12px 11px 38px", background: "rgba(30, 30, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "#fff", fontSize: "13.5px", transition: "all 0.2s" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.boxShadow = "0 0 10px rgba(220, 38, 38, 0.15)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
          />
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
        </div>
      </div>

      {/* Category Tabs filter */}
      <div className="category-tabs-container" style={{ display: "flex", gap: "8px", marginBottom: "15px", overflowX: "auto", paddingBottom: "5px" }}>
        {["all", ...(config?.categories || ["CCTV", "New Fire Extinguisher", "Refilling"])].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategoryTab(cat)}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              border: "1px solid " + (selectedCategoryTab === cat ? "var(--primary)" : "rgba(255,255,255,0.06)"),
              background: selectedCategoryTab === cat ? "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)" : "rgba(18, 18, 26, 0.4)",
              color: selectedCategoryTab === cat ? "#fff" : "#94a3b8",
              cursor: "pointer",
              fontSize: "12.5px",
              fontWeight: "600",
              boxShadow: selectedCategoryTab === cat ? "0 4px 10px rgba(var(--primary-rgb), 0.2)" : "none",
              transition: "all 0.2s"
            }}
          >
            {cat === "all" ? "All Types" : cat}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div style={{ background: "rgba(18, 18, 26, 0.45)", backdropFilter: "blur(20px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)", padding: "10px", overflowX: "auto", boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
            <div style={{ display: "inline-block", width: "24px", height: "24px", border: "3px solid rgba(220,38,38,0.2)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <div style={{ marginTop: "10px", fontSize: "14px" }}>Querying dispatch databases...</div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "45px 20px", color: "#94a3b8" }}>
            <span style={{ fontSize: "28px" }}>📭</span>
            <div style={{ marginTop: "10px", fontSize: "14px", fontWeight: "600" }}>No services records matched</div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Adjust search terms to find client inspect lists</div>
          </div>
        ) : (
          <table className="glass-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Client Name</th>
                <th>Contact Name</th>
                <th>Contact Phone</th>
                <th>Service Date</th>
                <th>Status</th>
                <th>Technicians</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedJobs.map((job, index) => {
                const displayStatus = job.currentStatus === "Pending Service" ? "Pending" : job.currentStatus;
                const statusDotClass = displayStatus === "Completed" ? "pulse-green" : "pulse-amber";
                const statusColor = displayStatus === "Completed" ? "#10b981" : "#fbbf24";

                return (
                  <tr key={job.id}>
                    <td style={{ color: "#64748b", fontWeight: "600" }}>{startIndex + index + 1}</td>
                    <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                      <div>{job.customer?.companyName || "N/A"}</div>
                      {job.serialNumber && (
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px", fontWeight: "normal" }}>
                          SN: <span style={{ fontFamily: "monospace", color: "var(--accent)" }}>{job.serialNumber}</span> {job.extinguisherType && `(${job.extinguisherType}${job.capacity ? ` - ${job.capacity}` : ""})`}
                        </div>
                      )}
                    </td>
                    <td>{job.customer?.contactPerson}</td>
                    <td style={{ fontFamily: "monospace", color: "#94a3b8" }}>{job.customer?.phone}</td>
                    <td style={{ color: "#fff", fontWeight: "600" }}>{formatDate(job.visitDate)}</td>
                    <td>
                      <div style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: "8px", background: "rgba(30, 30, 45, 0.4)", border: "1px solid rgba(255,255,255,0.03)", fontSize: "12px", color: statusColor, fontWeight: "700" }}>
                        <span className={`status-pulse-dot ${statusDotClass}`} />
                        {displayStatus}
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
                          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)"; }}
                          title="Service Update"
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
        
        {/* Pagination Footer */}
        {!loading && totalItems > 0 && (
          <div className="pagination-container" style={{ position: "relative", zIndex: 1, marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              Showing {startIndex + 1} to {endIndex} of {totalItems} entries
            </span>
            <div style={{ display: "flex", gap: "5px" }}>
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
              
              <span style={{ fontSize: "13px", color: "var(--text-secondary)", minWidth: "80px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
      </div>

      {/* Service Update Modal */}
      {isEditModalOpen && selectedJob && (
        <div className="slide-over-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setIsEditModalOpen(false); }}>
          <div className="slide-over-card">
            
            <div className="slide-over-header">
              <h2 style={{ fontSize: "18px", margin: 0, fontWeight: "bold", color: "#fff" }}>Service Update</h2>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: "none", border: "none", color: "#718096", cursor: "pointer", display: "flex", alignItems: "center" }}><X size={20} /></button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div className="slide-over-body" style={{ gap: "12px", padding: "1.5rem" }}>
                
                {/* Card 1: Customer Info */}
                <div style={{ border: "1px solid var(--border-glass)", borderRadius: "8px", overflow: "hidden" }}>
                  <div 
                    onClick={() => setIsCustomerCardOpen(!isCustomerCardOpen)}
                    style={{ padding: "10px 12px", background: "var(--bg-input)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Calendar size={16} style={{ color: "var(--accent)" }} />
                      <span style={{ fontWeight: "600", fontSize: "13px" }}>Customer & Site Information</span>
                    </div>
                    {isCustomerCardOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>

                  {isCustomerCardOpen && (
                    <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--border-glass)" }}>
                      <div className="responsive-form-grid">
                        <div>
                          <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Client (Company Name)</label>
                          <input type="text" value={selectedJob.customer?.companyName || ""} readOnly className="theme-input-disabled" style={{ width: "100%", padding: "7px", borderRadius: "6px" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Contact Person Name</label>
                          <input type="text" value={selectedJob.customer?.contactPerson || ""} readOnly className="theme-input-disabled" style={{ width: "100%", padding: "7px", borderRadius: "6px" }} />
                        </div>
                      </div>
                      <div className="responsive-form-grid">
                        <div>
                          <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Contact Phone 1</label>
                          <input type="text" value={selectedJob.customer?.phone || ""} readOnly className="theme-input-disabled" style={{ width: "100%", padding: "7px", borderRadius: "6px" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Contact Phone 2</label>
                          <input type="text" value={customerPhone2 || "N/A"} readOnly className="theme-input-disabled" style={{ width: "100%", padding: "7px", borderRadius: "6px" }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Email Address</label>
                        <input type="text" value={customerEmail || "N/A"} readOnly className="theme-input-disabled" style={{ width: "100%", padding: "7px", borderRadius: "6px" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Site Address</label>
                        <textarea value={customerAddress || "No site address logged."} readOnly className="theme-input-disabled" rows={2} style={{ width: "100%", padding: "7px", borderRadius: "6px", resize: "none" }} />
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
                      <span style={{ fontWeight: "600", fontSize: "13px" }}>Equipment & AMC Reference</span>
                    </div>
                    {isEquipmentCardOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>

                  {isEquipmentCardOpen && (
                    <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--border-glass)" }}>
                      <div className="responsive-form-grid">
                        <div>
                          <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>{config?.brand?.labels?.serialNumber || "Cylinder Serial No"}</label>
                          <input type="text" value={serialNumber || "N/A"} readOnly className="theme-input-disabled" style={{ width: "100%", padding: "7px", borderRadius: "6px" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>{config?.brand?.labels?.extinguisherType || "Extinguisher Type"}</label>
                          <input type="text" value={extinguisherType || "N/A"} readOnly className="theme-input-disabled" style={{ width: "100%", padding: "7px", borderRadius: "6px" }} />
                        </div>
                      </div>
                      <div className="responsive-form-grid">
                        <div>
                          <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>{config?.brand?.labels?.capacity || "Cylinder Capacity"}</label>
                          <input type="text" value={capacity || "N/A"} readOnly className="theme-input-disabled" style={{ width: "100%", padding: "7px", borderRadius: "6px" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>{config?.brand?.labels?.deliveredDate || "Delivered Date"}</label>
                          <input type="text" value={deliveredDate ? formatDate(deliveredDate) : "N/A"} readOnly className="theme-input-disabled" style={{ width: "100%", padding: "7px", borderRadius: "6px" }} />
                        </div>
                      </div>
                      <div className="responsive-form-grid">
                        <div>
                          <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>{config?.brand?.labels?.amcYears || "AMC Years Coverage"}</label>
                          <input type="text" value={amcYears ? `${amcYears} Year(s)` : "N/A"} readOnly className="theme-input-disabled" style={{ width: "100%", padding: "7px", borderRadius: "6px" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>{config?.brand?.labels?.amcDate || "AMC Renewal Date"}</label>
                          <input type="text" value={amcDate ? formatDate(amcDate) : "N/A"} readOnly className="theme-input-disabled" style={{ width: "100%", padding: "7px", borderRadius: "6px", color: "#10b981", fontWeight: "bold" }} />
                        </div>
                      </div>
                      {itemDescription && (
                        <div>
                          <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>{config?.brand?.labels?.itemDescription || "Item Description"}</label>
                          <input type="text" value={itemDescription} readOnly className="theme-input-disabled" style={{ width: "100%", padding: "7px", borderRadius: "6px" }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card 3: Original Requirement Context */}
                {requirementDetails && (
                  <div style={{ border: "1px solid var(--border-glass)", borderRadius: "8px", overflow: "hidden" }}>
                    <div 
                      onClick={() => setIsRequirementCardOpen(!isRequirementCardOpen)}
                      style={{ padding: "10px 12px", background: "var(--bg-input)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <MessageSquare size={16} style={{ color: "var(--accent)" }} />
                        <span style={{ fontWeight: "600", fontSize: "13px" }}>Original Enquiry Context</span>
                      </div>
                      {isRequirementCardOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                    {isRequirementCardOpen && (
                      <div style={{ padding: "12px", borderTop: "1px solid var(--border-glass)" }}>
                        <textarea value={requirementDetails} readOnly className="theme-input-disabled" rows={2} style={{ width: "100%", padding: "7px", borderRadius: "6px", resize: "none" }} />
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
                      <span style={{ fontWeight: "600", fontSize: "13px" }}>Service Schedule & Status</span>
                    </div>
                    {isStatusCardOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>

                  {isStatusCardOpen && (
                    <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--border-glass)" }}>
                      <div className="responsive-form-grid">
                        <div>
                          <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Service Date*</label>
                          <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} required style={{ width: "100%", padding: "7px", borderRadius: "6px" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Service Status*</label>
                          <select value={currentStatus} onChange={e => setCurrentStatus(e.target.value)} required style={{ width: "100%", padding: "7px", borderRadius: "6px" }}>
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
                        <span style={{ fontWeight: "600", fontSize: "13px" }}>Custom Fields</span>
                      </div>
                      {isCustomFieldsCardOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>

                    {isCustomFieldsCardOpen && (
                      <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--border-glass)" }}>
                        {config.stages.SERVICES.fields.map(field => {
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
                                <select value={val} onChange={e => onChange(e.target.value)} required={field.required} style={{ width: "100%", padding: "7px", borderRadius: "6px" }}>
                                  <option value="">SELECT</option>
                                  {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              ) : field.type === "multi-select" ? (
                                <input type="text" value={val} onChange={e => onChange(e.target.value)} placeholder="Comma-separated values" required={field.required} style={{ width: "100%", padding: "7px", borderRadius: "6px" }} />
                              ) : (
                                <input type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"} value={val} onChange={e => onChange(e.target.value)} required={field.required} style={{ width: "100%", padding: "7px", borderRadius: "6px" }} />
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
              <div className="slide-over-footer theme-modal-card-header" style={{ padding: "12px 1.5rem", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-secondary)", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", background: "var(--accent)", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer", fontWeight: "600" }}>Update Details</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Technician Modal */}
      {isAssignModalOpen && selectedJob && (
        <div className="slide-over-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setIsAssignModalOpen(false); }}>
          <div className="slide-over-card theme-modal-card">
            
            <div className="slide-over-header theme-modal-card-header">
              <h2 style={{ fontSize: "17px", margin: 0, fontWeight: "bold" }}>Assign Technician</h2>
              <button onClick={() => setIsAssignModalOpen(false)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center" }}><X size={18} /></button>
            </div>

            <form onSubmit={handleAssignSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div className="slide-over-body" style={{ gap: "12px", padding: "1.5rem" }}>
                
                {/* Client info summary */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", background: "var(--bg-input)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
                  <div>
                    <span style={{ fontSize: "10px", color: "var(--text-secondary)", display: "block" }}>CLIENT NAME</span>
                    <span style={{ fontSize: "12px", fontWeight: "bold" }}>{selectedJob.customer?.companyName || "N/A"}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", color: "var(--text-secondary)", display: "block" }}>CONTACT PERSON</span>
                    <span style={{ fontSize: "12px" }}>{selectedJob.customer?.contactPerson}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", color: "var(--text-secondary)", display: "block" }}>CONTACT NUMBER</span>
                    <span style={{ fontSize: "12px" }}>{selectedJob.customer?.phone}</span>
                  </div>
                </div>

                <div className="responsive-form-grid">
                  <div>
                    <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Visit/Service Date *</label>
                    <input type="date" value={assignVisitDate} onChange={e => setAssignVisitDate(e.target.value)} required style={{ width: "100%", padding: "7px", borderRadius: "6px" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Assign For</label>
                    <input type="text" value="SERVICE" readOnly className="theme-input-disabled" style={{ width: "100%", padding: "7px", borderRadius: "6px" }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Address</label>
                  <textarea value={selectedJob.customer?.address || ""} readOnly className="theme-input-disabled" rows={2} style={{ width: "100%", padding: "7px", borderRadius: "6px", resize: "none" }} />
                </div>

                <div className="responsive-form-grid">
                  <div>
                    <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Admin Instructions</label>
                    <textarea value={adminInstructions} onChange={e => setAdminInstructions(e.target.value)} rows={2} style={{ width: "100%", padding: "7px", borderRadius: "6px", resize: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Technician Instructions</label>
                    <textarea value={technicianInstructions} onChange={e => setTechnicianInstructions(e.target.value)} rows={2} style={{ width: "100%", padding: "7px", borderRadius: "6px", resize: "none" }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>Customer Location</label>
                  <input type="text" value={customerLocation} onChange={e => setCustomerLocation(e.target.value)} placeholder="Coordinates or URL..." style={{ width: "100%", padding: "7px", borderRadius: "6px" }} />
                </div>

                <div>
                  <label style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "bold" }}>Assign SERVICE To (Technicians) *</label>
                  <div style={{ background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "8px", maxHeight: "120px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {technicians.length === 0 ? (
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>No active technicians found.</div>
                    ) : (
                      technicians.map(tech => (
                        <label key={tech.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={selectedTechIds.includes(tech.id)}
                            onChange={() => handleTechToggle(tech.id)}
                            style={{ width: "15px", height: "15px", cursor: "pointer" }}
                          />
                          <span>{tech.fullName} ({tech.phone})</span>
                        </label>
                      ))
                    )}
                  </div>
                  <p style={{ fontSize: "10.5px", color: "#ff6c37", marginTop: "6px", lineHeight: "1.3", marginBlockEnd: 0 }}>
                    * Deselect existing technician (if any) for new assignment
                    <br />* Delete existing assignment from technician view screen
                  </p>
                </div>

              </div>

              <div className="slide-over-footer theme-modal-card-header" style={{ padding: "12px 1.5rem", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button type="button" onClick={() => setIsAssignModalOpen(false)} style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-secondary)", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", background: "var(--accent)", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer", fontWeight: "600" }}>Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
