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
  createdAt: string;
}

interface Technician {
  id: string;
  fullName: string;
  phone: string;
  isActive: boolean;
  role: string;
}

export default function ServiceDashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals Control
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Collapsible cards state in edit modal
  const [isStatusCardOpen, setIsStatusCardOpen] = useState(true);

  // --- Form Fields ---
  // Service Update Form fields
  const [visitDate, setVisitDate] = useState("");
  const [currentStatus, setCurrentStatus] = useState("Pending");

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
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter]);

  // Handle Edit Service Modal Open
  const handleOpenEdit = (job: Job) => {
    setSelectedJob(job);
    setVisitDate(job.visitDate ? job.visitDate.split("T")[0] : "");
    setCurrentStatus(job.currentStatus === "Pending Service" ? "Pending" : (job.currentStatus || "Pending"));
    setIsStatusCardOpen(true);
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

  return (
    <div style={{ padding: "10px", color: "#e2e8f0" }}>
      {/* Page Title & Subtitle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>Service Dashboard</h1>
        </div>
      </div>

      {/* Alerts */}
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

      {/* Full-width Search Bar Row */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "20px" }}>
        <div style={{ position: "relative", width: "100%" }}>
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "12px 15px 12px 40px", background: "#1a1a24", border: "1px solid #2d2d3a", borderRadius: "8px", color: "#fff", fontSize: "14px" }}
          />
          <Search size={18} style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#718096" }} />
        </div>
      </div>

      {/* Data Table */}
      <div style={{ background: "#111115", borderRadius: "12px", border: "1px solid #2d2d3a", overflowX: "auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>Loading services jobs...</div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#718096" }}>No service jobs found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2d2d3a", background: "#171721" }}>
                <th style={{ padding: "15px" }}>S.No</th>
                <th style={{ padding: "15px" }}>Client Name</th>
                <th style={{ padding: "15px" }}>Contact Person Name</th>
                <th style={{ padding: "15px" }}>Contact No1</th>
                <th style={{ padding: "15px" }}>Service Date</th>
                <th style={{ padding: "15px" }}>Service Status</th>
                <th style={{ padding: "15px" }}>Technician Names</th>
                <th style={{ padding: "15px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, index) => {
                const displayStatus = job.currentStatus === "Pending Service" ? "Pending" : job.currentStatus;
                return (
                  <tr key={job.id} style={{ borderBottom: "1px solid #1a1a24" }}>
                    <td style={{ padding: "15px" }}>{index + 1}</td>
                    <td style={{ padding: "15px" }}>{job.customer?.companyName || "N/A"}</td>
                    <td style={{ padding: "15px" }}>{job.customer?.contactPerson}</td>
                    <td style={{ padding: "15px" }}>{job.customer?.phone}</td>
                    <td style={{ padding: "15px" }}>{formatDate(job.visitDate)}</td>
                    <td style={{ padding: "15px" }}>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        background: 
                          displayStatus === "Completed" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                        color:
                          displayStatus === "Completed" ? "#10b981" : "#f59e0b",
                      }}>
                        {displayStatus}
                      </span>
                    </td>
                    <td style={{ padding: "15px" }}>
                      {job.assignments.length === 0 ? (
                        <span style={{ color: "#718096" }}>Unassigned</span>
                      ) : (
                        job.assignments.map(a => a.technician.fullName).join(", ")
                      )}
                    </td>
                    <td style={{ padding: "15px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                        <button
                          onClick={() => handleOpenEdit(job)}
                          style={{ background: "#ff4d80", border: "none", color: "#fff", padding: "6px", borderRadius: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                          title="Service Update"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenAssign(job)}
                          style={{ background: "#ff6c37", border: "none", color: "#fff", padding: "6px", borderRadius: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                          title="Assign Technician"
                        >
                          <UserPlus size={14} />
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

      {/* Service Update Modal */}
      {isEditModalOpen && selectedJob && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "15px" }}>
          <div style={{ background: "#181822", border: "1px solid #2d2d3a", borderRadius: "12px", width: "100%", maxWidth: "600px", maxHeight: "90%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            
            <div style={{ padding: "15px 20px", borderBottom: "1px solid #2d2d3a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "18px", margin: 0 }}>Service Update</h2>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: "none", border: "none", color: "#718096", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div style={{ padding: "20px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "15px" }}>
                
                {/* Collapsible Card: Enquiry Status & Dates */}
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
                          <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Service Date*</label>
                          <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Service Status*</label>
                          <select value={currentStatus} onChange={e => setCurrentStatus(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }}>
                            <option value="Select">Select</option>
                            <option value="Pending">Pending</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div style={{ padding: "15px 20px", borderTop: "1px solid #2d2d3a", display: "flex", justifyContent: "flex-end", gap: "10px", background: "#14141c" }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ padding: "8px 16px", background: "transparent", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#a0aec0", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", background: "#ff4d80", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer" }}>Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Technician Modal */}
      {isAssignModalOpen && selectedJob && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "15px" }}>
          <div style={{ background: "#181822", border: "1px solid #2d2d3a", borderRadius: "12px", width: "100%", maxWidth: "600px", maxHeight: "90%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            
            <div style={{ padding: "15px 20px", borderBottom: "1px solid #2d2d3a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "18px", margin: 0 }}>Assign Technician</h2>
              <button onClick={() => setIsAssignModalOpen(false)} style={{ background: "none", border: "none", color: "#718096", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <form onSubmit={handleAssignSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div style={{ padding: "20px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
                
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
                    <input type="date" value={assignVisitDate} onChange={e => setAssignVisitDate(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Assign For</label>
                    <input type="text" value="SERVICE" readOnly style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#718096", cursor: "not-allowed" }} />
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
                  <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "6px", fontWeight: "bold" }}>Assign SERVICE To (Technicians) *</label>
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

              <div style={{ padding: "15px 20px", borderTop: "1px solid #2d2d3a", display: "flex", justifyContent: "flex-end", gap: "10px", background: "#14141c" }}>
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
