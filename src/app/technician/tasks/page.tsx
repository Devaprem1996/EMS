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
import { useRef } from "react";
import { useConfig } from "@/context/ConfigContext";
import DynamicForm from "@/components/DynamicForm";
import TaskEditModal from "@/components/TaskEditModal";

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
  stageData?: string | null;
}

interface Assignment {
  id: string;
  jobId: string;
  technicianId: string;
  status: string;
  assignedBy?: string;
  assignedAt: string;
  technician: {
    id: string;
    fullName: string;
    phone: string;
  };
  job: Job;
}

import dynamic from "next/dynamic";
import useSWR from "swr";
import { Scan, Navigation, MapPin } from "lucide-react";

const QRScannerModal = dynamic(() => import("@/components/QRScannerModal"), {
  ssr: false,
  loading: () => <div style={{ color: "#a1a1aa", fontSize: "14px", textAlign: "center", padding: "20px" }}>Loading scanner...</div>
});

export default function TechnicianTasksPage() {
  const { config } = useConfig();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [sortByProximity, setSortByProximity] = useState(false);

  // Load GPS Location
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSortByProximity(true);
      }, (err) => {
        console.warn("Geolocation access denied or unavailable:", err);
      });
    }
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Table Density View Minimization State
  const [tableDensity, setTableDensity] = useState<"compact" | "normal">("compact");

  useEffect(() => {
    const saved = localStorage.getItem("ems_table_density");
    if (saved === "compact" || saved === "normal") {
      setTableDensity(saved);
    }
  }, []);

  const toggleTableDensity = (density: "compact" | "normal") => {
    setTableDensity(density);
    localStorage.setItem("ems_table_density", density);
  };

  // Notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAsg, setSelectedAsg] = useState<Assignment | null>(null);

  const fetcher = (url: string) => fetch(url).then(r => r.json());

  const { data: tasksData, mutate: mutateTasks } = useSWR(
    `/api/tasks?search=${encodeURIComponent(search)}&type=${selectedType}&page=${currentPage}&limit=${pageSize}`,
    fetcher
  );

  useEffect(() => {
    if (tasksData && tasksData.data) {
      setAssignments(tasksData.data);
      setLoading(false);
    }
  }, [tasksData]);

  const fetchData = () => {
    mutateTasks();
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
    setIsModalOpen(true);
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

  const filteredAssignments = assignments;

  // Server-side pagination metadata
  const totalItems = tasksData?.meta?.totalItems || 0;
  const totalPages = tasksData?.meta?.totalPages || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + filteredAssignments.length, totalItems);
  const paginatedAssignments = filteredAssignments;

  const totalAsgs = totalItems;
  const completedAsgs = filteredAssignments.filter(a => a.status === "Completed").length; // Approximation based on current page
  const pendingAsgs = Math.max(0, totalAsgs - completedAsgs);

  return (
    <div style={{ padding: "20px", position: "relative", minHeight: "100%" }}>
      {/* Background Accent Glow Spots */}
      <div className="glow-spot-bg" style={{ width: "400px", height: "400px", top: "-10%", left: "30%" }}></div>
      <div className="glow-spot-bg" style={{ width: "300px", height: "300px", bottom: "10%", right: "10%", background: "radial-gradient(circle, rgba(239, 68, 68, 0.03) 0%, rgba(0, 0, 0, 0) 70%)" }}></div>

      {/* Page Title */}
      <div style={{ marginBottom: "20px", position: "relative", zIndex: 1 }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "var(--text-primary)", margin: 0 }}>Technician View</h1>
      </div>

      {/* KPI Summary Cards */}
      <div className="kpi-grid" style={{ marginBottom: "25px", position: "relative", zIndex: 1 }}>
        <div className="kpi-card-glass" style={{ borderLeft: "4px solid #3b82f6" }}>
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Assignments</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-primary)", marginTop: "6px", fontFamily: "monospace" }}>{totalAsgs}</div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>Assigned Tasks</div>
          </div>
          <div style={{ background: "rgba(59, 130, 246, 0.1)", padding: "10px", borderRadius: "12px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
            <span style={{ fontSize: "20px" }}>📋</span>
          </div>
        </div>

        <div className="kpi-card-glass" style={{ borderLeft: "4px solid #f59e0b" }}>
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pending Tasks</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-primary)", marginTop: "6px", fontFamily: "monospace" }}>{pendingAsgs}</div>
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
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Completed Tasks</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-primary)", marginTop: "6px", fontFamily: "monospace" }}>{completedAsgs}</div>
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

      {/* Search & Action Toolbar */}
      <div style={{ display: "flex", gap: "10px", width: "100%", marginBottom: "20px", zIndex: 1, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "260px" }} className="search-container">
          <input
            type="text"
            placeholder="Search client name, tag serial, assignment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <Search size={18} className="search-icon-inside" />
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

        <button
          onClick={() => setIsScannerOpen(true)}
          className="btn-primary"
          style={{ padding: "0.6rem 1.25rem", fontSize: "0.85rem" }}
        >
          <Scan size={16} /> Scan Tag / Barcode
        </button>

        <button
          onClick={handleGetLocation}
          className="btn-secondary"
          style={{ padding: "0.6rem 1.25rem", fontSize: "0.85rem", background: sortByProximity ? "rgba(56, 189, 248, 0.2)" : undefined, color: sortByProximity ? "#38bdf8" : undefined }}
        >
          <Navigation size={16} /> {sortByProximity ? "📍 Proximity Active" : "Sort by Proximity"}
        </button>
      </div>

      {/* Camera QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(scannedText) => {
          setSearch(scannedText);
          setSuccessMsg(`Scanned Equipment Serial Tag: ${scannedText}`);
        }}
      />

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
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              border: "1px solid " + (selectedType === tab.key ? "var(--primary)" : "rgba(255,255,255,0.06)"),
              background: selectedType === tab.key ? "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)" : "rgba(18, 18, 26, 0.4)",
              color: selectedType === tab.key ? "#fff" : "#94a3b8",
              cursor: "pointer",
              fontSize: "12.5px",
              fontWeight: "600",
              boxShadow: selectedType === tab.key ? "0 4px 10px rgba(var(--primary-rgb), 0.2)" : "none",
              transition: "all 0.2s"
            }}
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
          <table className={`premium-table desktop-only-table table-density-${tableDensity}`} style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Client Name</th>
                <th>Contact No1</th>
                <th>Completed Status</th>
                <th>Assignment Type</th>
                <th>Assigned By</th>
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
                      <span className={`pill-badge ${
                        displayStatus === "Completed" ? "pill-badge-green" :
                        displayStatus === "Assign For Service" ? "pill-badge-blue" : "pill-badge-amber"
                      }`}>
                        <span className={`priority-dot ${
                          displayStatus === "Completed" ? "priority-dot-green" :
                          displayStatus === "Assign For Service" ? "priority-dot-amber" : "priority-dot-amber"
                        }`}></span>
                        {displayStatus}
                      </span>
                    </td>
                    <td style={{ fontWeight: "bold" }}>{asg.job.assignFor || "DELIVERY"}</td>
                    <td style={{ fontWeight: "600", color: "var(--accent, #a3e635)" }}>
                      {(!asg.assignedBy || /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(asg.assignedBy) || (asg.assignedBy.length >= 32 && asg.assignedBy.includes("-") && !asg.assignedBy.includes(" "))) ? "Admin User" : asg.assignedBy}
                    </td>
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
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(var(--primary-rgb, 59, 130, 246), 0.15)"; e.currentTarget.style.borderColor = "rgba(var(--primary-rgb, 59, 130, 246), 0.3)"; }}
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

        {/* Mobile View Card Grid */}
        {!loading && paginatedAssignments.length > 0 && (
          <div className="mobile-only-cards" style={{ display: "none" }}>
            {paginatedAssignments.map((asg, index) => {
              const displayStatus = asg.status === "ASSIGNED" ? "Pending" : asg.status;
              const locUrl = asg.job.customerLocation;
              const tel = asg.job.customer?.phone;

              return (
                <div 
                  key={asg.id} 
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-glass)",
                    borderRadius: "16px",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                    boxShadow: "var(--shadow-glass)",
                    position: "relative"
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span 
                      style={{
                        fontSize: "11px",
                        fontWeight: "800",
                        color: "var(--accent)",
                        background: "rgba(var(--accent-rgb, 163, 230, 53), 0.1)",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontFamily: "monospace"
                      }}
                    >
                      {asg.job.jobNumber}
                    </span>
                    <span className={`pill-badge ${
                      displayStatus === "Completed" ? "pill-badge-green" :
                      displayStatus === "Assign For Service" ? "pill-badge-blue" : "pill-badge-amber"
                    }`}>
                      <span className={`priority-dot ${
                        displayStatus === "Completed" ? "priority-dot-green" :
                        displayStatus === "Assign For Service" ? "priority-dot-amber" : "priority-dot-amber"
                      }`}></span>
                      {displayStatus}
                    </span>
                  </div>

                  {/* Client Info */}
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)", margin: "0 0 4px 0" }}>
                      {asg.job.customer?.companyName || "N/A"}
                    </h3>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                      Contact: {asg.job.customer?.contactPerson || "N/A"}
                    </p>
                  </div>

                  {/* Parameters Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.03)", fontSize: "13px" }}>
                    <div>
                      <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "11px", marginBottom: "2px" }}>Stage Type</span>
                      <strong style={{ color: "var(--text-primary)" }}>{asg.job.assignFor || "DELIVERY"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "11px", marginBottom: "2px" }}>Assigned On</span>
                      <strong style={{ color: "var(--text-primary)" }}>{formatDate(asg.assignedAt)}</strong>
                    </div>
                  </div>

                  {/* Actions (Call / Navigate) */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    {tel && (
                      <a 
                        href={`tel:${tel}`} 
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "10px",
                          borderRadius: "8px",
                          background: "rgba(59, 130, 246, 0.15)",
                          border: "1px solid rgba(59, 130, 246, 0.3)",
                          color: "#60a5fa",
                          fontSize: "12px",
                          fontWeight: "700",
                          textDecoration: "none",
                          textAlign: "center"
                        }}
                      >
                        📞 Call Client
                      </a>
                    )}
                    {locUrl && (
                      <a 
                        href={locUrl.startsWith("http") ? locUrl : `https://google.com/maps/search/?api=1&query=${encodeURIComponent(locUrl)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "10px",
                          borderRadius: "8px",
                          background: "rgba(163, 230, 53, 0.15)",
                          border: "1px solid rgba(163, 230, 53, 0.3)",
                          color: "var(--accent)",
                          fontSize: "12px",
                          fontWeight: "700",
                          textDecoration: "none",
                          textAlign: "center"
                        }}
                      >
                        📍 Navigate ↗
                      </a>
                    )}
                  </div>

                  {/* Edit action */}
                  <button
                    onClick={() => handleOpenEdit(asg)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
                      border: "none",
                      borderRadius: "10px",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)"
                    }}
                  >
                    ✏️ Update Task Details
                  </button>
                </div>
              );
            })}
          </div>
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
        <TaskEditModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedAsg={selectedAsg}
          config={config}
          onSuccess={() => {
            fetchData();
            setSuccessMsg("Task details updated successfully!");
            setTimeout(() => setSuccessMsg(null), 3000);
          }}
          onError={(err) => {
            setErrorMsg(err);
            setTimeout(() => setErrorMsg(null), 4000);
          }}
        />
      )}

      {/* CSS Media Queries for Responsive Viewport Switching */}
      <style jsx global>{`
        @media (max-width: 991px) {
          .desktop-only-table {
            display: none !important;
          }
          .mobile-only-cards {
            display: flex !important;
            flex-direction: column;
            gap: 16px;
            margin-bottom: 24px;
          }
        }
        @media (min-width: 992px) {
          .desktop-only-table {
            display: table !important;
          }
          .mobile-only-cards {
            display: none !important;
          }
        }
        @media (max-width: 580px) {
          .responsive-form-row {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
      `}</style>

    </div>
  );
}
