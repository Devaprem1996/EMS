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
  X
} from "lucide-react";
import { EMS_CONFIG } from "@/config/ems-config";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="login-wrapper" style={{ justifyContent: "center", alignItems: "center" }}>
        <div className="spinner" style={{ width: "40px", height: "40px", borderWidth: "3px" }}></div>
      </div>
    );
  }

  const menuItems = [
    { name: "Employee Master", path: "/admin/employees", icon: Users },
    { name: "Enquiry Dashboard", path: "/admin/enquiry", icon: FileText },
    { name: "Refilling Dashboard", path: "/admin/refilling", icon: RotateCcw },
    { name: "Service Dashboard", path: "/admin/services", icon: Wrench },
    { name: "Technician View", path: "/admin/tasks", icon: LayoutDashboard },
  ];

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="dashboard-sidebar" style={{ borderRight: "1px solid rgba(255, 255, 255, 0.05)", background: "#0a0a0f" }}>
        <div className="sidebar-logo" style={{ display: "flex", gap: "10px", alignItems: "center", padding: "20px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <div style={{ background: "rgba(220, 38, 38, 0.15)", padding: "8px", borderRadius: "10px", display: "inline-flex", border: "1px solid rgba(220, 38, 38, 0.25)", color: "#ef4444" }}>
            <Flame size={20} fill="currentColor" />
          </div>
          <span style={{ fontSize: "16px", fontWeight: "bold", letterSpacing: "-0.03em" }}>{EMS_CONFIG.brand.title}</span>
        </div>
        
        <nav className="sidebar-menu" style={{ padding: "25px 15px", gap: "8px" }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`menu-link ${isActive ? "active" : ""}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  fontSize: "13.5px",
                  fontWeight: "500",
                  color: isActive ? "#fff" : "#9ca3af",
                  background: isActive ? "linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)" : "transparent",
                  border: isActive ? "1px solid rgba(220, 38, 38, 0.3)" : "1px solid transparent",
                  boxShadow: isActive ? "0 4px 15px rgba(220, 38, 38, 0.1)" : "none",
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
              >
                <Icon size={16} style={{ color: isActive ? "#ef4444" : "#6b7280" }} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)", padding: "15px" }}>
          <button 
            onClick={handleLogout} 
            className="menu-link logout-link" 
            style={{ 
              width: "100%", 
              background: "rgba(239, 68, 68, 0.05)", 
              border: "1px solid rgba(239, 68, 68, 0.15)",
              color: "#f87171",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px",
              borderRadius: "10px",
              cursor: "pointer"
            }}
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="dashboard-main">
        {/* Top Header */}
        <header className="dashboard-header">
          <div className="header-user">
            <span className="header-user-icon">
              <UserIcon size={16} />
            </span>
            <span>{user?.fullName || "Admin User"}</span>
          </div>
          <button 
            onClick={handleLogout} 
            className="header-logout-btn" 
            title="Log Out"
            aria-label="Log Out"
          >
            <LogOut size={20} />
          </button>
        </header>

        {/* Content */}
        <div className="dashboard-content">
          {children}
        </div>
      </main>
    </div>
  );
}
