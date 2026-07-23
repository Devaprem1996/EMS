# Phase 3: Dynamic Form Field Engine & JSON Storage

This document outlines the code refactoring, schema interfaces, and instructions for implementing the **Dynamic Form Generator** (Phase 3).

---

## 🎯 Goal
Replace static input boxes in technician check-in and update modals with a dynamic rendering engine that loops over configuration field maps, rendering form controls on the fly and storing inputs inside the `stageData` JSON column.

---

## 🛠️ Code Specifications

### 1. The Dynamic Form Component (`src/components/DynamicForm.tsx`)
Create a generic component that accepts field definitions, maps over them, and outputs corresponding HTML controls:

```tsx
import React from "react";

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "boolean" | "select" | "multi-select";
  options?: string[];
  required?: boolean;
}

interface DynamicFormProps {
  fields: FieldDef[];
  values: Record<string, any>;
  onChange: (key: string, val: any) => void;
}

export default function DynamicForm({ fields, values, onChange }: DynamicFormProps) {
  return (
    <div className="dynamic-form-fields" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {fields.map((field) => {
        const value = values[field.key];

        return (
          <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "13px", color: "#a0aec0" }}>
              {field.label} {field.required && <span style={{ color: "#ef4444" }}>*</span>}
            </label>

            {field.type === "text" && (
              <input
                type="text"
                value={value || ""}
                onChange={(e) => onChange(field.key, e.target.value)}
                required={field.required}
                className="input-field"
              />
            )}

            {field.type === "number" && (
              <input
                type="number"
                value={value !== undefined ? value : ""}
                onChange={(e) => onChange(field.key, e.target.value === "" ? "" : Number(e.target.value))}
                required={field.required}
                className="input-field"
              />
            )}

            {field.type === "boolean" && (
              <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={!!value}
                  onChange={(e) => onChange(field.key, e.target.checked)}
                />
                <span style={{ fontSize: "13px" }}>Enabled</span>
              </label>
            )}

            {field.type === "select" && (
              <select
                value={value || ""}
                onChange={(e) => onChange(field.key, e.target.value)}
                required={field.required}
                className="select-field"
              >
                <option value="">Select an option</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

### 2. Integration in Check-in Modals
Use the component inside the technician submit flows:
```tsx
const stageFields = config.stages[currentStage]?.fields || [];
const [formState, setFormState] = useState<Record<string, any>>({});

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Submit raw values to the server to save inside the Ticket's stageData column
  await fetch(`/api/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify({
      status: "Completed",
      stageData: formState // Stringified automatically on backend
    })
  });
};

return (
  <form onSubmit={handleSubmit}>
    <DynamicForm
      fields={stageFields}
      values={formState}
      onChange={(key, val) => setFormState(prev => ({ ...prev, [key]: val }))}
    />
    <button type="submit">Submit Task</button>
  </form>
);
```

---

## 🤖 AI Assistant Coding Instruction & Prompt
Copy and paste this prompt when instructing an AI assistant to implement Phase 3:

> **AI Coding Instruction (Phase 3)**:
> "Create a generic React component `DynamicForm.tsx` that interprets field configurations.
> 1. Accept `fields` array containing specifications: `key`, `label`, `type` (text, number, boolean, select), `options`, and `required`.
> 2. Accept `values` object and a change callback `onChange(key, val)`.
> 3. Render appropriate HTML5 inputs dynamically.
> 4. Ensure inputs update states correctly and save all parameters in a single serializable object to submit to the backend."
