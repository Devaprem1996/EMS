"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardList, LogOut, User } from "lucide-react";
import { useConfig } from "@/context/ConfigContext";

export default function TechLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { config, loading: configLoading } = useConfig();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (!data.session || data.session.role !== "TECHNICIAN") {
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

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--bg-main)" }}>
      {/* Top Mobile Header */}
      <header style={{ 
        background: "var(--bg-card-glass)", 
        backdropFilter: "blur(10px)", 
        borderBottom: "1px solid var(--border-glass)",
        padding: "15px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {config?.brand?.logoUrl ? (
            <img src={config.brand.logoUrl} alt="Logo" style={{ height: "30px", objectFit: "contain" }} />
          ) : (
            <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
              {config?.brand?.title?.charAt(0) || "E"}
            </div>
          )}
          <span style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)", letterSpacing: "0.5px" }}>
            {config?.brand?.title || "EMS Tech"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", background: "var(--bg-input)", padding: "4px 8px", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
            {session?.fullName?.split(" ")[0] || "Tech"}
          </span>
        </div>
      </header>

      {/* Main Content Area (Scrollable) */}
      <main style={{ flex: 1, padding: "20px", paddingBottom: "80px", overflowY: "auto" }}>
        {children}
      </main>

      {/* Bottom Mobile Navigation */}
      <nav style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "var(--bg-card-glass)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border-glass)",
        display: "flex",
        justifyContent: "space-around",
        padding: "10px 0",
        paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
        zIndex: 50
      }}>
        <Link href="/tech" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", color: "var(--accent)", textDecoration: "none" }}>
          <ClipboardList size={22} />
          <span style={{ fontSize: "10px", fontWeight: "600" }}>Tasks</span>
        </Link>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", color: "var(--text-secondary)", cursor: "pointer" }}>
          <User size={22} />
          <span style={{ fontSize: "10px", fontWeight: "500" }}>Profile</span>
        </div>
        <div 
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
          }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", color: "#ef4444", cursor: "pointer" }}
        >
          <LogOut size={22} />
          <span style={{ fontSize: "10px", fontWeight: "500" }}>Log out</span>
        </div>
      </nav>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
