"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Flame, 
  LayoutDashboard, 
  LogOut, 
  User as UserIcon,
  Menu,
  X
} from "lucide-react";
import { useConfig } from "@/context/ConfigContext";

export default function TechnicianLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const { config, loading: configLoading } = useConfig();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check authentication
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/");
          return;
        }
        const data = await res.json();
        if (!data.authenticated || (data.user.role !== "TECHNICIAN" && data.user.role !== "ADMIN")) {
          router.push("/");
          return;
        }
        setUser(data.user);
      } catch (err) {
        console.error("Layout auth check failed:", err);
        router.push("/");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (loading || configLoading) {
    return (
      <div className="login-wrapper" style={{ justifyContent: "center", alignItems: "center" }}>
        <div className="spinner" style={{ width: "40px", height: "40px", borderWidth: "3px" }}></div>
      </div>
    );
  }

  const menuItems = [
    { name: "Technician View", path: "/technician/tasks", icon: LayoutDashboard },
  ];

  const brandTitle = config?.brand?.title || "Safeway";
  const logoUrl = config?.brand?.logoUrl;

  return (
    <div className="dashboard-container" style={{ flexDirection: "column" }}>
      {/* Top Header Navigation */}
      <header className="top-nav-header">
        {/* Left Side: Logo/Brand */}
        <Link href="/technician/tasks" className="top-nav-logo">
          {logoUrl ? (
            <img src={logoUrl} alt={brandTitle} />
          ) : (
            <div style={{ background: "rgba(220,38,38,0.1)", padding: "6px", borderRadius: "8px", display: "inline-flex", border: "1px solid rgba(220,38,38,0.2)", color: "var(--accent)" }}>
              <Flame size={18} fill="currentColor" />
            </div>
          )}
          <span style={{ fontSize: "15px", fontWeight: "bold" }}>{brandTitle}</span>
        </Link>

        {/* Center: Desktop Navigation links */}
        <nav className="top-nav-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`top-nav-link ${isActive ? "active" : ""}`}
              >
                <Icon size={14} style={{ color: isActive ? "var(--accent)" : "#6b7280" }} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Combined Profile & Logout Component */}
        <div className="top-nav-right">
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "var(--bg-input)",
            border: "1px solid var(--border-glass)",
            padding: "3px 6px 3px 8px",
            borderRadius: "10px"
          }}>
            <div style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              background: "linear-gradient(135deg, var(--primary, #3b82f6) 0%, var(--accent, #a3e635) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff"
            }}>
              <UserIcon size={15} style={{ color: "#ffffff" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--text-primary)", lineHeight: "1.1" }}>
                {user?.fullName || "Technician"}
              </span>
              <span style={{ fontSize: "0.65rem", fontWeight: "600", color: "var(--accent, #a3e635)", textTransform: "uppercase" }}>
                FIELD TECH
              </span>
            </div>

            <div style={{ width: "1px", height: "18px", background: "var(--border-glass)", margin: "0 2px" }} />

            <button 
              onClick={handleLogout} 
              title="Log Out"
              aria-label="Log Out"
              style={{ 
                padding: "4px 8px", 
                background: "rgba(239, 68, 68, 0.12)", 
                border: "1px solid rgba(239, 68, 68, 0.25)", 
                borderRadius: "6px",
                color: "#ef4444", 
                cursor: "pointer", 
                display: "flex", 
                alignItems: "center",
                gap: "4px",
                fontSize: "0.75rem",
                fontWeight: "700"
              }}
            >
              <LogOut size={13} />
              <span>Log Out</span>
            </button>
          </div>

          {/* Mobile hamburger menu toggle */}
          <button 
            className="hamburger-btn" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
            style={{ display: "none", background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer", padding: "0.5rem" }}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {isMobileMenuOpen && (
          <nav className="top-nav-menu-mobile">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`top-nav-link ${isActive ? "active" : ""}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ width: "100%" }}
                >
                  <Icon size={14} style={{ color: isActive ? "var(--accent)" : "#6b7280" }} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Logout item in mobile drawer */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              className="top-nav-link"
              style={{ 
                width: "100%", 
                textAlign: "left", 
                background: "rgba(239, 68, 68, 0.08)", 
                border: "1px solid rgba(239, 68, 68, 0.15)", 
                borderRadius: "6px",
                display: "flex", 
                alignItems: "center", 
                gap: "0.5rem", 
                padding: "0.5rem 1rem", 
                color: "#ef4444",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px",
                marginTop: "4px"
              }}
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          </nav>
        )}
      </header>

      {/* Main Content Pane */}
      <div className="layout-top-nav-main">
        <main className="layout-top-nav-content animated-page">
          {children}
        </main>
      </div>
      
      {/* Mobile media query hamburger control style inject */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .top-nav-menu {
            display: none !important;
          }
          .hamburger-btn {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
