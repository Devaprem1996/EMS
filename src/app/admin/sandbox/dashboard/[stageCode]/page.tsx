"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useConfig } from "@/context/ConfigContext";
import { Search } from "lucide-react";

interface Customer {
  id: string;
  companyName: string | null;
  contactName: string;
  primaryPhone: string;
}

interface Job {
  id: string;
  jobNumber: string;
  customer: Customer | null;
  currentStage: string;
  currentStatus: string;
  serialNumber: string | null;
  capacity: string | null;
  extinguisherType: string | null;
  itemDescription: string | null;
  createdAt: string;
}

export default function SandboxDynamicDashboard() {
  const params = useParams();
  const stageCode = (params.stageCode as string) || "ENQUIRY";
  const { config, loading: configLoading } = useConfig();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (configLoading) return;

    // Check if the current stage is enabled in config
    const stageConfig = (config?.stages as any)?.[stageCode];
    if (!stageConfig || !stageConfig.enabled) {
      console.warn(`Stage ${stageCode} is disabled or invalid in system configuration.`);
      return;
    }

    async function fetchJobs() {
      try {
        setLoading(true);
        const res = await fetch(`/api/jobs?stage=${stageCode}&search=${encodeURIComponent(search)}`);
        if (res.ok) {
          const data = await res.json();
          setJobs(data);
        }
      } catch (err) {
        console.error("Failed to load jobs for stage:", stageCode, err);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [stageCode, search, config, configLoading]);

  if (configLoading || loading) {
    return (
      <div className="login-wrapper" style={{ justifyContent: "center", alignItems: "center", display: "flex", minHeight: "200px" }}>
        <div className="spinner" style={{ width: "40px", height: "40px", borderWidth: "3px" }}></div>
      </div>
    );
  }

  const stageConfig = (config?.stages as any)?.[stageCode] || { displayName: stageCode };
  const labels = config?.brand?.labels || {};

  return (
    <div style={{ padding: "2rem", color: "#fff", background: "#0a0a0f", minHeight: "100vh" }}>
      {/* Title Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: "800", margin: 0, background: "linear-gradient(135deg, #fff 0%, #a1a1aa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {stageConfig.displayName} Dashboard
          </h1>
          <p style={{ color: "#71717a", margin: "4px 0 0 0", fontSize: "0.85rem" }}>
            Sandbox Workspace Configuration Engine active ⚡
          </p>
        </div>
      </div>

      {/* Control Filters */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <input
            type="text"
            placeholder="Search company, serial, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem 0.75rem 2.5rem",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              color: "#fff",
              outline: "none"
            }}
          />
          <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#71717a" }} />
        </div>
      </div>

      {/* Dynamic Data Grid */}
      <div style={{ background: "rgba(255, 255, 255, 0.01)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "16px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <th style={{ padding: "1rem" }}>Job Number</th>
              <th style={{ padding: "1rem" }}>Client Name</th>
              <th style={{ padding: "1rem" }}>{labels.serialNumber || "Asset Serial Number"}</th>
              <th style={{ padding: "1rem" }}>{labels.capacity || "Capacity / Metrics"}</th>
              <th style={{ padding: "1rem" }}>{labels.extinguisherType || "Type / Model"}</th>
              <th style={{ padding: "1rem" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#71717a" }}>
                  No active jobs found for stage {stageConfig.displayName}.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "1rem", fontWeight: "700" }}>{job.jobNumber}</td>
                  <td style={{ padding: "1rem" }}>{job.customer?.companyName || job.customer?.contactName || "Client"}</td>
                  <td style={{ padding: "1rem", color: "#e2e8f0" }}>{job.serialNumber || "-"}</td>
                  <td style={{ padding: "1rem" }}>{job.capacity || "-"}</td>
                  <td style={{ padding: "1rem" }}>{job.extinguisherType || "-"}</td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{
                      padding: "4px 10px",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      background: "rgba(163, 230, 53, 0.12)",
                      color: "#a3e635"
                    }}>
                      {job.currentStatus}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
