# Enquiry Dashboard Rules & Specifications

This document outlines the database schema, business rules, API endpoints, configuration overrides, and testing verification plan for the **Enquiry Dashboard** stage of the Fire Extinguisher Refilling & Services tool.

---

## 1. Business & Workflow Rules

- **First Stage of Lifecycle**: Every new job starts at the `ENQUIRY` stage, with a default status of `PENDING`.
- **Unique Job Identifier**: Every entry must be assigned a unique Job Number formatted according to `EMS_CONFIG` (e.g., `FE-2026-0001`).
- **Flexible Customer Model**: An enquiry can link to an existing customer in the database or create a new customer record during creation/upload.
- **Multi-Technician Assignment**: Admin can assign one or more technicians to a single enquiry. When assigned, the job's status automatically transitions from `PENDING` to `ASSIGNED`.
- **Manual Operations**:
  - **Add Row**: Admins can manually create a single enquiry via a modal form.
  - **Edit Row**: Admins can edit any field (customer info, extinguisher specs, assigned techs, status, and dynamic fields) for an enquiry.
- **Bulk Upload Operations**:
  - Accepts CSV/Excel files containing legacy/new enquiries.
  - Headers are parsed dynamically using mapped aliases in `src/config/ems-config.ts`.
  - Missing records are created, and duplicates (matched by Cylinder Serial Number + Client name combination) are either updated or flagged.
- **Transition Logic**:
  - Admins can transition one or more enquiries to the `REFILLING` stage.
  - Toggling stages will archive the `ENQUIRY` stage data in the history log.

---

## 2. Database Columns & Structures (Enquiry Stage)

All items at this stage are stored in the `Job` table with `currentStage: "ENQUIRY"`. Below is the mapping of data fields:

### Structured Fields (Prisma `Job` & Related Tables)

| Column Name | Database Type | Description | Required |
| :--- | :--- | :--- | :--- |
| `id` | `String (UUID)` | Primary Key | Yes |
| `jobNumber` | `String` | Unique, brandable task number | Yes |
| `customerId` | `String (UUID)` | Foreign Key referencing `Customer` | Yes |
| `currentStage` | `String` | Workflow stage (Set to `"ENQUIRY"`) | Yes |
| `currentStatus` | `String` | Task status (`"PENDING"`, `"ASSIGNED"`, `"IN_PROGRESS"`) | Yes |
| `serialNumber` | `String` | Cylinder unique serial/tag number | Yes |
| `extinguisherType`| `String` | Extinguisher medium (e.g., CO2, DCP, Foam) | Yes |
| `capacity` | `String` | Cylinder weight capacity (e.g., 2kg, 4.5kg, 9kg) | Yes |
| `itemDescription` | `String` | Cylinder brand, make, or general notes | No |
| `createdAt` | `DateTime` | Timestamp of creation | Yes |
| `updatedAt` | `DateTime` | Timestamp of last modification | Yes |

### Customer Relationship Fields (`Customer` Table)

| Column Name | Database Type | Description | Required |
| :--- | :--- | :--- | :--- |
| `companyName` | `String` | Corporate/client name | Yes |
| `contactPerson`| `String` | Primary point of contact name | Yes |
| `phone` | `String` | Contact phone number | Yes |
| `email` | `String` | Contact email address | No |
| `address` | `String` | Delivery/site address | Yes |

### Dynamic / Client-Specific Fields (`Job.stageData` JSON)

Stored inside a serialized JSON string in the `stageData` column of the `Job` model, parsed on-the-fly according to `EMS_CONFIG.stages.ENQUIRY.fields`:

```json
{
  "source": "Phone Call", // "Walk-in" | "Phone Call" | "Email" | "Agent"
  "urgency": "High"       // "Low" | "Medium" | "High" | "Critical"
}
```

---

## 3. Planned API Endpoints

We will implement the following REST endpoints to serve the Enquiry Dashboard:

1. **`GET /api/jobs?stage=ENQUIRY`**
   - Retrieves all jobs currently in the Enquiry stage.
   - Supports search (by client, job number, or serial number) and filter (by status, extinguisher type).
2. **`POST /api/jobs`**
   - Manual creation of a single row.
   - Expects customer details, cylinder details, dynamic fields, and optional technician assignments.
3. **`PUT /api/jobs/[id]`**
   - Edit detail of a single enquiry.
   - Supports editing status, assignments, dynamic fields, and cylinder specs.
4. **`POST /api/jobs/bulk-import`**
   - Parses array of rows (from CSV/Excel upload).
   - Resolves columns, maps headers, and performs bulk transactions.
5. **`POST /api/jobs/bulk-assign`**
   - Assigns a list of job IDs to a set of technician IDs.
6. **`POST /api/jobs/bulk-transition`**
   - Promotes a list of job IDs to the `REFILLING` stage.

---

## 4. Verification & Testing Strategy

To ensure zero UI bugs and perfect backend stability, we will perform the following verifications:

- **Database Unit Tests**:
  - Test seeding and creating jobs with invalid data (e.g. duplicate serial numbers or missing customer name) to verify constraints.
- **Import Mapping Tests**:
  - Parse mock CSV files with different header names (e.g. one with "Client Name" and one with "Company") to verify that `importMappings` works seamlessly.
- **Role Boundary Tests**:
  - Verify that a Technician session cannot fetch the Admin enquiry list `/api/jobs?stage=ENQUIRY` (returns 403 Forbidden).
- **Manual & Bulk Assignment Logs**:
  - Verify that assignments create records in `JobAssignment` and audits in `JobHistory`.
