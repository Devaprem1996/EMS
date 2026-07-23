"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Users, 
  FileText, 
  Flame, 
  RotateCcw, 
  Wrench, 
  LayoutDashboard, 
  LogOut, 
  User as UserIcon,
  Menu,
  X,
  Settings,
  Bell,
  AlertTriangle,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  PieChart
} from "lucide-react";
import { useConfig } from "@/context/ConfigContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const { config, loading: configLoading } = useConfig();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load sidebar collapsed preference and handle medium laptop viewports
  useEffect(() => {
    const saved = localStorage.getItem("ems_sidebar_collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    } else if (window.innerWidth >= 768 && window.innerWidth <= 1180) {
      setIsCollapsed(true);
    }
  }, []);

  const toggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("ems_sidebar_collapsed", String(nextState));
  };

  // Notifications State
  const [amcRenewals, setAmcRenewals] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showFridayModal, setShowFridayModal] = useState(false);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await fetch("/api/jobs/amc-renewals");
        if (res.ok) {
          const data = await res.json();
          setAmcRenewals(data);
          
          const isFriday = new Date().getDay() === 5;
          const urlParams = new URLSearchParams(window.location.search);
          const isTestMode = urlParams.get("test_notification") === "true";
          
          if ((isFriday || isTestMode) && data.length > 0) {
            const todayStr = new Date().toDateString();
            const lastShown = localStorage.getItem("last_amc_friday_shown");
            if (lastShown !== todayStr || isTestMode) {
              setShowFridayModal(true);
              localStorage.setItem("last_amc_friday_shown", todayStr);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load AMC renewals notification data:", err);
      }
    }
    if (user && user.role === "ADMIN") {
      loadNotifications();
    }
  }, [user]);

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
        if (!data.authenticated || (data.user.role !== "ADMIN" && data.user.role !== "SUPER_ADMIN")) {
          router.push(data.user.role === "TECHNICIAN" ? "/technician/tasks" : "/");
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
  }, []);

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

  // Build dynamic menu items based on user role
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const menuItems = isSuperAdmin
    ? [
        // SUPER_ADMIN: Configuration Control Center experience
        { name: "Configuration Center", path: "/admin/settings", icon: Settings },
        { name: "Overview Center", path: "/admin", icon: PieChart },
        { name: "Technician Sandbox", path: "/admin/sandbox/dashboard/ENQUIRY", icon: LayoutDashboard },
      ]
    : (() => {
        // ADMIN: Client operational dashboards
        const items = [
          { name: "Overview Center", path: "/admin", icon: PieChart },
          { name: "Employee Master", path: "/admin/employees", icon: Users },
        ];

        if (!config || config.stages?.ENQUIRY?.enabled !== false) {
          items.push({
            name: `${config?.stages?.ENQUIRY?.displayName || "Enquiry"} Dashboard`,
            path: "/admin/enquiry",
            icon: FileText,
          });
        }

        if (!config || config.stages?.REFILLING?.enabled !== false) {
          items.push({
            name: `${config?.stages?.REFILLING?.displayName || "Refilling"} Dashboard`,
            path: "/admin/refilling",
            icon: RotateCcw,
          });
        }

        if (!config || config.stages?.SERVICES?.enabled !== false) {
          items.push({
            name: `${config?.stages?.SERVICES?.displayName || "Service"} Dashboard`,
            path: "/admin/services",
            icon: Wrench,
          });
        }

        items.push(
          { name: "Technician View", path: "/admin/tasks", icon: LayoutDashboard }
        );

        return items;
      })();

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
          <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none", color: "var(--text-primary)" }}>
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
              Main Menu
            </div>
          )}
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            const badgeCounts: { [key: string]: number } = {
              "/admin/enquiry": 3,
              "/admin/refilling": 4,
              "/admin/tasks": 2
            };
            const badgeCount = badgeCounts[item.path];

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
                {!isCollapsed && badgeCount && (
                  <span style={{
                    background: isActive ? "var(--accent)" : "rgba(163, 230, 53, 0.15)",
                    color: isActive ? "var(--text-on-accent, #0f172a)" : "var(--accent)",
                    fontSize: "0.72rem",
                    fontWeight: "800",
                    padding: "2px 8px",
                    borderRadius: "9999px"
                  }}>
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Status Card */}
        <div style={{ padding: isCollapsed ? "0.5rem" : "0.85rem", borderTop: "1px solid var(--border-glass)" }}>
          {isCollapsed ? (
            <div 
              title="EMS Dispatch Pro Active"
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
              ⚡
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
                EMS Dispatch Pro
              </div>
              <div style={{ fontSize: "0.75rem", color: "#0f172a", fontWeight: "600", lineHeight: "1.35", marginBottom: "0.85rem" }}>
                Intelligent telemetry & dispatch tracking enabled.
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
                System Active ⚡
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main" style={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflow: "hidden" }}>
        {/* Top Header Bar with Breadcrumb Navigation */}
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
              <span>Dashboard</span>
              <span>/</span>
              <span style={{ fontWeight: "700", color: "var(--text-primary)" }}>
                {menuItems.find(m => m.path === pathname)?.name || "Master"}
              </span>
            </div>
          </div>

          {/* Right Header Utilities: Notifications & Profile */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* Notification Bell Popover */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: isNotificationsOpen ? "var(--accent)" : "var(--text-primary)",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  transition: "all 0.2s"
                }}
                title="Notifications"
              >
                <Bell size={16} />
                <span>Alerts</span>
                {amcRenewals.length > 0 && (
                  <span style={{
                    background: "var(--accent)",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: "bold",
                    borderRadius: "100px",
                    padding: "1px 6px"
                  }}>
                    {amcRenewals.length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {isNotificationsOpen && (
                <div 
                  className="theme-modal-card" 
                  style={{
                    position: "absolute",
                    top: "44px",
                    right: 0,
                    width: "340px",
                    maxHeight: "420px",
                    overflowY: "auto",
                    zIndex: 1000,
                    padding: "16px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                    borderRadius: "16px",
                    border: "1px solid var(--border-glass)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "8px" }}>
                    <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--text-primary)" }}>Notification Center</span>
                    <span className="pill-badge pill-badge-blue" style={{ fontSize: "10px" }}>{amcRenewals.length} updates</span>
                  </div>
                  {amcRenewals.length === 0 ? (
                    <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
                      No new renewal notifications.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {amcRenewals.map((item) => (
                        <div 
                          key={item.id}
                          style={{
                            padding: "12px",
                            borderRadius: "10px",
                            background: "var(--bg-input)",
                            border: "1px solid var(--border-glass)",
                            fontSize: "12px",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "all 0.2s ease"
                          }}
                          onClick={() => {
                            setIsNotificationsOpen(false);
                            router.push("/admin/services");
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", color: "var(--text-primary)", marginBottom: "4px" }}>
                            <span>{item.companyName}</span>
                            <span style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>{item.jobNumber}</span>
                          </div>
                          <div style={{ color: "var(--text-secondary)" }}>
                            AMC Renewal Date: <span style={{ fontWeight: "bold", color: "#10b981" }}>{new Date(item.amcDate).toLocaleDateString()}</span>
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                            Type: {item.itemDescription}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Combined User Profile & Logout Component */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              background: "var(--bg-input)",
              border: "1px solid var(--border-glass)",
              padding: "4px 6px 4px 10px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
              transition: "all 0.2s ease"
            }}>
              {/* User Profile Avatar Icon */}
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, var(--primary, #3b82f6) 0%, var(--accent, #a3e635) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
              }}>
                <UserIcon size={17} style={{ color: "#ffffff" }} />
              </div>

              {/* User Info Label */}
              <div className="header-user-info-text" style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-primary)", lineHeight: "1.1" }}>
                  {user?.fullName || "Admin User"}
                </span>
                <span style={{ fontSize: "0.68rem", fontWeight: "600", color: "var(--accent, #a3e635)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {user?.role || "ADMIN"}
                </span>
              </div>

              {/* Integrated Divider */}
              <div style={{ width: "1px", height: "22px", background: "var(--border-glass)", margin: "0 4px" }} />

              {/* Integrated Logout Button */}
              <button 
                onClick={handleLogout} 
                title="Log Out"
                aria-label="Log Out"
                style={{ 
                  padding: "6px 12px", 
                  background: "rgba(239, 68, 68, 0.12)", 
                  border: "1px solid rgba(239, 68, 68, 0.25)", 
                  borderRadius: "8px",
                  color: "#ef4444", 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  transition: "all 0.2s ease"
                }}
              >
                <LogOut size={14} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="dashboard-content animated-page" style={{ flexGrow: 1, padding: "2rem", overflowY: "auto" }}>
          {children}
        </main>
      </div>

      {/* Friday AMC Renewal Reminder Modal */}
      {showFridayModal && (
        <div className="slide-over-backdrop" style={{ zIndex: 2000 }} onClick={() => setShowFridayModal(false)}>
          <div className="slide-over-card theme-modal-card" style={{ maxWidth: "550px", margin: "10% auto", animation: "premiumSlideIn 0.3s ease-out", height: "auto", borderRadius: "20px" }} onClick={(e) => e.stopPropagation()}>
            <div className="slide-over-header theme-modal-card-header" style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#fff" }}>
                <AlertTriangle size={20} />
                <h2 style={{ fontSize: "16px", margin: 0, fontWeight: "bold", color: "#fff" }}>Friday AMC Renewal Reminder</h2>
              </div>
              <button onClick={() => setShowFridayModal(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "inline-flex" }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
              <p style={{ margin: 0, fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                Happy Friday! The following client service contracts have AMC renewal dates coming up within the next 30 days.
              </p>
              
              <div style={{ maxHeight: "220px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "10px", background: "var(--bg-input)" }}>
                {amcRenewals.map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", borderBottom: "1px solid var(--border-glass)", fontSize: "12.5px" }}>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: "700", color: "var(--text-primary)" }}>{item.companyName}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{item.itemDescription} ({item.jobNumber})</div>
                    </div>
                    <div>
                      <span className="pill-badge pill-badge-green" style={{ fontSize: "11px" }}>
                        {new Date(item.amcDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ padding: "15px 20px", borderTop: "1px solid var(--border-glass)", display: "flex", justifyContent: "flex-end", gap: "10px", background: "var(--bg-card)" }}>
              <button 
                onClick={() => setShowFridayModal(false)}
                className="btn-secondary"
              >
                Close Summary
              </button>
              <button 
                onClick={() => {
                  setShowFridayModal(false);
                  router.push("/admin/services");
                }}
                className="btn-primary"
              >
                Go to Services Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Native Mobile Bottom Application Bar */}
      <div className="mobile-bottom-nav">
        {menuItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              prefetch={false}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "3px",
                textDecoration: "none",
                color: isActive ? "#a3e635" : "var(--text-secondary, #94a3b8)",
                fontSize: "10.5px",
                fontWeight: isActive ? "800" : "500",
                transition: "all 0.2s",
                padding: "6px 0"
              }}
            >
              <div style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "28px",
                borderRadius: "12px",
                background: isActive ? "rgba(163, 230, 53, 0.15)" : "transparent"
              }}>
                <Icon size={18} style={{ color: isActive ? "#a3e635" : "inherit" }} />
              </div>
              <span>{item.name.replace(" Dashboard", "").replace(" Center", "")}</span>
            </Link>
          );
        })}
      </div>

      {/* Mobile Sidebar Media Query CSS */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .dashboard-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }
          .dashboard-sidebar.mobile-open {
            transform: translateX(0);
          }
          .mobile-sidebar-close {
            display: flex !important;
          }
          .hamburger-btn {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
