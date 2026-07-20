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
  Upload,
  ArrowRightCircle,
  Download,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight
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
  stageData?: string | null;
  createdAt: string;
}

interface Technician {
  id: string;
  fullName: string;
  phone: string;
  isActive: boolean;
  role: string;
}

import PDFCertificateModal from "@/components/PDFCertificateModal";
import AuditLogModal from "@/components/AuditLogModal";
import { Printer, ShieldCheck } from "lucide-react";

export default function EnquiryDashboardPage() {
  const { config } = useConfig();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState("all");
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, any>>({});
  const [isDragging, setIsDragging] = useState(false);

  // Certificate & Audit Modal States
  const [pdfJob, setPdfJob] = useState<any | null>(null);
  const [auditJob, setAuditJob] = useState<{ id: string; clientName: string } | null>(null);

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
  }, []);

  const toggleTableDensity = (density: "compact" | "normal") => {
    setTableDensity(density);
    localStorage.setItem("ems_table_density", density);
  };

  const filteredEnquiries = enquiries.filter(enq => {
    if (selectedCategoryTab === "all") return true;
    return enq.requirementCategory === selectedCategoryTab;
  });

  // Client-side pagination calculations
  const totalItems = filteredEnquiries.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedEnquiries = filteredEnquiries.slice(startIndex, endIndex);

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

  // Flow 2: Single-ticket transition state
  const [isSingleTransitionModalOpen, setIsSingleTransitionModalOpen] = useState(false);
  const [singleTransitionEnquiry, setSingleTransitionEnquiry] = useState<Enquiry | null>(null);
  const [singleTransitionLoading, setSingleTransitionLoading] = useState(false);

  // Bulk import instructions panel
  const [showImportGuide, setShowImportGuide] = useState(false);

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
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategoryTab]);

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
    setCustomFieldsData({});
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
          stageData: customFieldsData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create enquiry");

      // Flow 3: Auto-Route — if category is "Refilling", immediately move the new ticket to REFILLING stage.
      if (requirementCategory === "Refilling" && data.id) {
        await fetch("/api/jobs/bulk-transition", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobIds: [data.id],
            toStage: "REFILLING",
            skipStatusCheck: true, // bypass Order Confirmed guard since ticket was just created
          }),
        });
        setSuccessMsg("Refilling enquiry auto-routed to Refilling Dashboard!");
      } else {
        setSuccessMsg("Enquiry registered successfully!");
      }

      setIsAddModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 4000);
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

    setCustomFieldsData(enq.stageData ? JSON.parse(enq.stageData) : {});
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
          stageData: customFieldsData,
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

      // Flow 1: Show how many were transitioned vs skipped
      if (data.skipped > 0) {
        setSuccessMsg(`Transitioned ${data.transitioned} enquiries. Skipped ${data.skipped} (not "Order Confirmed"): ${data.skippedTickets.join(", ")}`);
      } else {
        setSuccessMsg(`Successfully transitioned ${data.transitioned} enquiries to ${bulkTransitionStage}!`);
      }
      setIsTransitionModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // Flow 2: Open single-ticket transition confirm modal
  const handleSingleTransitionOpen = (enq: Enquiry) => {
    setSingleTransitionEnquiry(enq);
    setIsSingleTransitionModalOpen(true);
  };

  // Flow 2: Submit single-ticket transition
  const handleSingleTransitionSubmit = async () => {
    if (!singleTransitionEnquiry) return;
    setSingleTransitionLoading(true);
    try {
      const res = await fetch("/api/jobs/bulk-transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobIds: [singleTransitionEnquiry.id],
          toStage: "REFILLING",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to transition enquiry");
      setSuccessMsg(`${singleTransitionEnquiry.jobNumber} moved to Refilling Dashboard!`);
      setIsSingleTransitionModalOpen(false);
      setSingleTransitionEnquiry(null);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setSingleTransitionLoading(false);
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

  // Download CSV Template for bulk import
  const downloadTemplate = () => {
    const headers = [
      "Customer Name",
      "Contact Person Name",
      "Mobile",
      "Mobile 2",
      "Email",
      "Address",
      "Cylinder S/N",
      "Weight",
      "Type",
      "Description",
      "Enquiry Source",
      "Requirement Category",
      "Enquiry Date",
      "Requested Delivery Date",
      "Enquiry Status",
      "Follow Up Date",
      "Follow Up Remarks",
      "Visit Date",
      "Admin Instructions",
      "Technician Instructions",
      "Customer Location",
      "Delivered Date",
      "AMC Years",
      "Assigned Technicians",
      "Upload To",
    ];
    const exampleRow = [
      "KH Chemicals",
      "Karamad Begum",
      "9840135355",
      "9840135356",
      "karamad@khchem.com",
      "Tambaram, Chennai",
      "CYL-001",
      "9 Kg",
      "DCP",
      "Annual refilling service",
      "Existing Customers",
      "Refilling",
      "14/07/2026",
      "20/07/2026",
      "Order Confirmed",
      "16/07/2026",
      "Customer confirmed order",
      "18/07/2026",
      "Handle with care",
      "Check valve before refill",
      "",
      "",
      "",
      "Ravi Kumar",
      "Refilling",
    ];
    const csvContent = [
      headers.join(","),
      exampleRow.map(v => `"${v}"`).join(","),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "safeway_bulk_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const processImportFile = async (file: File) => {
    setImporting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) throw new Error("Empty file content");

        // Use Web Worker if supported for asynchronous parsing
        if (typeof Worker !== "undefined") {
          const worker = new Worker("/csv-worker.js");
          worker.onmessage = async (e) => {
            if (e.data.error) {
              setErrorMsg(e.data.error);
              setImporting(false);
              worker.terminate();
              return;
            }
            if (e.data.success) {
              const rows = e.data.records;
              const res = await fetch("/api/jobs/bulk-import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rows }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Failed to process bulk import");

              setSuccessMsg(
                `⚡ Web Worker Import complete! Created: ${data.created}, Updated: ${data.updated}, Failed: ${data.failed}.`
              );
              fetchData();
              setImporting(false);
              worker.terminate();
            }
          };
          worker.postMessage(text);
          return;
        }

        // Fallback synchronous parser
        const lines = text.split(/\r?\n/);
        const headers = lines[0].split(",").map(h => h.replace(/^["']|["']$/g, "").trim());
        const rows: Record<string, string>[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const values = line.split(",");
          const row: Record<string, string> = {};
          for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = (values[j] || "").replace(/^["']|["']$/g, "").trim();
          }
          rows.push(row);
        }

        const res = await fetch("/api/jobs/bulk-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows }),
        });
        const data = await res.json();
        setSuccessMsg(`Import complete! Created: ${data.created}, Updated: ${data.updated}.`);
        fetchData();
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processImportFile(file);
      e.target.value = "";
    }
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
    <div style={{ padding: "20px", color: "#e2e8f0", position: "relative", minHeight: "100%" }}>
      {/* Background Accent Glow Spots */}
      <div className="glow-spot-bg" style={{ width: "400px", height: "400px", top: "-10%", left: "30%" }}></div>
      <div className="glow-spot-bg" style={{ width: "300px", height: "300px", bottom: "10%", right: "10%", background: "radial-gradient(circle, rgba(239, 68, 68, 0.03) 0%, rgba(0, 0, 0, 0) 70%)" }}></div>

      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", position: "relative", zIndex: 1 }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "800", margin: 0, letterSpacing: "-0.03em", background: "linear-gradient(to right, #fff 40%, #cbd5e1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Enquiry Hub</h1>
          <p style={{ fontSize: "13.5px", color: "#94a3b8", margin: "4px 0 0 0" }}>Real-time telemetry, lead assignment, and dispatch pipeline</p>
        </div>
        <button
          onClick={() => {
            setCompanyName("");
            setContactPerson("");
            setPhone("");
            setPhone2("");
            setEmail("");
            setAddress("");
            setRequirementCategory("SELECT");
            setEnquirySource("SELECT");
            setRequirementDetails("");
            setRequestedDeliveryDate("");
            setEnquiryDate("");
            setFollowUpDate("");
            setNewRemarks("");
            setDeliveredDate("");
            setAmcYears("1");
            setCalculatedAmcDate("");
            setIsAddModalOpen(true);
          }}
          style={{
            padding: "10px 18px",
            background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
            border: "none",
            borderRadius: "12px",
            color: "#fff",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: "600",
            boxShadow: "0 6px 20px rgba(220, 38, 38, 0.25)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 25px rgba(220, 38, 38, 0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(220, 38, 38, 0.25)";
          }}
        >
          <Plus size={16} />
          Register Enquiry
        </button>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
        
        {/* Flux Card 1: Enquiries Breakdown with Progress Bars */}
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
                Total Enquiries Pipeline
              </span>
              <span style={{ background: "rgba(163, 230, 53, 0.18)", color: "#a3e635", fontSize: "0.75rem", fontWeight: "800", padding: "3px 10px", borderRadius: "9999px" }}>
                +5% today
              </span>
            </div>
            <div style={{ fontSize: "2.4rem", fontWeight: "800", letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: "1.25rem" }}>
              {enquiries.length} <span style={{ fontSize: "0.9rem", fontWeight: "500", color: "var(--text-muted)" }}>active leads</span>
            </div>
          </div>

          {/* Flux Horizontal Progress Bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: "700", marginBottom: "0.35rem" }}>
                <span>Registered Leads ({enquiries.filter(e => e.currentStatus === "Enquiry Registered").length})</span>
                <span style={{ color: "#c084fc" }}>45%</span>
              </div>
              <div style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
                <div style={{ width: "45%", height: "100%", background: "#c084fc", borderRadius: "9999px" }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: "700", marginBottom: "0.35rem" }}>
                <span>Orders Confirmed ({enquiries.filter(e => e.currentStatus === "Order Confirmed").length})</span>
                <span style={{ color: "var(--text-secondary)" }}>30%</span>
              </div>
              <div style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
                <div style={{ width: "30%", height: "100%", background: "#52525b", borderRadius: "9999px" }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: "700", marginBottom: "0.35rem" }}>
                <span>Orders Delivered ({enquiries.filter(e => e.currentStatus === "Order Delivered").length})</span>
                <span style={{ color: "#a3e635" }}>25%</span>
              </div>
              <div style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
                <div style={{ width: "25%", height: "100%", background: "#a3e635", borderRadius: "9999px" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Flux Card 2: Enquiry Lead Conversion & Area Trend Analytics Widget */}
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
                <span style={{ background: "rgba(163, 230, 53, 0.15)", color: "#a3e635", padding: "6px", borderRadius: "8px" }}>📈</span>
                Enquiry Lead Conversion & Trend Curve
              </div>
              <span style={{ fontSize: "0.78rem", color: "#a3e635", background: "rgba(163, 230, 53, 0.12)", padding: "4px 10px", borderRadius: "9999px", fontWeight: "700" }}>
                78.4% Win Rate
              </span>
            </div>

            <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem" }}>
              <div>
                <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#a3e635" }}>78.4%</div>
                <div style={{ fontSize: "0.72rem", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em" }}>Quote Win Rate</div>
              </div>
              <div>
                <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#38bdf8" }}>3.2 Days</div>
                <div style={{ fontSize: "0.72rem", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em" }}>Avg Sales Cycle</div>
              </div>
            </div>
          </div>

          {/* Smooth Curved SVG Area Trend Line */}
          <div style={{ position: "relative", width: "100%", height: "90px", marginTop: "10px" }}>
            <svg viewBox="0 0 300 80" style={{ width: "100%", height: "100%", overflow: "visible" }}>
              <defs>
                <linearGradient id="enquiryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a3e635" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#a3e635" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path 
                d="M0 60 Q 50 40, 100 50 T 200 20 T 300 10 L 300 80 L 0 80 Z" 
                fill="url(#enquiryAreaGrad)" 
              />
              <path 
                d="M0 60 Q 50 40, 100 50 T 200 20 T 300 10" 
                fill="none" 
                stroke="#a3e635" 
                strokeWidth="3" 
                strokeLinecap="round" 
              />
              {/* Data points */}
              <circle cx="0" cy="60" r="4" fill="#a3e635" />
              <circle cx="100" cy="50" r="4" fill="#a3e635" />
              <circle cx="200" cy="20" r="4" fill="#a3e635" />
              <circle cx="300" cy="10" r="6" fill="#ffffff" stroke="#a3e635" strokeWidth="3" />
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "#71717a", marginTop: "4px" }}>
              <span>Registered</span>
              <span>Quoted</span>
              <span>Confirmed</span>
              <span style={{ color: "#a3e635", fontWeight: "700" }}>Delivered ↗</span>
            </div>
          </div>
        </div>

      </div>

      {/* Floating Toolbar (Search & Filter) */}
      <div className="floating-toolbar">
        <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
          <input
            type="text"
            placeholder="Search client name, contact, enquiry ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "11px 12px 11px 38px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "13.5px", transition: "all 0.2s" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.boxShadow = "0 0 10px rgba(220, 38, 38, 0.15)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-glass)"; e.currentTarget.style.boxShadow = "none"; }}
          />
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "11px 15px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "10px", color: "var(--text-primary)", cursor: "pointer", fontSize: "13.5px", outline: "none" }}
          >
            <option value="all">All Pipeline Stages</option>
            <option value="Enquiry Registered">Enquiry Registered</option>
            <option value="Order Confirmed">Order Confirmed</option>
            <option value="Order Delivered">Order Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          
          <button
            onClick={() => setShowImportGuide(true)}
            title="Open Bulk Import Center to upload files, view column maps, and download templates"
            style={{
              padding: "11px 18px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              color: "#e2e8f0",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13.5px",
              fontWeight: "600",
              transition: "all 0.25s"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
          >
            <Upload size={15} />
            Bulk Import Center
          </button>
        </div>
      </div>

      {/* ── Bulk Import Instructions Panel ── */}
      {showImportGuide && (
        <div className="slide-over-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowImportGuide(false); }}>
          <div className="slide-over-card theme-modal-card" style={{ maxWidth: "600px" }}>
            
            {/* Header */}
            <div className="slide-over-header theme-modal-card-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "18px" }}>📤</span>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#fff" }}>Bulk Import Center</h3>
              </div>
              <button onClick={() => setShowImportGuide(false)} style={{ background: "none", border: "none", color: "#718096", cursor: "pointer", display: "flex", alignItems: "center" }}><X size={20} /></button>
            </div>

            <div className="slide-over-body" style={{ gap: "20px" }}>
              
              {/* Premium Drag & Drop Area */}
              <div 
                className={`dropzone-container ${isDragging ? "dragover" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) await processImportFile(file);
                }}
                onClick={() => document.getElementById("csv-file-picker")?.click()}
              >
                <div className="dropzone-icon-wrapper">
                  <Upload size={24} style={{ color: isDragging ? "#ef4444" : "#6b7280" }} />
                </div>
                <h3 style={{ fontSize: "14px", fontWeight: "bold", margin: 0, color: "#fff" }}>
                  {importing ? "Processing CSV..." : "Drag & Drop CSV File"}
                </h3>
                <p style={{ fontSize: "12px", color: "#a0aec0", margin: 0 }}>
                  {importing ? "Please wait while we upload and parse records..." : "or click here to select a file manually"}
                </p>
                <input 
                  id="csv-file-picker" 
                  type="file" 
                  accept=".csv" 
                  onChange={handleBulkImport} 
                  style={{ display: "none" }} 
                  disabled={importing}
                />
              </div>

              {/* Template Downloader Section */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "12px 15px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "13px", color: "#a0aec0" }}>Need the CSV template structure?</span>
                <button 
                  onClick={downloadTemplate} 
                  style={{ 
                    display: "inline-flex", 
                    alignItems: "center", 
                    gap: "6px", 
                    padding: "8px 12px", 
                    border: "1px solid rgba(59,130,246,0.3)", 
                    borderRadius: "8px", 
                    background: "rgba(59,130,246,0.1)", 
                    color: "#60a5fa", 
                    cursor: "pointer", 
                    fontSize: "12px", 
                    fontWeight: "bold",
                    transition: "all 0.2s"
                  }}
                >
                  <Download size={13} /> Download Template
                </button>
              </div>

              {/* Rules & Tips */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", padding: "12px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#f87171", marginBottom: "6px" }}>⚠️ Rules</div>
                  <ul style={{ margin: 0, paddingLeft: "16px", color: "#a0aec0", fontSize: "11px", lineHeight: "1.8" }}>
                    <li>Use <b style={{ color: "#e2e8f0" }}>"Upload To"</b> column to route: <b style={{ color: "#fbbf24" }}>Refilling</b> | <b style={{ color: "#fbbf24" }}>Service</b></li>
                    <li>File must be saved as <b style={{ color: "#e2e8f0" }}>.csv</b> (not .xlsx)</li>
                    <li>Dates format: <b style={{ color: "#e2e8f0" }}>DD/MM/YYYY</b></li>
                  </ul>
                </div>
                <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "8px", padding: "12px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#6ee7b7", marginBottom: "6px" }}>💡 Tips</div>
                  <ul style={{ margin: 0, paddingLeft: "16px", color: "#a0aec0", fontSize: "11px", lineHeight: "1.8" }}>
                    <li>Column names are <b style={{ color: "#e2e8f0" }}>case-insensitive</b></li>
                    <li>Duplicate cylinders are <b style={{ color: "#e2e8f0" }}>updated</b></li>
                    <li>Add multiple techs: <b style={{ color: "#e2e8f0" }}>"Ravi, Suresh"</b></li>
                  </ul>
                </div>
              </div>

              {/* Mappings Guide Table */}
              <div>
                <h4 style={{ fontSize: "13px", fontWeight: "bold", color: "#fff", marginBottom: "8px" }}>CSV Columns Reference Mappings</h4>
                <div style={{ overflowX: "auto", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11.5px", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                        <th style={{ padding: "8px 12px", color: "#f59e0b", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>Column Name</th>
                        <th style={{ padding: "8px 12px", color: "#f59e0b", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>Required?</th>
                        <th style={{ padding: "8px 12px", color: "#f59e0b", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>Description</th>
                        <th style={{ padding: "8px 12px", color: "#f59e0b", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>Example</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Customer Name",           "✅ Required",  "Company or client name",                                      "KH Chemicals"],
                        ["Contact Person Name",     "Optional",    "Name of contact person",                                      "Karamad Begum"],
                        ["Mobile",                  "Optional",    "Primary phone (used to match customer)",                       "9840135355"],
                        ["Mobile 2",                "Optional",    "Secondary phone number",                                      "9840135356"],
                        ["Email",                   "Optional",    "Customer email address",                                      "test@abc.com"],
                        ["Address",                 "Optional",    "Customer site address",                                        "Tambaram, Chennai"],
                        ["Cylinder S/N",            "Optional",    "Serial number of cylinder",                                   "CYL-001"],
                        ["Weight",                  "Optional",    "Cylinder capacity / weight",                                  "9 Kg"],
                        ["Type",                    "Optional",    "Extinguisher type",                                           "DCP / CO2"],
                        ["Description",             "Optional",    "Item notes / description",                                    "Annual refilling"],
                        ["Enquiry Source",          "Optional",    "How enquiry came in",                                         "Phone Call"],
                        ["Requirement Category",    "Optional",    "Type of service needed",                                      "Refilling"],
                        ["Enquiry Date",            "Optional",    "Date enquiry was made",                                       "14/07/2026"],
                        ["Requested Delivery Date", "Optional",    "Customer delivery date",                                      "20/07/2026"],
                        ["Enquiry Status",          "Optional",    "Starting status",                                             "Order Confirmed"],
                        ["Follow Up Date",          "Optional",    "Next follow-up date",                                         "16/07/2026"],
                        ["Follow Up Remarks",       "Optional",    "Follow-up remarks notes",                                     "Confirmed order"],
                        ["Visit Date",             "Optional",    "Scheduled visit date",                                        "18/07/2026"],
                        ["Admin Instructions",      "Optional",    "Internal notes for admin",                                    "Handle with care"],
                        ["Technician Instructions", "Optional",    "Instructions for technician",                                 "Check valve first"],
                        ["Customer Location",       "Optional",    "GPS coordinates or Map link",                                 "https://maps.google.com/..."],
                        ["Delivered Date",          "Optional",    "Delivered date status",                                       "22/07/2026"],
                        ["AMC Years",               "Optional",    "AMC years contract (1–10)",                                   "1"],
                        ["Assigned Technicians",    "Optional",    "Technician name or phone",                                    "Ravi Kumar"],
                        ["Upload To",               "⭐ Routing",  "Routing control: Refilling \| Service \| blank = Enquiry",    "Refilling"],
                      ].map(([col, req, desc, ex]) => (
                        <tr key={col} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", background: req === "⭐ Routing" ? "rgba(245,158,11,0.06)" : "transparent" }}>
                          <td style={{ padding: "6px 12px", color: req === "⭐ Routing" ? "#fbbf24" : "#93c5fd", fontFamily: "monospace", whiteSpace: "nowrap", fontWeight: req === "⭐ Routing" ? "700" : "normal" }}>{col}</td>
                          <td style={{ padding: "6px 12px", color: req === "✅ Required" ? "#f87171" : req === "⭐ Routing" ? "#f59e0b" : "#718096", whiteSpace: "nowrap" }}>{req}</td>
                          <td style={{ padding: "6px 12px", color: "#a0aec0" }}>{desc}</td>
                          <td style={{ padding: "6px 12px", color: "#6ee7b7", fontFamily: "monospace" }}>{ex}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

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
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontWeight: "600", color: "#60a5fa" }}>
              {selectedJobIds.length} row(s) selected
            </span>
            {/* Flow 1: Show warning if any selected ticket is not Order Confirmed */}
            {(() => {
              const notConfirmed = enquiries
                .filter(e => selectedJobIds.includes(e.id) && e.currentStatus !== "Order Confirmed")
                .map(e => e.jobNumber);
              return notConfirmed.length > 0 ? (
                <span style={{ fontSize: "11px", color: "#f59e0b" }}>
                  ⚠️ {notConfirmed.join(", ")} not yet "Order Confirmed" — will be skipped on Refilling transition
                </span>
              ) : (
                <span style={{ fontSize: "11px", color: "#10b981" }}>
                  ✅ All selected are "Order Confirmed" — ready to transition
                </span>
              );
            })()}
          </div>
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
            {/* Flow 1: Bulk Transition button — always clickable, API handles skipping */}
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

      {/* Table Data Grid */}
      <div style={{ background: "var(--bg-card)", backdropFilter: "blur(20px)", borderRadius: "16px", border: "1px solid var(--border-glass)", padding: "10px", overflowX: "auto", boxShadow: "var(--shadow-glass)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
            <div style={{ display: "inline-block", width: "24px", height: "24px", border: "3px solid rgba(220,38,38,0.2)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <div style={{ marginTop: "10px", fontSize: "14px" }}>Querying telemetry systems...</div>
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "45px 20px", color: "var(--text-secondary)" }}>
            <span style={{ fontSize: "28px" }}>📭</span>
            <div style={{ marginTop: "10px", fontSize: "14px", fontWeight: "600" }}>No telemetry records available</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Register a new client enquiry or import a bulk batch file</div>
          </div>
        ) : (
          <table className={`glass-table table-density-${tableDensity}`}>
            <thead>
              <tr>
                <th style={{ width: "40px", textAlign: "left" }}>
                  <input
                    type="checkbox"
                    checked={filteredEnquiries.length > 0 && selectedJobIds.length === filteredEnquiries.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    style={{ cursor: "pointer", accentColor: "var(--primary)" }}
                  />
                </th>
                <th>S.No</th>
                <th>Enquiry Id</th>
                <th>Client Name</th>
                <th>Contact Name</th>
                <th>Contact Phone</th>
                <th>Category</th>
                <th>Reg. Date</th>
                <th>Status</th>
                <th>Technicians</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEnquiries.map((enq, index) => {
                const statusDotClass = 
                  enq.currentStatus === "Order Delivered" ? "pulse-green" :
                  enq.currentStatus === "Order Confirmed" ? "pulse-blue" :
                  enq.currentStatus === "Cancelled" ? "pulse-red" : "pulse-amber";

                const statusColor =
                  enq.currentStatus === "Order Delivered" ? "#10b981" :
                  enq.currentStatus === "Order Confirmed" ? "#60a5fa" :
                  enq.currentStatus === "Cancelled" ? "#f87171" : "#fbbf24";

                return (
                  <tr key={enq.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedJobIds.includes(enq.id)}
                        onChange={() => handleSelectJob(enq.id)}
                        style={{ cursor: "pointer", accentColor: "var(--primary)" }}
                      />
                    </td>
                    <td style={{ color: "#64748b", fontWeight: "600" }}>{startIndex + index + 1}</td>
                    <td style={{ fontFamily: "monospace", fontWeight: "700", color: "var(--accent)" }}>{enq.jobNumber}</td>
                    <td style={{ fontWeight: "600", color: "#fff" }}>{enq.customer?.companyName || "N/A"}</td>
                    <td>{enq.customer?.contactPerson}</td>
                    <td style={{ fontFamily: "monospace", color: "#94a3b8" }}>{enq.customer?.phone}</td>
                    <td>
                      <span style={{ fontSize: "11px", textTransform: "uppercase", background: "rgba(255,255,255,0.05)", padding: "3px 6px", borderRadius: "5px", border: "1px solid rgba(255,255,255,0.04)" }}>
                        {enq.requirementCategory || "SELECT"}
                      </span>
                    </td>
                    <td>{formatDate(enq.createdAt)}</td>
                    <td>
                      <span className={`pill-badge ${
                        enq.currentStatus === "Order Delivered" || enq.currentStatus === "Closed" ? "pill-badge-green" :
                        enq.currentStatus === "Order Confirmed" ? "pill-badge-blue" :
                        enq.currentStatus === "Cancelled" ? "pill-badge-red" : "pill-badge-amber"
                      }`}>
                        <span className={`priority-dot ${
                          enq.currentStatus === "Order Delivered" || enq.currentStatus === "Closed" ? "priority-dot-green" :
                          enq.currentStatus === "Order Confirmed" ? "priority-dot-amber" :
                          enq.currentStatus === "Cancelled" ? "priority-dot-red" : "priority-dot-amber"
                        }`}></span>
                        {enq.currentStatus || "Enquiry Registered"}
                      </span>
                    </td>
                    <td>
                      {enq.assignments.length === 0 ? (
                        <span style={{ color: "#475569", fontSize: "12px", fontStyle: "italic" }}>Unassigned</span>
                      ) : (
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {enq.assignments.map(a => (
                            <span 
                              key={a.id} 
                              title={a.assignedBy ? `Assigned by: ${a.assignedBy}` : "Assigned by Admin"} 
                              style={{ fontSize: "11px", background: "rgba(59, 130, 246, 0.1)", color: "#93c5fd", padding: "2px 6px", borderRadius: "5px", border: "1px solid rgba(59,130,246,0.15)", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            >
                              <span>{a.technician.fullName}</span>
                              {a.assignedBy && (
                                <span style={{ fontSize: "9.5px", opacity: 0.75, borderLeft: "1px solid rgba(147,197,253,0.3)", paddingLeft: "4px" }}>
                                  by {(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(a.assignedBy) || (a.assignedBy.length >= 32 && a.assignedBy.includes("-") && !a.assignedBy.includes(" "))) ? "Admin" : a.assignedBy}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          onClick={() => handleOpenEdit(enq)}
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
                          title="Edit Enquiry details"
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          onClick={() => setPdfJob({
                            id: enq.id,
                            clientName: enq.customer?.companyName || enq.customer?.contactPerson || "Client",
                            contactNumber: enq.customer?.phone || "",
                            cylinderTag: (enq as any).customFields?.cylinderTag || "CYL-2026-X",
                            equipmentCapacity: (enq as any).customFields?.equipmentCapacity || "6.0 KG",
                            equipmentType: enq.requirementCategory || "ABC Fire Extinguisher",
                            deliveredDate: enq.createdAt
                          })}
                          style={{
                            background: "rgba(56, 189, 248, 0.08)",
                            border: "1px solid rgba(56, 189, 248, 0.2)",
                            color: "#38bdf8",
                            padding: "7px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          title="Print / Save Fire Safety Certificate PDF"
                        >
                          <Printer size={13} />
                        </button>

                        <button
                          onClick={() => setAuditJob({ id: enq.id, clientName: enq.customer?.companyName || enq.customer?.contactPerson || "Client" })}
                          style={{
                            background: "rgba(163, 230, 53, 0.08)",
                            border: "1px solid rgba(163, 230, 53, 0.2)",
                            color: "#a3e635",
                            padding: "7px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          title="View Security Audit Compliance History"
                        >
                          <ShieldCheck size={13} />
                        </button>
                        
                        {enq.currentStatus === "Order Confirmed" && (
                          <button
                            onClick={() => handleOpenAssign(enq)}
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
                        )}

                        {enq.currentStatus === "Order Confirmed" && (
                          <button
                            onClick={() => handleSingleTransitionOpen(enq)}
                            style={{
                              background: "rgba(16, 185, 129, 0.08)",
                              border: "1px solid rgba(16, 185, 129, 0.2)",
                              color: "#10b981",
                              padding: "6px 10px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "11px",
                              fontWeight: "700",
                              transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(16, 185, 129, 0.18)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(16, 185, 129, 0.08)"; }}
                            title="Move to Refilling Dashboard"
                          >
                            <ArrowRightCircle size={13} /> Refilling
                          </button>
                        )}
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

      {/* Floating Add Button Removed */}

      {/* Add Enquiry Modal */}
      {isAddModalOpen && (
        <div className="slide-over-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setIsAddModalOpen(false); }}>
          <div className="slide-over-card theme-modal-card">
            <div className="slide-over-header theme-modal-card-header">
              <h2 style={{ fontSize: "18px", margin: 0, fontWeight: "bold", color: "#fff" }}>Register New Enquiry</h2>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: "none", border: "none", color: "#718096", cursor: "pointer", display: "flex", alignItems: "center" }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div className="slide-over-body">
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
                      {(config?.categories || ["CCTV", "New Fire Extinguisher", "Refilling"]).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {/* Flow 3: Auto-route banner */}
                    {requirementCategory === "Refilling" && (
                      <div style={{
                        marginTop: "6px",
                        padding: "8px 10px",
                        background: "rgba(245, 158, 11, 0.12)",
                        border: "1px solid rgba(245, 158, 11, 0.4)",
                        borderRadius: "6px",
                        color: "#f59e0b",
                        fontSize: "11px",
                        lineHeight: "1.5",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "6px",
                      }}>
                        <span style={{ marginTop: "1px" }}>⚡</span>
                        <span><b>Auto-Route Active:</b> This ticket will be sent directly to the <b>Refilling Dashboard</b> after registration.</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Source of Enquiry</label>
                    <select value={enquirySource} onChange={e => setEnquirySource(e.target.value)} style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }}>
                      <option value="SELECT">SELECT</option>
                      {(config?.sources || ["Existing Customers", "Social Media", "Phone Call", "Walk-in", "Email Enquiry", "Field Agent", "Website"]).map(src => (
                        <option key={src} value={src}>{src}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Requirement Description</label>
                  <textarea value={requirementDetails} onChange={e => setRequirementDetails(e.target.value)} rows={2} placeholder="Details about customer specifications..." style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff", resize: "none" }} />
                </div>
                {/* Custom Fields in Add modal */}
                {config?.stages?.ENQUIRY?.fields && config.stages.ENQUIRY.fields.length > 0 && (
                  <div style={{ marginTop: "15px", padding: "15px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px" }}>
                    <h3 style={{ fontSize: "12px", fontWeight: "bold", color: "var(--accent)", marginBottom: "12px" }}>Custom Fields</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {config.stages.ENQUIRY.fields.map(field => {
                        const val = customFieldsData[field.key] ?? "";
                        const onChange = (newVal: any) => setCustomFieldsData({ ...customFieldsData, [field.key]: newVal });
                        return (
                          <div key={field.key}>
                            <label style={{ fontSize: "11px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>
                              {field.label} {field.required ? "*" : ""}
                            </label>
                            {field.type === "boolean" ? (
                              <input type="checkbox" checked={!!val} onChange={e => onChange(e.target.checked)} style={{ accentColor: "var(--primary)", transform: "scale(1.1)", cursor: "pointer" }} />
                            ) : field.type === "select" ? (
                              <select value={val} onChange={e => onChange(e.target.value)} required={field.required} style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }}>
                                <option value="">SELECT</option>
                                {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            ) : field.type === "multi-select" ? (
                              <input type="text" value={val} onChange={e => onChange(e.target.value)} placeholder="Comma-separated values" required={field.required} style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                            ) : (
                              <input type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"} value={val} onChange={e => onChange(e.target.value)} required={field.required} style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="slide-over-footer">
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: "8px 16px", background: "transparent", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#a0aec0", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", background: "#3b82f6", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer" }}>Register</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Enquiry Modal (Tabbed Layout) */}
      {isEditModalOpen && selectedEnquiry && (
        <div className="slide-over-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setIsEditModalOpen(false); }}>
          <div className="slide-over-card theme-modal-card" style={{ maxWidth: "660px" }}>
            
            {/* Modal Header */}
            <div className="slide-over-header theme-modal-card-header">
              <h2 style={{ fontSize: "18px", margin: 0, fontWeight: "bold", color: "#fff" }}>Edit Enquiry: <span style={{ color: "#3b82f6" }}>{selectedEnquiry.jobNumber}</span></h2>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: "none", border: "none", color: "#718096", cursor: "pointer", display: "flex", alignItems: "center" }}><X size={20} /></button>
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
              <div className="slide-over-body">
                
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
                          {(config?.categories || ["CCTV", "New Fire Extinguisher", "Refilling"]).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Source of Enquiry *</label>
                        <select value={enquirySource} onChange={e => setEnquirySource(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }}>
                          <option value="SELECT">SELECT</option>
                          {(config?.sources || ["Existing Customers", "Social Media", "Phone Call", "Walk-in", "Email Enquiry", "Field Agent", "Website"]).map(src => (
                            <option key={src} value={src}>{src}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Requirement</label>
                      <textarea value={requirementDetails} onChange={e => setRequirementDetails(e.target.value)} rows={4} placeholder="Cylinder count, medium type..." style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff", resize: "none" }} />
                    </div>
                    {/* Custom Fields in Edit modal */}
                    {config?.stages?.ENQUIRY?.fields && config.stages.ENQUIRY.fields.length > 0 && (
                      <div style={{ marginTop: "15px", padding: "15px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px" }}>
                        <h3 style={{ fontSize: "12px", fontWeight: "bold", color: "var(--accent)", marginBottom: "12px" }}>Custom Fields</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {config.stages.ENQUIRY.fields.map(field => {
                            const val = customFieldsData[field.key] ?? "";
                            const onChange = (newVal: any) => setCustomFieldsData({ ...customFieldsData, [field.key]: newVal });
                            return (
                              <div key={field.key}>
                                <label style={{ fontSize: "11px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>
                                  {field.label} {field.required ? "*" : ""}
                                </label>
                                {field.type === "boolean" ? (
                                  <input type="checkbox" checked={!!val} onChange={e => onChange(e.target.checked)} style={{ accentColor: "var(--primary)", transform: "scale(1.1)", cursor: "pointer" }} />
                                ) : field.type === "select" ? (
                                  <select value={val} onChange={e => onChange(e.target.value)} required={field.required} style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }}>
                                    <option value="">SELECT</option>
                                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                  </select>
                                ) : field.type === "multi-select" ? (
                                  <input type="text" value={val} onChange={e => onChange(e.target.value)} placeholder="Comma-separated values" required={field.required} style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                                ) : (
                                  <input type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"} value={val} onChange={e => onChange(e.target.value)} required={field.required} style={{ width: "100%", padding: "8px", background: "#111116", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#fff" }} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
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
              <div className="slide-over-footer">
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ padding: "8px 16px", background: "transparent", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#a0aec0", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", background: "#ff4d80", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer" }}>Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Technician Modal */}
      {isAssignModalOpen && (isBulkAssign || selectedEnquiry) && (
        <div className="slide-over-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setIsAssignModalOpen(false); }}>
          <div className="slide-over-card theme-modal-card">
            
            <div className="slide-over-header theme-modal-card-header">
              <h2 style={{ fontSize: "18px", margin: 0, fontWeight: "bold", color: "#fff" }}>
                {isBulkAssign ? `Bulk Assign (${selectedJobIds.length} Enquiries)` : "Assign Technician"}
              </h2>
              <button onClick={() => setIsAssignModalOpen(false)} style={{ background: "none", border: "none", color: "#718096", cursor: "pointer", display: "flex", alignItems: "center" }}><X size={20} /></button>
            </div>
 
            <form onSubmit={handleAssignSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div className="slide-over-body">
                
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
                    * Delete existing assignment from technician view screen
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

                {/* Flow 1: Show skippable tickets warning */}
                {(() => {
                  const notConfirmed = enquiries
                    .filter(e => selectedJobIds.includes(e.id) && e.currentStatus !== "Order Confirmed")
                    .map(e => e.jobNumber);
                  return notConfirmed.length > 0 && bulkTransitionStage === "REFILLING" ? (
                    <div style={{ background: "rgba(245, 158, 11, 0.12)", padding: "10px 12px", borderRadius: "6px", border: "1px solid rgba(245, 158, 11, 0.4)", color: "#f59e0b", fontSize: "12px", lineHeight: "1.5" }}>
                      ⚠️ <b>The following tickets will be skipped</b> because they are not yet "Order Confirmed":<br />
                      <span style={{ fontFamily: "monospace", fontSize: "11px" }}>{notConfirmed.join(", ")}</span>
                    </div>
                  ) : null;
                })()}

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

      {/* Flow 2: Single-Ticket Transition Confirm Modal */}
      {isSingleTransitionModalOpen && singleTransitionEnquiry && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.75)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: "15px" }}>
          <div style={{ background: "#181822", border: "1px solid #2d2d3a", borderRadius: "12px", width: "100%", maxWidth: "420px", overflow: "hidden" }}>

            <div style={{ padding: "15px 20px", borderBottom: "1px solid #2d2d3a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "17px", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <ArrowRightCircle size={18} color="#10b981" /> Move to Refilling
              </h2>
              <button onClick={() => { setIsSingleTransitionModalOpen(false); setSingleTransitionEnquiry(null); }} style={{ background: "none", border: "none", color: "#718096", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.4)", borderRadius: "8px", padding: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ fontSize: "12px", color: "#a0aec0" }}>Ticket</div>
                <div style={{ fontFamily: "monospace", fontWeight: "bold", fontSize: "16px", color: "#10b981" }}>{singleTransitionEnquiry.jobNumber}</div>
                <div style={{ fontSize: "13px", color: "#e2e8f0" }}>{singleTransitionEnquiry.customer?.companyName || singleTransitionEnquiry.customer?.contactPerson}</div>
              </div>
              <p style={{ margin: 0, color: "#a0aec0", fontSize: "13px", lineHeight: "1.6" }}>
                This ticket will be moved from <b style={{ color: "#fff" }}>Enquiry Dashboard</b> to the <b style={{ color: "#10b981" }}>Refilling Dashboard</b> with status <b style={{ color: "#fff" }}>"Refilling Order Received"</b>.
              </p>
              <p style={{ margin: 0, color: "#718096", fontSize: "12px" }}>
                This action is logged in the ticket history and cannot be auto-reversed.
              </p>
            </div>

            <div style={{ padding: "15px 20px", borderTop: "1px solid #2d2d3a", display: "flex", justifyContent: "flex-end", gap: "10px", background: "#14141c" }}>
              <button
                onClick={() => { setIsSingleTransitionModalOpen(false); setSingleTransitionEnquiry(null); }}
                style={{ padding: "8px 16px", background: "transparent", border: "1px solid #2d2d3a", borderRadius: "6px", color: "#a0aec0", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSingleTransitionSubmit}
                disabled={singleTransitionLoading}
                style={{
                  padding: "8px 18px",
                  background: singleTransitionLoading ? "#065f46" : "#10b981",
                  border: "none",
                  borderRadius: "6px",
                  color: "#fff",
                  cursor: singleTransitionLoading ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <ArrowRightCircle size={14} />
                {singleTransitionLoading ? "Moving..." : "Confirm & Move"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PDF Compliance Certificate Generator Modal */}
      <PDFCertificateModal
        isOpen={!!pdfJob}
        onClose={() => setPdfJob(null)}
        job={pdfJob}
      />

      {/* Security Audit Compliance Log Modal */}
      <AuditLogModal
        isOpen={!!auditJob}
        onClose={() => setAuditJob(null)}
        jobId={auditJob?.id || null}
        clientName={auditJob?.clientName || null}
      />
    </div>
  );
}
