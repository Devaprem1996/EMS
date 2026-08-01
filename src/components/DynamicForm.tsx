"use client";

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
  values: Record<string, unknown>;
  onChange: (key: string, val: unknown) => void;
}

export default function DynamicForm({ fields, values, onChange }: DynamicFormProps) {
  return (
    <div className="dynamic-form-fields" style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
      {fields.map((field) => {
        const value = values[field.key] as any;

        return (
          <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600" }}>
              {field.label} {field.required && <span style={{ color: "var(--accent)" }}>*</span>}
            </label>

            {field.type === "text" && (
              <input
                type="text"
                value={(value as string) || ""}
                onChange={(e) => onChange(field.key, e.target.value)}
                required={field.required}
                style={{
                  width: "100%",
                  padding: "0.7rem 0.9rem",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: "10px",
                  color: "var(--text-primary)",
                  outline: "none"
                }}
              />
            )}

            {field.type === "number" && (
              <input
                type="number"
                value={value !== undefined && value !== null ? value : ""}
                onChange={(e) => onChange(field.key, e.target.value === "" ? "" : Number(e.target.value))}
                required={field.required}
                style={{
                  width: "100%",
                  padding: "0.7rem 0.9rem",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: "10px",
                  color: "var(--text-primary)",
                  outline: "none"
                }}
              />
            )}

            {field.type === "boolean" && (
              <label style={{ display: "inline-flex", alignItems: "center", gap: "10px", cursor: "pointer", marginTop: "4px" }}>
                <input
                  type="checkbox"
                  checked={!!value}
                  onChange={(e) => onChange(field.key, e.target.checked)}
                  style={{
                    cursor: "pointer",
                    width: "16px",
                    height: "16px"
                  }}
                />
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Check to confirm</span>
              </label>
            )}

            {field.type === "select" && (
              <select
                value={value || ""}
                onChange={(e) => onChange(field.key, e.target.value)}
                required={field.required}
                style={{
                  width: "100%",
                  padding: "0.7rem 0.9rem",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: "10px",
                  color: "var(--text-primary)",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value="" style={{ background: "var(--bg-input)", color: "var(--text-primary)" }}>Select an option</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt} style={{ background: "var(--bg-input)", color: "var(--text-primary)" }}>
                    {opt
                  }</option>
                ))}
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
}
