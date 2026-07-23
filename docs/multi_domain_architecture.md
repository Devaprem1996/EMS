# Architecture Plan: Evolving to a Multi-Domain FSM SaaS Platform

To transform the current codebase from a specific **Fire Safety/Cylinder Management** tool into a **Generic, Multi-Domain Field Service Management (FSM) & Workflow Automation** platform (supporting HVAC, IT Helpdesk, Elevator Maintenance, Medical Equipment, etc.), we need to transition from **hardcoded business logic** to a **configuration-driven engine**.

Here is how we can refactor the schemas and APIs to make the platform completely domain-agnostic.

---

## 🛠️ 1. Generalizing the Workflow (Dynamic State Machine)

### The Current Domain-Specific Problem
Stages are currently hardcoded in the APIs and database checks as `"ENQUIRY" | "REFILLING" | "SERVICES" | "COMPLETED"`. This is highly specific to cylinder refills.

### The Multi-Domain Solution
Introduce a configurable **Workflow & State Machine Engine** inside `SystemConfig`.
* Tenants can define their own stage pipelines in JSON.
* **Fire Safety**: `Enquiry -> Refilling -> Service -> Completed`
* **HVAC Services**: `Booking -> Dispatch -> Repair -> Testing -> Handover`
* **IT Helpdesk**: `Triage -> Under Investigation -> Awaiting Client -> Resolved`

#### Proposed Database Schema Shift:
```prisma
model WorkflowStage {
  id          String   @id @default(uuid())
  tenantId    String
  name        String   // e.g., "Dispatch"
  code        String   // e.g., "DISPATCH"
  sequenceOrder Int    // e.g., 2
  colorCode   String   // UI hex color
  allowedRoles String  // JSON array, e.g., ["ADMIN", "TECHNICIAN"]
}
```

---

## 📋 2. Entity Custom Fields (Dynamic Schema Engine)

### The Current Domain-Specific Problem
The `Ticket` model has static columns like `serialNumber` (cylinder tag), `capacity` (kg), and `extinguisherType` (CO2, DCP). An HVAC company doesn't need "extinguisherType" but needs "compressorModel". An IT firm needs "operatingSystem".

### The Multi-Domain Solution
Transition to a **Metadata EAV (Entity-Attribute-Value) Model** or exploit the `stageData` JSON field dynamically.
* Define custom schemas per domain/category in `SystemConfig`.
* Example Schema Definitions:
```json
{
  "category": "HVAC",
  "fields": [
    { "name": "ac_tonnage", "label": "AC Tonnage", "type": "select", "options": ["1 Ton", "1.5 Ton", "2 Ton"] },
    { "name": "coolant_pressure", "label": "Coolant Pressure (PSI)", "type": "number" }
  ]
}
```
* Read these configurations dynamically on the frontend and render inputs on the fly. Save the filled values inside the `stageData` JSON column.

---

## 🗓️ 3. Configurable Service Schedules (Rules Engine)

### The Current Domain-Specific Problem
AMC calculations are hardcoded to annual periods: `amcDate = deliveredDate + amcYears`.

### The Multi-Domain Solution
Implement a **Recurrence Rules Engine** (analogous to Cron or standard calendar rules):
* Replace `amcYears` with a `maintenanceFrequency` enum/config.
* Frequency Types: `WEEKLY` | `MONTHLY` | `QUARTERLY` | `BI_ANNUALLY` | `ANNUALLY`.
* The system computes the next service date based on the chosen pattern:
```typescript
function calculateNextMaintenance(deliveredDate: Date, frequency: string): Date {
  const nextDate = new Date(deliveredDate);
  if (frequency === "MONTHLY") nextDate.setMonth(nextDate.getMonth() + 1);
  if (frequency === "QUARTERLY") nextDate.setMonth(nextDate.getMonth() + 3);
  if (frequency === "ANNUALLY") nextDate.setFullYear(nextDate.getFullYear() + 1);
  return nextDate;
}
```

---

## 🏷️ 4. Skill-Based Routing & Tagging

### The Current Domain-Specific Problem
Assignments are currently manual and assume any technician can do any job.

### The Multi-Domain Solution
Different domains require specialized staff (e.g. an Electrician vs. a Plumber, or a Network Engineer vs. a Database Admin).
* Add a `Skill` or `Tag` system.
* Technicians have specific tags: `["Electrician", "HVAC-Senior"]`.
* Jobs have required skills: `["HVAC-Senior"]`.
* The technician assignment dropdown automatically filters out employees who lack the required skills.

---

## 🏢 5. White-Label Custom Domains

### The Current Domain-Specific Problem
Multi-tenancy uses standard subdomains (`tenant1.safeway.in`).

### The Multi-Domain Solution
True multi-domain SaaS applications allow tenants to bind their own domain names.
* Add a `customDomain` field to the `Tenant` table.
* In Next.js middleware, check the incoming hostname. If it matches `service.myhvac.com`, look up that tenant and render their specific dashboard theme and branding.

---

## 📈 Summary of Domain Architectures

| Domain | Workflow Stages | Dynamic Fields (stageData) | Maintenance Rule |
| :--- | :--- | :--- | :--- |
| **Fire Safety** | Enquiry ➔ Refilling ➔ Service | Cylinder Serial, Capacity, Type | Annually (`amcYears`) |
| **HVAC Service** | Booking ➔ Repair ➔ Inspection | AC Model, Gas Pressure, Filter Status | Quarterly Maintenance |
| **IT Helpdesk** | Triage ➔ Resolution | Device MAC Address, OS, RAM | None (Ad-Hoc) |
| **Elevator Care** | Inspection ➔ Maintenance | Elevator Lift ID, Cable Wear Rate | Monthly Testing |
