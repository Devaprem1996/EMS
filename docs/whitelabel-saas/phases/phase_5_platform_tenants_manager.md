# Architecture Solution Guide: Centralized SaaS Platform Tenant Manager (Phase 5)

This guide documents the technical design, data boundaries, and routing logic for the centralized **Platform Tenant Manager Console** built for the platform developer (`SUPER_ADMIN`).

---

## 1. Context Separation Architecture

The application operates in two distinct contexts determined by the logged-in user's role:

```mermaid
graph TD
    User([User Logs In]) --> AuthCheck{Check User Role}
    AuthCheck -- SUPER_ADMIN (Developer) --> PlatformContext[Platform Admin Console]
    AuthCheck -- ADMIN / TECHNICIAN (Client) --> TenantContext[Client Tenant Workspace]
    
    PlatformContext --> PlatformUI[List Tenants, Provision Clients, Global Settings]
    TenantContext --> TenantUI[Enquiries, Refilling, Tasks scoped by tenantId]
```

### Role Boundaries
* **Client Tenant Context (`ADMIN` / `TECHNICIAN`)**:
  - Bound strictly to a single `tenantId` in the database.
  - Queries are isolated using `{ where: { tenantId } }` clauses.
  - Access is restricted to client dashboards (`/admin/enquiry`, `/admin/refilling`, etc.).
* **Platform Console Context (`SUPER_ADMIN`)**:
  - Global developer account with `tenantId: null`.
  - Allowed to query across all tenants (e.g. counting total tickets, listing tenant records).
  - Swaps menus from client-centric lists to the platform-wide manager (`/admin/tenants`).

---

## 2. Dynamic Configuration Targeting
To allow a central administrator to edit settings for any client, the config endpoints (`/api/config`) and views are modified to accept a `tenantId` query parameter.

```
Request: GET /api/config?tenantId=4b75d825-b974-4668-910c-4d4e40faf5ae
```

### Authorization Rule
- If the session role is `"SUPER_ADMIN"`, the API will load/save config matching the requested `?tenantId=...`.
- If the session role is `"ADMIN"`, the API ignores the query parameter and strictly scopes settings modifications to the user's own `tenantId` from their cookie token.

---

## 3. Automated Provisioning Pipeline Flow

When the developer provisions a new tenant, the system executes a transactional pipeline to guarantee atomic deployment:

```mermaid
sequenceDiagram
    participant Dev as Platform Developer
    participant API as POST /api/tenants
    participant DB as SQLite Database
    participant FS as Local Filesystem

    Dev->>API: Submit Tenant Info (Name, Subdomain, Template, Admin Phone)
    API->>DB: Check if Subdomain or Admin Phone already exists
    Note over API,DB: Abort if not unique
    API->>FS: Load template config json (e.g., hvac-repair.json)
    API->>DB: 1. Create Tenant record
    API->>DB: 2. Create SystemConfig record (bound to Tenant ID & Template)
    API->>DB: 3. Create Employee record (Role: ADMIN, bound to Tenant ID)
    API->>Dev: Return 201 Created (Tenant live!)
```

---

## 4. UI Layout Routing Restructure

* **Menu Navigation filtering (`src/app/admin/layout.tsx`)**:
  - On mount, if the user role is `SUPER_ADMIN`, we bypass rendering client-level menus (Enquiries, Refilling, Services, Employees).
  - The menu array is rebuilt to show:
    - **Tenant Manager** (`/admin/tenants`)
    - **Platform Defaults** (`/admin/settings`)
    - **Technician Sandbox** (`/admin/sandbox/dashboard/ENQUIRY`)
* **Redirection Gates (`src/app/page.tsx`)**:
  - Directs `SUPER_ADMIN` to `/admin/tenants` automatically upon successful login.
