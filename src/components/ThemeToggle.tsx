"use client";

import { useConfig } from "@/context/ConfigContext";
import { Sun, Moon } from "lucide-react";

export function ThemeToggleFloating() {
  const { themeMode, toggleTheme } = useConfig();

  return (
    <button
      onClick={toggleTheme}
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 9999,
        background: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(12px)",
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: "var(--text-primary)",
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      className="theme-toggle-floating-btn"
      title={`Switch to ${themeMode === "dark" ? "Light" : "Dark"} Mode`}
    >
      {themeMode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
