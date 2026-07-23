# Architectural Blueprint & Developer Playbook: Multi-Domain Whitelabel FSM

This document serves as the master blueprint for building a **Whitelabel Field Service Management (FSM) & Workflow Engine**. It details how to design the codebase using **SOLID principles**, secure the platform, handle errors, and leverage **AI prompts** to customize and maintain instances for different clients.

---

## 🏛️ 1. SOLID Design Architecture

To ensure the codebase is easily customizable and maintainable by developers, we structure the core logic around SOLID principles:

```
┌────────────────────────────────────────────────────────┐
│              Domain Config Interface                   │
│                    (IConfig)                           │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│            Config Loader Factory Class                 │
│               (ConfigLoaderFactory)                    │
└────────┬───────────────────────────────┬───────────────┘
         │ (Loads Local Config)          │ (Loads DB Config)
         ▼                               ▼
┌──────────────────┐           ┌──────────────────┐
│ FileConfigLoader │           │ DbConfigLoader   │
└──────────────────┘           └──────────────────┘
```

### A. Single Responsibility Principle (SRP)
Each module must have exactly one reason to change:
- **`ConfigLoader`**: Exclusively handles loading and validation of JSON configurations. It does not handle database query operations or UI logic.
- **`WorkflowEngine`**: Exclusively processes state transitions (e.g., verifying if stage `A` can transition to stage `B`).
- **`DynamicFieldParser`**: Exclusively parses the custom JSON payloads (`stageData`) to match fields.

### B. Open/Closed Principle (OCP)
The system is open for extension but closed for modification.
- We do not write new routes or DB tables for a new client. Instead, we extend the system by loading a new **Domain Configuration JSON**.
- The core router and forms engine automatically adapt to the loaded JSON without code modifications.

### C. Liskov Substitution Principle (LSP)
We define an interface `IConfigLoader` for our config loaders.
- Both the `DbConfigLoader` (for SaaS database deployment) and `FileConfigLoader` (for single-tenant local file deployment) implement `IConfigLoader` and can be swapped interchangeably without breaking the system.

### D. Interface Segregation Principle (ISP)
Instead of a single, giant configuration interface, configurations are split into distinct, specialized interfaces:
```typescript
interface IBrandConfig { title: string; subtitle: string; logoUrl?: string; }
interface IWorkflowConfig { stages: Record<string, IStageConfig>; }
interface IImportConfig { importMappings: Record<string, string[]>; }
```

### E. Dependency Inversion Principle (DIP)
High-level operational code (like our ticket updates) does not depend directly on database client singletons. Instead, they depend on an abstract database adapter. This allows swapping databases (e.g. SQLite to PostgreSQL) easily depending on what database server the client hosts.

---

## 📋 2. Dynamic Field & Workflow Engine Design

For any domain, we require a schema-less structure. We achieve this by combining a configuration schema with JSON columns.

### A. Schema-less Storage (Prisma SQLite/Postgres)
The `Ticket` table uses a string/text column called `stageData` to hold serialized custom JSON.

### B. UI Form Interpreter
The frontend acts as an interpreter that reads configuration field types and displays corresponding HTML elements:
```typescript
// interpretation logic
function renderField(field: DynamicField, value: any, onChange: (val: any) => void) {
  switch (field.type) {
    case "text":
      return <input type="text" value={value || ""} onChange={e => onChange(e.target.value)} required={field.required} />;
    case "boolean":
      return <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} />;
    case "select":
      return (
        <select value={value || ""} onChange={e => onChange(e.target.value)} required={field.required}>
          <option value="">Select...</option>
          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    default:
      return null;
  }
}
```

---

## 🛡️ 3. Security Boundaries & Transaction-Safe Error Handling

### A. Transaction Isolation & Rollbacks
If a task completion involves multiple steps (creating task assignment log ➔ updating ticket stage ➔ scheduling next service), always wrap the operations in a database transaction block:
```typescript
const result = await prisma.$transaction(async (tx) => {
  const updatedTask = await tx.ticketAssignment.update({ ... });
  const updatedTicket = await tx.ticket.update({ ... });
  return { updatedTask, updatedTicket };
});
// If any database operation fails, the transaction is completely rolled back, preventing orphaned data.
```

### B. Global Tenant Data Isolation
If hosting multiple clients on a single server, prevent data cross-talk by forcing queries to supply the `tenantId` checked against the signed session token:
```typescript
// Prevent query if tenantId is missing or hijacked
const session = getAuthSession(req);
if (!session.tenantId) throw new Error("Unauthorized access to workspace data");

const tickets = await prisma.ticket.findMany({
  where: {
    tenantId: session.tenantId,
    id: ticketId
  }
});
```

---

## 🤖 4. AI-Assistant Developer Prompts

You can use the following pre-structured prompts with an AI assistant (like Gemini or Claude) to quickly generate new domain configurations or customize components.

### Prompt 1: Generate a New Domain Configuration JSON
Copy and paste this prompt when you need to configure the app for a new client:
> **Prompt**: "Act as a software architect. I need a domain configuration JSON for a [INSERT BUSINESS TYPE, e.g. Elevator Maintenance] company. Provide a JSON object conforming to the `EmsConfig` structure. 
> 1. Set custom terminology labels for: `serialNumber` (e.g. Lift ID), `capacity` (e.g. Load capacity), `extinguisherType` (e.g. Lift Type).
> 2. Define 3 custom stages with sequence orders (e.g., BOOKING, MAINTENANCE, TESTING).
> 3. Add custom dynamic form fields for the checking steps during the inspection stage (e.g., Cable tension checked: boolean, Brake performance rating: number)."

### Prompt 2: Refactor a Component for Dynamic Column Mappings
Use this prompt to adapt any static table to dynamic config-driven columns:
> **Prompt**: "Act as a React/Next.js developer. I have a static table component that displays columns: [INSERT COLUMNS, e.g. Ticket Number, Cylinder Serial]. Refactor this component to render columns dynamically by reading the layout configuration array `config.dashboards[currentStage].columns` and fetching mapped labels from `config.brand.labels`."

---

## 🚀 5. Deployment & Configuration Handover Guide

When selling a dedicated instance to a client (hosted on their infrastructure):

1. **Host Environment Variables (`.env`)**:
   - `DATABASE_URL`: Path to their private SQLite file, or postgres database URL.
   - `SESSION_SECRET`: Unique cryptographic string used for signing cookies.
2. **Build and Start Commands**:
   - Compile the optimized production build:
     ```bash
     npm install
     npx prisma db push
     npm run build
     npm run start
     ```
3. **Domain Configuration Seeding**:
   - Save their customized domain config inside their private DB. They can now access their FSM tool with their customized fields, branding, and workflows.
