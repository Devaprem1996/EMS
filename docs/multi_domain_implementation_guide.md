# Implementation Guide: Building a Multi-Domain Configurable Engine

To make the application dynamically support multiple domains (such as HVAC, IT Helpdesk, Elevator Care, etc.), you can follow this step-by-step migration guide. It transitions the hardcoded components to a fully dynamic database-driven config engine.

---

## 📅 Phase 1: Enable Dynamic Config Loader

Currently, `src/lib/config-loader.ts` hardcodes the system properties (`stages`, `categories`, `importMappings`) by overriding them with `EMS_CONFIG` from the file system.

### Refactoring `src/lib/config-loader.ts`
Modify the configuration loader to prefer values defined inside the tenant's database configuration (`SystemConfig`) while falling back to the fire safety system defaults:

```typescript
// Refactored src/lib/config-loader.ts
import { prisma } from "@/lib/db";
import { EMS_CONFIG, EmsConfig } from "@/config/ems-config";

export async function getDbConfig(tenantId?: string | null): Promise<EmsConfig> {
  try {
    const record = await prisma.systemConfig.findFirst({
      where: tenantId ? { tenantId } : { id: "default" },
    });
    
    if (record && record.config) {
      const dbConfig = JSON.parse(record.config);
      
      // Fully merge settings, prioritizing database overrides
      return {
        categories: dbConfig.categories || EMS_CONFIG.categories,
        sources: dbConfig.sources || EMS_CONFIG.sources,
        importMappings: {
          ...EMS_CONFIG.importMappings,
          ...(dbConfig.importMappings || {}),
        },
        brand: {
          ...EMS_CONFIG.brand,
          ...(dbConfig.brand || {}),
          theme: {
            ...EMS_CONFIG.brand.theme,
            ...(dbConfig.brand?.theme || {}),
          },
          labels: {
            ...EMS_CONFIG.brand.labels,
            ...(dbConfig.brand?.labels || {}),
          },
        },
        stages: {
          ...EMS_CONFIG.stages,
          ...(dbConfig.stages || {}),
        },
      };
    }
  } catch (error) {
    console.error("[Config Loader] Error loading config from database:", error);
  }
  return EMS_CONFIG;
}
```

---

## 📋 Phase 2: Render Dynamic Frontend Forms & Headers

Instead of rendering static labels like "Cylinder Serial" or "Extinguisher Type", the table headers and edit modal labels must read from the configured labels:

### A. Rendering Labels on Tables
In pages like `src/app/admin/enquiry/page.tsx` and `src/app/admin/refilling/page.tsx`:
```tsx
// Instead of:
<th>Cylinder Tag / Serial No</th>
<th>Cylinder Capacity</th>

// Use config-driven labels:
<th>{config.brand.labels?.serialNumber || "Asset Serial"}</th>
<th>{config.brand.labels?.capacity || "Capacity"}</th>
```

### B. Dynamically Rendering Stage Input Fields
When technicians or admins perform check-ins, the fields shown should map to the current stage's dynamic field definitions:

```tsx
// Inside check-in / update modals:
const stageFields = config.stages[selectedStage]?.fields || [];

return (
  <form>
    {stageFields.map((field) => (
      <div key={field.key} className="form-group">
        <label>{field.label}</label>
        
        {field.type === "text" && (
          <input type="text" required={field.required} name={field.key} />
        )}
        
        {field.type === "number" && (
          <input type="number" required={field.required} name={field.key} />
        )}
        
        {field.type === "select" && (
          <select required={field.required} name={field.key}>
            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        )}
        
        {field.type === "boolean" && (
          <input type="checkbox" name={field.key} />
        )}
      </div>
    ))}
  </form>
);
```

---

## ⚡ Phase 3: Configurable Stage & Transition API Rules

Avoid hardcoding the transition paths in the API. Currently, `api/tasks/[id]` updates are hardcoded:
```typescript
if (ticket.currentStage === "REFILLING") {
  ticketUpdateData.currentStatus = "Order Delivered";
} else if (ticket.currentStage === "SERVICES") {
  ticketUpdateData.currentStatus = "Service Done";
}
```

### Refactoring to Configuration Rules
Add rules mapping inside the config:
```json
{
  "stages": {
    "REFILLING": {
      "enabled": true,
      "displayName": "Refilling Stage",
      "completionStatus": "Order Delivered",
      "autoTransitionStage": "SERVICES"
    }
  }
}
```
Inside `api/tasks/[id]/route.ts`, parse the custom rule dynamically:
```typescript
const currentStageConfig = config.stages[ticket.currentStage];
if (currentStageConfig) {
  ticketUpdateData.currentStatus = currentStageConfig.completionStatus || "Completed";
  
  if (currentStageConfig.autoTransitionStage) {
    ticketUpdateData.currentStage = currentStageConfig.autoTransitionStage;
  } else {
    ticketUpdateData.currentStage = "COMPLETED";
  }
}
```

---

## 🛠️ Phase 4: Dynamic Admin Settings Control Panel

Build a configuration tab in `/admin/settings` where tenant admins can:
1. Select their industry template (e.g. `HVAC`, `Fire Safety`, `Elevator Service`, `Cleaning`).
2. Selecting a template pre-populates the database's `SystemConfig` record with:
   - The corresponding primary and secondary labels.
   - The stage pipeline (names, order, colors).
   - Dynamic field forms for check-ins.
3. Save the custom configuration to the DB.
