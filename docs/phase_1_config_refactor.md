# Phase 1: Dynamic Configuration Loader & DB Integration

This document outlines the code refactoring, file paths, type definitions, and instructions for implementing the **Dynamic Configuration Loader** (Phase 1).

---

## 🎯 Goal
Refactor the system configuration loader to retrieve dynamic tenant configurations from the database (`SystemConfig` table) and merge them with the default `EMS_CONFIG` constants, allowing dynamic terminology, custom categories, and custom workflows.

---

## 📁 File Structure & Paths

| Role | File Path | Description |
| :--- | :--- | :--- |
| **System Defaults** | `src/config/ems-config.ts` | Hardcoded fallback values. |
| **Loader Engine** | `src/lib/config-loader.ts` | Awaits DB reads and merges configurations. |
| **Data Context** | `src/context/ConfigContext.tsx` | Provides the configuration to the React UI. |
| **Config API** | `src/app/api/config/route.ts` | Allows reading and writing system configs. |

---

## 🛠️ Code Specifications

### 1. Refactored Configuration Loader (`src/lib/config-loader.ts`)
Must merge database JSON configurations over filesystem defaults using a deep-merge strategy:

```typescript
import { prisma } from "@/lib/db";
import { EMS_CONFIG, EmsConfig } from "@/config/ems-config";

export async function getDbConfig(tenantId?: string | null): Promise<EmsConfig> {
  try {
    const record = await prisma.systemConfig.findFirst({
      where: tenantId ? { tenantId } : { id: "default" },
    });
    
    if (record && record.config) {
      const dbConfig = JSON.parse(record.config);
      
      // Merge configuration options
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

### 2. Config Endpoint Update (`src/app/api/config/route.ts`)
Ensure the GET API retrieves database-driven configs dynamically:
```typescript
import { NextResponse } from "next/server";
import { getDbConfig } from "@/lib/config-loader";
import { getAuthSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = getAuthSession(req);
    const tenantId = session?.tenantId || null;
    const config = await getDbConfig(tenantId);
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 });
  }
}
```

---

## 🤖 AI Assistant Coding Instruction & Prompt
Copy and paste this prompt when instructing an AI assistant to implement Phase 1:

> **AI Coding Instruction (Phase 1)**:
> "We are refactoring our configuration loader `src/lib/config-loader.ts` to merge database configurations with default configurations. 
> 1. Read the default settings from `@/config/ems-config.ts`.
> 2. Fetch the `SystemConfig` record from the SQLite database using `prisma`.
> 3. Perform a deep-merge where DB keys take priority over file defaults. Keep brand labels, categories, stages, and import mappings customizable.
> 4. Ensure no schema validation errors are thrown. Log failures gracefully and fall back to the default config."
