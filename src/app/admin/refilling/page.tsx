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
  RotateCcw,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Settings,
  Zap
} from "lucide-react";
import { useConfig } from "@/context/ConfigContext";
import useSWR from "swr";
import RefillEditModal from "@/components/RefillEditModal";
import AssignTechnicianModal from "@/components/AssignTechnicianModal";
import KanbanBoard from "@/components/KanbanBoard";

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
  assignedBy?: string;
  assignedAt?: string;
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
  stageData?: string | null;
  createdAt: string;
  serialNumber?: string | null;
  capacity?: string | null;
  extinguisherType?: string | null;
  itemDescription?: string | null;
}

interface Technician {
  id: string;
  fullName: string;
  phone: string;
  isActive: boolean;
  role: string;
}

export default function RefillingDashboardPage() {
  const { config } = useConfig();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState("all");
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, any>>({});
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Table Density View Minimization State
  const [tableDensity, setTableDensity] = useState<"compact" | "normal">("compact");

  useEffect(() => {
    const saved = localStorage.getItem("ems_table_density");
    if (saved === "compact" || saved === "normal") {
      setTableDensity(saved);
    }

    const params = new URLSearchParams(window.location.search);
    const urlSearch = params.get("search");
    if (urlSearch) {
      setSearch(urlSearch);
    }
  }, []);

  const toggleTableDensity = (density: "compact" | "normal") => {
    setTableDensity(density);
    localStorage.setItem("ems_table_density", density);
  };

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
  const [isCustomerCardOpen, setIsCustomerCardOpen] = useState(true);
  const [isEquipmentCardOpen, setIsEquipmentCardOpen] = useState(true);
  const [isCustomFieldsCardOpen, setIsCustomFieldsCardOpen] = useState(true);

  // --- Form Fields ---
  // Update Refilling Form fields
  const [deliveredDate, setDeliveredDate] = useState("");
  const [amcYears, setAmcYears] = useState("1");
  const [calculatedAmcDate, setCalculatedAmcDate] = useState("");
  const [currentStatus, setCurrentStatus] = useState("Refilling Order Received");
  const [followUpDate, setFollowUpDate] = useState("");
  const [newRemarks, setNewRemarks] = useState("");

  // Cylinder/Equipment Specs
  const [serialNumber, setSerialNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [extinguisherType, setExtinguisherType] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [requirementDetails, setRequirementDetails] = useState("");

  // Assign Technician Form fields
  const [visitDate, setVisitDate] = useState("");
  const [adminInstructions, setAdminInstructions] = useState("");
  const [technicianInstructions, setTechnicianInstructions] = useState("");
  const [customerLocation, setCustomerLocation] = useState("");
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);

  const fetcher = (url: string) => fetch(url).then(r => r.json());

  const { data: jobsData, mutate: mutateJobs } = useSWR(
    `/api/jobs?stage=REFILLING&status=${statusFilter}&search=${encodeURIComponent(search)}&category=${selectedCategoryTab}&year=${yearFilter}&page=${currentPage}&limit=${pageSize}`,
    fetcher
  );

  const { data: allJobsData } = useSWR(
    `/api/jobs?stage=REFILLING&limit=1000`,
    fetcher
  );

  const allRefillJobs = Array.isArray(allJobsData) ? allJobsData : (allJobsData?.data || []);
  const totalRefill = allRefillJobs.length;
  const activeProd = allRefillJobs.filter((j: any) => !["order delivered", "order dropped"].includes(j.currentStatus?.toLowerCase())).length;
  const deliveredRefill = allRefillJobs.filter((j: any) => j.currentStatus?.toLowerCase() === "order delivered").length;
  
  const activePct = totalRefill > 0 ? Math.round((activeProd / totalRefill) * 100) : 0;
  const delPct = totalRefill > 0 ? Math.round((deliveredRefill / totalRefill) * 100) : 0;

  const { data: techRawData, mutate: mutateTechnicians } = useSWR(
    "/api/employees?status=active",
    fetcher
  );

  useEffect(() => {
    if (jobsData && jobsData.data) {
      setJobs(jobsData.data);
    }
  }, [jobsData]);

  useEffect(() => {
    if (techRawData) {
      setTechnicians(techRawData.filter((t: any) => t.role === "TECHNICIAN"));
    }
  }, [techRawData]);

  useEffect(() => {
    if (jobsData && techRawData) {
      setLoading(false);
    }
  }, [jobsData, techRawData]);

  useEffect(() => {
    const handleSearchChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setSearch(customEvent.detail);
      }
    };
    window.addEventListener("search-param-change", handleSearchChange);
    return () => {
      window.removeEventListener("search-param-change", handleSearchChange);
    };
  }, []);

  const fetchData = () => {
    mutateJobs();
    mutateTechnicians();
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchData();
      setCurrentPage(1); // Reset page on filters changes
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [yearFilter, selectedCategoryTab]);

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
    setIsCustomerCardOpen(true);
    setIsEquipmentCardOpen(true);
    setIsCustomFieldsCardOpen(true);
    
    // Initialize cylinder specs
    setSerialNumber(job.serialNumber || "");
    setCapacity(job.capacity || "");
    setExtinguisherType(job.extinguisherType || "");
    setItemDescription(job.itemDescription || "");
    setRequirementDetails(job.requirementDetails || "");

    setCustomFieldsData(job.stageData ? JSON.parse(job.stageData) : {});
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

  const handleStatusChange = async (ticket: Job, newStatus: string) => {
    if (!window.confirm(`Are you sure you want to change status of ${ticket.jobNumber} to "${newStatus}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/jobs/${ticket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentStatus: newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      setSuccessMsg(`Status of ${ticket.jobNumber || "Job"} updated to "${newStatus}"!`);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update status");
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // Handle Assign Technician Modal Open
  const handleOpenAssign = (job: Job) => {
    setSelectedJob(job);
    setIsAssignModalOpen(true);
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
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear - 2; y <= currentYear + 4; y++) {
      years.push(String(y));
    }
    return years;
  };

  // Server-side filtered jobs
  const filteredJobs = jobs;

  // Server-side pagination metadata
  const totalItems = jobsData?.meta?.totalItems || 0;
  const totalPages = jobsData?.meta?.totalPages || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + jobs.length, totalItems);
  const paginatedJobs = jobs;

  return (
    <div style={{ padding: "20px", color: "#e2e8f0", position: "relative", minHeight: "100%" }}>
      {/* Background Accent Glow Spots */}
      <div className="glow-spot-bg" style={{ width: "400px", height: "400px", top: "-10%", left: "20%" }}></div>
      <div className="glow-spot-bg" style={{ width: "300px", height: "300px", bottom: "10%", right: "5%", background: "radial-gradient(circle, rgba(239, 68, 68, 0.02) 0%, rgba(0, 0, 0, 0) 70%)" }}></div>

      {/* Page Title & Subtitle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", position: "relative", zIndex: 1 }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "800", margin: 0, letterSpacing: "-0.03em", background: "linear-gradient(to right, #fff 40%, #cbd5e1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {config?.stages?.REFILLING?.displayName || "Refilling"} Control Center
          </h1>
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

      {/* Flux Design System: Metric Breakdown Grid & High-Contrast Analytics Widget */}
      <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
        
        {/* Flux Card 1: Refilling Jobs Progress Bars */}
        <div style={{
          background: "var(--bg-card)",
          borderRadius: "24px",
          padding: "1.5rem",
          border: "1px solid var(--border-glass)",
          boxShadow: "var(--shadow-glow)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
                Total Refilling Volume
              </span>
              <span style={{ background: "rgba(163, 230, 53, 0.18)", color: "#a3e635", fontSize: "0.75rem", fontWeight: "800", padding: "3px 10px", borderRadius: "9999px" }}>
                +12% volume
              </span>
            </div>
             <div style={{ fontSize: "2.4rem", fontWeight: "800", letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: "1.25rem" }}>
              {totalRefill || jobs.length} <span style={{ fontSize: "0.9rem", fontWeight: "500", color: "var(--text-muted)" }}>refilling jobs</span>
            </div>
          </div>

          {/* Flux Horizontal Progress Bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: "700", marginBottom: "0.35rem" }}>
                <span>Active Production ({activeProd})</span>
                <span style={{ color: "#c084fc" }}>{activePct}%</span>
              </div>
              <div style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
                <div style={{ width: `${activePct}%`, height: "100%", background: "#c084fc", borderRadius: "9999px" }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: "700", marginBottom: "0.35rem" }}>
                <span>Delivered & Verified ({deliveredRefill})</span>
                <span style={{ color: "#a3e635" }}>{delPct}%</span>
              </div>
              <div style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
                <div style={{ width: `${delPct}%`, height: "100%", background: "#a3e635", borderRadius: "9999px" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Flux Card 2: Radial Donut & Gas Capacity Speedometer Gauge Widget */}
        <div style={{
          background: "#111116",
          borderRadius: "24px",
          padding: "1.5rem",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", fontWeight: "700" }}>
                <span style={{ background: "rgba(192, 132, 252, 0.15)", color: "#c084fc", padding: "6px", borderRadius: "8px" }}>🎛️</span>
                <div style={{ padding: "0 10px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>
                    {config?.brand?.labels?.capacity || "Capacity"} & Purity Speedometer
                  </span>
                  <div style={{ marginTop: "10px", height: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", overflow: "hidden" }}></div>
                </div>
              </div>
              <span style={{ fontSize: "0.78rem", color: "#c084fc", background: "rgba(192, 132, 252, 0.12)", padding: "4px 10px", borderRadius: "9999px", fontWeight: "700" }}>
                99.2% Quality Grade
              </span>
            </div>

            <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem" }}>
              <div>
                <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#c084fc" }}>99.2%</div>
                <div style={{ fontSize: "0.72rem", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em" }}>Hydro-Test Rate</div>
              </div>
              <div>
                <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#a3e635" }}>1.8 Days</div>
                <div style={{ fontSize: "0.72rem", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em" }}>Plant Turnaround</div>
              </div>
            </div>
          </div>

          {/* SVG Radial Speedometer Arc Gauge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", padding: "10px 0" }}>
            <div style={{ position: "relative", width: "110px", height: "70px", display: "flex", justifyContent: "center" }}>
              <svg viewBox="0 0 100 60" style={{ width: "100%", height: "100%" }}>
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" strokeLinecap="round" />
                <path d="M 10 50 A 40 40 0 0 1 78 20" fill="none" stroke="url(#refillRadialGrad)" strokeWidth="10" strokeLinecap="round" />
                <defs>
                  <linearGradient id="refillRadialGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#a3e635" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: "absolute", bottom: "4px", textAlign: "center" }}>
                <span style={{ fontSize: "14px", fontWeight: "800", color: "#ffffff" }}>94%</span>
                <div style={{ fontSize: "9px", color: "#71717a" }}>Capacity</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#c084fc" }}></span>
                <span style={{ color: "#ffffff", fontWeight: "600" }}>CO2 & Foam (480 L)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#a3e635" }}></span>
                <span style={{ color: "#ffffff", fontWeight: "600" }}>ABC Powder (320 L)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#38bdf8" }}></span>
                <span style={{ color: "#ffffff", fontWeight: "600" }}>Clean Agent (150 L)</span>
              </div>
            </div>
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
              style={{ width: "100%", padding: "11px 12px 11px 38px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "13.5px", transition: "all 0.2s" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.boxShadow = "0 0 10px rgba(220, 38, 38, 0.15)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-glass)"; e.currentTarget.style.boxShadow = "none"; }}
            />
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {/* View Mode Switcher */}
          <div style={{ display: "flex", alignItems: "center", gap: "3px", background: "var(--bg-input)", padding: "3px", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: "700",
                borderRadius: "7px",
                border: "none",
                background: viewMode === "list" ? "var(--accent)" : "transparent",
                color: viewMode === "list" ? "#0f172a" : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              title="Standard list view"
            >
              📋 List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: "700",
                borderRadius: "7px",
                border: "none",
                background: viewMode === "kanban" ? "var(--accent)" : "transparent",
                color: viewMode === "kanban" ? "#0f172a" : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              title="Kanban Board view"
            >
              🎴 Kanban
            </button>
          </div>

          {/* Table View Density Control */}
          <div style={{ display: "flex", alignItems: "center", gap: "3px", background: "var(--bg-input)", padding: "3px", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
            <button
              type="button"
              onClick={() => toggleTableDensity("compact")}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: "700",
                borderRadius: "7px",
                border: "none",
                background: tableDensity === "compact" ? "var(--accent)" : "transparent",
                color: tableDensity === "compact" ? "#0f172a" : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              title="Minimize table row view"
            >
              ⚡ Compact
            </button>
            <button
              type="button"
              onClick={() => toggleTableDensity("normal")}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: "700",
                borderRadius: "7px",
                border: "none",
                background: tableDensity === "normal" ? "var(--accent)" : "transparent",
                color: tableDensity === "normal" ? "#0f172a" : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              title="Standard table view"
            >
              📑 Standard
            </button>
          </div>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="robust-select"
            style={{ minWidth: "130px" }}
          >
            <option value="all">All Years</option>
            {getFilterYears().map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="robust-select"
            style={{ minWidth: "210px" }}
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

      {/* Data Table or Kanban Board */}
      {viewMode === "kanban" ? (
        loading ? (
          <div style={{ background: "var(--bg-card)", backdropFilter: "blur(20px)", borderRadius: "16px", border: "1px solid var(--border-glass)", padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
            <div style={{ display: "inline-block", width: "24px", height: "24px", border: "3px solid rgba(220,38,38,0.2)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <div style={{ marginTop: "10px", fontSize: "14px" }}>Synchronizing gas inventory log...</div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ background: "var(--bg-card)", backdropFilter: "blur(20px)", borderRadius: "16px", border: "1px solid var(--border-glass)", padding: "45px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
            <span style={{ fontSize: "28px" }}>📭</span>
            <div style={{ marginTop: "10px", fontSize: "14px", fontWeight: "600" }}>No refilling records matched</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Adjust search terms or year/status dropdown values</div>
          </div>
        ) : (
          <KanbanBoard
            tickets={filteredJobs}
            statusKey="currentStatus"
            columns={[
              { key: "Refilling Order Received", label: "Order Received", color: "#fbbf24", badgeBg: "rgba(251, 191, 36, 0.15)" },
              { key: "Quotation Sent", label: "Quotation Sent", color: "#60a5fa", badgeBg: "rgba(96, 165, 250, 0.15)" },
              { key: "Follow-up In Progress", label: "Follow-up In Progress", color: "#c084fc", badgeBg: "rgba(192, 132, 252, 0.15)" },
              { key: "Order Confirmed", label: "Order Confirmed", color: "#a3e635", badgeBg: "rgba(163, 230, 83, 0.15)" },
              { key: "Order Delivered", label: "Order Delivered", color: "#10b981", badgeBg: "rgba(16, 185, 129, 0.15)" },
              { key: "Order Dropped", label: "Order Dropped", color: "#f87171", badgeBg: "rgba(248, 113, 113, 0.15)" }
            ]}
            onEdit={(ticket) => {
              setSelectedJob(ticket);
              setIsEditModalOpen(true);
            }}
            onAssign={(ticket) => {
              setSelectedJob(ticket);
              setIsAssignModalOpen(true);
            }}
            onStatusChange={handleStatusChange}
            stageName="REFILLING"
          />
        )
      ) : (
        <>
          {/* Data Table */}
          <div style={{ background: "var(--bg-card)", backdropFilter: "blur(20px)", borderRadius: "16px", border: "1px solid var(--border-glass)", padding: "10px", overflowX: "auto", boxShadow: "var(--shadow-glass)" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                <div style={{ display: "inline-block", width: "24px", height: "24px", border: "3px solid rgba(220,38,38,0.2)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                <div style={{ marginTop: "10px", fontSize: "14px" }}>Synchronizing gas inventory log...</div>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "45px 20px", color: "var(--text-secondary)" }}>
                <span style={{ fontSize: "28px" }}>📭</span>
                <div style={{ marginTop: "10px", fontSize: "14px", fontWeight: "600" }}>No refilling records matched</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Adjust search terms or year/status dropdown values</div>
              </div>
            ) : (
              <table className={`glass-table table-density-${tableDensity}`}>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Job Number</th>
                    <th>Client Name</th>
                    <th>Cylinder Serial No</th>
                    <th>Type</th>
                    <th>Capacity</th>
                    <th>Stage Status</th>
                    <th>Technicians</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedJobs.map((job, index) => {
                    return (
                      <tr key={job.id}>
                        <td style={{ color: "#64748b", fontWeight: "600" }}>{startIndex + index + 1}</td>
                        <td style={{ fontFamily: "monospace", fontWeight: "700", color: "var(--accent)" }}>{job.jobNumber}</td>
                        <td style={{ fontWeight: "600", color: "#fff" }}>{job.customer?.companyName || "N/A"}</td>
                        <td style={{ fontFamily: "monospace", color: "#c084fc", fontWeight: "600" }}>{job.serialNumber || "N/A"}</td>
                        <td>{job.extinguisherType || "N/A"}</td>
                        <td>{job.capacity || "N/A"}</td>
                        <td>
                          <span className={`pill-badge ${
                            job.currentStatus === "Order Delivered" || job.currentStatus === "Closed" ? "pill-badge-green" :
                            job.currentStatus === "Order Confirmed" ? "pill-badge-blue" :
                            job.currentStatus === "Order Dropped" ? "pill-badge-red" : "pill-badge-amber"
                          }`}>
                            <span className={`priority-dot ${
                              job.currentStatus === "Order Delivered" || job.currentStatus === "Closed" ? "priority-dot-green" :
                              job.currentStatus === "Order Confirmed" ? "priority-dot-blue" :
                              job.currentStatus === "Order Dropped" ? "priority-dot-red" : "priority-dot-amber"
                            }`}></span>
                            {job.currentStatus || "Order Confirmed"}
                          </span>
                        </td>
                        <td>
                          {job.assignments.length === 0 ? (
                            <span style={{ color: "#475569", fontSize: "12px", fontStyle: "italic" }}>Unassigned</span>
                          ) : (
                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                              {job.assignments.map((asg) => (
                                <span 
                                  key={asg.id} 
                                  style={{
                                    fontSize: "10px",
                                    background: "rgba(192, 132, 252, 0.15)",
                                    color: "#c084fc",
                                    padding: "2px 6px",
                                    borderRadius: "9999px",
                                    fontWeight: "600",
                                    border: "1px solid rgba(192, 132, 252, 0.2)"
                                  }}
                                  title={asg.technician?.phone}
                                >
                                  {asg.technician?.fullName.split(" ")[0]}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                            <button
                              onClick={() => {
                                setSelectedJob(job);
                                setIsEditModalOpen(true);
                              }}
                              style={{
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                color: "var(--text-secondary)",
                                padding: "7px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220, 38, 38, 0.15)"; e.currentTarget.style.borderColor = "rgba(220, 38, 38, 0.3)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                              title="Edit Refilling details"
                            >
                              <Edit2 size={13} />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedJob(job);
                                setIsAssignModalOpen(true);
                              }}
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
                              title="Assign Technicians"
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

          {/* Pagination Footer */}
          {!loading && totalItems > 0 && (
            <div className="pagination-container" style={{ position: "relative", zIndex: 1, marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <span className="pagination-info" style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  Showing {startIndex + 1} to {endIndex} of {totalItems} entries
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Page Size:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    style={{
                      background: "rgba(18, 18, 26, 0.6)",
                      border: "1px solid var(--border-glass)",
                      borderRadius: "6px",
                      color: "var(--text-primary)",
                      padding: "4px 8px",
                      fontSize: "12px",
                      cursor: "pointer"
                    }}
                  >
                    {[10, 20, 50, 100].map(sz => (
                      <option key={sz} value={sz}>{sz}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pagination-controls" style={{ display: "flex", gap: "5px" }}>
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
                
                <span style={{ fontSize: "13px", color: "var(--text-primary)", minWidth: "80px", textAlign: "center", alignSelf: "center" }}>
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
        </>
      )}

      {/* Update Refilling Modal */}
      {isEditModalOpen && selectedJob && (
        <RefillEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          selectedJob={selectedJob}
          config={config}
          onSuccess={() => {
            fetchData();
            setIsEditModalOpen(false);
          }}
          onError={setErrorMsg}
        />
      )}

      {/* Assign Technician Modal */}
      {isAssignModalOpen && selectedJob && (
        <AssignTechnicianModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          selectedJob={selectedJob}
          technicians={technicians}
          assignFor="REFILLING"
          onSuccess={() => {
            fetchData();
            setIsAssignModalOpen(false);
            setSuccessMsg("Technician assigned successfully!");
            setTimeout(() => setSuccessMsg(null), 3000);
          }}
          onError={setErrorMsg}
        />
      )}

    </div>
  );
}
