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
  Check
} from "lucide-react";
import { useConfig } from "@/context/ConfigContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const { config, loading: configLoading } = useConfig();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          
          // Show on Friday (5) or if test mode is requested (?test_notification=true)
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
        if (!data.authenticated || data.user.role !== "ADMIN") {
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

  // Build dynamic menu items based on configurations
  const menuItems = [
    { name: "Employee Master", path: "/admin/employees", icon: Users },
  ];

  if (!config || config.stages?.ENQUIRY?.enabled !== false) {
    menuItems.push({
      name: `${config?.stages?.ENQUIRY?.displayName || "Enquiry"} Dashboard`,
      path: "/admin/enquiry",
      icon: FileText,
    });
  }

  if (!config || config.stages?.REFILLING?.enabled !== false) {
    menuItems.push({
      name: `${config?.stages?.REFILLING?.displayName || "Refilling"} Dashboard`,
      path: "/admin/refilling",
      icon: RotateCcw,
    });
  }

  if (!config || config.stages?.SERVICES?.enabled !== false) {
    menuItems.push({
      name: `${config?.stages?.SERVICES?.displayName || "Service"} Dashboard`,
      path: "/admin/services",
      icon: Wrench,
    });
  }

  menuItems.push(
    { name: "Technician View", path: "/admin/tasks", icon: LayoutDashboard },
    { name: "System Settings", path: "/admin/settings", icon: Settings }
  );

  const brandTitle = config?.brand?.title || "Safeway";
  const logoUrl = config?.brand?.logoUrl;

  return (
    <div className="dashboard-container" style={{ flexDirection: "column" }}>
      {/* Top Header Navigation */}
      <header className="top-nav-header">
        {/* Left Side: Logo/Brand */}
        <Link href="/admin/enquiry" className="top-nav-logo">
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

        {/* Right: Profile & Mobile Toggle */}
        <div className="top-nav-right">
          {/* Notifications Bell Icon Button */}
          <div style={{ position: "relative", marginRight: "12px", display: "inline-flex" }}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "8px",
                padding: "8px",
                cursor: "pointer",
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                color: isNotificationsOpen ? "var(--accent)" : "var(--text-secondary)",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"; }}
              title="Notifications"
            >
              <Bell size={16} />
              {amcRenewals.length > 0 && (
                <span style={{
                  position: "absolute",
                  top: "-2px",
                  right: "-2px",
                  background: "var(--accent)",
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: "bold",
                  borderRadius: "50%",
                  width: "16px",
                  height: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 10px var(--accent)"
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
                  top: "40px",
                  right: 0,
                  width: "320px",
                  maxHeight: "400px",
                  overflowY: "auto",
                  zIndex: 1000,
                  padding: "15px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "8px" }}>
                  <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--text-primary)" }}>Notification Center</span>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{amcRenewals.length} updates</span>
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
                          padding: "10px",
                          borderRadius: "8px",
                          background: "rgba(255, 255, 255, 0.02)",
                          border: "1px solid var(--border-glass)",
                          fontSize: "12px",
                          cursor: "pointer",
                          textAlign: "left"
                        }}
                        onClick={() => {
                          setIsNotificationsOpen(false);
                          router.push("/admin/services");
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", color: "var(--text-primary)", marginBottom: "4px" }}>
                          <span>{item.companyName}</span>
                          <span style={{ color: "var(--accent)" }}>{item.jobNumber}</span>
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

          <div className="header-user" style={{ marginRight: "10px" }}>
            <span className="header-user-icon">
              <UserIcon size={14} />
            </span>
            <span style={{ fontSize: "13px" }}>{user?.fullName || "Admin User"}</span>
          </div>

          <button 
            onClick={handleLogout} 
            className="header-logout-btn" 
            title="Log Out"
            aria-label="Log Out"
            style={{ 
              padding: "6px 12px", 
              background: "rgba(239, 68, 68, 0.08)", 
              border: "1px solid rgba(239, 68, 68, 0.15)", 
              borderRadius: "6px",
              color: "#ef4444", 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: "600",
              marginLeft: "8px"
            }}
          >
            <LogOut size={14} />
            <span>Log Out</span>
          </button>

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
      
      {/* Friday AMC Renewal Reminder Modal */}
      {showFridayModal && (
        <div className="slide-over-backdrop" style={{ zIndex: 2000 }} onClick={() => setShowFridayModal(false)}>
          <div className="slide-over-card theme-modal-card" style={{ maxWidth: "550px", margin: "10% auto", animation: "premiumSlideIn 0.3s ease-out" }} onClick={(e) => e.stopPropagation()}>
            <div className="slide-over-header theme-modal-card-header" style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#fff" }}>
                <AlertTriangle size={20} />
                <h2 style={{ fontSize: "17px", margin: 0, fontWeight: "bold", color: "#fff" }}>Friday AMC Renewal Summary Reminder</h2>
              </div>
              <button onClick={() => setShowFridayModal(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "inline-flex" }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
              <p style={{ margin: 0, fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                Happy Friday! The following client service contracts have AMC renewal dates coming up within the next 30 days. Please inspect and schedule maintenance visits.
              </p>
              
              <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "10px", background: "rgba(0,0,0,0.15)" }}>
                {amcRenewals.map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.02)", fontSize: "12.5px" }}>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: "700", color: "var(--text-primary)" }}>{item.companyName}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{item.itemDescription} ({item.jobNumber})</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>
                        {new Date(item.amcDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ padding: "15px 20px", borderTop: "1px solid var(--border-glass)", display: "flex", justifyContent: "flex-end", gap: "10px", background: "var(--bg-input)" }}>
              <button 
                onClick={() => setShowFridayModal(false)}
                style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-secondary)", cursor: "pointer", fontSize: "13px" }}
              >
                Close Summary
              </button>
              <button 
                onClick={() => {
                  setShowFridayModal(false);
                  router.push("/admin/services");
                }}
                style={{ padding: "8px 16px", background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
              >
                Go to Services Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

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
