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

The database schema utilizes Prisma ORM with the LibSQL driver adapter. SQLite is utilized locally, but the schema translates directly to PostgreSQL or MySQL.

```mermaid
erDiagram
    USER {
        String id PK
        String username UK
        String passwordHash
        String role
        String fullName
        String phone
        Boolean isActive
        DateTime createdAt
        DateTime updatedAt
    }
    CUSTOMER {
        String id PK
        String companyName
        String contactPerson
        String phone
        String email
        String address
        DateTime createdAt
        DateTime updatedAt
    }
    JOB {
        String id PK
        String jobNumber UK
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
    }
    JOB_ASSIGNMENT {
        String id PK
        String jobId FK
        String technicianId FK
        DateTime assignedAt
        DateTime completedAt
        String status
        String notes
    }
    JOB_HISTORY {
        String id PK
        String jobId FK
        String changedById FK
        String fromStage
        String toStage
        String fromStatus
        String toStatus
        String remarks
        DateTime createdAt
    }

    USER ||--o{ JOB_ASSIGNMENT : "receives"
    USER ||--o{ JOB_HISTORY : "performs"
    CUSTOMER ||--o{ JOB : "places"
    JOB ||--o{ JOB_ASSIGNMENT : "has"
    JOB ||--o{ JOB_HISTORY : "tracks"
```

### Table Specifications

#### 1. `User`
Manages system access accounts. Role-Based Access Control (RBAC) relies on the `role` column.
- `id` (UUID, Primary Key)
- `username` (VARCHAR, Unique, serves as login credentials)
- `passwordHash` (VARCHAR, hashed via `bcryptjs` with salt rounds = 10)
- `role` (VARCHAR, constrained to `"ADMIN"` or `"TECHNICIAN"`)
- `fullName` & `phone` (VARCHAR, optional contact info)
- `isActive` (BOOLEAN, default `true` - facilitates instant account suspension)

#### 2. `Customer`
Stores primary client metadata.
- `id` (UUID, Primary Key)
- `companyName` (VARCHAR, nullable for direct individual consumers)
- `contactPerson`, `phone` (VARCHAR, required)
- `email`, `address` (VARCHAR/TEXT, optional)

#### 3. `Job`
The central transaction table tracking cylinders through lifecycle stages.
- `id` (UUID, Primary Key)
- `jobNumber` (VARCHAR, Unique, formatted dynamically)
- `customerId` (UUID, Foreign Key referencing `Customer`)
- `currentStage` (VARCHAR, constrained to `"ENQUIRY"`, `"REFILLING"`, `"SERVICES"`, `"COMPLETED"`)
- `currentStatus` (VARCHAR, constrained to `"PENDING"`, `"ASSIGNED"`, `"IN_PROGRESS"`, `"COMPLETED"`)
- **Core Cylinder Specs**: `serialNumber` (unique barcoded ID), `extinguisherType` (DCP, CO2, etc.), `capacity` (size/weight), `itemDescription` (brand/color/details).
- `stageData` (TEXT, serialized JSON object containing client-specific values).

#### 4. `JobAssignment`
Mapping table resolving many-to-many relationship between `Jobs` and `Users` (technicians).
- `id` (UUID, Primary Key)
- `jobId` (UUID, Foreign Key referencing `Job`, cascade deletes enabled)
- `technicianId` (UUID, Foreign Key referencing `User`)
- `assignedAt` (DateTime, default `now()`)
- `completedAt` (DateTime, updated by Technician upon completion)
- `status` (VARCHAR, constrained to `"ASSIGNED"` or `"COMPLETED"`)
- `notes` (TEXT, technician completion reports)
- *Unique Constraint*: `[jobId, technicianId]` ensures a technician is assigned to a job only once.

#### 5. `JobHistory`
Audit logs capturing all state transitions.
- `id` (UUID, Primary Key)
- `jobId` (UUID, Foreign Key referencing `Job`, cascade deletes enabled)
- `changedById` (UUID, Foreign Key referencing `User` who made the change)
- `fromStage` / `toStage` (VARCHAR, tracks stage progression)
- `fromStatus` / `toStatus` (VARCHAR, tracks status changes)
- `remarks` (TEXT, manual notes for transition reason)
- `createdAt` (DateTime, default `now()`)

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
