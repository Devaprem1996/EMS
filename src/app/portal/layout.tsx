"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, LayoutDashboard, LifeBuoy } from "lucide-react";
import { useConfig } from "@/context/ConfigContext";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { config, loading: configLoading } = useConfig();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (!data.session || data.session.role !== "CUSTOMER") {
          router.push("/login");
        } else {
          setSession(data.session);
          setLoading(false);
        }
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  if (loading || configLoading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "var(--bg-main)" }}>
        <div className="spinner" style={{ width: "40px", height: "40px", border: "3px solid var(--border-glass)", borderTop: "3px solid var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  // Ensure Customer Portal is enabled by the SUPER_ADMIN
  if (config?.features && !config.features.customerPortal) {
    return (
      <div style={{ display: "flex", height: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg-main)", color: "var(--text-primary)" }}>
        <LifeBuoy size={48} style={{ color: "var(--text-secondary)", marginBottom: "20px" }} />
        <h2>Portal Disabled</h2>
        <p style={{ color: "var(--text-secondary)" }}>The customer portal is currently disabled for this tenant.</p>
        <button onClick={() => router.push("/login")} style={{ marginTop: "20px", padding: "10px 20px", background: "var(--primary)", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer" }}>Return to Login</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--bg-main)" }}>
      {/* Top Header */}
      <header style={{ 
        background: "var(--bg-card-glass)", 
        backdropFilter: "blur(20px)", 
        borderBottom: "1px solid var(--border-glass)",
        padding: "15px 30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          {config?.logoUrl ? (
            <img src={config.logoUrl} alt="Logo" style={{ height: "35px", objectFit: "contain" }} />
          ) : (
            <div style={{ width: "35px", height: "35px", borderRadius: "8px", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
              {config?.brandTitle?.charAt(0) || "C"}
            </div>
          )}
          <div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)", letterSpacing: "0.5px" }}>
              {config?.brandTitle || "Client Portal"}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Self-Service Dashboard</div>
          </div>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
            <User size={18} />
            <span style={{ fontSize: "14px", fontWeight: "500", display: "none", "@media (min-width: 768px)": { display: "inline" } }}>
              {session?.fullName || "Valued Client"}
            </span>
          </div>
          <button 
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/login");
            }}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "1px solid var(--border-glass)", padding: "8px 12px", borderRadius: "8px", color: "var(--text-primary)", cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "background 0.2s" }}
            onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
            onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
          >
            <LogOut size={16} style={{ color: "#ef4444" }} />
            Log out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: "30px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)", fontSize: "12px", borderTop: "1px solid var(--border-glass)" }}>
        &copy; {new Date().getFullYear()} {config?.brandTitle || "EMS"}. All rights reserved.
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
