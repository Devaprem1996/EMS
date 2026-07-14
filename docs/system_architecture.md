# FireGuard EMS: System Architecture & Developer Playbook

This document details the enterprise-grade system architecture, database design patterns, configuration strategy, and development runbook for the **FireGuard Enquiry Management System (EMS) Tool**. This blueprint is structured to support multi-client white-label scaling, allowing developers to provision and deploy customized instances rapidly.

---

## 1. Architectural Vision & Principles

The FireGuard EMS is designed not as a single-use web app, but as a **highly configurable white-label software tool**. The design centers around three primary architectural pillars:

### A. Core Engine vs. Configuration Isolation
- **The Core Engine** is completely agnostic of client branding, specific terminology (e.g., whether a client calls a Cylinder a "Unit", "Tank", or "Bottle"), and custom field definitions. It handles the core relational logic, state machine routing, security, user sessions, and database migrations.
- **The Client Configuration** (`src/config/ems-config.ts`) acts as the compiler directive for the engine. It dynamically injects theme variables, translates UI labels, adds custom validators, maps legacy data headers, and toggles optional features.

### B. Hybrid Relational + Document (JSON) Database Model
To support client-specific dynamic fields without altering the database schema for each new deployment, the system uses a hybrid storage model:
- **Relational Tables**: Core entities (Users, Customers, Jobs, Assignments, History logs) use structured tables for referential integrity, indexing, and high-performance joins.
- **Document Column (`Job.stageData`)**: A serialized JSON text column storing unstructured, client-specific key-value pairs (e.g. pressure test results, valve replacements). This avoids expensive schema migrations when adding or changing fields.

### C. Unified Full-Stack Environment
By choosing **Next.js App Router**, the application runs as a self-contained unit containing:
- Backend API routes with direct serverless database connectivity via Prisma.
- Client-side React components rendering UI views dynamically from the configuration.
- Shared TypeScript types enforcing type-safety from database to view.

```mermaid
graph TD
    subgraph Client Layer
        Browser[Web Browser / Mobile Client] -->|HTTP Requests| NextApp[Next.js App Server]
    end

    subgraph Application Server
        Config[ems-config.ts] -->|Hydrates| NextApp
        NextApp -->|API Endpoints / Pages| AppRouter[App Router - src/app]
        AppRouter -->|DB Operations| PrismaClient[Prisma Client / LibSQL Adapter]
    end

    subgraph Database Layer
        PrismaClient -->|Local File Connection| SQLite[(SQLite/LibSQL - dev.db)]
        PrismaClient -.->|Optional TCP Connection| Postgres[(PostgreSQL/MySQL Production)]
    end
```

---

## 2. Database Schema Design (Prisma 7)

The database schema utilizes Prisma ORM with the LibSQL driver adapter. SQLite is utilized locally, but the schema translates directly to PostgreSQL or MySQL. Every table incorporates a `deletedAt` field to support soft-deletes natively.

```mermaid
erDiagram
    EMPLOYEE {
        String id PK
        String mobileNumber UK
        String passwordHash
        String role
        String fullName
        String contactPhone
        String employeeNumber UK
        String email
        Boolean isActive
        DateTime createdAt
        DateTime updatedAt
        DateTime deletedAt
    }
    CUSTOMER {
        String id PK
        String companyName
        String contactName
        String primaryPhone
        String secondaryPhone
        String email
        String address
        DateTime createdAt
        DateTime updatedAt
        DateTime deletedAt
    }
    TICKET {
        String id PK
        String ticketNumber UK
        String customerId FK
        String currentStage
        String currentStatus
        String itemDescription
        String serialNumber
        String capacity
        String extinguisherType
        String stageData
        DateTime createdAt
        DateTime updatedAt
        DateTime deletedAt
    }
    TICKET_ASSIGNMENT {
        String id PK
        String ticketId FK
        String employeeId FK
        DateTime assignedAt
        DateTime completedAt
        String status
        String notes
        DateTime deletedAt
    }
    TICKET_HISTORY {
        String id PK
        String ticketId FK
        String changedById FK
        String fromStage
        String toStage
        String fromStatus
        String toStatus
        String remarks
        DateTime createdAt
        DateTime deletedAt
    }

    EMPLOYEE ||--o{ TICKET_ASSIGNMENT : "allocated"
    EMPLOYEE ||--o{ TICKET_HISTORY : "initiates"
    CUSTOMER ||--o{ TICKET : "creates"
    TICKET ||--o{ TICKET_ASSIGNMENT : "has"
    TICKET ||--o{ TICKET_HISTORY : "tracks"
```

### Table Specifications

