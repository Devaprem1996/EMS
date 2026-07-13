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
  UserPlus
} from "lucide-react";
import { EMS_CONFIG } from "@/config/ems-config";

interface Employee {
  id: string;
  username: string;
  role: "ADMIN" | "TECHNICIAN";
  fullName: string;
  phone: string;
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
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, statusFilter]);

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
    setPhone(emp.phone || "");
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

  return (
    <div style={{ position: "relative", minHeight: "100%" }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">Employee Master</h1>
          <p className="page-subtitle">Configure system users, assignments, and authorization roles</p>
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="alert-banner" style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#10b981" }}>
          <Check size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Controls */}
      <div className="controls-row">
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, contact, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={18} className="search-icon-inside" />
        </div>

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Employees Table */}
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
          <table className="premium-table">
            <thead>
              <tr>
                <th style={{ width: "80px" }}>S.No</th>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Contact No</th>
                <th>Role</th>
                <th>Status</th>
                <th style={{ width: "100px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, index) => (
                <tr key={emp.id}>
                  <td>{index + 1}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontWeight: "600", color: "#fff" }}>
                    {emp.employeeNumber || "N/A"}
                  </td>
                  <td>
                    <div style={{ fontWeight: "600", color: "#fff" }}>{emp.fullName}</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{emp.email || "No Email"}</div>
                  </td>
                  <td>{emp.phone}</td>
                  <td>
                    <span 
                      className="badge" 
                      style={{ 
                        background: emp.role === "ADMIN" ? "rgba(239, 68, 68, 0.1)" : "rgba(59, 130, 246, 0.1)", 
                        color: emp.role === "ADMIN" ? "#ef4444" : "#3b82f6",
                        border: emp.role === "ADMIN" ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(59, 130, 246, 0.2)"
                      }}
                    >
                      {emp.role === "ADMIN" ? "Admin" : "Technician"}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${emp.isActive ? "badge-active" : "badge-inactive"}`}>
                      {emp.isActive ? (
                        <>
                          <UserCheck size={12} />
                          Active
                        </>
                      ) : (
                        <>
                          <UserX size={12} />
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

      {/* Floating Action Button (FAB) */}
      <button 
        onClick={handleOpenAdd} 
        className="fab-btn"
        title="Add Employee"
        aria-label="Add Employee"
      >
        <Plus size={24} />
      </button>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingEmployee ? "Edit Employee" : "Add Employee"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="modal-close-btn"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="alert-banner">
                    <ShieldAlert size={18} className="alert-icon" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-grid">
                  {/* Name */}
                  <div className="form-group form-grid-full">
                    <label className="form-label" htmlFor="fullName">Employee Name *</label>
                    <input
                      type="text"
                      id="fullName"
                      className="form-input"
                      style={{ paddingLeft: "1rem" }}
                      placeholder="e.g. John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Employee ID */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="employeeNumber">Employee Number *</label>
                    <input
                      type="text"
                      id="employeeNumber"
                      className="form-input"
                      style={{ paddingLeft: "1rem" }}
                      placeholder="e.g. E001"
                      value={employeeNumber}
                      onChange={(e) => setEmployeeNumber(e.target.value)}
                      required
                    />
                  </div>

                  {/* Contact Number */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="phone">Contact No *</label>
                    <input
                      type="tel"
                      id="phone"
                      className="form-input"
                      style={{ paddingLeft: "1rem" }}
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>

                  {/* Email ID */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Email ID</label>
                    <input
                      type="email"
                      id="email"
                      className="form-input"
                      style={{ paddingLeft: "1rem" }}
                      placeholder="e.g. john@safeway.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  {/* Role Selection */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="role">Role *</label>
                    <select
                      id="role"
                      className="form-input"
                      style={{ paddingLeft: "1rem", cursor: "pointer" }}
                      value={role}
                      onChange={(e) => setRole(e.target.value as "ADMIN" | "TECHNICIAN")}
                    >
                      <option value="TECHNICIAN">Technician</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  {/* Password */}
                  <div className="form-group form-grid-full">
                    <label className="form-label" htmlFor="password">
                      {editingEmployee ? "New Password (Leave blank to keep current)" : "Create Password *"}
                    </label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input
                        type="text"
                        id="password"
                        className="form-input"
                        style={{ paddingLeft: "1rem" }}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required={!editingEmployee}
                      />
                    </div>
                  </div>

                  {/* Active Status */}
                  <div className="form-grid-full">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        className="checkbox-input"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                      />
                      <span>Active Status</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="btn-secondary"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <div className="spinner" style={{ width: "16px", height: "16px" }}></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      {editingEmployee ? "Update" : "Create"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
