# Security Design: Restricting Domain Configurations to Developers

When selling this application as a SaaS product, you want to prevent tenant clients from accessing or modifying system domain structures, workflow pipelines, and custom fields. These configurations should be managed exclusively by developers/platform administrators.

Here is how to implement a secure **Developer-Only Configuration Control** system.

---

## 🔐 1. Role Expansion: Introducing `SUPER_ADMIN`

Currently, `Employee.role` supports `"ADMIN" | "TECHNICIAN"`. We will introduce a third role: `"SUPER_ADMIN"` (Developer/Platform Admin).

### Database Rule Updates
1. **`ADMIN` (Client Admin)**: Accesses customer list, schedules technician dispatches, views dashboards, and edits basic tenant branding (logo, business name).
2. **`SUPER_ADMIN` (Developer)**: Overrides everything, configures workflow pipelines, registers new tenants, and modifies the core database configurations.

---

## 🛡️ 2. API Route Protection (Backend Enforcement)

To ensure clients cannot modify their domain configurations via API calls (even using tools like Postman), enforce super-admin validation on the configuration endpoints.

### Editing `src/app/api/config/route.ts` (or the settings controller):
```typescript
import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth"; // auth helper
import { prisma } from "@/lib/db";

export async function PUT(req: Request) {
  try {
    const session = getAuthSession(req);
    
    // STRICT SECURITY CHECK: Only allow SUPER_ADMIN role (Developers) to modify config
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only developers/super-administrators can modify domain settings." },
        { status: 403 }
      );
    }

    const { configData } = await req.json();
    
    // Update the system configuration
    const updated = await prisma.systemConfig.update({
      where: { id: "default" }, // or matching tenantId
      data: { config: JSON.stringify(configData) },
    });

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
```

---

## 🖥️ 3. UI Protection (Frontend Enforcement)

Hide developer-only settings tabs or pages from the sidebar and client settings view by inspecting the user's session role.

### A. Sidebar Navigation Protection
Inside your sidebar component:

```tsx
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const { user } = useAuth(); // contains current logged-in employee role

  return (
    <nav>
      {/* Client Admin standard navigation */}
      <Link href="/admin/enquiry">Enquiries</Link>
      <Link href="/admin/employees">Employees Master</Link>
      <Link href="/admin/settings">Branding Settings</Link>

      {/* DEVELOPER ONLY: Only visible to platform developers */}
      {user?.role === "SUPER_ADMIN" && (
        <div className="developer-section">
          <span className="section-label">Developer Panel</span>
          <Link href="/admin/developer/domain-config">Domain Pipeline Manager</Link>
          <Link href="/admin/developer/tenants">Tenant Provisioning</Link>
        </div>
      )}
    </nav>
  );
}
```

### B. Client-Side Page Router Guard
Protect pages at `/admin/developer/*` using Next.js middleware or route checking:

```tsx
// Inside src/app/admin/developer/domain-config/page.tsx
"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DomainConfigPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "SUPER_ADMIN")) {
      router.replace("/admin/enquiry"); // Redirect standard client admins out
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "SUPER_ADMIN") {
    return <p>Loading secure panel...</p>;
  }

  return (
    <div>
      <h1>Global Domain Settings (Developer Access)</h1>
      {/* Form inputs to edit stages, fields, etc. */}
    </div>
  );
}
```

---

## 🚀 4. Best Practice for White-Label Distribution

When shipping the software:
1. **Developer Domain URL**: Set up a master platform domain (e.g. `master.ems-saas.com` or `/platform-admin`). Developers log in here with the `SUPER_ADMIN` account to provision new clients.
2. **Tenant Subdomain URL**: Clients access the app via their private URL (e.g. `clientname.ems-saas.com`). Standard users are created with `ADMIN` or `TECHNICIAN` roles. Since they log in here, they will never see or have routes to developer-only panels.
3. **Seeding script**: Pre-load one global `SUPER_ADMIN` developer user in the SQLite database during project setup (using `prisma/seed.ts`).
