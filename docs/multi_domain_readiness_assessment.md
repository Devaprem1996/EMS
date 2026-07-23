# Readiness Assessment: Transitioning to a Multi-Domain SaaS Codebase

Your vision is to maintain **one codebase** where you can dynamically toggle features/stages on or off per client and customize terminology (name conversions) depending on their industry.

Here is the assessment of the current codebase and the specific changes required to make this vision a reality.

---

## 🚦 Current State Analysis

| Feature Area | Current State in Codebase | Multi-Domain Readiness |
| :--- | :--- | :--- |
| **Data Storage** | `Ticket.stageData` JSON & `SystemConfig` JSON exist. | **READY**: Database can hold dynamic fields. |
| **Configuration Loading** | Config loader overrides tenant settings with filesystem `EMS_CONFIG`. | **NOT READY**: Needs refactoring to prioritize DB. |
| **Dashboard Views** | Separate static pages exist for `/admin/enquiry`, `/admin/refilling`, `/admin/services`. | **NOT READY**: Dashboards are hardcoded. |
| **Technician forms** | Forms contain hardcoded inputs (e.g. Tare Weight, Gross Weight). | **NOT READY**: Forms are hardcoded. |
| **Calculations / Transitions** | Task completion updates are hardcoded to cylinder status labels. | **NOT READY**: Rules engine is hardcoded. |

---

## 🛠️ Required Codebase Modifications

To achieve your vision of a customizable multi-domain SaaS, we must refactor the following modules:

### 1. Unified Dynamic Dashboard Router
* **Current Issue**: The dashboards are separated into static files: `/admin/refilling/page.tsx` and `/admin/services/page.tsx`. If a client does not have "Refilling", they still see the dashboard link.
* **Refactoring Need**: Create a single dynamic route: `/admin/dashboard/[stageCode]/page.tsx`.
* **Flow**:
  - The sidebar reads `config.stages`. It only renders links for stages that have `enabled: true`.
  - The page `/admin/dashboard/[stageCode]` dynamically queries the columns and titles based on the configuration of that specific `stageCode`.

### 2. Dynamic Form Engine
* **Current Issue**: Input boxes are hardcoded with fields like `tareWeight` and `pressureTestPassed`.
* **Refactoring Need**: Replace the hardcoded forms in the check-in modals with a loop over `config.stages[stageCode].fields`. The frontend will render text, number, select, or checkbox inputs dynamically, storing the results in the `stageData` JSON column.

### 3. Generic Scheduler (Replacing AMC)
* **Current Issue**: The database columns are hardcoded to `amcYears` and `amcDate`.
* **Refactoring Need**: Generalize this in the database schema or metadata config. Rename `amcDate` to `nextServiceDate`. Define the service recurrence rule in the configuration (e.g., HVAC monthly checkup vs. Fire Safety annual refilling).

### 4. Dynamic CSV Header Mapper
* **Current Issue**: The CSV parser maps headers based on static array aliases in the file `ems-config.ts`.
* **Refactoring Need**: The CSV import route (`api/jobs/bulk-import`) must read `config.importMappings` dynamically from `getDbConfig(tenantId)`. This allows different domains to import CSVs matching their industry-specific headers.

---

## 📋 The Development Roadmap

```
Phase 1: Config Refactor  ➔  Phase 2: UI Dynamic Routing  ➔  Phase 3: Form Rendering Engine
-----------------------      --------------------------      ----------------------------
Allow getDbConfig to         Merge dashboard pages into      Convert technician check-in
fully load stages & labels   /admin/dashboard/[stageCode].   forms to loop over stages
from the database.           Render sidebar dynamically.     fields dynamically.
```
