import { prisma } from "@/lib/db";
import { Plus, Users, Building, Settings } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PlatformDashboard() {
  const tenants = await prisma.tenant.findMany({
    include: {
      _count: {
        select: { employees: true, customers: true, tickets: true }
      },
      configs: true
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "var(--text-primary)", margin: "0 0 8px 0" }}>Tenants & Clients</h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0 }}>Manage all client instances across the platform.</p>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--primary)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
          <Plus size={18} />
          Provision New Tenant
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
        {tenants.map(tenant => {
          // Attempt to parse the brand title from their config
          let brandTitle = tenant.name;
          if (tenant.configs && tenant.configs.length > 0) {
            try {
              const parsed = JSON.parse(tenant.configs[0].config);
              if (parsed.brand?.title) brandTitle = parsed.brand.title;
            } catch(e) {}
          }

          return (
            <div key={tenant.id} style={{ background: "var(--bg-card-glass)", border: "1px solid var(--border-glass)", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border-glass)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                  <Building size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", margin: "0 0 4px 0" }}>{brandTitle}</h3>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{tenant.subdomain}.platform.com</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "15px", marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid var(--border-glass)" }}>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)" }}>{tenant._count.employees}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Employees</div>
                </div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)" }}>{tenant._count.customers}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Customers</div>
                </div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)" }}>{tenant._count.tickets}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Tickets</div>
                </div>
              </div>

              <div style={{ marginTop: "auto", display: "flex", gap: "10px" }}>
                <Link href={`/platform/tenant/${tenant.id}`} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-glass)", padding: "10px", borderRadius: "8px", color: "var(--text-primary)", textDecoration: "none", fontSize: "13px", fontWeight: "500", transition: "0.2s" }}>
                  <Settings size={16} />
                  Manage Settings
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
