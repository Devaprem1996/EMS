# Phase 4: Platform Admin Configuration Panel & Security

This document outlines the security roles, route guards, developer portal, and deployment seeding instructions for **Platform Administration** (Phase 4).

---

## 🎯 Goal
Configure the developer control panel to allow provisioning new tenants, mapping domain templates, and modifying `SystemConfig` records without exposing these settings to client admins or technicians.

---

## 📁 File Structure & Paths

| Role | File Path | Description |
| :--- | :--- | :--- |
| **Platform Dashboard** | `src/app/admin/developer/config/page.tsx` | Secure workspace config editor for Developers. |
| **Domain Templates** | `src/config/templates/*.json` | JSON files pre-configured for HVAC, IT, elevator care, etc. |
| **Seeding Script** | `prisma/seed.ts` | Populates the initial `SUPER_ADMIN` developer credentials. |

---

## 🛠️ Code Specifications

### 1. Developer Role Definition & Middleware check
Update authentication filters or API route handlers to ensure only `SUPER_ADMIN` users can access platform configurations:

```typescript
import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";

export async function PUT(req: Request) {
  const session = getAuthSession(req);
  
  // SECURE GUARD: Block access unless role is SUPER_ADMIN
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: Developer permissions required to update system layouts." },
      { status: 403 }
    );
  }
  
  // Proceed with updating configuration...
}
```

### 2. Tenant Provisioning Script (`src/scripts/provision.ts`)
Run this script to onboard a new tenant and load their default configuration template:

```typescript
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function provisionTenant(name: string, subdomain: string, template: string, adminPhone: string) {
  try {
    const tenant = await prisma.tenant.create({
      data: { name, subdomain }
    });

    // Read template JSON file
    const filePath = path.join(process.cwd(), "src/config/templates", `${template}.json`);
    const templateContent = fs.readFileSync(filePath, "utf-8");

    // Seed configuration
    await prisma.systemConfig.create({
      data: {
        tenantId: tenant.id,
        config: templateContent
      }
    });

    // Seed Tenant Administrator
    const passwordHash = await bcrypt.hash("StartConfig123!", 10);
    await prisma.employee.create({
      data: {
        tenantId: tenant.id,
        mobileNumber: adminPhone,
        passwordHash,
        role: "ADMIN",
        fullName: `${name} General Manager`
      }
    });

    console.log(`✅ Tenant successfully onboarded! URL: http://${subdomain}.localhost:3000`);
  } catch (error) {
    console.error("❌ Onboarding failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Example Execution
provisionTenant("Arctic HVAC Solutions", "arctic", "hvac-repair", "8888888888");
```

---

## 🤖 AI Assistant Coding Instruction & Prompt
Copy and paste this prompt when instructing an AI assistant to implement Phase 4:

> **AI Coding Instruction (Phase 4)**:
> "We are setting up the platform developer administration and tenant onboarding.
> 1. Create a platform provisioning script that loads templates from JSON config files and seeds them to the database.
> 2. Ensure all API routes under `/api/platform/*` are protected using a backend session check verifying `role === 'SUPER_ADMIN'`.
> 3. Verify that new tenants default to their mapped config template without affecting existing databases."
