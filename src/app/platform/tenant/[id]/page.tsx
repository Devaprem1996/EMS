import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import TenantControlPanel from "./TenantControlPanel";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TenantSettingsPage({ params }: { params: { id: string } }) {
  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: { configs: true }
  });

  if (!tenant) {
    notFound();
  }

  // Parse config
  let configObj = {};
  if (tenant.configs && tenant.configs.length > 0) {
    try {
      configObj = JSON.parse(tenant.configs[0].config);
    } catch (e) {
      console.error("Failed to parse tenant config", e);
    }
  }

  return (
    <div style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <Link href="/platform" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", textDecoration: "none", marginBottom: "20px", fontSize: "14px" }}>
        <ArrowLeft size={16} />
        Back to Platform HQ
      </Link>
      
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "var(--text-primary)", margin: "0 0 8px 0" }}>{tenant.name} Control Panel</h1>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0 }}>Super Admin control center for tenant domain: {tenant.subdomain}.platform.com</p>
      </div>

      <TenantControlPanel tenantId={tenant.id} initialConfig={configObj} />
    </div>
  );
}
