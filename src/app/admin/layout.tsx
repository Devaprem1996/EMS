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
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <Flame size={24} fill="currentColor" />
          <span>{EMS_CONFIG.brand.title}</span>
        </div>
        
        <nav className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`menu-link ${isActive ? "active" : ""}`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="menu-link logout-link" style={{ width: "100%", background: "none" }}>
            <LogOut size={18} />
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
