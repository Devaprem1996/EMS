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
import { EMS_CONFIG } from "@/config/ems-config";

interface Employee {
  id: string;
  mobileNumber: string;
  role: "ADMIN" | "TECHNICIAN";
  fullName: string;
  contactPhone: string;
  employeeNumber: string;
  email: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function EmployeeMasterPage() {
  // Data States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "inactive"

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

  // Trigger fetch when search or filter changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEmployees();
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
    setRole(emp.role);
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
  const adminCount = employees.filter(e => e.role === "ADMIN" && e.isActive).length;
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
                <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#10b981" }}>98.4%</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Service Reliability</div>
              </div>
              <div>
                <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#a3e635" }}>14 Min</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Avg Response Time</div>
              </div>
            </div>
          </div>

          {/* Mini Sparkline Bar Viz */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "42px", paddingTop: "8px" }}>
            {[
              { month: "Jan", h1: "40%", h2: "60%", active: false },
              { month: "Feb", h1: "55%", h2: "70%", active: false },
              { month: "Mar", h1: "70%", h2: "85%", active: false },
              { month: "Apr", h1: "60%", h2: "75%", active: false },
              { month: "May", h1: "80%", h2: "90%", active: false },
              { month: "Jun", h1: "95%", h2: "100%", active: true },
            ].map((bar, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%" }}>
                <div style={{ width: "100%", flex: 1, display: "flex", gap: "2px", alignItems: "flex-end" }}>
                  <div style={{ flex: 1, height: bar.h1, background: bar.active ? "#a3e635" : "var(--border-glass)", borderRadius: "4px" }}></div>
                  <div style={{ flex: 1, height: bar.h2, background: bar.active ? "#c084fc" : "var(--border-glass)", borderRadius: "4px" }}></div>
                </div>
                <span style={{ fontSize: "0.68rem", color: bar.active ? "#a3e635" : "var(--text-muted)", fontWeight: bar.active ? "800" : "500" }}>
                  {bar.month}
                </span>
              </div>
            ))}
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
        }}>
          <div style={{
            background: "#121217",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "24px",
            width: "100%",
            maxWidth: "540px",
            boxShadow: "0 25px 60px rgba(0,0,0,0.8)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}>
            
            {/* Modal Header */}
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(255,255,255,0.02)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "9999px",
                  background: role === "ADMIN" ? "rgba(192, 132, 252, 0.2)" : "rgba(163, 230, 53, 0.2)",
                  color: role === "ADMIN" ? "#c084fc" : "#a3e635",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {editingEmployee ? <Edit2 size={18} /> : <UserPlus size={18} />}
                </div>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: "800", margin: 0, color: "#ffffff" }}>
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
                  background: "rgba(255,255,255,0.06)",
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
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#ef4444",
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
                      borderColor: role === "TECHNICIAN" ? "#a3e635" : "rgba(255,255,255,0.08)",
                      background: role === "TECHNICIAN" ? "rgba(163, 230, 53, 0.12)" : "rgba(255,255,255,0.03)",
                      color: role === "TECHNICIAN" ? "#a3e635" : "var(--text-secondary)",
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
                      borderColor: role === "ADMIN" ? "#c084fc" : "rgba(255,255,255,0.08)",
                      background: role === "ADMIN" ? "rgba(192, 132, 252, 0.12)" : "rgba(255,255,255,0.03)",
                      color: role === "ADMIN" ? "#c084fc" : "var(--text-secondary)",
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
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#ffffff",
                      fontSize: "13.5px",
                      outline: "none"
                    }}
                  />
                </div>

                {/* Employee ID */}
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Employee Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. E001"
                    value={employeeNumber}
                    onChange={(e) => setEmployeeNumber(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#ffffff",
                      fontSize: "13.5px",
                      fontFamily: "monospace",
                      outline: "none"
                    }}
                  />
                </div>

                {/* Contact Phone */}
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#ffffff",
                      fontSize: "13.5px",
                      outline: "none"
                    }}
                  />
                </div>

                {/* Email */}
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. john@safeway.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#ffffff",
                      fontSize: "13.5px",
                      outline: "none"
                    }}
                  />
                </div>

                {/* Password */}
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    {editingEmployee ? "New Password (Leave blank to keep current)" : "Account Password *"}
                  </label>
                  <input
                    type="text"
                    required={!editingEmployee}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#ffffff",
                      fontSize: "13.5px",
                      outline: "none"
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
                      style={{ width: "18px", height: "18px", accentColor: "#a3e635" }}
                    />
                    <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#ffffff" }}>
                      Enable Active Account Access
                    </span>
                  </label>
                </div>

              </div>

              {/* Modal Action Buttons */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "18px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formLoading}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "9999px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "var(--text-primary)",
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
                    background: "linear-gradient(135deg, #a3e635 0%, #84cc16 100%)",
                    border: "none",
                    color: "#0f172a",
                    fontSize: "13.5px",
                    fontWeight: "800",
                    cursor: "pointer",
                    boxShadow: "0 6px 20px rgba(163, 230, 53, 0.3)"
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