#### 1. `Employee`
Manages system access accounts and profiles. Role-Based Access Control (RBAC) relies on the `role` column.
- `id` (UUID, Primary Key)
- `mobileNumber` (VARCHAR, Unique, serves as login credentials)
- `passwordHash` (VARCHAR, hashed via `bcryptjs` with salt rounds = 10)
- `role` (VARCHAR, constrained to `"ADMIN"` or `"TECHNICIAN"`)
- `fullName` & `contactPhone` (VARCHAR, optional contact info)
- `employeeNumber` & `email` (VARCHAR, optional employee info)
- `isActive` (BOOLEAN, default `true` - facilitates instant account suspension)
- `deletedAt` (DateTime, nullable for soft deletes)

#### 2. `Customer`
Stores primary client metadata.
- `id` (UUID, Primary Key)
- `companyName` (VARCHAR, nullable for direct individual consumers)
- `contactName`, `primaryPhone` (VARCHAR, required)
- `secondaryPhone`, `email`, `address` (VARCHAR/TEXT, optional)
- `deletedAt` (DateTime, nullable for soft deletes)

#### 3. `Ticket`
The central transaction table tracking enquiries through lifecycle stages.
- `id` (UUID, Primary Key)
- `ticketNumber` (VARCHAR, Unique, formatted dynamically)
- `customerId` (UUID, Foreign Key referencing `Customer`)
- `currentStage` (VARCHAR, constrained to `"ENQUIRY"`, `"REFILLING"`, `"SERVICES"`, `"COMPLETED"`)
- `currentStatus` (VARCHAR, constrained to `"PENDING"`, `"ASSIGNED"`, `"IN_PROGRESS"`, `"COMPLETED"`)
- **Core Cylinder Specs**: `serialNumber` (unique cylinders), `extinguisherType`, `capacity`, `itemDescription`.
- `stageData` (TEXT, serialized JSON object containing client-specific values).
- `deletedAt` (DateTime, nullable for soft deletes)

#### 4. `TicketAssignment`
Mapping table resolving many-to-many relationship between `Tickets` and `Employees` (technicians).
- `id` (UUID, Primary Key)
- `ticketId` (UUID, Foreign Key referencing `Ticket`, cascade deletes enabled)
- `employeeId` (UUID, Foreign Key referencing `Employee`)
- `assignedAt` (DateTime, default `now()`)
- `completedAt` (DateTime, updated by Technician upon completion)
- `status` (VARCHAR, constrained to `"ASSIGNED"` or `"COMPLETED"`)
- `notes` (TEXT, technician completion reports)
- `deletedAt` (DateTime, nullable for soft deletes)
- *Unique Constraint*: `[ticketId, employeeId]` ensures an employee is assigned to a ticket only once.

#### 5. `TicketHistory`
Audit logs capturing all state transitions.
- `id` (UUID, Primary Key)
- `ticketId` (UUID, Foreign Key referencing `Ticket`, cascade deletes enabled)
- `changedById` (UUID, Foreign Key referencing `Employee` who made the change)
- `fromStage` / `toStage` (VARCHAR, tracks stage progression)
- `fromStatus` / `toStatus` (VARCHAR, tracks status changes)
- `remarks` (TEXT, manual notes for transition reason)
- `createdAt` (DateTime, default `now()`)
- `deletedAt` (DateTime, nullable for soft deletes)

---

## 3. Configuration System Specification (`ems-config.ts`)

The configuration file is located at `src/config/ems-config.ts`. It leverages strong typing (`EmsConfig` interface) to prevent developer configuration errors during client setup.

```typescript
export interface DynamicField {
  key: string;
  label: string;
  type: "text" | "number" | "boolean" | "date" | "select" | "multi-select";
  options?: string[];
  required?: boolean;
}

export interface StageConfig {
  enabled: boolean;
  displayName: string;
  fields: DynamicField[];
}

export interface EmsConfig {
  brand: {
    title: string;
    subtitle: string;
    logoUrl?: string;
    theme: {
      primaryColor: string;
      accentColor: string;
      darkTheme: boolean;
    };
  };
  stages: {
    ENQUIRY: StageConfig;
    REFILLING: StageConfig;
    SERVICES: StageConfig;
  };
  importMappings: {
    jobNumber: string[];
    customerName: string[];
    phone: string[];
    email: string[];
    address: string[];
    serialNumber: string[];
    capacity: string[];
    extinguisherType: string[];
    itemDescription: string[];
  };
}
```

---

## 4. Security & Role-Based Access Control (RBAC)

The system enforces strict boundaries between **Admins** and **Technicians**:

1. **Admin Boundaries**:
   - Access to all dashboards (Enquiry, Refilling, Services, Technician overview).
   - Creation of jobs, editing details, performing imports, assigning technicians, and performing bulk operations.
