"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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

export default function AdminCentralOverviewPage() {
  const [timeframe, setTimeframe] = useState<"today" | "month" | "year">("month");
  const [loading, setLoading] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Timeframe-Specific Datasets & KPIs
  const timeframeData = {
    today: {
      enquiries: 28,
      refills: 14,
      services: 9,
      techs: 18,
      leadConv: "+18.4%",
      onTimeRate: "99.1%",
      avgTurnaround: "1.2 hrs",
      quoteRate: "88%",
      refillRate: "95%",
      inspectionRate: "98%",
      chartSubtitle: "Hourly Dispatch & Fleet Capacity Breakdown",
      bars: [
        { label: "08:00 AM", target: "80%", actual: "75%", valTarget: 16, valActual: 15 },
        { label: "10:00 AM", target: "90%", actual: "88%", valTarget: 22, valActual: 20 },
        { label: "12:00 PM", target: "95%", actual: "92%", valTarget: 28, valActual: 26 },
        { label: "02:00 PM ⚡", target: "100%", actual: "98%", valTarget: 34, valActual: 33, active: true },
        { label: "04:00 PM", target: "85%", actual: "82%", valTarget: 24, valActual: 22 },
        { label: "06:00 PM", target: "70%", actual: "68%", valTarget: 18, valActual: 17 },
        { label: "08:00 PM", target: "50%", actual: "48%", valTarget: 10, valActual: 9 }
      ]
    },
    month: {
      enquiries: 148,
      refills: 64,
      services: 39,
      techs: 18,
      leadConv: "+14.2%",
      onTimeRate: "98.4%",
      avgTurnaround: "2.4 hrs",
      quoteRate: "84%",
      refillRate: "92%",
      inspectionRate: "96%",
      chartSubtitle: "Monthly Target SLA vs Actual Execution",
      bars: [
        { label: "Jun", target: "65%", actual: "58%", valTarget: 95, valActual: 82 },
        { label: "Jul", target: "75%", actual: "70%", valTarget: 110, valActual: 102 },
        { label: "Aug", target: "82%", actual: "79%", valTarget: 125, valActual: 118 },
        { label: "Sept ↗", target: "95%", actual: "92%", valTarget: 148, valActual: 140, active: true },
        { label: "Oct", target: "85%", actual: "80%", valTarget: 130, valActual: 122 },
        { label: "Nov", target: "88%", actual: "84%", valTarget: 135, valActual: 128 },
        { label: "Dec", target: "92%", actual: "89%", valTarget: 142, valActual: 136 }
      ]
    },
    year: {
      enquiries: 1420,
      refills: 580,
      services: 310,
      techs: 18,
      leadConv: "+22.8%",
      onTimeRate: "97.8%",
      avgTurnaround: "2.1 hrs",
      quoteRate: "86%",
      refillRate: "94%",
      inspectionRate: "97%",
      chartSubtitle: "Quarterly Enterprise SLA & Capacity Performance",
      bars: [
        { label: "Q1 2025", target: "70%", actual: "66%", valTarget: 320, valActual: 305 },
        { label: "Q2 2025", target: "80%", actual: "76%", valTarget: 380, valActual: 360 },
        { label: "Q3 2025", target: "88%", actual: "85%", valTarget: 420, valActual: 405 },
        { label: "Q4 2025 ↗", target: "98%", actual: "95%", valTarget: 480, valActual: 465, active: true },
        { label: "Q1 2026", target: "90%", actual: "87%", valTarget: 440, valActual: 425 }
      ]
    }
  };

  const currentDataset = timeframeData[timeframe];

  return (
    <div className="dashboard-content" style={{ padding: "2rem", overflowY: "auto", minHeight: "100vh" }}>
      
      {/* Central Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "2rem",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{
              background: "rgba(163, 230, 53, 0.15)",
              color: "#a3e635",
              fontSize: "11px",
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
          <h1 style={{ fontSize: "1.85rem", fontWeight: "800", color: "var(--text-primary, #ffffff)", margin: 0 }}>
            Central Operations & Telemetry
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary, #a1a1aa)", margin: "4px 0 0 0" }}>
            Unified real-time monitoring across Enquiry, Cylinder Refilling, Field Services & Staff Dispatch.
          </p>
        </div>

        {/* Dynamic Date / Month / Year Timeframe Pill Filter */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "rgba(255, 255, 255, 0.05)",
          padding: "5px",
          borderRadius: "9999px",
          border: "1px solid var(--border-glass, rgba(255, 255, 255, 0.1))",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
        }}>
          <button
            onClick={() => setTimeframe("today")}
            style={{
              padding: "8px 18px",
              borderRadius: "9999px",
              border: "none",
              background: timeframe === "today" ? "#a3e635" : "transparent",
              color: timeframe === "today" ? "#000000" : "var(--text-secondary, #a1a1aa)",
              fontSize: "12.5px",
              fontWeight: "800",
              cursor: "pointer",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: timeframe === "today" ? "0 4px 12px rgba(163, 230, 53, 0.3)" : "none"
            }}
          >
            📅 Date-wise
          </button>
          <button
            onClick={() => setTimeframe("month")}
            style={{
              padding: "8px 18px",
              borderRadius: "9999px",
              border: "none",
              background: timeframe === "month" ? "#c084fc" : "transparent",
              color: timeframe === "month" ? "#000000" : "var(--text-secondary, #a1a1aa)",
              fontSize: "12.5px",
              fontWeight: "800",
              cursor: "pointer",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: timeframe === "month" ? "0 4px 12px rgba(192, 132, 252, 0.3)" : "none"
            }}
          >
            📊 Month-wise
          </button>
          <button
            onClick={() => setTimeframe("year")}
            style={{
              padding: "8px 18px",
              borderRadius: "9999px",
              border: "none",
              background: timeframe === "year" ? "#38bdf8" : "transparent",
              color: timeframe === "year" ? "#000000" : "var(--text-secondary, #a1a1aa)",
              fontSize: "12.5px",
              fontWeight: "800",
              cursor: "pointer",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: timeframe === "year" ? "0 4px 12px rgba(56, 189, 248, 0.3)" : "none"
            }}
          >
            📈 Year-wise
          </button>
        </div>
      </div>

      {/* Cross-Module Executive Telemetry Cards (Flux Grid) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "1.25rem",
        marginBottom: "2rem"
      }}>
        {/* Card 1: Enquiry */}
        <Link href="/admin/enquiry" style={{ textDecoration: "none" }}>
          <div style={{
            background: "var(--card-bg, #111116)",
            border: "1px solid var(--border-glass, rgba(255, 255, 255, 0.1))",
            borderRadius: "20px",
            padding: "1.35rem",
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            cursor: "pointer",
            boxShadow: "0 15px 30px rgba(0,0,0,0.3)"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#a3e635"; e.currentTarget.style.transform = "translateY(-4px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-glass, rgba(255, 255, 255, 0.1))"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-secondary, #a1a1aa)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Client Enquiries
              </span>
              <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "rgba(163, 230, 53, 0.15)", color: "#a3e635", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileText size={20} />
              </div>
            </div>
            <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--text-primary, #ffffff)", marginBottom: "0.25rem" }}>
              {currentDataset.enquiries}
            </div>
            <div style={{ fontSize: "12px", color: "#a3e635", display: "flex", alignItems: "center", gap: "4px", fontWeight: "700" }}>
              <TrendingUp size={14} /> {currentDataset.leadConv} Lead Conversion Rate
            </div>
          </div>
        </Link>

        {/* Card 2: Refilling */}
        <Link href="/admin/refilling" style={{ textDecoration: "none" }}>
          <div style={{
            background: "var(--card-bg, #111116)",
            border: "1px solid var(--border-glass, rgba(255, 255, 255, 0.1))",
            borderRadius: "20px",
            padding: "1.35rem",
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            cursor: "pointer",
            boxShadow: "0 15px 30px rgba(0,0,0,0.3)"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c084fc"; e.currentTarget.style.transform = "translateY(-4px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-glass, rgba(255, 255, 255, 0.1))"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-secondary, #a1a1aa)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Cylinder Refilling
              </span>
              <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "rgba(192, 132, 252, 0.15)", color: "#c084fc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <RotateCcw size={20} />
              </div>
            </div>
            <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--text-primary, #ffffff)", marginBottom: "0.25rem" }}>
              {currentDataset.refills}
            </div>
            <div style={{ fontSize: "12px", color: "#c084fc", display: "flex", alignItems: "center", gap: "4px", fontWeight: "700" }}>
              <Zap size={14} /> {currentDataset.onTimeRate} Dispatch Efficiency
            </div>
          </div>
        </Link>

        {/* Card 3: Services */}
        <Link href="/admin/services" style={{ textDecoration: "none" }}>
          <div style={{
            background: "var(--card-bg, #111116)",
            border: "1px solid var(--border-glass, rgba(255, 255, 255, 0.1))",
            borderRadius: "20px",
            padding: "1.35rem",
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            cursor: "pointer",
            boxShadow: "0 15px 30px rgba(0,0,0,0.3)"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#38bdf8"; e.currentTarget.style.transform = "translateY(-4px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-glass, rgba(255, 255, 255, 0.1))"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-secondary, #a1a1aa)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Maintenance & AMC
              </span>
              <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Wrench size={20} />
              </div>
            </div>
            <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--text-primary, #ffffff)", marginBottom: "0.25rem" }}>
              {currentDataset.services}
            </div>
            <div style={{ fontSize: "12px", color: "#38bdf8", display: "flex", alignItems: "center", gap: "4px", fontWeight: "700" }}>
              <CheckCircle2 size={14} /> 94.8% AMC SLA Renewal Rate
            </div>
          </div>
        </Link>

        {/* Card 4: Staff Fleet */}
        <Link href="/admin/employees" style={{ textDecoration: "none" }}>
          <div style={{
            background: "var(--card-bg, #111116)",
            border: "1px solid var(--border-glass, rgba(255, 255, 255, 0.1))",
            borderRadius: "20px",
            padding: "1.35rem",
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            cursor: "pointer",
            boxShadow: "0 15px 30px rgba(0,0,0,0.3)"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#f43f5e"; e.currentTarget.style.transform = "translateY(-4px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-glass, rgba(255, 255, 255, 0.1))"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-secondary, #a1a1aa)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Field Technicians
              </span>
              <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "rgba(244, 63, 94, 0.15)", color: "#f43f5e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users size={20} />
              </div>
            </div>
            <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--text-primary, #ffffff)", marginBottom: "0.25rem" }}>
              {currentDataset.techs}
            </div>
            <div style={{ fontSize: "12px", color: "#f43f5e", display: "flex", alignItems: "center", gap: "4px", fontWeight: "700" }}>
              <Activity size={14} /> Active Fleet Assigned
            </div>
          </div>
        </Link>
      </div>

      {/* Main Dual-Widget Dispatch Telemetry Analysis Section */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
        gap: "1.5rem",
        marginBottom: "2rem"
      }}>
        
        {/* Dispatch SLA & Pipeline Performance Widget */}
        <div style={{
          background: "var(--card-bg, #111116)",
          border: "1px solid var(--border-glass, rgba(255, 255, 255, 0.1))",
          borderRadius: "24px",
          padding: "1.75rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-primary, #ffffff)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Zap size={18} style={{ color: "#a3e635" }} /> Dispatch Analysis & Pipeline
              </h3>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#a3e635", background: "rgba(163, 230, 53, 0.15)", padding: "4px 10px", borderRadius: "9999px" }}>
                Real-Time Telemetry
              </span>
            </div>

            <div style={{ display: "flex", gap: "2rem", marginBottom: "1.5rem", marginTop: "1rem" }}>
              <div>
                <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "#a3e635", lineHeight: "1" }}>
                  {currentDataset.onTimeRate}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary, #a1a1aa)", marginTop: "4px", fontWeight: "600" }}>
                  On-Time Dispatch Rate
                </div>
              </div>

              <div>
                <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "#c084fc", lineHeight: "1" }}>
                  {currentDataset.avgTurnaround}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary, #a1a1aa)", marginTop: "4px", fontWeight: "600" }}>
                  Avg Turnaround Time
                </div>
              </div>
            </div>

            {/* Dynamic Pipeline Progress Bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                  <span style={{ color: "var(--text-primary, #ffffff)", fontWeight: "600" }}>Client Enquiry to Order Quote</span>
                  <span style={{ color: "#a3e635", fontWeight: "800" }}>{currentDataset.quoteRate}</span>
                </div>
                <div style={{ width: "100%", height: "9px", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
                  <div style={{ width: currentDataset.quoteRate, height: "100%", background: "linear-gradient(90deg, #a3e635, #84cc16)", borderRadius: "9999px" }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                  <span style={{ color: "var(--text-primary, #ffffff)", fontWeight: "600" }}>Cylinder Refill Dispatches</span>
                  <span style={{ color: "#c084fc", fontWeight: "800" }}>{currentDataset.refillRate}</span>
                </div>
                <div style={{ width: "100%", height: "9px", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
                  <div style={{ width: currentDataset.refillRate, height: "100%", background: "linear-gradient(90deg, #c084fc, #a855f7)", borderRadius: "9999px" }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                  <span style={{ color: "var(--text-primary, #ffffff)", fontWeight: "600" }}>Technician Inspection Completion</span>
                  <span style={{ color: "#38bdf8", fontWeight: "800" }}>{currentDataset.inspectionRate}</span>
                </div>
                <div style={{ width: "100%", height: "9px", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
                  <div style={{ width: currentDataset.inspectionRate, height: "100%", background: "linear-gradient(90deg, #38bdf8, #0284c7)", borderRadius: "9999px" }}></div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Dynamic Dual-Bar Interactive Analytics Chart Widget */}
        <div style={{
          background: "var(--card-bg, #111116)",
          border: "1px solid var(--border-glass, rgba(255, 255, 255, 0.1))",
          borderRadius: "24px",
          padding: "1.75rem",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-primary, #ffffff)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <BarChart3 size={18} style={{ color: "#c084fc" }} /> Dispatch & Capacity Analytics
                </h3>
                <p style={{ fontSize: "12px", color: "var(--text-secondary, #a1a1aa)", margin: "2px 0 0 0" }}>
                  {currentDataset.chartSubtitle}
                </p>
              </div>
              <span style={{ fontSize: "0.78rem", color: "#c084fc", background: "rgba(192, 132, 252, 0.12)", padding: "4px 10px", borderRadius: "9999px", fontWeight: "700" }}>
                {timeframe === "today" ? "Hourly View" : timeframe === "month" ? "Monthly View" : "Quarterly View"}
              </span>
            </div>

            {/* Dynamic Multi-Color Vertical Bar Chart */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "10px", height: "140px", paddingTop: "20px" }}>
              {currentDataset.bars.map((bar: any, i: number) => (
                <div 
                  key={i} 
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flex: 1, position: "relative" }}
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Tooltip on Hover */}
                  {hoveredBar === i && (
                    <div style={{
                      position: "absolute",
                      top: "-38px",
                      background: "#000000",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                      padding: "4px 8px",
                      fontSize: "10px",
                      color: "#ffffff",
                      whiteSpace: "nowrap",
                      zIndex: 10,
                      boxShadow: "0 10px 20px rgba(0,0,0,0.5)"
                    }}>
                      SLA Target: <b>{bar.valTarget}</b> | Actual: <b>{bar.valActual}</b>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "3px", alignItems: "flex-end", height: "100px", width: "100%" }}>
                    {/* Target SLA Bar */}
                    <div style={{
                      flex: 1,
                      height: bar.target,
                      background: bar.active ? "linear-gradient(180deg, #a3e635, #84cc16)" : "linear-gradient(180deg, #38bdf8, #0284c7)",
                      borderRadius: "4px",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      opacity: hoveredBar === i ? 1 : 0.85
                    }} title={`Target: ${bar.target}`}></div>
                    
                    {/* Actual Execution Bar */}
                    <div style={{
                      flex: 1,
                      height: bar.actual,
                      background: bar.active ? "linear-gradient(180deg, #c084fc, #a855f7)" : "rgba(255,255,255,0.25)",
                      borderRadius: "4px",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      opacity: hoveredBar === i ? 1 : 0.85
                    }} title={`Actual: ${bar.actual}`}></div>
                  </div>

                  <span style={{ fontSize: "0.68rem", color: bar.active ? "#a3e635" : "var(--text-secondary, #a1a1aa)", fontWeight: bar.active ? "800" : "600" }}>
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Chart Legend */}
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", fontSize: "11px", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#38bdf8" }}></span>
                <span style={{ color: "var(--text-secondary, #a1a1aa)" }}>Target SLA Volume</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#c084fc" }}></span>
                <span style={{ color: "var(--text-secondary, #a1a1aa)" }}>Actual Fleet Execution</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Action Pill Buttons Row */}
      <div style={{
        background: "var(--card-bg, #111116)",
        border: "1px solid var(--border-glass, rgba(255, 255, 255, 0.1))",
        borderRadius: "20px",
        padding: "1.25rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
        boxShadow: "0 15px 30px rgba(0,0,0,0.3)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Sparkles size={18} style={{ color: "#a3e635" }} />
          <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary, #ffffff)" }}>
            Operational Quick Actions:
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link href="/admin/enquiry">
            <button className="btn-primary" style={{ fontSize: "13px" }}>
              <Plus size={16} /> Register Enquiry
            </button>
          </Link>

          <Link href="/admin/refilling">
            <button className="btn-secondary" style={{ fontSize: "13px" }}>
              <RotateCcw size={16} /> Schedule Refill
            </button>
          </Link>

          <Link href="/admin/services">
            <button className="btn-secondary" style={{ fontSize: "13px" }}>
              <Wrench size={16} /> Schedule Inspection
            </button>
          </Link>

          <Link href="/admin/employees">
            <button className="btn-secondary" style={{ fontSize: "13px" }}>
              <Users size={16} /> Manage Tech Fleet
            </button>
          </Link>
        </div>
      </div>

    </div>
  );
}
