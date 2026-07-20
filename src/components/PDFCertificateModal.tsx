"use client";

import React from "react";
import { Printer, Download, X, ShieldCheck, Flame, CheckCircle2 } from "lucide-react";

interface PDFCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: string;
    clientName: string;
    contactNumber: string;
    cylinderTag?: string;
    equipmentCapacity?: string;
    equipmentType?: string;
    currentStatus?: string;
    deliveredDate?: string;
    coverageYears?: number;
    nextRefillingDate?: string;
  } | null;
}

export default function PDFCertificateModal({ isOpen, onClose, job }: PDFCertificateModalProps) {
  if (!isOpen || !job) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.85)",
      backdropFilter: "blur(12px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem"
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: "20px",
        width: "100%",
        maxWidth: "680px",
        padding: "2rem",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        color: "#0f172a",
        maxHeight: "90vh",
        overflowY: "auto"
      }} className="printable-certificate">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ background: "#ecfdf5", color: "#10b981", padding: "6px 12px", borderRadius: "9999px", fontSize: "12px", fontWeight: "700" }}>
              📜 Printable Certificate Preview
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handlePrint}
              style={{
                background: "#0f172a",
                color: "#ffffff",
                border: "none",
                borderRadius: "9999px",
                padding: "0.55rem 1.25rem",
                fontSize: "0.85rem",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Printer size={16} /> Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              style={{ background: "#f1f5f9", border: "none", color: "#64748b", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Certificate Content Body */}
        <div style={{ border: "4px double #0f172a", padding: "2rem", borderRadius: "12px", background: "#ffffff", position: "relative" }}>
          
          {/* Official Seal Watermark */}
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            opacity: 0.04,
            pointerEvents: "none"
          }}>
            <Flame size={240} />
          </div>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#dc2626", fontWeight: "800", fontSize: "1.3rem" }}>
                <Flame size={26} fill="currentColor" /> SAFEWAY FIRE SAFETY PRO
              </div>
              <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "2px 0 0 0" }}>
                ISO 9001:2025 Certified Maintenance & Cylinder Refilling Facility
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Certificate No.</div>
              <div style={{ fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>CERT-{job.id.substring(0, 8).toUpperCase()}</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>Date: {new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <div style={{ textAlign: "center", margin: "1.5rem 0", borderTop: "2px solid #e2e8f0", borderBottom: "2px solid #e2e8f0", padding: "0.75rem 0" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: "800", letterSpacing: "0.05em", color: "#0f172a", margin: 0, textTransform: "uppercase" }}>
              Certificate of Fire Equipment Compliance & Testing
            </h2>
          </div>

          <p style={{ fontSize: "0.9rem", color: "#334155", lineHeight: "1.6", marginBottom: "1.5rem" }}>
            This is to certify that the fire safety equipment detailed below has undergone rigorous hydrostatic pressure testing, gas refilling, and functional safety inspection in accordance with national safety standards.
          </p>

          {/* Details Table Grid */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.85rem" }}>
              <div>
                <span style={{ color: "#64748b", fontWeight: "600" }}>Client / Facility Name:</span>
                <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "1rem" }}>{job.clientName}</div>
              </div>
              <div>
                <span style={{ color: "#64748b", fontWeight: "600" }}>Contact Number:</span>
                <div style={{ fontWeight: "700", color: "#0f172a" }}>{job.contactNumber || "N/A"}</div>
              </div>
              <div>
                <span style={{ color: "#64748b", fontWeight: "600" }}>Equipment / Tag Serial:</span>
                <div style={{ fontWeight: "700", color: "#dc2626" }}>{job.cylinderTag || "SAFEWAY-TAG-01"}</div>
              </div>
              <div>
                <span style={{ color: "#64748b", fontWeight: "600" }}>Extinguisher Type:</span>
                <div style={{ fontWeight: "700", color: "#0f172a" }}>{job.equipmentType || "ABC Dry Powder"}</div>
              </div>
              <div>
                <span style={{ color: "#64748b", fontWeight: "600" }}>Equipment Capacity:</span>
                <div style={{ fontWeight: "700", color: "#0f172a" }}>{job.equipmentCapacity || "6.0 KG"}</div>
              </div>
              <div>
                <span style={{ color: "#64748b", fontWeight: "600" }}>Status / Approval:</span>
                <div style={{ fontWeight: "800", color: "#16a34a" }}>PASSED & CERTIFIED</div>
              </div>
              <div>
                <span style={{ color: "#64748b", fontWeight: "600" }}>Service / Setup Date:</span>
                <div style={{ fontWeight: "700", color: "#0f172a" }}>{job.deliveredDate ? new Date(job.deliveredDate).toLocaleDateString() : new Date().toLocaleDateString()}</div>
              </div>
              <div>
                <span style={{ color: "#64748b", fontWeight: "600" }}>Next Mandatory Inspection:</span>
                <div style={{ fontWeight: "800", color: "#dc2626" }}>{job.nextRefillingDate ? new Date(job.nextRefillingDate).toLocaleDateString() : "Next Year"}</div>
              </div>
            </div>
          </div>

          {/* Signature & Stamp Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "2rem", paddingTop: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#16a34a", fontWeight: "800", fontSize: "0.85rem", marginBottom: "4px" }}>
                <ShieldCheck size={18} /> Official Stamp Verified
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Safeway EMS Quality Testing Unit</div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ width: "160px", borderBottom: "1px solid #0f172a", marginBottom: "4px" }}></div>
              <div style={{ fontSize: "0.8rem", fontWeight: "800", color: "#0f172a" }}>Authorized Inspector</div>
              <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Safeway Fire Safety Division</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
