"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { EmsConfig } from "@/config/ems-config";

interface ConfigContextType {
  config: EmsConfig | null;
  loading: boolean;
  updateConfig: (newConfig: EmsConfig) => Promise<boolean>;
  themeMode: "light" | "dark";
  toggleTheme: () => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

function hexToRgb(hex: string): string | null {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : null;
}

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<EmsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [themeMode, setThemeMode] = useState<"light" | "dark">("dark");

  // Load initial local preference on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme-mode") as "light" | "dark" | null;
    if (saved) {
      setTimeout(() => {
        setThemeMode(saved);
      }, 0);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  // Fetch configuration on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/config");
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        }
      } catch (error) {
        console.error("[Config Context] Failed to fetch configuration:", error);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  // Inject CSS Custom Properties dynamically based on brand theme colors
  useEffect(() => {
    if (config?.brand?.theme) {
      let primaryHex = config.brand.theme.primaryColor || "#ffffff";
      const accentHex = config.brand.theme.accentColor || "#ff3300";
      
      const savedPref = localStorage.getItem("theme-mode") as "light" | "dark" | null;
      const isDarkMode = savedPref ? (savedPref === "dark") : (config.brand.theme.darkTheme !== false);

      // Prevent white-on-white visual collision in light mode
      if (!isDarkMode && (primaryHex.toLowerCase() === "#ffffff" || primaryHex.toLowerCase() === "#fff")) {
        primaryHex = "#0f172a"; // fall back to slate-900
      }
      
      document.documentElement.style.setProperty("--primary", primaryHex);
      document.documentElement.style.setProperty("--accent", accentHex);

      const primaryRgb = hexToRgb(primaryHex);
      const accentRgb = hexToRgb(accentHex);

      if (primaryRgb) {
        document.documentElement.style.setProperty("--primary-rgb", primaryRgb);
      }
      if (accentRgb) {
        document.documentElement.style.setProperty("--accent-rgb", accentRgb);
      }

      // Synchronize data-theme attribute and React state
      const targetTheme = isDarkMode ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", targetTheme);
      setTimeout(() => {
        setThemeMode(targetTheme);
      }, 0);
    }
  }, [config]);

  const toggleTheme = () => {
    const newTheme = themeMode === "dark" ? "light" : "dark";
    localStorage.setItem("theme-mode", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    setThemeMode(newTheme);
  };

  const updateConfig = async (newConfig: EmsConfig): Promise<boolean> => {
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        return true;
      }
      return false;
    } catch (error) {
      console.error("[Config Context] Failed to update configuration:", error);
      return false;
    }
  };

  return (
    <ConfigContext.Provider value={{ config, loading, updateConfig, themeMode, toggleTheme }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
}
