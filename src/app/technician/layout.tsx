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
  X,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { useConfig } from "@/context/ConfigContext";

export default function TechnicianLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const { config, loading: configLoading } = useConfig();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load sidebar collapsed preference and handle medium laptop viewports
  useEffect(() => {
    const saved = localStorage.getItem("ems_sidebar_collapsed_tech");
    if (saved === "true") {
      setIsCollapsed(true);
    } else if (window.innerWidth >= 768 && window.innerWidth <= 1180) {
      setIsCollapsed(true);
    }
  }, []);

  const toggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("ems_sidebar_collapsed_tech", String(nextState));
  };

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
    { name: "Technician Tasks", path: "/technician/tasks", icon: LayoutDashboard },
  ];

  const brandTitle = config?.brand?.title || "Safeway";
  const logoUrl = config?.brand?.logoUrl;

  return (
    <div className="dashboard-container" style={{ display: "flex", flexDirection: "row", minHeight: "100vh" }}>
      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="mobile-sidebar-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 999,
          }}
        />
      )}

      {/* Left Collapsible Sidebar Navigation */}
      <aside className={`dashboard-sidebar ${isMobileMenuOpen ? "mobile-open" : ""}`} style={{
        width: isCollapsed ? "74px" : "250px",
        background: "var(--bg-card)",
        borderRight: "1px solid var(--border-glass)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        zIndex: 100,
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      }}>
        {/* Brand Header */}
        <div className="sidebar-logo" style={{
          padding: isCollapsed ? "1.25rem 0.5rem" : "1.25rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "space-between",
          borderBottom: "1px solid var(--border-glass)",
          transition: "all 0.3s"
        }}>
          <Link href="/technician/tasks" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none", color: "var(--text-primary)" }}>
            {logoUrl ? (
              <img src={logoUrl} alt={brandTitle} style={{ height: "32px", width: "auto" }} />
            ) : (
              <div style={{ background: "rgba(220,38,38,0.12)", padding: "8px", borderRadius: "10px", color: "var(--accent)", display: "flex", border: "1px solid rgba(220,38,38,0.25)" }}>
                <Flame size={20} fill="currentColor" />
              </div>
            )}
            {!isCollapsed && <span style={{ fontWeight: "800", fontSize: "1.1rem", letterSpacing: "-0.02em" }}>{brandTitle}</span>}
          </Link>

          {/* Toggle Sidebar Collapse Button */}
          <button 
            onClick={toggleSidebar}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--text-muted)",
              cursor: "pointer",
              borderRadius: "8px",
              padding: "5px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s"
            }}
          >
            {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* Navigation Section */}
        <nav style={{ padding: isCollapsed ? "1.25rem 0.5rem" : "1.25rem 0.85rem", flexGrow: 1, display: "flex", flexDirection: "column", gap: "0.45rem", overflowY: "auto" }}>
          {!isCollapsed && (
            <div style={{ fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", padding: "0.5rem 0.75rem", marginBottom: "0.25rem" }}>
              Tech Menu
            </div>
          )}
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <Link 
                key={item.path} 
                href={item.path}
                prefetch={false}
                title={isCollapsed ? item.name : undefined}
                className={`menu-link ${isActive ? "active" : ""}`}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isCollapsed ? "center" : "space-between",
                  padding: isCollapsed ? "0.75rem 0" : "0.7rem 1.1rem",
                  borderRadius: "9999px",
                  fontSize: "var(--font-sm)",
                  fontWeight: isActive ? "700" : "500",
                  color: isActive ? "var(--nav-active-text)" : "var(--text-secondary)",
                  background: isActive ? "var(--nav-active-bg)" : "transparent",
                  boxShadow: isActive ? "0 4px 14px rgba(0, 0, 0, 0.15)" : "none",
                  textDecoration: "none",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: isCollapsed ? 0 : "0.85rem", justifyContent: "center" }}>
                  <Icon size={18} style={{ color: isActive ? "var(--nav-active-text)" : "var(--text-muted)" }} />
                  {!isCollapsed && <span>{item.name}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Status Card */}
        <div style={{ padding: isCollapsed ? "0.5rem" : "0.85rem", borderTop: "1px solid var(--border-glass)" }}>
          {isCollapsed ? (
            <div 
              title="EMS Tech Mode Active"
              style={{
                background: "linear-gradient(135deg, #a3e635 0%, #84cc16 100%)",
                borderRadius: "9999px",
                width: "40px",
                height: "40px",
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0f172a",
                fontWeight: "800"
              }}
            >
              🛠️
            </div>
          ) : (
            <div style={{
              background: "linear-gradient(135deg, #a3e635 0%, #84cc16 100%)",
              borderRadius: "18px",
              padding: "1.15rem 1rem",
              color: "#0f172a",
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{ fontWeight: "800", fontSize: "0.95rem", marginBottom: "0.25rem", color: "#000000" }}>
                EMS Field Dispatch
              </div>
              <div style={{ fontSize: "0.75rem", color: "#0f172a", fontWeight: "600", lineHeight: "1.35", marginBottom: "0.85rem" }}>
                Intelligent job tracking & verification active.
              </div>
              <button style={{
                width: "100%",
                background: "#0f172a",
                color: "#a3e635",
                border: "none",
                borderRadius: "9999px",
                padding: "0.55rem 1rem",
                fontSize: "0.78rem",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
              }}>
                Tech Connected 🛠️
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main" style={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflow: "hidden" }}>
        {/* Top Header Bar */}
        <header className="dashboard-header" style={{
          height: "64px",
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border-glass)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 2rem",
          zIndex: 10
        }}>
          {/* Breadcrumb & Mobile Hamburger */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="hamburger-btn"
              aria-label="Toggle Navigation"
              style={{ display: "none", background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer" }}
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb Navigation Trail */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
              <span>Technician Dashboard</span>
              <span>/</span>
              <span style={{ fontWeight: "700", color: "var(--text-primary)" }}>
                Tasks
              </span>
            </div>
          </div>

          {/* Right Header Utilities: User Name & Logout */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "var(--bg-input)",
              border: "1px solid var(--border-glass)",
              padding: "4px 8px 4px 10px",
              borderRadius: "10px"
            }}>
              <div style={{
                width: "24px",
                height: "24px",
                borderRadius: "5px",
                background: "linear-gradient(135deg, var(--primary, #3b82f6) 0%, var(--accent, #a3e635) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff"
              }}>
                <UserIcon size={12} style={{ color: "#ffffff" }} />
              </div>
              <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-primary)" }}>
                {user?.fullName || "Tech"}
              </span>
              <div style={{ width: "1px", height: "14px", background: "var(--border-glass)", margin: "0 2px" }} />
              <button 
                onClick={handleLogout} 
                title="Log Out"
                style={{ 
                  padding: "2px 6px", 
                  background: "transparent", 
                  border: "none", 
                  color: "#ef4444", 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center"
                }}
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </header>

        {/* Content Pane */}
        <main className="dashboard-main-content animated-page" style={{ flexGrow: 1, overflowY: "auto", padding: "1.5rem" }}>
          {children}
        </main>
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          .hamburger-btn {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
