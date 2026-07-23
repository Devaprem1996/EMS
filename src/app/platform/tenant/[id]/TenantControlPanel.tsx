"use client";

import React, { useState, useTransition } from "react";
import { updateTenantConfig } from "./actions";
import { Save, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TenantControlPanel({ tenantId, initialConfig }: { tenantId: string, initialConfig: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [config, setConfig] = useState(initialConfig);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Helper to ensure nested objects exist
  const handleFeatureToggle = (featureKey: string, checked: boolean) => {
    setConfig((prev: any) => ({
      ...prev,
      features: {
        ...(prev.features || {}),
        [featureKey]: checked
      }
    }));
  };

  const handleStageToggle = (stageKey: string, checked: boolean) => {
    setConfig((prev: any) => ({
      ...prev,
      stages: {
        ...(prev.stages || {}),
        [stageKey]: {
          ...(prev.stages?.[stageKey] || {}),
          enabled: checked
        }
      }
    }));
  };

  const handleSave = () => {
    startTransition(async () => {
      await updateTenantConfig(tenantId, config);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      router.refresh();
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      {/* SaaS Feature Modules */}
      <section style={{ background: "var(--bg-card-glass)", border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "20px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "10px" }}>
          Premium Modules
        </h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <ToggleRow 
            label="Customer Self-Service Portal" 
            description="Allows customers to log in and track their tickets."
            checked={!!config?.features?.customerPortal}
            onChange={(checked) => handleFeatureToggle("customerPortal", checked)}
          />
          <ToggleRow 
            label="Billing & Invoicing Engine" 
            description="Enables the creation of invoices, PDF generation, and payment tracking."
            checked={!!config?.features?.billingModule}
            onChange={(checked) => handleFeatureToggle("billingModule", checked)}
          />
          <ToggleRow 
            label="Advanced Analytics" 
            description="Enables performance reporting, revenue tracking, and CSV exports."
            checked={!!config?.features?.advancedAnalytics}
            onChange={(checked) => handleFeatureToggle("advancedAnalytics", checked)}
          />
        </div>
      </section>

      {/* Operational Workflows (Stages) */}
      <section style={{ background: "var(--bg-card-glass)", border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "20px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "10px" }}>
          Operational Workflows (Stages)
        </h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <ToggleRow 
            label="Enquiry Management" 
            description="Allow registration of new leads or service requests."
            checked={config?.stages?.ENQUIRY?.enabled !== false}
            onChange={(checked) => handleStageToggle("ENQUIRY", checked)}
          />
          <ToggleRow 
            label="Refilling & Inventory Ops" 
            description="Track refilling tasks for cylinders or equipment."
            checked={config?.stages?.REFILLING?.enabled !== false}
            onChange={(checked) => handleStageToggle("REFILLING", checked)}
          />
          <ToggleRow 
            label="Field Services & Repair" 
            description="Schedule field technicians for on-site services."
            checked={config?.stages?.SERVICES?.enabled !== false}
            onChange={(checked) => handleStageToggle("SERVICES", checked)}
          />
        </div>
      </section>

      {/* Save Button */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "15px" }}>
        {saveSuccess && (
          <span style={{ color: "#10b981", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
            <CheckCircle size={16} /> Config Saved!
          </span>
        )}
        <button 
          onClick={handleSave} 
          disabled={isPending}
          style={{ 
            display: "flex", alignItems: "center", gap: "8px", 
            background: "var(--primary)", color: "#fff", border: "none", 
            padding: "12px 24px", borderRadius: "8px", fontSize: "15px", fontWeight: "600", 
            cursor: isPending ? "not-allowed" : "pointer",
            opacity: isPending ? 0.7 : 1
          }}>
          <Save size={18} />
          {isPending ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string, description: string, checked: boolean, onChange: (c: boolean) => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "4px" }}>{label}</div>
        <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{description}</div>
      </div>
      
      {/* Custom CSS Toggle Switch */}
      <label style={{ position: "relative", display: "inline-block", width: "50px", height: "28px" }}>
        <input 
          type="checkbox" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)} 
          style={{ opacity: 0, width: 0, height: 0 }} 
        />
        <span style={{
          position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: checked ? "var(--primary)" : "rgba(255, 255, 255, 0.1)",
          transition: ".4s",
          borderRadius: "34px",
          border: checked ? "none" : "1px solid var(--border-glass)"
        }}>
          <span style={{
            position: "absolute", height: "20px", width: "20px", left: checked ? "26px" : "4px", bottom: "3px",
            backgroundColor: "white", transition: ".4s", borderRadius: "50%"
          }} />
        </span>
      </label>
    </div>
  );
}
