import React from "react";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, LogOut, Settings } from "lucide-react";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("ems_session");
  const session = sessionCookie ? verifySession(sessionCookie.value) : null;

  if (!session || session.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)" }}>
      {/* Sidebar */}
      <aside style={{
        width: "260px",
        background: "var(--bg-card-glass)",
        borderRight: "1px solid var(--border-glass)",
        display: "flex",
        flexDirection: "column",
        padding: "20px 0"
      }}>
        <div style={{ padding: "0 20px 20px 20px", borderBottom: "1px solid var(--border-glass)", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "var(--primary)" }}>Platform HQ</h2>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Super Admin View</div>
        </div>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px", padding: "0 10px" }}>
          <Link href="/platform" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 15px", borderRadius: "10px", color: "var(--text-primary)", textDecoration: "none", transition: "0.2s" }}>
            <LayoutDashboard size={20} />
            <span style={{ fontSize: "14px", fontWeight: "500" }}>Tenants</span>
          </Link>
        </nav>

        <div style={{ padding: "20px", borderTop: "1px solid var(--border-glass)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold" }}>
              SA
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>{session.fullName}</div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Super Admin</div>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "10px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "var(--text-secondary)", cursor: "pointer" }}>
              <LogOut size={16} />
              <span style={{ fontSize: "13px", fontWeight: "500" }}>Log out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}
