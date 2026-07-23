# Employee Master Rules & Specifications

This document outlines the business rules, database schema updates, centralized configuration support, API endpoints, and verification plan for the **Employee Master** module of the EMS Tool.

---

## 1. Business & Workflow Rules

- **Admin Only Access**: The Employee Master screen and its corresponding APIs are strictly restricted to users with the `"ADMIN"` role. Technicians trying to load this view or call its APIs will receive a `403 Forbidden` response.
- **Unique Fields**:
  - **Contact No (Phone)**: Used as the unique login username (`username` field in the database).
  - **Employee Number**: Must be unique (e.g., E001, E002). Can be manually supplied or auto-generated based on config.
- **Roles**:
  - Constrained to `"ADMIN"` (can manage employees, assign tasks, view all dashboards) and `"TECHNICIAN"` (can only view assigned tasks and update status).
- **Status (Active/Inactive)**:
  - Setting an employee status to Inactive immediately invalidates their session and blocks future logins.
  - Active status allows standard system login.
- **Password Updates**:
  - When editing an employee, password update is optional. If left blank, the existing password hash is preserved. If provided, it is freshly hashed via `bcryptjs` (salt rounds = 10).

---

## 2. Database Columns & Structures (Employee Master)

To support all fields shown in the screenshot, we must add `employeeNumber` and `email` fields to the `User` model.

### Table: `User` (Updated Schema)

| Column Name | Database Type | Description | Constraints / Requirements |
| :--- | :--- | :--- | :--- |
| `id` | `String (UUID)` | Primary Key | Required |
| `username` | `String` | Mobile number used for login | Required, Unique |
| `passwordHash` | `String` | Hashed password | Required |
| `role` | `String` | Authorization role | Required (`"ADMIN"` or `"TECHNICIAN"`) |
| `fullName` | `String` | Full name of the employee | Required |
| `phone` | `String` | Primary contact number | Required (Synchronized with `username`) |
| `employeeNumber`| `String` | Custom employee badge identifier | Required, Unique (e.g., `"E001"`) |
| `email` | `String` | Corporate/personal email ID | Optional |
| `isActive` | `Boolean` | Account activation status | Default: `true` |
| `createdAt` | `DateTime` | Creation timestamp | Required |
| `updatedAt` | `DateTime` | Last update timestamp | Required |

---

## 3. Centralized Developer Configuration (`ems-config.ts` overrides)

We will expand our centralized configuration to support employee-specific requirements:

```typescript
export const EMS_CONFIG = {
  // ... other configs ...
  employeeMaster: {
    // Terminologies customization
    labels: {
      employeeName: "Employee Name",
      employeeNumber: "Employee ID",
      phone: "Contact Number",
      email: "Email ID",
    },
    // ID Auto-generation rule
    autoGenerateEmployeeNumber: false,
    employeeNumberPrefix: "E",
  }
};
```

---

## 4. Planned API Endpoints

We will implement the following REST endpoints to serve the Employee Master:

1. **`GET /api/employees`**
   - Retrieves all users in the database.
   - Parameters:
     - `status` (string, optional: `"active"`, `"inactive"`)
     - `search` (string, optional: filter by `fullName`, `phone`, or `employeeNumber`)
2. **`POST /api/employees`**
   - Creates a new employee.
   - Validates that `phone` (username) and `employeeNumber` are not already taken.
   - Hashes password before database write.
3. **`PUT /api/employees/[id]`**
   - Updates employee profile.
   - Validates that edited `phone` and `employeeNumber` are not in conflict with other users.
   - Conditionally hashes new password if provided.

---

## 5. Verification & Testing Strategy

To guarantee stability, we will perform the following testing steps before and after UI creation:

- **Database Constraint Verification**:
  - Attempt to insert two users with the same `employeeNumber` and check if database throws a unique constraint error.
  - Attempt to insert two users with the same `phone`/`username` and check if database throws a unique constraint error.
- **Role Restriction Tests**:
  - Send a `GET /api/employees` request using a Technician session and verify it returns a `403 Forbidden` response.
- **Session Termination on Deactivation**:
  - Deactivate a technician user, and verify that their subsequent requests are rejected.
