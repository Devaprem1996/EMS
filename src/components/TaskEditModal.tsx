"use client";

import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import DynamicForm from "./DynamicForm";

function SignaturePad({ onSave, onClear }: { onSave: (base64: string) => void; onClear: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#ff4d80"; // Premium Accent pink-red
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    if (e.cancelable) {
      e.preventDefault();
    }
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL("image/png"));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ border: "1px dashed var(--border-glass)", borderRadius: "8px", background: "#0c0c10", overflow: "hidden", position: "relative" }}>
        <canvas
          ref={canvasRef}
          width={580}
          height={150}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ display: "block", cursor: "crosshair", width: "100%", height: "150px" }}
        />
        <button
          type="button"
          onClick={clear}
          style={{
            position: "absolute",
            bottom: "8px",
            right: "8px",
            padding: "4px 8px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid var(--border-glass)",
            borderRadius: "4px",
            color: "var(--text-secondary)",
            fontSize: "11px",
            cursor: "pointer"
          }}
        >
          Clear Pad
        </button>
      </div>
    </div>
  );
}

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

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAsg: Assignment;
  config: any;
  onSuccess: () => void;
  onError: (err: string) => void;
}

export default function TaskEditModal({
  isOpen,
  onClose,
  selectedAsg,
  config,
  onSuccess,
  onError
}: TaskEditModalProps) {
  const [visitDate, setVisitDate] = useState("");
  const [technicianInstructions, setTechnicianInstructions] = useState("");
  const [customerLocation, setCustomerLocation] = useState("");
  const [completedStatus, setCompletedStatus] = useState("Pending");
  const [signature, setSignature] = useState<string | null>(null);
  const [existingSignature, setExistingSignature] = useState<string | null>(null);
  const [dynamicFormValues, setDynamicFormValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (selectedAsg) {
      setVisitDate(selectedAsg.job.visitDate ? selectedAsg.job.visitDate.split("T")[0] : "");
      setTechnicianInstructions(selectedAsg.job.technicianInstructions || "");
      setCustomerLocation(selectedAsg.job.customerLocation || "");
      
      const currentAsgStatus = selectedAsg.status === "ASSIGNED" ? "Pending" : selectedAsg.status;
      setCompletedStatus(currentAsgStatus);

      let existingSign: string | null = null;
      let parsedStageData: Record<string, unknown> = {};
      if (selectedAsg.job.stageData) {
        try {
          parsedStageData = JSON.parse(selectedAsg.job.stageData);
          if (parsedStageData.signature) {
            existingSign = parsedStageData.signature as string;
          }
        } catch (e) {}
      }
      setExistingSignature(existingSign);
      setSignature(null);
      setDynamicFormValues(parsedStageData);
    }
  }, [selectedAsg]);

  const getStatusOptions = (assignFor: string | null) => {
    if (assignFor === "REFILLING") {
      return ["Pending", "Assign For Service", "Completed"];
    }
    return ["Pending", "Completed"];
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let finalSignatureUrl = undefined;
      if (signature && signature.startsWith("data:image/png;base64,")) {
        // Upload base64 signature pad to server
        const uploadRes = await fetch("/api/uploads/signature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signature }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Failed to upload signature file");
        finalSignatureUrl = uploadData.url;
      }

      const res = await fetch(`/api/tasks/${selectedAsg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: completedStatus,
          visitDate: visitDate || null,
          technicianInstructions,
          customerLocation,
          signature: finalSignatureUrl || signature || undefined,
          stageData: dynamicFormValues,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update task details");

      onSuccess();
    } catch (err: any) {
      onError(err.message || "Failed to update task details");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="slide-over-backdrop" style={{ zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="slide-over-card theme-modal-card" style={{ maxWidth: "650px", maxHeight: "95%" }}>
        
        {/* Modal Header */}
        <div className="slide-over-header theme-modal-card-header">
          <h2 style={{ fontSize: "18px", margin: 0, fontWeight: "700", color: "var(--text-primary)" }}>Task Details</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", display: "inline-flex" }}><X size={20} /></button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div style={{ padding: "20px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "18px" }}>
            
            {/* Client / Contact Person */}
            <div className="responsive-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {/* Client Name */}
              <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-input)" }}>
                <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-input)", padding: "0 4px", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600" }}>Client Name*</span>
                <input type="text" value={selectedAsg.job.customer?.companyName || ""} readOnly className="transparent-input" style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "var(--text-secondary)", cursor: "not-allowed" }} />
              </div>
              {/* Contact Person */}
              <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-input)" }}>
                <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-input)", padding: "0 4px", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600" }}>Contact Person*</span>
                <input type="text" value={selectedAsg.job.customer?.contactPerson || ""} readOnly className="transparent-input" style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "var(--text-secondary)", cursor: "not-allowed" }} />
              </div>
            </div>

            {/* Contact Number / Visit Date */}
            <div className="responsive-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {/* Contact Number */}
              <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-input)" }}>
                <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-input)", padding: "0 4px", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600" }}>Contact Number*</span>
                <input type="text" value={selectedAsg.job.customer?.phone || ""} readOnly className="transparent-input" style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "var(--text-secondary)", cursor: "not-allowed" }} />
              </div>
              {/* Visit/Service Date */}
              <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-card)" }}>
                <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-card)", padding: "0 4px", fontSize: "11px", color: "var(--accent)", fontWeight: "600" }}>Visit/Service Date*</span>
                <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} required className="transparent-input" style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "var(--text-primary)", cursor: "pointer" }} />
              </div>
            </div>

            {/* Address */}
            <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-input)" }}>
              <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-input)", padding: "0 4px", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600" }}>Address</span>
              <textarea value={selectedAsg.job.customer?.address || ""} readOnly rows={2} className="transparent-input" style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "var(--text-secondary)", cursor: "not-allowed", resize: "none", fontFamily: "inherit" }} />
            </div>

            {/* Instructions */}
            <div className="responsive-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {/* Admin Instructions */}
              <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-input)" }}>
                <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-input)", padding: "0 4px", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600" }}>Admin Instructions</span>
                <textarea value={selectedAsg.job.adminInstructions || ""} readOnly rows={2} className="transparent-input" style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "var(--text-secondary)", cursor: "not-allowed", resize: "none", fontFamily: "inherit" }} />
              </div>
              {/* Technician Instructions */}
              <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-card)" }}>
                <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-card)", padding: "0 4px", fontSize: "11px", color: "var(--accent)", fontWeight: "600" }}>Technician Instructions</span>
                <textarea value={technicianInstructions} onChange={e => setTechnicianInstructions(e.target.value)} rows={2} className="transparent-input" style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "var(--text-primary)", resize: "none", fontFamily: "inherit" }} />
              </div>
            </div>

            {/* Customer Location */}
            <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-card)" }}>
              <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-card)", padding: "0 4px", fontSize: "11px", color: "var(--accent)", fontWeight: "600" }}>Customer Location</span>
              <input type="text" value={customerLocation} onChange={e => setCustomerLocation(e.target.value)} placeholder="Maps link or coordinates..." className="transparent-input" style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "var(--text-primary)" }} />
            </div>

            {/* Assigned For & Completed Status */}
            <div className="responsive-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {/* Assigned For */}
              <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-input)" }}>
                <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-input)", padding: "0 4px", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600" }}>Assigned For*</span>
                <input type="text" value={selectedAsg.job.assignFor || "DELIVERY"} readOnly className="transparent-input" style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "var(--text-secondary)", cursor: "not-allowed" }} />
              </div>
              {/* Completed Status */}
              <div style={{ position: "relative", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "6px 12px", background: "var(--bg-card)" }}>
                <span style={{ position: "absolute", top: "-8px", left: "10px", background: "var(--bg-card)", padding: "0 4px", fontSize: "11px", color: "var(--accent)", fontWeight: "600" }}>Completed Status*</span>
                <select value={completedStatus} onChange={e => setCompletedStatus(e.target.value)} required className="transparent-input" style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", padding: "4px 0", color: "var(--text-primary)", cursor: "pointer" }}>
                  {getStatusOptions(selectedAsg.job.assignFor).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dynamic Config Fields Form */}
            {(() => {
              const stageCode = selectedAsg.job.assignFor || "DELIVERY";
              const stagesMap = config?.stages as Record<string, { displayName?: string; fields?: Array<{ key: string; label: string; type: "text" | "number" | "boolean" | "select" | "multi-select"; options?: string[]; required?: boolean }> }> | undefined;
              const stageConfig = stagesMap?.[stageCode];
              const stageFields = stageConfig?.fields || [];
              if (stageFields.length === 0) return null;

              return (
                <div style={{ marginTop: "10px", borderTop: "1px solid var(--border-glass)", paddingTop: "15px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)", margin: "0 0 15px 0" }}>
                    {stageConfig?.displayName || "Stage"} Checklist
                  </h4>
                  <DynamicForm
                    fields={stageFields}
                    values={dynamicFormValues}
                    onChange={(key, val) => setDynamicFormValues(prev => ({ ...prev, [key]: val }))}
                  />
                </div>
              );
            })()}

            {/* Dynamic Signature Block */}
            {existingSignature ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>Customer Signature Preview</label>
                <div style={{ padding: "10px", background: "#0c0c10", borderRadius: "8px", border: "1px dashed var(--border-glass)", display: "flex", justifyContent: "center" }}>
                  <img src={existingSignature} alt="Customer Signature" style={{ maxHeight: "100px", maxWidth: "100%", objectFit: "contain" }} />
                </div>
              </div>
            ) : (
              completedStatus === "Completed" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", color: "var(--accent)", fontWeight: "600" }}>Customer Hand-off Signature *</label>
                  <SignaturePad onSave={setSignature} onClear={() => setSignature(null)} />
                </div>
              )
            )}

          </div>

          {/* Modal Footer */}
          <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border-glass)", display: "flex", justifyContent: "flex-end", gap: "10px", background: "var(--bg-input)" }}>
            <button type="button" onClick={onClose} style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-secondary)", cursor: "pointer", fontWeight: "500", fontSize: "13px" }}>Cancel</button>
            <button type="submit" style={{ padding: "8px 16px", background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)", border: "none", borderRadius: "6px", color: "#ffffff", cursor: "pointer", fontWeight: "500", fontSize: "13px" }}>Update</button>
          </div>
        </form>
      </div>
    </div>
  );
}