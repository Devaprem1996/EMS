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

        {/* Right: Profile & Mobile Toggle */}
        <div className="top-nav-right">
          <div className="header-user" style={{ marginRight: "10px" }}>
            <span className="header-user-icon">
              <UserIcon size={14} />
            </span>
            <span style={{ fontSize: "13px" }}>{user?.fullName || "Technician"}</span>
          </div>

          <button 
            onClick={handleLogout} 
            className="header-logout-btn" 
            title="Log Out"
            aria-label="Log Out"
            style={{ padding: "6px", background: "none", border: "none", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <LogOut size={16} />
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
