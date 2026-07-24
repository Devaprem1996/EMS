"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { useConfig } from "@/context/ConfigContext";
import { FileText, CheckCircle, Clock, Download, PlusCircle, AlertCircle } from "lucide-react";

export default function BillingDashboard() {
  const { config } = useConfig();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const fetcher = (url: string) => fetch(url).then(r => r.json());

  // SWR queries for unbilled tickets and generated invoices
  const { data: unbilledTickets = [], error: errorUnbilled, mutate: mutateUnbilled } = useSWR(
    "/api/billing?scope=unbilled",
    fetcher
  );

  const { data: invoices = [], error: errorInvoices, mutate: mutateInvoices } = useSWR(
    "/api/billing",
    fetcher
  );

  const handleGenerateInvoice = async (ticketId: string) => {
    setSubmittingId(ticketId);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Invoice ${data.invoiceNumber} generated successfully!`);
        mutateUnbilled();
        mutateInvoices();
        // Clear message after timeout
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(data.error || "Failed to generate invoice");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Connection error. Failed to generate invoice.");
    } finally {
      setSubmittingId(null);
    }
  };

  const handlePrint = (invoiceId: string) => {
    window.open(`/admin/billing/invoice/${invoiceId}/print`, "_blank");
  };

  const totalRevenue = invoices
    .filter((i: any) => i.status === "PAID")
    .reduce((sum: number, i: any) => sum + i.totalAmount, 0);

  const pendingRevenue = invoices
    .filter((i: any) => i.status === "SENT")
    .reduce((sum: number, i: any) => sum + i.totalAmount, 0);

  const primaryColor = config?.brand?.theme?.primaryColor || "#2563eb";

  return (
    <div style={{ padding: "30px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "var(--text-primary)", margin: "0 0 8px 0" }}>Billing & Invoicing</h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0 }}>Manage revenue, generate invoices, and track payments.</p>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10b981", color: "#10b981", borderRadius: "10px", padding: "12px 16px", marginBottom: "25px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle size={18} />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", color: "#ef4444", borderRadius: "10px", padding: "12px 16px", marginBottom: "25px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={18} />
          {errorMsg}
        </div>
      )}

      {(errorUnbilled || errorInvoices) && (
        <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", color: "#ef4444", borderRadius: "10px", padding: "12px 16px", marginBottom: "25px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={18} />
          Failed to load billing or unbilled data. Please try again.
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        <div style={{ background: "var(--bg-card-glass)", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-glass)", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Total Revenue (Paid)</div>
          <div style={{ fontSize: "32px", fontWeight: "700", color: "#10b981" }}>${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div style={{ background: "var(--bg-card-glass)", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-glass)", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Pending (Awaiting Payment)</div>
          <div style={{ fontSize: "32px", fontWeight: "700", color: "#f59e0b" }}>${pendingRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div style={{ background: "var(--bg-card-glass)", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-glass)", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Unbilled Tasks</div>
          <div style={{ fontSize: "32px", fontWeight: "700", color: "var(--text-primary)" }}>{unbilledTickets.length}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
        {/* Unbilled Completed Tickets */}
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={20} style={{ color: primaryColor }} />
            Ready for Invoicing
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {unbilledTickets.length === 0 ? (
              <div style={{ background: "var(--bg-card-glass)", border: "1px dashed var(--border-glass)", borderRadius: "12px", padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>
                No completed tasks awaiting invoices.
              </div>
            ) : (
              unbilledTickets.map((ticket: any) => (
                <div key={ticket.id} style={{ background: "var(--bg-card-glass)", border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "4px" }}>
                      {ticket.customer?.companyName || ticket.customer?.contactName || "Unknown Customer"}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      {ticket.ticketNumber} • {ticket.itemDescription || "General Service"}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleGenerateInvoice(ticket.id)}
                    disabled={submittingId === ticket.id}
                    style={{ 
                      background: primaryColor, 
                      color: "#fff", 
                      border: "none", 
                      padding: "8px 16px", 
                      borderRadius: "8px", 
                      fontSize: "13px", 
                      fontWeight: "600", 
                      cursor: submittingId === ticket.id ? "not-allowed" : "pointer",
                      opacity: submittingId === ticket.id ? 0.7 : 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <PlusCircle size={14} />
                    {submittingId === ticket.id ? "Generating..." : "Generate Invoice"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Generated Invoices */}
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText size={20} style={{ color: "#10b981" }} />
            Recent Invoices
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {invoices.length === 0 ? (
              <div style={{ background: "var(--bg-card-glass)", border: "1px dashed var(--border-glass)", borderRadius: "12px", padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>
                No invoices generated yet.
              </div>
            ) : (
              invoices.map((invoice: any) => (
                <div key={invoice.id} style={{ background: "var(--bg-card-glass)", border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)" }}>{invoice.invoiceNumber}</span>
                      <span style={{ background: invoice.status === "PAID" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)", color: invoice.status === "PAID" ? "#10b981" : "#f59e0b", padding: "2px 6px", borderRadius: "6px", fontSize: "10px", fontWeight: "bold" }}>
                        {invoice.status}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      {invoice.ticket?.customer?.companyName || "Unknown Customer"} • ${invoice.totalAmount.toFixed(2)}
                    </div>
                  </div>
                  <button 
                    onClick={() => handlePrint(invoice.id)}
                    style={{ 
                      background: "transparent", 
                      color: "var(--text-primary)", 
                      border: "1px solid var(--border-glass)", 
                      padding: "8px", 
                      borderRadius: "8px", 
                      cursor: "pointer", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center" 
                    }} 
                    title="Download PDF / Print"
                  >
                    <Download size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