2. **Technician Boundaries**:
   - Access restricted strictly to `/technician/tasks` (technician view).
   - Can only view jobs that have an active assignment record in `JobAssignment` linking to their `userId`.
   - Cannot create jobs, perform bulk actions, or view customer master directories.
   - Allowed to update status (`IN_PROGRESS` or `COMPLETED`) and enter notes.

### Token & Session Strategy
- Login credentials verification sets a secure, HTTP-only cookie called `ems_session`.
- The cookie payload contains the user's ID, name, and role, base64-encoded.
- **Middleware / API Protection**: Every dashboard page and API endpoint decodes the cookie and validates the role before processing requests.

---

## 5. Scalability & Bulk Execution Design

### A. Bulk Import Pipeline (CSV / Excel)
To scale to clients with thousands of cylinders:
1. **Header Parsing**: Uploaded file headers are converted to lowercase. The engine checks `EMS_CONFIG.importMappings` to resolve column names (e.g. if header is "Extinguisher ID", it resolves to `jobNumber`).
2. **Batched Transaction Insert**: To prevent connection timeouts and database locking (especially on SQLite):
   - Parsed rows are split into batches of 500.
   - For each batch, the engine creates `Customer` entries (if new) and inserts `Job` entries within a database `$transaction`.
3. **Validation Report**: The import API returns details of successfully imported records along with a list of skipped rows and corresponding validation errors.

### B. Bulk Assignment & Transition Engine
- The UI uses checklist components to aggregate Job IDs.
- Admin triggers `/api/jobs/bulk-assign` or `/api/jobs/bulk-transition`.
- The backend executes a Prisma `$transaction` to insert multiple `JobAssignment` rows and update all targeted `Job` rows simultaneously, maintaining database consistency.

---

## 6. Development Runbook

### Prerequisites
- Node.js (v18.x or later)
- NPM (v9.x or later)

### Step 1: Clone and Install
```bash
# Clone the repository
cd EMS

# Install required modules
npm install
```

### Step 2: Configure Environment
Create a `.env` file in the root directory:
```env
DATABASE_URL="file:./dev.db"
NODE_ENV="development"
```

### Step 3: Database Setup & Seeding
```bash
# Run migrations to build SQLite database tables
npx prisma migrate dev --name init

# Seed default users and clients
npx prisma db seed
```

### Step 4: Run Development Server
```bash
# Start Next.js development server
npm run dev
```
Open `http://localhost:3000` to access the application.

---

## 7. Production Deployment & Database Porting

When selling this tool to a client requiring a production-grade database (e.g. PostgreSQL or MySQL):

### Step 1: Change Schema Provider
Open `prisma/schema.prisma` and edit the `datasource` block:
```prisma
datasource db {
  provider = "postgresql" // Or "mysql"
}
```

### Step 2: Update Connection Variables
In the production environment variables, supply the matching connection URL:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/ems_db?schema=public"
```

### Step 3: Instantiate Adapter in Code
For PostgreSQL/MySQL, you can drop the driver adapter instantiation in `src/lib/db.ts` and use standard Prisma connectivity:
```typescript
// src/lib/db.ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
```
*(No need for `@prisma/adapter-libsql` or `@libsql/client` when running on full relational engines like PostgreSQL or MySQL that do not require cloud/edge serverless compilation adapters).*

---

## 8. Quality Assurance & Testing Suite

To support production-level reliability and validation, the following tools are configured in [package.json](file:///c:/Users/Guvi/Desktop/PW/EMS/package.json):

### A. Input Schema Validation (`zod`)
* **Zod** is used for strict runtime validation of requests on backend API endpoints (e.g. bulk transitions, user additions) and client-side form submissions.
* Ensures validation constraints (e.g., matching length, formats, email formats, and number bounds) are enforced cleanly before query execution.

### B. Unit & Database Testing (`vitest` + `@testing-library/react`)
* **Vitest** serves as the test runner for fast, native unit testing of utilities, hooks, API routes, and DB helper scripts.
* Database testing relies on running test suites against an isolated SQLite memory database or setting a specific `DATABASE_URL` environment variable for testing.
* `@testing-library/react` and `jsdom` are integrated to support component-level rendering and event testing.

### C. End-to-End & UI Testing (`@playwright/test`)
* **Playwright** is configured for comprehensive E2E testing. It spins up browser instances to simulate client usage flows (login, register enquiry, assignment, technician logging, transition, soft delete validations).
* Target folder and test specs reside in tests directories or files ending in `.spec.ts` or `.test.ts`.

### Running Tests
```bash
# Run unit and API tests
npm run test

# Run Vitest in interactive watch mode
npm run test:watch

# Run UI/E2E tests using Playwright
npm run test:e2e
```
