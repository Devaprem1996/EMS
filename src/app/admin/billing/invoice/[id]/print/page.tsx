"use client";

import React, { useEffect } from "react";
import useSWR from "swr";
import { useParams } from "next/navigation";
import { useConfig } from "@/context/ConfigContext";
import { Flame } from "lucide-react";

export default function InvoicePrintPage() {
  const params = useParams();
  const { id } = params as { id: string };
  const { config } = useConfig();

  const fetcher = (url: string) => fetch(url).then(r => r.json());
  const { data: invoice, error } = useSWR(`/api/billing/${id}`, fetcher);

  useEffect(() => {
    if (invoice) {
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [invoice]);

  if (error) {
    return <div style={{ padding: "40px", color: "#ef4444", textAlign: "center" }}>Error loading invoice data.</div>;
  }

  if (!invoice) {
    return <div style={{ padding: "40px", color: "var(--text-secondary)", textAlign: "center" }}>Preparing print document...</div>;
  }

  const primaryColor = config?.brand?.theme?.primaryColor || "#2563eb";
  const brandTitle = config?.brand?.title || "EMS";

  return (
    <div style={{
      fontFamily: "'Inter', sans-serif",
      padding: "40px",
      color: "#1e293b",
      background: "#ffffff",
      minHeight: "100vh"
    }}>
      {/* Invoice Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
        <div>
          {config?.brand?.logoUrl ? (
            <img src={config.brand.logoUrl} alt={brandTitle} style={{ maxHeight: "40px", objectFit: "contain", marginBottom: "15px" }} />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "15px" }}>
              <Flame size={28} color={primaryColor} fill={primaryColor} />
              <span style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>{brandTitle}</span>
            </div>
          )}
          <div style={{ fontSize: "13px", color: "#64748b" }}>
            Intelligent Fire Protection & Cylinder Management Facility
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: primaryColor, margin: "0 0 4px 0", letterSpacing: "-0.03em" }}>INVOICE</h1>
          <div style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>#{invoice.invoiceNumber}</div>
          <div style={{ fontSize: "12px", color: "#64748b" }}>Date: {new Date(invoice.createdAt).toLocaleDateString()}</div>
          <div style={{ fontSize: "12px", color: "#64748b" }}>Due Date: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "Upon Receipt"}</div>
        </div>
      </div>

      <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", marginBottom: "30px" }} />

      {/* Bill To section */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "45px" }}>
        <div>
          <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", color: "#64748b", display: "block", marginBottom: "8px" }}>
            Bill To
          </span>
          <div style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
            {invoice.ticket.customer?.companyName || "Valued Client"}
          </div>
          <div style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>
            Attn: {invoice.ticket.customer?.contactName}<br />
            {invoice.ticket.customer?.address || "No address provided"}<br />
            Phone: {invoice.ticket.customer?.primaryPhone}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", color: "#64748b", display: "block", marginBottom: "8px" }}>
            Payment Status
          </span>
          <span style={{
            background: invoice.status === "PAID" ? "#dcfce7" : "#fef3c7",
            color: invoice.status === "PAID" ? "#166534" : "#92400e",
            padding: "4px 12px",
            borderRadius: "9999px",
            fontSize: "11px",
            fontWeight: "700",
            textTransform: "uppercase"
          }}>
            {invoice.status}
          </span>
        </div>
      </div>

      {/* Line Items Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "40px" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #cbd5e1" }}>
            <th style={{ textAlign: "left", padding: "12px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "#64748b" }}>
              Job/Task Details
            </th>
            <th style={{ textAlign: "left", padding: "12px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "#64748b" }}>
              Equipment Specs
            </th>
            <th style={{ textAlign: "right", padding: "12px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "#64748b" }}>
              Total Amount
            </th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
            <td style={{ padding: "16px 12px" }}>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
                {invoice.ticket.itemDescription || "General Service"}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                Ticket: {invoice.ticket.ticketNumber} ({invoice.ticket.currentStage})
              </div>
            </td>
            <td style={{ padding: "16px 12px", fontSize: "13px", color: "#475569" }}>
              {invoice.ticket.serialNumber ? `S/N: ${invoice.ticket.serialNumber}` : "N/A"}<br />
              {invoice.ticket.capacity ? `Capacity: ${invoice.ticket.capacity}` : ""}<br />
              {invoice.ticket.extinguisherType ? `Type: ${invoice.ticket.extinguisherType}` : ""}
            </td>
            <td style={{ padding: "16px 12px", textAlign: "right", fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
              ${invoice.totalAmount.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Totals Section */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ width: "250px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: "13px", color: "#64748b" }}>
            <span>Subtotal:</span>
            <span>${invoice.totalAmount.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: "13px", color: "#64748b" }}>
            <span>Tax (0%):</span>
            <span>$0.00</span>
          </div>
          <hr style={{ border: 0, borderTop: "1px solid #cbd5e1", margin: "8px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
            <span>Total Due:</span>
            <span>${invoice.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Print Footer */}
      <div style={{ marginTop: "80px", textAlign: "center", fontSize: "11px", color: "#94a3b8" }}>
        Thank you for choosing {brandTitle}!<br />
        This is a system-generated document and does not require a physical signature.
      </div>

      {/* Clean styles for print media */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            padding: 0 !important;
          }
          header, nav, aside, footer, button, .no-print, [class*="Floating"], .theme-floating-toggle {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
