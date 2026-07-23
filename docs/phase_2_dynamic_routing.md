# Phase 2: Next.js Dynamic UI Routing & Navigation

This document outlines the code refactoring, routing architecture, and instructions for implementing the **Unified Dynamic Router** (Phase 2).

---

## 🎯 Goal
Replace separate static dashboard pages (`/admin/refilling`, `/admin/services`) with a single, dynamic Next.js route: `/admin/dashboard/[stageCode]`. The navigation menu will automatically hide or show stages depending on the tenant's loaded configuration.

---

## 📁 File Structure & Paths

| Role | File Path | Description |
| :--- | :--- | :--- |
| **New Dynamic Route** | `src/app/admin/dashboard/[stageCode]/page.tsx` | Standard dashboard layout file that adapts based on stage code. |
| **Sidebar Menu** | `src/components/Sidebar.tsx` (or equivalent layout sidebar) | Renders links based on `config.stages` flags. |

---

## 🛠️ Code Specifications

### 1. Dynamic Route Handlers (`src/app/admin/dashboard/[stageCode]/page.tsx`)
This page handles the rendering of data for the specific stage requested via dynamic route parameters:

```tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useConfig } from "@/context/ConfigContext";

export default function DynamicDashboardPage() {
  const { stageCode } = useParams() as { stageCode: string };
  const { config, loading: configLoading } = useConfig();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (configLoading) return;
    
    // Check if stage is enabled
    const stageConfig = config?.stages?.[stageCode];
    if (!stageConfig || !stageConfig.enabled) {
      return; // Or show Access Denied / Redirect
    }

    // Fetch jobs for this specific stage dynamically
    fetch(`/api/jobs?stage=${stageCode}`)
      .then(res => res.json())
      .then(data => {
        setTickets(data);
        setLoading(false);
      });
  }, [stageCode, config, configLoading]);

  if (configLoading || loading) return <p>Loading workspace...</p>;

  const stageConfig = config.stages[stageCode];
  const labels = config.brand.labels;

  return (
    <div className="container">
      <h1>{stageConfig.displayName} Dashboard</h1>
      {/* Table grid showing custom labels */}
      <table>
        <thead>
          <tr>
            <th>Ticket Number</th>
            <th>Client Name</th>
            <th>{labels?.serialNumber || "Asset Serial"}</th>
            <th>{labels?.capacity || "Capacity"}</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t: any) => (
            <tr key={t.id}>
              <td>{t.ticketNumber}</td>
              <td>{t.customer?.companyName}</td>
              <td>{t.serialNumber}</td>
              <td>{t.capacity}</td>
              <td>{t.currentStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 2. Configurable Sidebar Navigation Menu
Filter visible sidebar links by checking `enabled` status on active config stages:
```tsx
import { useConfig } from "@/context/ConfigContext";

export default function Sidebar() {
  const { config } = useConfig();

  // Get active stages dynamically
  const activeStages = Object.entries(config.stages)
    .filter(([_, stage]) => stage.enabled)
    .map(([code, stage]) => ({ code, name: stage.displayName }));

  return (
    <nav className="sidebar">
      <Link href="/admin/enquiry">Enquiry Dashboard</Link>
      
      {/* Dynamic Links */}
      {activeStages.map(stage => (
        <Link key={stage.code} href={`/admin/dashboard/${stage.code}`}>
          {stage.name} Dashboard
        </Link>
      ))}
    </nav>
  );
}
```

---

## 🤖 AI Assistant Coding Instruction & Prompt
Copy and paste this prompt when instructing an AI assistant to implement Phase 2:

> **AI Coding Instruction (Phase 2)**:
> "We are replacing static dashboard files with a dynamic router `/admin/dashboard/[stageCode]/page.tsx` in Next.js.
> 1. Use the `useParams` hook to capture `stageCode`.
> 2. Read `config` from `useConfig` context to verify if `config.stages[stageCode].enabled` is true.
> 3. Fetch data dynamically from `/api/jobs?stage=${stageCode}`.
> 4. Render headers dynamically using the labels configured in `config.brand.labels`."
