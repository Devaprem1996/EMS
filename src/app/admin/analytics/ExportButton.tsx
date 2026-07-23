"use client";

import React from "react";
import { Download } from "lucide-react";
import { exportToCSV } from "@/lib/export-utils";

export default function ExportButton({ data, filename }: { data: any[], filename: string }) {
  return (
    <button 
      onClick={() => exportToCSV(filename, data)}
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
        cursor: "pointer",
        transition: "opacity 0.2s"
      }}
      onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
      onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
    >
      <Download size={18} />
      Export CSV
    </button>
  );
}
