# SaaS Productization Framework: Managing Configurations & Tenant Lifecycle

To scale and sell this application as a commercial Software-as-a-Service (SaaS) product, you need a structured management system. You cannot write raw JSON or run manual SQL queries for every new client.

This framework outlines the tools, pipelines, and administrative dashboards required to control, provision, and update a config-based multi-tenant application.

---

## 🛠️ 1. Configuration Template Registry (Centralized Templates)

Instead of designing configurations from scratch, maintain a directory of version-controlled **Domain Templates** in the codebase.

```
src/config/templates/
├── fire-safety.json
├── hvac-repair.json
├── it-helpdesk.json
└── elevator-maintenance.json
```

### Example: `hvac-repair.json`
```json
{
  "templateVersion": "1.0.0",
  "categories": ["AC Repair", "Ventilation Service"],
  "brand": {
    "labels": {
      "serialNumber": "Compressor Serial",
      "capacity": "AC Tonnage"
    }
  },
  "stages": {
    "BOOKING": { "enabled": true, "displayName": "Booking" },
    "DISPATCH": { "enabled": true, "displayName": "Dispatch" }
  }
}
```

*When onboarding a new client, you clone the corresponding template JSON and write it directly to the database.*

---

## 🚀 2. Tenant Provisioning Pipeline (Onboarding Clients)

Create a secure CLI script or developer API endpoint `/api/platform/provision` to automate the creation of new client instances. 

```
[ Developer Input ] ➔ [ Run Provisioning Script ] ➔ [ Database Setup ]
(Client Name, Subdomain,                            1. Creates Tenant record.
 Domain Template)                                    2. Clones Template Config.
                                                     3. Seeds Client Admin User.
```

### Sample Automated Onboarding Function:
```typescript
async function provisionNewClient(companyName: string, subdomain: string, templateType: string, adminPhone: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Create Tenant
    const tenant = await tx.tenant.create({
      data: { name: companyName, subdomain }
    });

    // 2. Load Template Config
    const templateConfig = require(`@/config/templates/${templateType}.json`);

    // 3. Save Config to SystemConfig
    await tx.systemConfig.create({
      data: {
        tenantId: tenant.id,
        config: JSON.stringify(templateConfig)
      }
    });

    // 4. Create Initial Client Admin User
    const defaultPassword = await bcrypt.hash("InitialPassword123!", 10);
    await tx.employee.create({
      data: {
        tenantId: tenant.id,
        mobileNumber: adminPhone,
        passwordHash: defaultPassword,
        role: "ADMIN",
        fullName: `${companyName} Administrator`
      }
    });

    console.log(`✅ Tenant ${companyName} successfully created at ${subdomain}.ems-saas.com!`);
  });
}
```

---

## 🖥️ 3. Platform Admin Control Center (Developer Panel)

Build a dedicated, isolated platform control dashboard (e.g. `platform.ems-saas.com`) accessible only by developers (`SUPER_ADMIN` role).

### Key Features of the Platform Admin Panel:
1. **Tenant Directory**: A list of all active clients, their current subscriptions, and usage statistics.
2. **Visual Config Editor**: A GUI form with text inputs, toggle switches, and drag-and-drop lists that edits a tenant's database-stored `SystemConfig` record (saving developers from writing raw JSON).
3. **Module Access Toggles**: Enable or disable entire system features (e.g., toggle invoicing, SMS alert notifications, or route optimization maps) depending on the package the client purchased.

---

## 🔄 4. Versioning & Configuration Upgrades (Patching Existing Clients)

When you update a core feature, you may need to add a new configuration parameter to existing clients without overwriting their custom modifications.

### Configuration Patching Strategy:
1. Keep template versions inside the configuration (`templateVersion: "1.2.0"`).
2. Write a migration script that compares each tenant's config with the master template.
3. Use a deep-merge strategy that adds missing keys but preserves existing custom labels:
```typescript
import merge from "lodash/merge";

function upgradeTenantConfig(currentConfig: any, masterTemplate: any) {
  // Merges master values into currentConfig only if the keys don't already exist
  const upgradedConfig = merge({}, masterTemplate, currentConfig);
  upgradedConfig.templateVersion = masterTemplate.templateVersion;
  return upgradedConfig;
}
```
4. Run this script during deployment updates to upgrade all active tenants safely.
