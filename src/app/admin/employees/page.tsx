"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  X, 
  UserCheck, 
  UserX, 
  ShieldAlert, 
  Key, 
  Check, 
  UserPlus,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight
} from "lucide-react";
import { useConfig } from "@/context/ConfigContext";

interface Employee {
  id: string;
  mobileNumber: string;
  role: "ADMIN" | "TECHNICIAN" | "SUPER_ADMIN";
  fullName: string;
  contactPhone: string;
  employeeNumber: string;
  email: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function EmployeeMasterPage() {
  const { config } = useConfig();
  // Data States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "inactive"
  const [stats, setStats] = useState<any>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // Form Fields
  const [fullName, setFullName] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "TECHNICIAN">("TECHNICIAN");
  const [isActive, setIsActive] = useState(true);

  // Form UI states
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // Fetch employees
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employees?search=${encodeURIComponent(search)}&status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await fetch("/api/jobs/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  // Trigger fetch when search or filter changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEmployees();
      fetchStats();
      setCurrentPage(1); // Reset page on new filters
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, statusFilter]);

  // Client-side pagination calculations
  const totalItems = employees.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedEmployees = employees.slice(startIndex, endIndex);

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFullName("");
    // Basic auto-increment guess based on list length
    setEmployeeNumber(`E${String(employees.length + 1).padStart(3, "0")}`);
    setPhone("");
    setEmail("");
    setPassword("");
    setRole("TECHNICIAN");
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFullName(emp.fullName || "");
    setEmployeeNumber(emp.employeeNumber || "");
    setPhone(emp.contactPhone || "");
    setEmail(emp.email || "");
    setPassword(""); // Leave empty for edit
    setRole(emp.role === "SUPER_ADMIN" ? "ADMIN" : emp.role);
    setIsActive(emp.isActive);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit Handler (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    const payload = {
      fullName,
      employeeNumber,
      phone,
      email,
      role,
      isActive,
      ...(password ? { password } : {}), // only send password if populated
    };

    // Add validation
    if (!editingEmployee && !password) {
      setFormError("Password is required for new employees");
      setFormLoading(false);
      return;
    }

    try {
      const url = editingEmployee ? `/api/employees/${editingEmployee.id}` : "/api/employees";
      const method = editingEmployee ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process request");
      }

      setSuccessMessage(editingEmployee ? "Employee updated successfully!" : "Employee added successfully!");
      setIsModalOpen(false);
      fetchEmployees();

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  // Calculate KPI Summary Stats
  const activeCount = employees.filter(e => e.isActive).length;
  const technicianCount = employees.filter(e => e.role === "TECHNICIAN" && e.isActive).length;
  const adminCount = employees.filter(e => (e.role === "ADMIN" || e.role === "SUPER_ADMIN") && e.isActive).length;
  const inactiveCount = employees.filter(e => !e.isActive).length;

  return (
    <div style={{ position: "relative", minHeight: "100%" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "800", margin: 0, letterSpacing: "-0.03em", background: "linear-gradient(to right, #fff 40%, #cbd5e1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Employee Master
          </h1>
          <p style={{ fontSize: "13.5px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>Configure system workforce, assignment authorization, and role access privileges</p>
        </div>
        <button
          onClick={handleOpenAdd}
          style={{
            padding: "10px 22px",
            background: "linear-gradient(135deg, #a3e635 0%, #84cc16 100%)",
            color: "#0f172a",
            border: "none",
            borderRadius: "9999px",
            fontWeight: "800",
            fontSize: "14px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 6px 20px rgba(163, 230, 53, 0.3)",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 25px rgba(163, 230, 53, 0.45)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(163, 230, 53, 0.3)";
          }}
        >
          <UserPlus size={17} />
          <span>Register Employee</span>
        </button>
      </div>

      {/* Flux Design System: Metric Breakdown Grid & High-Contrast Analytics Widget */}
      <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
        
        {/* Flux Card 1: Employee Breakdown Progress Bars */}
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
                Total Authorized Staff
              </span>
              <span style={{ background: "rgba(163, 230, 53, 0.18)", color: "#a3e635", fontSize: "0.75rem", fontWeight: "800", padding: "3px 10px", borderRadius: "9999px" }}>
                {activeCount} Active
              </span>
            </div>
            <div style={{ fontSize: "2.4rem", fontWeight: "800", letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: "1.25rem" }}>
              {employees.length} <span style={{ fontSize: "0.9rem", fontWeight: "500", color: "var(--text-muted)" }}>registered profiles</span>
            </div>
          </div>

          {/* Flux Horizontal Progress Bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: "700", marginBottom: "0.35rem" }}>
                <span>Field Technicians ({technicianCount})</span>
                <span style={{ color: "#a3e635" }}>{Math.round((technicianCount / (employees.length || 1)) * 100)}%</span>
              </div>
              <div style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
                <div style={{ width: `${Math.round((technicianCount / (employees.length || 1)) * 100)}%`, height: "100%", background: "#a3e635", borderRadius: "9999px" }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: "700", marginBottom: "0.35rem" }}>
                <span>Administrators ({adminCount})</span>
                <span style={{ color: "#c084fc" }}>{Math.round((adminCount / (employees.length || 1)) * 100)}%</span>
              </div>
              <div style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
                <div style={{ width: `${Math.round((adminCount / (employees.length || 1)) * 100)}%`, height: "100%", background: "#c084fc", borderRadius: "9999px" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Flux Card 2: High-Contrast Feature Analytics Widget */}
        <div style={{
          background: "var(--bg-card)",
          borderRadius: "24px",
          padding: "1.5rem",
          border: "1px solid var(--border-glass)",
          boxShadow: "var(--shadow-glow)",
          color: "var(--text-primary)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", fontWeight: "700" }}>
                <span style={{ background: "var(--bg-input)", padding: "6px", borderRadius: "8px" }}>👥</span>
                Field Dispatch Readiness
              </div>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", background: "var(--bg-input)", padding: "4px 10px", borderRadius: "9999px" }}>
                Active Teams
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#10b981" }}>
                  {stats?.month?.onTimeRate || "98.4%"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Service Reliability</div>
              </div>
              <div>
                <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#a3e635" }}>
                  {stats?.month?.avgTurnaround || "14 Min"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Avg Response Time</div>
              </div>
            </div>
          </div>

          {/* Mini Sparkline Bar Viz */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "42px", paddingTop: "8px" }}>
            {(stats?.month?.bars || [
              { label: "Jan", valTarget: 40, valActual: 60 },
              { label: "Feb", valTarget: 55, valActual: 70 },
              { label: "Mar", valTarget: 70, valActual: 85 },
              { label: "Apr", valTarget: 60, valActual: 75 },
              { label: "May", valTarget: 80, valActual: 90 },
              { label: "Jun", valTarget: 95, valActual: 100 },
            ]).map((bar: any, i: number, arr: any[]) => {
              const maxVal = Math.max(...arr.map(b => Math.max(b.valTarget || 1, b.valActual || 1)));
              const h1 = `${Math.round(((bar.valTarget || 0) / maxVal) * 100)}%`;
              const h2 = `${Math.round(((bar.valActual || 0) / maxVal) * 100)}%`;
              const isActive = i === arr.length - 1;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%" }}>
                  <div style={{ width: "100%", flex: 1, display: "flex", gap: "2px", alignItems: "flex-end" }}>
                    <div style={{ flex: 1, height: h1, background: isActive ? "#a3e635" : "var(--border-glass)", borderRadius: "4px" }}></div>
                    <div style={{ flex: 1, height: h2, background: isActive ? "#c084fc" : "var(--border-glass)", borderRadius: "4px" }}></div>
                  </div>
                  <span style={{ fontSize: "0.68rem", color: isActive ? "#a3e635" : "var(--text-muted)", fontWeight: isActive ? "800" : "500" }}>
                    {bar.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="alert-banner" style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#10b981" }}>
          <Check size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filter Toolbar Row */}
      <div className="filter-toolbar" style={{ display: "flex", gap: "10px", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <div className="search-container" style={{ maxWidth: "340px", flex: 1 }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search employee by name, ID, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={18} className="search-icon-inside" />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
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
            className={`filter-pill-btn ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All Users ({employees.length})
          </button>
          <button 
            className={`filter-pill-btn ${statusFilter === "active" ? "active" : ""}`}
            onClick={() => setStatusFilter("active")}
          >
            Active ({activeCount})
          </button>
          <button 
            className={`filter-pill-btn ${statusFilter === "inactive" ? "active" : ""}`}
            onClick={() => setStatusFilter("inactive")}
          >
            Inactive ({inactiveCount})
          </button>
        </div>
      </div>

      {/* Employees Data Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
            <div className="spinner"></div>
          </div>
        ) : employees.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-secondary)" }}>
            No employees found matching the filters.
          </div>
        ) : (
          <table className={`premium-table table-density-${tableDensity}`}>
            <thead>
              <tr>
                <th style={{ width: "70px" }}>S.No</th>
                <th>Employee Code</th>
                <th>Employee Details</th>
                <th>Contact Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th style={{ width: "100px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmployees.map((emp, index) => (
                <tr key={emp.id}>
                  <td>{startIndex + index + 1}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontWeight: "700", color: "var(--text-primary)" }}>
                    {emp.employeeNumber || "N/A"}
                  </td>
                  <td>
                    <div className="user-avatar-cell">
                      <div className="user-avatar-circle">
                        {emp.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-avatar-info">
                        <span className="user-avatar-name">{emp.fullName}</span>
                        <span className="user-avatar-sub">{emp.email || emp.contactPhone}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{emp.contactPhone}</td>
                  <td>
                    <span 
                      className={`pill-badge ${emp.role === "ADMIN" ? "pill-badge-red" : "pill-badge-blue"}`}
                    >
                      <span className={`priority-dot ${emp.role === "ADMIN" ? "priority-dot-red" : "priority-dot-amber"}`}></span>
                      {emp.role === "ADMIN" ? "Administrator" : "Field Technician"}
                    </span>
                  </td>
                  <td>
                    <span className={`pill-badge ${emp.isActive ? "pill-badge-green" : "pill-badge-amber"}`}>
                      {emp.isActive ? (
                        <>
                          <UserCheck size={13} />
                          Active
                        </>
                      ) : (
                        <>
                          <UserX size={13} />
                          Inactive
                        </>
                      )}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button 
                      onClick={() => handleOpenEdit(emp)} 
                      className="action-btn edit-btn"
                      title="Edit Employee"
                      aria-label="Edit Employee"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && totalItems > 0 && (
        <div className="pagination-container" style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <span className="pagination-info">
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



      {/* Enhanced Flux Register & Edit Employee Modal */}
      {isModalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }} onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="modal-card theme-modal-card" style={{
            width: "100%",
            maxWidth: "540px",
            boxShadow: "var(--shadow-glass)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}>
            
            {/* Modal Header */}
            <div className="theme-modal-card-header" style={{
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--border-glass)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "9999px",
                  background: role === "ADMIN" ? "var(--accent-purple-glow)" : "var(--accent-green-glow)",
                  color: role === "ADMIN" ? "var(--accent-purple)" : "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {editingEmployee ? <Edit2 size={18} /> : <UserPlus size={18} />}
                </div>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: "800", margin: 0, color: "var(--text-primary)" }}>
                    {editingEmployee ? "Edit Employee Profile" : "Register New Employee"}
                  </h2>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                    {editingEmployee ? "Modify authorization roles and system credentials" : "Create new account credentials for staff dispatch"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "var(--bg-input)",
                  border: "none",
                  color: "var(--text-muted)",
                  width: "32px",
                  height: "32px",
                  borderRadius: "9999px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s"
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
              {formError && (
                <div style={{
                  background: "var(--accent-rose-glow)",
                  border: "1px solid var(--accent-rose)",
                  color: "var(--accent-rose)",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  marginBottom: "18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <ShieldAlert size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Role Interactive Switcher Tabs */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>
                  System Role Authorization *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setRole("TECHNICIAN")}
                    style={{
                      padding: "12px",
                      borderRadius: "14px",
                      border: "1px solid",
                      borderColor: role === "TECHNICIAN" ? "var(--accent)" : "var(--border-glass)",
                      background: role === "TECHNICIAN" ? "var(--accent-green-glow)" : "var(--bg-input)",
                      color: role === "TECHNICIAN" ? "var(--accent)" : "var(--text-secondary)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                      fontWeight: "700",
                      fontSize: "13px",
                      transition: "all 0.2s"
                    }}
                  >
                    <span>👨‍🔧 Field Technician</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("ADMIN")}
                    style={{
                      padding: "12px",
                      borderRadius: "14px",
                      border: "1px solid",
                      borderColor: role === "ADMIN" ? "var(--accent-purple)" : "var(--border-glass)",
                      background: role === "ADMIN" ? "var(--accent-purple-glow)" : "var(--bg-input)",
                      color: role === "ADMIN" ? "var(--accent-purple)" : "var(--text-secondary)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                      fontWeight: "700",
                      fontSize: "13px",
                      transition: "all 0.2s"
                    }}
                  >
                    <span>🔑 Administrator</span>
                  </button>
                </div>
              </div>

              {/* Form Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                
                {/* Full Name */}
                <div style={{ gridColumn: "span 2", position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-card)" }}>
                  <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-card)", padding: "0 4px", fontSize: "11px", color: "var(--accent)", fontWeight: "600" }}>Full Name *</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="transparent-input"
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontSize: "14px",
                      padding: "4px 0",
                      color: "var(--text-primary)"
                    }}
                  />
                </div>

                {/* Employee ID */}
                <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-card)" }}>
                  <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-card)", padding: "0 4px", fontSize: "11px", color: "var(--accent)", fontWeight: "600" }}>Employee Number *</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. E001"
                    value={employeeNumber}
                    onChange={(e) => setEmployeeNumber(e.target.value)}
                    className="transparent-input"
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontSize: "14px",
                      padding: "4px 0",
                      fontFamily: "monospace",
                      color: "var(--text-primary)"
                    }}
                  />
                </div>

                {/* Contact Phone */}
                <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-card)" }}>
                  <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-card)", padding: "0 4px", fontSize: "11px", color: "var(--accent)", fontWeight: "600" }}>Mobile Number *</span>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="transparent-input"
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontSize: "14px",
                      padding: "4px 0",
                      color: "var(--text-primary)"
                    }}
                  />
                </div>

                {/* Email */}
                <div style={{ gridColumn: "span 2", position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-card)" }}>
                  <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-card)", padding: "0 4px", fontSize: "11px", color: "var(--accent)", fontWeight: "600" }}>Email Address</span>
                  <input
                    type="email"
                    placeholder="e.g. user@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="transparent-input"
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontSize: "14px",
                      padding: "4px 0",
                      color: "var(--text-primary)"
                    }}
                  />
                </div>

                {/* Password */}
                <div style={{ gridColumn: "span 2", position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-card)" }}>
                  <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-card)", padding: "0 4px", fontSize: "11px", color: "var(--accent)", fontWeight: "600" }}>
                    {editingEmployee ? "New Password (Leave blank to keep current)" : "Account Password *"}
                  </span>
                  <input
                    type="text"
                    required={!editingEmployee}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="transparent-input"
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontSize: "14px",
                      padding: "4px 0",
                      color: "var(--text-primary)"
                    }}
                  />
                </div>

                {/* Active Checkbox Pill */}
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      style={{ width: "18px", height: "18px", accentColor: "var(--primary)" }}
                    />
                    <span style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--text-primary)" }}>
                      Enable Active Account Access
                    </span>
                  </label>
                </div>

              </div>

              {/* Modal Action Buttons */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", borderTop: "1px solid var(--border-glass)", paddingTop: "18px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formLoading}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "9999px",
                    background: "transparent",
                    border: "1px solid var(--border-glass)",
                    color: "var(--text-secondary)",
                    fontSize: "13.5px",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={formLoading}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "9999px",
                    background: "linear-gradient(135deg, var(--accent) 0%, #84cc16 100%)",
                    border: "none",
                    color: "#0f172a",
                    fontSize: "13.5px",
                    fontWeight: "800",
                    cursor: "pointer",
                    boxShadow: "0 6px 20px rgba(163, 230, 53, 0.2)"
                  }}
                >
                  {formLoading ? "Saving..." : editingEmployee ? "Update Profile" : "Create Profile"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
