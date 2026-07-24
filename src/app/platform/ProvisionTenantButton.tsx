"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, CheckCircle, AlertCircle } from "lucide-react";

export default function ProvisionTenantButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/platform/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subdomain }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Tenant "${data.name}" provisioned successfully!`);
        setName("");
        setSubdomain("");
        router.refresh();
        setTimeout(() => {
          setSuccessMsg(null);
          setIsOpen(false);
        }, 2000);
      } else {
        setErrorMsg(data.error || "Failed to provision tenant.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Connection error. Failed to provision tenant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "8px", 
          background: "var(--primary)", 
          color: "#fff", 
          border: "none", 
          padding: "10px 20px", 
          borderRadius: "8px", 
          fontSize: "14px", 
          fontWeight: "600", 
          cursor: "pointer" 
        }}
      >
        <Plus size={18} />
        Provision New Tenant
      </button>

      {isOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            background: "var(--bg-card-glass)",
            border: "1px solid var(--border-glass)",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "450px",
            padding: "25px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
            position: "relative"
          }}>
            <button 
              onClick={() => { setIsOpen(false); setErrorMsg(null); setSuccessMsg(null); }}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "transparent",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer"
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "8px" }}>
              Provision New Client Tenant
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
              Configure a dedicated whitelabel database and subdomain context.
            </p>

            {successMsg && (
              <div style={{ background: "rgba(16, 185, 129, 0.12)", border: "1px solid #10b981", color: "#10b981", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", marginBottom: "15px", display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle size={16} />
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div style={{ background: "rgba(239, 68, 68, 0.12)", border: "1px solid #ef4444", color: "#ef4444", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", marginBottom: "15px", display: "flex", alignItems: "center", gap: "6px" }}>
                <AlertCircle size={16} />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: "600" }}>
                  Tenant Name / Client Brand
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Acme Corp" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--border-glass)",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: "600" }}>
                  Subdomain Context
                </label>
                <div style={{ display: "flex", alignItems: "center", background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "0 12px" }}>
                  <input 
                    type="text" 
                    required
                    placeholder="acmecorp" 
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "none",
                      padding: "10px 0",
                      color: "var(--text-primary)",
                      fontSize: "14px",
                      outline: "none"
                    }}
                  />
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)", paddingLeft: "8px", borderLeft: "1px solid var(--border-glass)" }}>
                    .platform.com
                  </span>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                style={{
                  background: "var(--primary)",
                  color: "#fff",
                  border: "none",
                  padding: "12px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  marginTop: "10px",
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? "Provisioning..." : "Provision Client Instance"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
