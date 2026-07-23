# UI Walkthrough: Step-by-Step Multi-Domain Experience

To help you visualize how this setup works in practice, here is a step-by-step walkthrough of what **Developers**, **Client Admins**, and **Technicians** see on their screens.

---

## 💻 Step 1: The Developer Panel (What you see)
Developers configure client domains from a hidden platform portal (e.g., `master.ems-saas.com` or `/admin/developer`).

### 1. Tenant Overview Table
You see a list of all your clients (tenants):
```
+------------------------------------+------------------+---------------------+
| Company (Tenant)                   | Domain Type      | Action              |
+------------------------------------+------------------+---------------------+
| Safeway Fire protection            | Fire Safety      | [Configure Domain]  |
| Arctic Cold Solutions              | HVAC Maintenance | [Configure Domain]  |
| Nexa IT Services                   | IT Helpdesk      | [Configure Domain]  |
+------------------------------------+------------------+---------------------+
```

### 2. Domain Editor Interface
When you click **[Configure Domain]** for **Arctic Cold Solutions**, you configure their terminology and checklist forms:

* **Terminology Map Form**:
  - `Database Field: serialNumber` ➔ Label: `AC Compressor Serial Number`
  - `Database Field: capacity`     ➔ Label: `AC Tonnage (HP)`
  - `Database Field: deliveredDate`➔ Label: `Installation Date`
* **Custom Checklists (Dynamic fields for dispatches)**:
  - Add Field ➔ Label: `Coolant pressure (PSI)`, Type: `Number`
  - Add Field ➔ Label: `Compressor Replaced?`, Type: `Boolean`

*Clicking "Save Configuration" writes this JSON to the database for this specific client.*

---

## 🏢 Step 2: The Client Admin Dashboard (What your client sees)
When the manager of **Arctic Cold Solutions** logs in (e.g., `arctic.ems-saas.com/admin/enquiry`), the interface renders their specific labels.

### 1. Job/Enquiry Grid Table
The table headers translate dynamically:
```
+-------+--------------+--------------------------+------------------+-------------------+
| S.NO  | JOB NUMBER   | AC COMPRESSOR SERIAL NO  | AC TONNAGE (HP)  | INSTALLATION DATE |
+-------+--------------+--------------------------+------------------+-------------------+
| 1     | EQ-9021      | COMP-88122               | 1.5 Ton          | 23/07/2026        |
+-------+--------------+--------------------------+------------------+-------------------+
```
*Note: They see "AC Compressor Serial No" instead of "Cylinder Tag"!*

### 2. Client Settings Panel
When they open the Settings page, they only see options to change their **Company Logo**, **Theme Color**, and **Business Name**. The core workflow configurations (stages, technical forms) are locked out and hidden.

---

## 📱 Step 3: The Technician Dispatch Screen (What the worker sees)
When a field technician logs in to perform a task (e.g., a service dispatch), the mobile layout loads the dynamic form configured by the developer in Step 1.

### 1. Task Check-In Screen
The technician clicks **"Start Work"**. Under the service checklist section, the UI renders inputs on the fly:

```
[Service Check-in Form]

AC Compressor Serial: COMP-88122
AC Tonnage (HP): 1.5 Ton

[ ] Compressor Replaced? (Checkbox)
Coolant pressure (PSI): [ 65  ]

[ SUBMIT TASK ]
```

When they click **Submit**, the form inputs are saved inside the `stageData` column as a JSON payload:
```json
{
  "compressorReplaced": true,
  "coolantPressure": 65
}
```

---

## 🔄 Dynamic Flow Summary

```
   1. Developer Sets Config    ➔  2. Client Admin Views Grid  ➔  3. Technician Fills Form
  --------------------------      --------------------------      --------------------------
  Sets "serialNumber" label       Reads label config, renders     Fills form; UI saves variables
  as "AC Compressor Serial".      header: "Compressor Serial".    as JSON to "stageData" column.
```
