"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useConfig } from "@/context/ConfigContext";
import { 
  FileText, 
  RotateCcw, 
  Wrench, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUpRight,
  Filter,
  Calendar,
  Layers,
  Zap,
  Activity,
  Plus,
  RefreshCw,
  Download,
  Search,
  Sparkles,
  BarChart3
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";

export default function AdminCentralOverviewPage() {
  const { config } = useConfig();
  const [timeframe, setTimeframe] = useState<"today" | "month" | "year">("month");
  const [loading, setLoading] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/jobs/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to load operations stats:", err);
      }
    }
    fetchStats();
  }, []);

  const defaultTimeframeData = {
    today: {
      enquiries: 0,
      refills: 0,
      services: 0,
      techs: 0,
      leadConv: "+0%",
      onTimeRate: "100%",
      avgTurnaround: "0.0 hrs",
      quoteRate: "0%",
      refillRate: "0%",
      inspectionRate: "0%",
      chartSubtitle: "Hourly Dispatch & Fleet Capacity Breakdown",
      bars: []
    },
    month: {
      enquiries: 0,
      refills: 0,
      services: 0,
      techs: 0,
      leadConv: "+0%",
      onTimeRate: "100%",
      avgTurnaround: "0.0 hrs",
      quoteRate: "0%",
      refillRate: "0%",
      inspectionRate: "0%",
      chartSubtitle: "Monthly Target SLA vs Actual Execution",
      bars: []
    },
    year: {
      enquiries: 0,
      refills: 0,
      services: 0,
      techs: 0,
      leadConv: "+0%",
      onTimeRate: "100%",
      avgTurnaround: "0.0 hrs",
      quoteRate: "0%",
      refillRate: "0%",
      inspectionRate: "0%",
      chartSubtitle: "Quarterly Enterprise SLA & Capacity Performance",
      bars: []
    }
  };

  const currentDataset = stats ? {
    enquiries: stats.enquiries,
    refills: stats.refills,
    services: stats.services,
    techs: stats.techs,
    ...stats[timeframe]
  } : defaultTimeframeData[timeframe];

  return (
    <div className="dashboard-content" style={{ padding: "var(--padding-container)", overflowY: "auto", minHeight: "100vh" }}>
      
      {/* Central Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1.5rem",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{
              background: "var(--accent-green-glow)",
              color: "var(--accent-green)",
              fontSize: "var(--font-xs)",
              fontWeight: "800",
              padding: "4px 12px",
              borderRadius: "9999px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <Zap size={13} /> Executive Master Command Center
            </span>
          </div>
          <h1 style={{ fontSize: "var(--font-xl)", fontWeight: "800", color: "var(--text-primary)", margin: 0 }}>
            Central Operations & Telemetry
          </h1>
          <p style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
            Unified real-time monitoring across Enquiry, Refilling, Field Services & Staff Dispatch.
          </p>
        </div>

        {/* Dynamic Date / Month / Year Timeframe Pill Filter */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "var(--bg-input)",
          padding: "5px",
          borderRadius: "9999px",
          border: "1px solid var(--border-glass)",
          boxShadow: "var(--shadow-glass)"
        }}>
          <button
            onClick={() => setTimeframe("today")}
            className={`timeframe-btn ${timeframe === "today" ? "active-today" : ""}`}
          >
            📅 Date-wise
          </button>
          <button
            onClick={() => setTimeframe("month")}
            className={`timeframe-btn ${timeframe === "month" ? "active-month" : ""}`}
          >
            📊 Month-wise
          </button>
          <button
            onClick={() => setTimeframe("year")}
            className={`timeframe-btn ${timeframe === "year" ? "active-year" : ""}`}
          >
            📈 Year-wise
          </button>
        </div>
      </div>

      {/* Cross-Module Executive Telemetry Cards (Flux Grid) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "var(--gap-grid)",
        marginBottom: "1.5rem"
      }}>
        {/* Card 1: Enquiry */}
        <Link href="/admin/enquiry" style={{ textDecoration: "none" }}>
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-glass)",
            borderRadius: "20px",
            padding: "var(--padding-card)",
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            cursor: "pointer",
            boxShadow: "var(--shadow-glass)"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-green)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-glass)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
              <span style={{ fontSize: "var(--font-xs)", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {config?.stages?.ENQUIRY?.displayName || "Client Enquiries"}
              </span>
              <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "var(--accent-green-glow)", color: "var(--accent-green)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileText size={18} />
              </div>
            </div>
            <div style={{ fontSize: "var(--font-2xl)", fontWeight: "800", color: "var(--text-primary)", marginBottom: "0.25rem" }}>
              {currentDataset.enquiries}
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: "600", marginBottom: "4px" }}>All-Time Total</div>
            <div style={{ fontSize: "var(--font-xs)", color: "var(--accent-green)", display: "flex", alignItems: "center", gap: "4px", fontWeight: "700" }}>
              <TrendingUp size={13} /> {currentDataset.leadConv} Lead Conversion Rate
            </div>
          </div>
        </Link>

        {/* Card 2: Refilling */}
        <Link href="/admin/refilling" style={{ textDecoration: "none" }}>
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-glass)",
            borderRadius: "20px",
            padding: "var(--padding-card)",
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            cursor: "pointer",
            boxShadow: "var(--shadow-glass)"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-purple)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-glass)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
              <span style={{ fontSize: "var(--font-xs)", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {config?.stages?.REFILLING?.displayName || "Refilling Operations"}
              </span>
              <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "var(--accent-purple-glow)", color: "var(--accent-purple)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <RotateCcw size={18} />
              </div>
            </div>
            <div style={{ fontSize: "var(--font-2xl)", fontWeight: "800", color: "var(--text-primary)", marginBottom: "0.25rem" }}>
              {currentDataset.refills}
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: "600", marginBottom: "4px" }}>All-Time Total</div>
            <div style={{ fontSize: "var(--font-xs)", color: "var(--accent-purple)", display: "flex", alignItems: "center", gap: "4px", fontWeight: "700" }}>
              <Zap size={13} /> {currentDataset.onTimeRate} Dispatch Efficiency
            </div>
          </div>
        </Link>

        {/* Card 3: Services */}
        <Link href="/admin/services" style={{ textDecoration: "none" }}>
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-glass)",
            borderRadius: "20px",
            padding: "var(--padding-card)",
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            cursor: "pointer",
            boxShadow: "var(--shadow-glass)"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-blue)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-glass)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
              <span style={{ fontSize: "var(--font-xs)", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {config?.stages?.SERVICES?.displayName || "Maintenance & AMC"}
              </span>
              <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "var(--accent-blue-glow)", color: "var(--accent-blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Wrench size={18} />
              </div>
            </div>
            <div style={{ fontSize: "var(--font-2xl)", fontWeight: "800", color: "var(--text-primary)", marginBottom: "0.25rem" }}>
              {currentDataset.services}
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: "600", marginBottom: "4px" }}>All-Time Total</div>
            <div style={{ fontSize: "var(--font-xs)", color: "var(--accent-blue)", display: "flex", alignItems: "center", gap: "4px", fontWeight: "700" }}>
              <CheckCircle2 size={13} /> 94.8% Completion Rate
            </div>
          </div>
        </Link>

        {/* Card 4: Staff Fleet */}
        <Link href="/admin/employees" style={{ textDecoration: "none" }}>
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-glass)",
            borderRadius: "20px",
            padding: "var(--padding-card)",
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            cursor: "pointer",
            boxShadow: "var(--shadow-glass)"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-rose)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-glass)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
              <span style={{ fontSize: "var(--font-xs)", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Field Staff
              </span>
              <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "var(--accent-rose-glow)", color: "var(--accent-rose)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users size={18} />
              </div>
            </div>
            <div style={{ fontSize: "var(--font-2xl)", fontWeight: "800", color: "var(--text-primary)", marginBottom: "0.25rem" }}>
              {currentDataset.techs}
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: "600", marginBottom: "4px" }}>All-Time Total</div>
            <div style={{ fontSize: "var(--font-xs)", color: "var(--accent-rose)", display: "flex", alignItems: "center", gap: "4px", fontWeight: "700" }}>
              <Activity size={13} /> Active Staff Assigned
            </div>
          </div>
        </Link>
      </div>

      {/* Main Dual-Widget Dispatch Telemetry Analysis Section */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "var(--gap-grid)",
        marginBottom: "1.5rem"
      }}>
        
        {/* Dispatch SLA & Pipeline Performance Widget */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-glass)",
          borderRadius: "24px",
          padding: "1.75rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Zap size={18} style={{ color: "var(--accent-green)" }} /> Dispatch Analysis & Pipeline
              </h3>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--accent-green)", background: "var(--accent-green-glow)", padding: "4px 10px", borderRadius: "9999px" }}>
                Real-Time Telemetry
              </span>
            </div>

            <div style={{ display: "flex", gap: "2rem", marginBottom: "1.5rem", marginTop: "1rem" }}>
              <div>
                <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--accent-green)", lineHeight: "1" }}>
                  {currentDataset.onTimeRate}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px", fontWeight: "600" }}>
                  On-Time Dispatch Rate
                </div>
              </div>

              <div>
                <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--accent-purple)", lineHeight: "1" }}>
                  {currentDataset.avgTurnaround}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px", fontWeight: "600" }}>
                  Avg Turnaround Time
                </div>
              </div>
            </div>

            {/* Dynamic Pipeline Progress Bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                  <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>Enquiry to Conversion</span>
                  <span style={{ color: "var(--accent-green)", fontWeight: "800" }}>{currentDataset.quoteRate}</span>
                </div>
                <div style={{ width: "100%", height: "9px", background: "var(--progress-bg)", borderRadius: "9999px", overflow: "hidden" }}>
                  <div style={{ width: currentDataset.quoteRate, height: "100%", background: "var(--accent-green)", borderRadius: "9999px" }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                  <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>{config?.stages?.REFILLING?.displayName || "Refilling"} Dispatches</span>
                  <span style={{ color: "var(--accent-purple)", fontWeight: "800" }}>{currentDataset.refillRate}</span>
                </div>
                <div style={{ width: "100%", height: "9px", background: "var(--progress-bg)", borderRadius: "9999px", overflow: "hidden" }}>
                  <div style={{ width: currentDataset.refillRate, height: "100%", background: "var(--accent-purple)", borderRadius: "9999px" }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                  <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>Task Completion Rate</span>
                  <span style={{ color: "var(--accent-blue)", fontWeight: "800" }}>{currentDataset.inspectionRate}</span>
                </div>
                <div style={{ width: "100%", height: "9px", background: "var(--progress-bg)", borderRadius: "9999px", overflow: "hidden" }}>
                  <div style={{ width: currentDataset.inspectionRate, height: "100%", background: "var(--accent-blue)", borderRadius: "9999px" }}></div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Dynamic Dual-Bar Interactive Analytics Chart Widget */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-glass)",
          borderRadius: "24px",
          padding: "1.75rem",
          boxShadow: "var(--shadow-glass)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <BarChart3 size={18} style={{ color: "var(--accent-purple)" }} /> Dispatch & Capacity Analytics
                </h3>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                  {currentDataset.chartSubtitle}
                </p>
              </div>
              <span style={{ fontSize: "0.78rem", color: "var(--accent-purple)", background: "var(--accent-purple-glow)", padding: "4px 10px", borderRadius: "9999px", fontWeight: "700" }}>
                {timeframe === "today" ? "Hourly View" : timeframe === "month" ? "Monthly View" : "Quarterly View"}
              </span>
            </div>
                   {/* Dynamic Multi-Color Vertical Bar Chart */}
            <div style={{ height: "140px", paddingTop: "10px", width: "100%" }}>
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={currentDataset.bars}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-glass)" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: 'var(--text-primary)'
                      }}
                      itemStyle={{ color: 'var(--text-primary)' }}
                      cursor={{ fill: 'var(--primary-glow)' }}
                    />
                    <Bar 
                      dataKey="valTarget" 
                      name="SLA Target" 
                      fill="var(--accent-blue)" 
                      radius={[4, 4, 0, 0]} 
                    />
                    <Bar 
                      dataKey="valActual" 
                      name="Actual" 
                      fill="var(--accent-green)" 
                      radius={[4, 4, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: "100%", width: "100%", background: "var(--progress-bg)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontSize: "12px" }}>
                  Loading telemetry visualizer...
                </div>
              )}
            </div>

            {/* Chart Legend */}
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", fontSize: "11px", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-blue)" }}></span>
                <span style={{ color: "var(--text-secondary)" }}>Target SLA Volume</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-green)" }}></span>
                <span style={{ color: "var(--text-secondary)" }}>Actual Execution</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Action Pill Buttons Row */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-glass)",
        borderRadius: "20px",
        padding: "1.25rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
        boxShadow: "var(--shadow-glass)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Sparkles size={18} style={{ color: "var(--accent-green)" }} />
          <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)" }}>
            Operational Quick Actions:
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link href="/admin/enquiry">
            <button className="btn-primary" style={{ fontSize: "13px" }}>
              <Plus size={16} /> Register {config?.stages?.ENQUIRY?.displayName || "Enquiry"}
            </button>
          </Link>

          <Link href="/admin/refilling">
            <button className="btn-secondary" style={{ fontSize: "13px" }}>
              <RotateCcw size={16} /> Schedule {config?.stages?.REFILLING?.displayName || "Refill"}
            </button>
          </Link>

          <Link href="/admin/services">
            <button className="btn-secondary" style={{ fontSize: "13px" }}>
              <Wrench size={16} /> Schedule {config?.stages?.SERVICES?.displayName || "Service"}
            </button>
          </Link>

          <Link href="/admin/employees">
            <button className="btn-secondary" style={{ fontSize: "13px" }}>
              <Users size={16} /> Manage Staff
            </button>
          </Link>
        </div>
      </div>

    </div>
  );
}
