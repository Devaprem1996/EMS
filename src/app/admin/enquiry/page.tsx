"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  UserPlus, 
  X, 
  Check, 
  AlertCircle,
  Calendar,
  MessageSquare,
  MapPin,
  Clock,
  UserCheck,
  Upload
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

interface Enquiry {
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

export default function EnquiryDashboardPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal control
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);

  // Edit Form Tab State
  const [activeTab, setActiveTab] = useState<"client" | "requirement" | "status" | "followup" | "amc">("client");

  // --- Form Fields ---
  // Client Details
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [phone2, setPhone2] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // Requirement Info
  const [requirementCategory, setRequirementCategory] = useState("SELECT");
  const [enquirySource, setEnquirySource] = useState("SELECT");
  const [requirementDetails, setRequirementDetails] = useState("");

  // Status & Dates
  const [enquiryDate, setEnquiryDate] = useState("");
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState("");
  const [currentStatus, setCurrentStatus] = useState("Enquiry Registered");

  // Follow Up
  const [followUpDate, setFollowUpDate] = useState("");
  const [newRemarks, setNewRemarks] = useState("");

  // Delivery & AMC
  const [deliveredDate, setDeliveredDate] = useState("");
  const [amcYears, setAmcYears] = useState("1");
  const [calculatedAmcDate, setCalculatedAmcDate] = useState("");

  // Assignment fields
  const [visitDate, setVisitDate] = useState("");
  const [adminInstructions, setAdminInstructions] = useState("");
  const [technicianInstructions, setTechnicianInstructions] = useState("");
  const [customerLocation, setCustomerLocation] = useState("");
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [isBulkAssign, setIsBulkAssign] = useState(false);
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [bulkTransitionStage, setBulkTransitionStage] = useState("REFILLING");

  // Fetch all data
  const fetchData = async () => {
    setSelectedJobIds([]);
    try {
      // 1. Fetch enquiries
      const enqRes = await fetch(`/api/jobs?stage=ENQUIRY&status=${statusFilter}&search=${encodeURIComponent(search)}`);
      if (enqRes.ok) {
        const enqData = await enqRes.json();
        setEnquiries(enqData);
      }

      // 2. Fetch technicians
      const techRes = await fetch("/api/employees?status=active");
      if (techRes.ok) {
        const techData = await techRes.json();
        setTechnicians(techData.filter((t: any) => t.role === "TECHNICIAN"));
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
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

  // Handle open Add Enquiry Modal
  const handleOpenAdd = () => {
    // Clear forms
    setCompanyName("");
    setContactPerson("");
    setPhone("");
    setPhone2("");
    setEmail("");
    setAddress("");
    setRequirementCategory("SELECT");
    setEnquirySource("SELECT");
    setRequirementDetails("");
    setEnquiryDate(new Date().toISOString().split("T")[0]);
    setRequestedDeliveryDate("");
    setCurrentStatus("Enquiry Registered");
    setIsAddModalOpen(true);
  };

  // Submit Add Enquiry Form
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactPerson || !phone) {
      setErrorMsg("Contact Person and Contact Number are required");
      return;
    }

    if (requestedDeliveryDate && enquiryDate && new Date(requestedDeliveryDate) < new Date(enquiryDate)) {
      setErrorMsg("Requested Delivery Date cannot be before the Enquiry Date");
      return;
    }

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          contactPerson,
          phone,
          phone2: phone2 || null,
          email: email || null,
          address,
          requirementCategory: requirementCategory === "SELECT" ? null : requirementCategory,
          enquirySource: enquirySource === "SELECT" ? null : enquirySource,
          requirementDetails,
          currentStatus,
          enquiryDate: enquiryDate || null,
          requestedDeliveryDate: requestedDeliveryDate || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create enquiry");

      setSuccessMsg("Enquiry registered successfully!");
      setIsAddModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // Open Edit Enquiry Modal
  const handleOpenEdit = (enq: Enquiry) => {
    setSelectedEnquiry(enq);
    setActiveTab("client");

    // Pre-populate fields
    setCompanyName(enq.customer?.companyName || "");
    setContactPerson(enq.customer?.contactPerson || "");
    setPhone(enq.customer?.phone || "");
    setPhone2(enq.customer?.phone2 || "");
    setEmail(enq.customer?.email || "");
    setAddress(enq.customer?.address || "");

    setRequirementCategory(enq.requirementCategory || "SELECT");
    setEnquirySource(enq.enquirySource || "SELECT");
    setRequirementDetails(enq.requirementDetails || "");

    setRequestedDeliveryDate(enq.requestedDeliveryDate ? enq.requestedDeliveryDate.split("T")[0] : "");
    setEnquiryDate(enq.createdAt ? enq.createdAt.split("T")[0] : "");
    setCurrentStatus(enq.currentStatus || "Enquiry Registered");

    setFollowUpDate(enq.followUpDate ? enq.followUpDate.split("T")[0] : "");
    setNewRemarks(""); // Start empty for updates

    setDeliveredDate(enq.deliveredDate ? enq.deliveredDate.split("T")[0] : "");
    setAmcYears(String(enq.amcYears || 1));
    setCalculatedAmcDate(enq.amcDate ? enq.amcDate.split("T")[0] : "");

    setIsEditModalOpen(true);
  };

  // Recalculate AMC Date dynamically in edit view
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

  // Submit Edit Enquiry Updates
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiry) return;

    if (requestedDeliveryDate && enquiryDate && new Date(requestedDeliveryDate) < new Date(enquiryDate)) {
      setErrorMsg("Requested Delivery Date cannot be before the Enquiry Date");
      return;
    }

    try {
      const res = await fetch(`/api/jobs/${selectedEnquiry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          contactPerson,
          phone,
          phone2: phone2 || null,
          email: email || null,
          address,
          requirementCategory,
          enquirySource,
          requirementDetails,
          requestedDeliveryDate: requestedDeliveryDate || null,
          enquiryDate: enquiryDate || null,
          currentStatus,
          followUpDate: followUpDate || null,
          newRemarks: newRemarks.trim() || null,
          deliveredDate: deliveredDate || null,
          amcYears: parseInt(amcYears, 10),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update enquiry");

      setSuccessMsg("Enquiry updated successfully!");
      setIsEditModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // Open Assign Technician Modal
  const handleOpenAssign = (enq: Enquiry) => {
    setIsBulkAssign(false);
    setSelectedEnquiry(enq);
    setVisitDate(enq.visitDate ? enq.visitDate.split("T")[0] : "");
    setAdminInstructions(enq.adminInstructions || "");
    setTechnicianInstructions(enq.technicianInstructions || "");
    setCustomerLocation(enq.customerLocation || "");
    // Pre-check currently assigned techs
    setSelectedTechIds(enq.assignments.map(a => a.technicianId));

    setIsAssignModalOpen(true);
  };

  const handleOpenBulkAssign = () => {
    setIsBulkAssign(true);
    setSelectedEnquiry(null);
    setVisitDate("");
    setAdminInstructions("");
    setTechnicianInstructions("");
    setCustomerLocation("");
    setSelectedTechIds([]);
    setIsAssignModalOpen(true);
  };

  // Submit Assignments
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBulkAssign && !selectedEnquiry) return;

    try {
      const url = isBulkAssign ? "/api/jobs/bulk-assign" : `/api/jobs/${selectedEnquiry!.id}/assign`;
      const payload = isBulkAssign
        ? {
            jobIds: selectedJobIds,
            technicianIds: selectedTechIds,
            visitDate: visitDate || null,
            adminInstructions,
            technicianInstructions,
            customerLocation,
          }
        : {
            visitDate: visitDate || null,
            adminInstructions,
            technicianInstructions,
            customerLocation,
            technicianIds: selectedTechIds,
          };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update technician assignments");

      setSuccessMsg(isBulkAssign ? "Bulk assignments completed successfully!" : "Assignments updated successfully!");
      setIsAssignModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  const handleBulkTransitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedJobIds.length === 0) return;

    try {
      const res = await fetch("/api/jobs/bulk-transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobIds: selectedJobIds,
          toStage: bulkTransitionStage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to transition enquiries");

      setSuccessMsg(`Successfully transitioned ${selectedJobIds.length} enquiries to ${bulkTransitionStage}!`);
      setIsTransitionModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  const handleSelectJob = (id: string) => {
    setSelectedJobIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedJobIds(enquiries.map(e => e.id));
    } else {
      setSelectedJobIds([]);
    }
  };

  // Handle tech checkbox toggle
  const handleTechToggle = (techId: string) => {
    setSelectedTechIds(prev => 
      prev.includes(techId) ? prev.filter(id => id !== techId) : [...prev, techId]
    );
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) throw new Error("Empty file content");

        const lines = text.split(/\r?\n/);
        if (lines.length === 0) throw new Error("No lines found in CSV");

        // Parse headers
        const headers = lines[0].split(",").map(h => h.replace(/^["']|["']$/g, "").trim());
        const rows: Record<string, string>[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values: string[] = [];
          let currentVal = "";
          let inQuotes = false;
          for (let c = 0; c < line.length; c++) {
            const char = line[c];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(currentVal.trim());
              currentVal = "";
            } else {
              currentVal += char;
            }
          }
          values.push(currentVal.trim());

          const row: Record<string, string> = {};
          for (let j = 0; j < headers.length; j++) {
            let val = values[j] || "";
            val = val.replace(/^["']|["']$/g, "");
            row[headers[j]] = val;
          }
          rows.push(row);
        }

        if (rows.length === 0) throw new Error("No data rows found in CSV");

        const res = await fetch("/api/jobs/bulk-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to process bulk import");

        setSuccessMsg(
          `Import complete! Created: ${data.created}, Updated: ${data.updated}, Failed: ${data.failed}`
        );
        if (data.errors && data.errors.length > 0) {
          console.warn("Import errors:", data.errors);
          setErrorMsg(`Failed rows: ${data.errors.slice(0, 3).join("; ")}${data.errors.length > 3 ? "..." : ""}`);
        }
        fetchData();
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setImporting(false);
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

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
      {/* Page Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>Enquiry Dashboard</h1>
          <p style={{ fontSize: "14px", color: "#a0aec0", margin: "4px 0 0 0" }}>Manage client requests, follow-ups, and confirmations</p>
        </div>
      </div>

      {/* Success/Error Alerts */}
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

      {/* Search and Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
          <input
            type="text"
            placeholder="Search client, contact, enquiry ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 10px 10px 35px", background: "#1a1a24", border: "1px solid #2d2d3a", borderRadius: "8px", color: "#fff" }}
          />
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#718096" }} />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "10px 15px", background: "#1a1a24", border: "1px solid #2d2d3a", borderRadius: "8px", color: "#fff", cursor: "pointer" }}
        >
          <option value="all">All Statuses</option>
          <option value="Enquiry Registered">Enquiry Registered</option>
          <option value="Order Confirmed">Order Confirmed</option>
          <option value="Order Delivered">Order Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        
        <label
          style={{
            padding: "10px 15px",
            background: "#3b82f6",
            border: "none",
            borderRadius: "8px",
            color: "#fff",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "14px",
            fontWeight: "500",
            opacity: importing ? 0.7 : 1,
            pointerEvents: importing ? "none" : "auto",
          }}
        >
          <Upload size={16} />
          {importing ? "Importing..." : "Bulk Import"}
          <input
            type="file"
            accept=".csv"
            onChange={handleBulkImport}
            style={{ display: "none" }}
            disabled={importing}
          />
        </label>
      </div>

      {selectedJobIds.length > 0 && (
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 20px",
          background: "rgba(59, 130, 246, 0.15)",
          border: "1px solid rgba(59, 130, 246, 0.4)",
          borderRadius: "8px",
          marginBottom: "15px",
        }}>
          <span style={{ fontWeight: "600", color: "#60a5fa" }}>
            {selectedJobIds.length} row(s) selected
          </span>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleOpenBulkAssign}
              style={{
                padding: "8px 12px",
                background: "#ff6c37",
                border: "none",
                borderRadius: "6px",
                color: "#fff",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "13px",
              }}
            >
              Bulk Assign Technicians
            </button>
            <button
              onClick={() => {
                setBulkTransitionStage("REFILLING");
                setIsTransitionModalOpen(true);
              }}
              style={{
                padding: "8px 12px",
                background: "#10b981",
                border: "none",
                borderRadius: "6px",
                color: "#fff",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "13px",
              }}
            >
              Bulk Transition Stage
            </button>
          </div>
        </div>
      )}

      {/* Table Data Grid */}
      <div style={{ background: "#111115", borderRadius: "12px", border: "1px solid #2d2d3a", overflowX: "auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>Loading enquiries...</div>
        ) : enquiries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#718096" }}>No enquiries found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2d2d3a", background: "#171721" }}>
                <th style={{ padding: "12px 15px", width: "40px" }}>
                  <input
                    type="checkbox"
                    checked={enquiries.length > 0 && selectedJobIds.length === enquiries.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    style={{ cursor: "pointer" }}
                  />
                </th>
                <th style={{ padding: "12px 15px" }}>S.No</th>
                <th style={{ padding: "12px 15px" }}>Enquiry Id</th>
                <th style={{ padding: "12px 15px" }}>Client Name</th>
                <th style={{ padding: "12px 15px" }}>Contact Person Name</th>
                <th style={{ padding: "12px 15px" }}>Contact No1</th>
                <th style={{ padding: "12px 15px" }}>Requirement Category</th>
                <th style={{ padding: "12px 15px" }}>Enquiry Date</th>
                <th style={{ padding: "12px 15px" }}>Status Name</th>
                <th style={{ padding: "12px 15px" }}>Technicians</th>
                <th style={{ padding: "12px 15px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((enq, index) => (
                <tr key={enq.id} style={{ borderBottom: "1px solid #1a1a24" }}>
                  <td style={{ padding: "12px 15px" }}>
                    <input
                      type="checkbox"
                      checked={selectedJobIds.includes(enq.id)}
                      onChange={() => handleSelectJob(enq.id)}
                      style={{ cursor: "pointer" }}
                    />
                  </td>
                  <td style={{ padding: "12px 15px" }}>{index + 1}</td>
                  <td style={{ padding: "12px 15px", fontFamily: "monospace", fontWeight: "bold" }}>{enq.jobNumber}</td>
                  <td style={{ padding: "12px 15px" }}>{enq.customer?.companyName || "N/A"}</td>
                  <td style={{ padding: "12px 15px" }}>{enq.customer?.contactPerson}</td>
                  <td style={{ padding: "12px 15px" }}>{enq.customer?.phone}</td>
                  <td style={{ padding: "12px 15px" }}>{enq.requirementCategory || "SELECT"}</td>
                  <td style={{ padding: "12px 15px" }}>{formatDate(enq.createdAt)}</td>
                  <td style={{ padding: "12px 15px" }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      background: 
                        enq.currentStatus === "Order Delivered" ? "rgba(16, 185, 129, 0.15)" :
                        enq.currentStatus === "Order Confirmed" ? "rgba(59, 130, 246, 0.15)" :
                        enq.currentStatus === "Cancelled" ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)",
                      color:
                        enq.currentStatus === "Order Delivered" ? "#10b981" :
                        enq.currentStatus === "Order Confirmed" ? "#3b82f6" :
                        enq.currentStatus === "Cancelled" ? "#ef4444" : "#f59e0b",
                    }}>
                      {enq.currentStatus}
                    </span>
                  </td>
                  <td style={{ padding: "12px 15px" }}>
                    {enq.assignments.length === 0 ? (
                      <span style={{ color: "#718096" }}>Unassigned</span>
                    ) : (
                      enq.assignments.map(a => a.technician.fullName).join(", ")
                    )}
                  </td>
                  <td style={{ padding: "12px 15px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                      <button
                        onClick={() => handleOpenEdit(enq)}
                        style={{ background: "#ff4d80", border: "none", color: "#fff", padding: "6px", borderRadius: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                        title="Edit Enquiry details"
                      >
                        <Edit2 size={14} />
                      </button>
                      
                      {enq.currentStatus === "Order Confirmed" && (
                        <button
                          onClick={() => handleOpenAssign(enq)}
                          style={{ background: "#ff6c37", border: "none", color: "#fff", padding: "6px", borderRadius: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                          title="Assign Technicians"
                        >
                          <UserPlus size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={handleOpenAdd}
        style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "#3b82f6",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9
        }}
        title="Add Enquiry"
      >
        <Plus size={24} />
      </button>

      {/* Add Enquiry Modal */}
      {isAddModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "15px" }}>
          <div style={{ background: "#181822", border: "1px solid #2d2d3a", borderRadius: "12px", width: "100%", maxWidth: "600px", maxHeight: "90%", overflow: "hidden" }}>
            <div style={{ padding: "15px 20px", borderBottom: "1px solid #2d2d3a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "18px", margin: 0 }}>Register New Enquiry</h2>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: "none", border: "none", color: "#718096", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div style={{ padding: "20px", maxHeight: "65vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Client / Company Name</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Siva Clinicals" style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Contact Person Name *</label>
                    <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} required placeholder="e.g. Manikrishnan" style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Contact No *</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="e.g. 9944332106" style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Contact No 2</label>
                    <input type="tel" value={phone2} onChange={e => setPhone2(e.target.value)} placeholder="Optional" style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Email ID</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. info@sivaclinicals.com" style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Address</label>
                  <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} placeholder="Service address details..." style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff", resize: "none" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Enquiry Date *</label>
                    <input type="date" value={enquiryDate} onChange={e => setEnquiryDate(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Requested Delivery Date</label>
                    <input type="date" value={requestedDeliveryDate} onChange={e => setRequestedDeliveryDate(e.target.value)} style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                  </div>
                </div>
                <hr style={{ border: "0", borderTop: "1px solid #2d2d3a", margin: "10px 0" }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Requirement Category</label>
                    <select value={requirementCategory} onChange={e => setRequirementCategory(e.target.value)} style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }}>
                      <option value="SELECT">SELECT</option>
                      <option value="CCTV">CCTV</option>
                      <option value="New Fire Extinguisher">New Fire Extinguisher</option>
                      <option value="Refilling">Refilling</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Source of Enquiry</label>
                    <select value={enquirySource} onChange={e => setEnquirySource(e.target.value)} style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }}>
                      <option value="SELECT">SELECT</option>
                      <option value="Existing Customers">Existing Customers</option>
                      <option value="Social Media">Social Media</option>
                      <option value="Phone Call">Phone Call</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Requirement Description</label>
                  <textarea value={requirementDetails} onChange={e => setRequirementDetails(e.target.value)} rows={2} placeholder="Details about customer specifications..." style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff", resize: "none" }} />
                </div>
              </div>
              <div style={{ padding: "15px 20px", borderTop: "1px solid #2d2d3a", display: "flex", justifyContent: "flex-end", gap: "10px", background: "#14141c" }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: "8px 16px", background: "transparent", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#a0aec0", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", background: "#3b82f6", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer" }}>Register</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Enquiry Modal (Tabbed Layout) */}
      {isEditModalOpen && selectedEnquiry && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "15px" }}>
          <div style={{ background: "#181822", border: "1px solid #2d2d3a", borderRadius: "12px", width: "100%", maxWidth: "700px", maxHeight: "90%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            
            {/* Modal Header */}
            <div style={{ padding: "15px 20px", borderBottom: "1px solid #2d2d3a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "18px", margin: 0 }}>Edit Enquiry: <span style={{ color: "#3b82f6" }}>{selectedEnquiry.jobNumber}</span></h2>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: "none", border: "none", color: "#718096", cursor: "pointer" }}><X size={20} /></button>
            </div>

            {/* Tabs List */}
            <div style={{ display: "flex", background: "#13131c", borderBottom: "1px solid #2d2d3a", overflowX: "auto" }}>
              <button 
                onClick={() => setActiveTab("client")}
                style={{ padding: "12px 18px", background: activeTab === "client" ? "#181822" : "transparent", border: "none", borderBottom: activeTab === "client" ? "2px solid #ff4d80" : "none", color: activeTab === "client" ? "#ff4d80" : "#a0aec0", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}
              >
                Client Details
              </button>
              <button 
                onClick={() => setActiveTab("requirement")}
                style={{ padding: "12px 18px", background: activeTab === "requirement" ? "#181822" : "transparent", border: "none", borderBottom: activeTab === "requirement" ? "2px solid #ff4d80" : "none", color: activeTab === "requirement" ? "#ff4d80" : "#a0aec0", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}
              >
                Requirement Info
              </button>
              <button 
                onClick={() => setActiveTab("status")}
                style={{ padding: "12px 18px", background: activeTab === "status" ? "#181822" : "transparent", border: "none", borderBottom: activeTab === "status" ? "2px solid #ff4d80" : "none", color: activeTab === "status" ? "#ff4d80" : "#a0aec0", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}
              >
                Enquiry Status & Dates
              </button>
              <button 
                onClick={() => setActiveTab("followup")}
                style={{ padding: "12px 18px", background: activeTab === "followup" ? "#181822" : "transparent", border: "none", borderBottom: activeTab === "followup" ? "2px solid #ff4d80" : "none", color: activeTab === "followup" ? "#ff4d80" : "#a0aec0", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}
              >
                Follow Up
              </button>
              {currentStatus === "Order Delivered" && (
                <button 
                  onClick={() => setActiveTab("amc")}
                  style={{ padding: "12px 18px", background: activeTab === "amc" ? "#181822" : "transparent", border: "none", borderBottom: activeTab === "amc" ? "2px solid #ff4d80" : "none", color: activeTab === "amc" ? "#ff4d80" : "#a0aec0", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}
                >
                  Delivery & AMC
                </button>
              )}
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div style={{ padding: "20px", flex: 1, overflowY: "auto" }}>
                
                {/* 1. Client Details Tab */}
                {activeTab === "client" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Client / Company Name *</label>
                      <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Contact Person Name *</label>
                        <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Contact No 1 *</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Contact No 2</label>
                        <input type="tel" value={phone2} onChange={e => setPhone2(e.target.value)} style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Email ID</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Address *</label>
                      <textarea value={address} onChange={e => setAddress(e.target.value)} required rows={3} style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff", resize: "none" }} />
                    </div>
                  </div>
                )}

                {/* 2. Requirement Info Tab */}
                {activeTab === "requirement" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Requirement Category *</label>
                        <select value={requirementCategory} onChange={e => setRequirementCategory(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }}>
                          <option value="SELECT">SELECT</option>
                          <option value="CCTV">CCTV</option>
                          <option value="New Fire Extinguisher">New Fire Extinguisher</option>
                          <option value="Refilling">Refilling</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Source of Enquiry *</label>
                        <select value={enquirySource} onChange={e => setEnquirySource(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }}>
                          <option value="SELECT">SELECT</option>
                          <option value="Existing Customers">Existing Customers</option>
                          <option value="Social Media">Social Media</option>
                          <option value="Phone Call">Phone Call</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Requirement</label>
                      <textarea value={requirementDetails} onChange={e => setRequirementDetails(e.target.value)} rows={4} placeholder="Cylinder count, medium type..." style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff", resize: "none" }} />
                    </div>
                  </div>
                )}

                {/* 3. Enquiry Status & Dates Tab */}
                {activeTab === "status" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Enquiry Date *</label>
                        <input type="date" value={enquiryDate} onChange={e => setEnquiryDate(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Requested Delivery Date</label>
                        <input type="date" value={requestedDeliveryDate} onChange={e => setRequestedDeliveryDate(e.target.value)} style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Enquiry Status *</label>
                      <select value={currentStatus} onChange={e => setCurrentStatus(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }}>
                        <option value="Enquiry Registered">Enquiry Registered</option>
                        <option value="Order Confirmed">Order Confirmed</option>
                        <option value="Order Delivered">Order Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <p style={{ fontSize: "12px", color: "#a0aec0", marginTop: "10px", lineHeight: "1.4" }}>
                        💡 Changing status updates task flow logic:
                        <br />• <b>Order Confirmed</b> enables the Assign Technicians button.
                        <br />• <b>Order Delivered</b> displays the Delivery & AMC setup tab.
                      </p>
                    </div>
                  </div>
                )}

                {/* 4. Follow Up Tab */}
                {activeTab === "followup" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Next Follow-up Date</label>
                      <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>New Follow-up Notes / Remarks</label>
                      <textarea value={newRemarks} onChange={e => setNewRemarks(e.target.value)} rows={3} placeholder="Add follow-up notes updates here..." style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff", resize: "none" }} />
                    </div>

                    <div style={{ marginTop: "10px" }}>
                      <h4 style={{ fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid #2d2d3a", paddingBottom: "6px", marginBottom: "8px" }}>Follow-up History</h4>
                      <div style={{ maxHeight: "150px", overflowY: "auto", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        {selectedEnquiry.followUps.length === 0 ? (
                          <div style={{ color: "#718096", fontSize: "12px" }}>No prior follow-up history logs.</div>
                        ) : (
                          selectedEnquiry.followUps.map(f => (
                            <div key={f.id} style={{ fontSize: "12px", borderBottom: "1px solid #1a1a24", paddingBottom: "6px" }}>
                              <span style={{ color: "#ff4d80", fontWeight: "500" }}>{formatDate(f.createdAt)}</span>: {f.remarks}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Delivery & AMC Tab */}
                {activeTab === "amc" && currentStatus === "Order Delivered" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Delivered Date</label>
                      <input type="date" value={deliveredDate} onChange={e => setDeliveredDate(e.target.value)} style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>No. of Years</label>
                      <select value={amcYears} onChange={e => setAmcYears(e.target.value)} style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(y => (
                          <option key={y} value={String(y)}>{y} {y === 1 ? "Year" : "Years"}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ background: "#111116", border: "1px solid #2d2d3a", padding: "12px", borderRadius: "6px", marginTop: "10px" }}>
                      <label style={{ fontSize: "11px", color: "#a0aec0", display: "block", textTransform: "uppercase" }}>Calculated AMC Date</label>
                      <span style={{ fontSize: "18px", color: "#10b981", fontWeight: "bold", fontFamily: "monospace" }}>
                        {calculatedAmcDate ? formatDate(calculatedAmcDate) : "Please select Delivered Date"}
                      </span>
                    </div>
                  </div>
                )}

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
      {isAssignModalOpen && (isBulkAssign || selectedEnquiry) && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "15px" }}>
          <div style={{ background: "#181822", border: "1px solid #2d2d3a", borderRadius: "12px", width: "100%", maxWidth: "600px", maxHeight: "90%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            
            <div style={{ padding: "15px 20px", borderBottom: "1px solid #2d2d3a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "18px", margin: 0 }}>
                {isBulkAssign ? `Bulk Assign Technicians (${selectedJobIds.length} Enquiries)` : "Assign Technician"}
              </h2>
              <button onClick={() => setIsAssignModalOpen(false)} style={{ background: "none", border: "none", color: "#718096", cursor: "pointer" }}><X size={20} /></button>
            </div>
 
            <form onSubmit={handleAssignSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div style={{ padding: "20px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
                
                {/* Client Pre-fill info */}
                {!isBulkAssign && selectedEnquiry && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", background: "#111116", padding: "10px", borderRadius: "6px", border: "1px solid #1a1a24" }}>
                    <div>
                      <span style={{ fontSize: "10px", color: "#718096", display: "block" }}>CLIENT NAME</span>
                      <span style={{ fontSize: "12px", fontWeight: "bold" }}>{selectedEnquiry.customer?.companyName || "N/A"}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", color: "#718096", display: "block" }}>CONTACT PERSON</span>
                      <span style={{ fontSize: "12px" }}>{selectedEnquiry.customer?.contactPerson}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", color: "#718096", display: "block" }}>CONTACT NUMBER</span>
                      <span style={{ fontSize: "12px" }}>{selectedEnquiry.customer?.phone}</span>
                    </div>
                  </div>
                )}
                {isBulkAssign && (
                  <div style={{ background: "rgba(59, 130, 246, 0.15)", padding: "12px", borderRadius: "6px", border: "1px solid #3b82f6", color: "#60a5fa", fontSize: "13px" }}>
                    ℹ️ You are assigning technicians to <b>{selectedJobIds.length}</b> selected enquiries at once.
                  </div>
                )}
 
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Visit/Service Date *</label>
                    <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Assign For (Not Editable)</label>
                    <input type="text" value="DELIVERY" readOnly style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#718096", cursor: "not-allowed" }} />
                  </div>
                </div>
 
                {!isBulkAssign && selectedEnquiry && (
                  <div>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Address (Service Location)</label>
                    <textarea value={selectedEnquiry.customer?.address || ""} readOnly rows={2} style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#718096", cursor: "not-allowed", resize: "none" }} />
                  </div>
                )}

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
                  <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Customer Location (Google Map URL or Coordinates)</label>
                  <input type="text" value={customerLocation} onChange={e => setCustomerLocation(e.target.value)} placeholder="e.g. 12.9249, 80.1293 or link" style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "6px", fontWeight: "bold" }}>Assign ENQUIRY To (Technicians) *</label>
                  
                  <div style={{ background: "#111116", border: "1px solid #2d2d3a", borderRadius: "8px", padding: "10px", maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {technicians.length === 0 ? (
                      <div style={{ fontSize: "12px", color: "#718096" }}>No active technicians found. Add technician roles in Employee Master.</div>
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
                    * Deselect existing technician (if any) for new assignment and
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
      {/* Bulk Transition Stage Modal */}
      {isTransitionModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "15px" }}>
          <div style={{ background: "#181822", border: "1px solid #2d2d3a", borderRadius: "12px", width: "100%", maxWidth: "450px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            
            <div style={{ padding: "15px 20px", borderBottom: "1px solid #2d2d3a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "18px", margin: 0 }}>Bulk Transition Stage</h2>
              <button onClick={() => setIsTransitionModalOpen(false)} style={{ background: "none", border: "none", color: "#718096", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <form onSubmit={handleBulkTransitionSubmit} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                
                <div style={{ background: "rgba(16, 185, 129, 0.15)", padding: "12px", borderRadius: "6px", border: "1px solid #10b981", color: "#34d399", fontSize: "13px" }}>
                  ℹ️ You are moving <b>{selectedJobIds.length}</b> selected enquiries to the selected stage.
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Select Destination Stage *</label>
                  <select 
                    value={bulkTransitionStage} 
                    onChange={e => setBulkTransitionStage(e.target.value)} 
                    required 
                    style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }}
                  >
                    <option value="REFILLING">Refilling Dashboard</option>
                    <option value="SERVICES">Service Dashboard</option>
                  </select>
                </div>

              </div>

              <div style={{ padding: "15px 20px", borderTop: "1px solid #2d2d3a", display: "flex", justifyContent: "flex-end", gap: "10px", background: "#14141c" }}>
                <button type="button" onClick={() => setIsTransitionModalOpen(false)} style={{ padding: "8px 16px", background: "transparent", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#a0aec0", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", background: "#10b981", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer" }}>Transition</button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
