# SaaS Scalability Guide: Fields, Lifecycles, and Dashboard Customization

As you expand your application to multiple clients, different businesses will request **custom fields**, **unique ticket approval lifecycles**, and **different dashboard logic**. 

Here is the design plan to solve these three challenges dynamically without modifying the codebase for each client.

---

## 🛠️ Challenge 1: What if a client wants to add more fields?
**Solution: Dynamic JSON Schemas (EAV / Form Builder)**

Do not add new database columns for client-specific fields. Instead, define custom fields in the tenant's `SystemConfig` JSON record, and store the inputs in the `stageData` JSON column.

### 1. Define fields in `SystemConfig`:
```json
{
  "stages": {
    "REFILLING": {
      "fields": [
        { "key": "pressurePassed", "label": "Hydro Pressure OK?", "type": "boolean" },
        { "key": "gasQty", "label": "Gas Quantity (kg)", "type": "number" },
        { "key": "gasLeakChecked", "label": "Leakage Checked?", "type": "boolean" }
      ]
    }
  }
}
```

### 2. UI Renders Fields Dynamically:
The frontend checks the stage's config list and loops over the array, generating inputs on the fly:
```tsx
const fields = config.stages[currentStage].fields;
return (
  <form>
    {fields.map(f => (
      <div key={f.key}>
        <label>{f.label}</label>
        <input type={f.type === "number" ? "number" : "text"} />
      </div>
    ))}
  </form>
);
```

### 3. Store in the Database:
The submitted inputs are packaged into a single JSON object and saved in the ticket's `stageData` column:
```json
{
  "pressurePassed": true,
  "gasQty": 4.5,
  "gasLeakChecked": true
}
```
*This allows any client to add 5, 10, or 50 fields per stage without changing the database schema.*

---

## 🔄 Challenge 2: What if a client wants more/different ticket lifecycles?
**Solution: Configuration-Driven State Machine**

Instead of hardcoding stage sequences (Enquiry ➔ Refilling ➔ Services), store the **workflow transitions** in the config.

### 1. Transition Configuration Schema:
```json
{
  "stages": {
    "ENQUIRY": {
      "transitions": [
        { "label": "Approve Enquiry", "targetStage": "REFILLING", "requireRole": "ADMIN" },
        { "label": "Escalate to Manager", "targetStage": "MANAGER_APPROVAL", "requireRole": "ADMIN" }
      ]
    },
    "MANAGER_APPROVAL": {
      "transitions": [
        { "label": "Manager Reject", "targetStage": "ENQUIRY" },
        { "label": "Manager Approve", "targetStage": "REFILLING" }
      ]
    }
  }
}
```

### 2. Frontend Renders Transition Buttons Dynamically:
The dashboard checks the current ticket stage config and renders the transition actions as buttons:
```tsx
const currentConfig = config.stages[ticket.currentStage];
return (
  <div>
    {currentConfig.transitions.map(t => (
      <button key={t.label} onClick={() => handleTransition(t.targetStage)}>
        {t.label}
      </button>
    ))}
  </div>
);
```
*Adding an "approval stage" is as simple as adding a new stage key and target transition in the config database record.*

---

## 📊 Challenge 3: What if a client wants different logic on their dashboard?
**Solution: Dynamic Grid Columns & Feature Flags**

Dashboards should draw their column layout, metrics, and operation rules directly from the tenant config.

### 1. Dashboard Configuration Config:
```json
{
  "dashboards": {
    "ENQUIRY": {
      "columns": ["ticketNumber", "clientName", "enquirySource", "status"],
      "allowBulkTransitions": true,
      "requireTechnicianSignature": false
    },
    "REFILLING": {
      "columns": ["ticketNumber", "clientName", "serialNumber", "pressurePassed", "status"],
      "allowBulkTransitions": false,
      "requireTechnicianSignature": true
    }
  }
}
```

### 2. Dynamic Column Rendering in Table Grid:
```tsx
const activeColumns = config.dashboards[currentStage].columns;

return (
  <table>
    <thead>
      <tr>
        {activeColumns.map(col => (
          <th key={col}>{translateLabel(col)}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {tickets.map(t => (
        <tr key={t.id}>
          {activeColumns.map(col => (
            <td key={col}>{renderValue(t, col)}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);
```

### 3. Feature Flag Rule Execution in Backend:
If a client needs signature enforcement, check the flag in the API:
```typescript
const dashboardConfig = config.dashboards[ticket.currentStage];
if (dashboardConfig?.requireTechnicianSignature && !signatureData) {
  return NextResponse.json({ error: "Technician signature is required to complete this task" }, { status: 400 });
}
```
*This allows you to customize columns, filters, security locks, and validation logic per client dynamically.*
