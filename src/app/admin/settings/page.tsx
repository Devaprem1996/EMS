"use client";

import React, { useState, useEffect } from "react";
import { 
  Save, 
  Palette, 
  Layout, 
  ListFilter, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
  Zap,
  Flame,
  Building2,
  Monitor,
  Snowflake,
  Wand2
} from "lucide-react";
import { useConfig } from "@/context/ConfigContext";
import { EmsConfig, DynamicField } from "@/config/ems-config";

// --- Preset Color Swatches ---
const PRESET_SWATCHES = [
  { name: "Default Safeway Red", primary: "#dc2626", accent: "#ef4444" },
  { name: "Ocean Blue", primary: "#2563eb", accent: "#3b82f6" },
  { name: "Forest Green", primary: "#059669", accent: "#10b981" },
  { name: "Royal Purple", primary: "#7c3aed", accent: "#8b5cf6" },
  { name: "Sunset Orange", primary: "#ea580c", accent: "#f97316" },
  { name: "Monochrome Steel Gray", primary: "#4b5563", accent: "#6b7280" }
];

const INDUSTRY_TEMPLATES = [
  { code: "fire-safety", name: "Fire Safety", subtitle: "Fire protection & cylinder management", icon: Flame, color: "#ef4444", file: "/config/templates/fire-safety.json" },
  { code: "hvac-repair", name: "HVAC & Air Conditioning", subtitle: "AC maintenance & climate systems", icon: Snowflake, color: "#38bdf8", file: "/config/templates/hvac-repair.json" },
  { code: "elevator-maintenance", name: "Elevator & Lifts", subtitle: "Lift maintenance & inspection", icon: Building2, color: "#8b5cf6", file: "/config/templates/elevator-maintenance.json" },
  { code: "it-helpdesk", name: "IT Helpdesk", subtitle: "IT support & service management", icon: Monitor, color: "#10b981", file: "/config/templates/it-helpdesk.json" },
  { code: "custom-blank", name: "Custom / Blank", subtitle: "Start from scratch", icon: Wand2, color: "#94a3b8", file: "/config/templates/custom-blank.json" },
];

export default function SettingsPage() {
  const { config, loading: configLoading, updateConfig } = useConfig();
  const [activeTab, setActiveTab] = useState<"brand" | "stages" | "categories" | "fields" | "csv">("brand");
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null);

  // Success/Error toast states
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load auth state
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error("SettingsPage auth check failed:", err);
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, []);

  // Brand States
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#dc2626");
  const [accentColor, setAccentColor] = useState("#ef4444");
  const [darkTheme, setDarkTheme] = useState(true);

  // Dynamic Vocabulary Custom Labels States
  const [serialNumberLabel, setSerialNumberLabel] = useState("Cylinder Tag / Serial No");
  const [capacityLabel, setCapacityLabel] = useState("Cylinder Capacity");
  const [extinguisherTypeLabel, setExtinguisherTypeLabel] = useState("Extinguisher Type");
  const [itemDescriptionLabel, setItemDescriptionLabel] = useState("Item Description");
  const [deliveredDateLabel, setDeliveredDateLabel] = useState("Delivered Date");
  const [amcYearsLabel, setAmcYearsLabel] = useState("No. of Years");
  const [amcDateLabel, setAmcDateLabel] = useState("Next Refilling Date (Calculated)");

  // Stages States
  const [enquiryEnabled, setEnquiryEnabled] = useState(true);
  const [enquiryName, setEnquiryName] = useState("");
  const [refillingEnabled, setRefillingEnabled] = useState(true);
  const [refillingName, setRefillingName] = useState("");
  const [servicesEnabled, setServicesEnabled] = useState(true);
  const [servicesName, setServicesName] = useState("");

  // Categories & Sources (inputs as comma-separated strings)
  const [categoriesText, setCategoriesText] = useState("");
  const [sourcesText, setSourcesText] = useState("");

  // Custom Fields Schema
  const [enquiryFields, setEnquiryFields] = useState<DynamicField[]>([]);
  const [refillingFields, setRefillingFields] = useState<DynamicField[]>([]);
  const [servicesFields, setServicesFields] = useState<DynamicField[]>([]);

  // Temp states for adding new fields
  const [addFieldStage, setAddFieldStage] = useState<"ENQUIRY" | "REFILLING" | "SERVICES">("ENQUIRY");
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<"text" | "number" | "boolean" | "date" | "select" | "multi-select">("text");
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  // CSV Mappings States (key mapping string inputs)
  const [csvMappings, setCsvMappings] = useState<Record<string, string>>({});

  // Load state from context config
  useEffect(() => {
    if (config) {
      setTitle(config.brand.title || "");
      setSubtitle(config.brand.subtitle || "");
      setLogoUrl(config.brand.logoUrl || "");
      setPrimaryColor(config.brand.theme.primaryColor || "#dc2626");
      setAccentColor(config.brand.theme.accentColor || "#ef4444");
      setDarkTheme(config.brand.theme.darkTheme !== false);

      // Dynamic Vocabulary Custom Labels
      const lbs = config.brand.labels || {};
      setSerialNumberLabel(lbs.serialNumber || "Cylinder Tag / Serial No");
      setCapacityLabel(lbs.capacity || "Cylinder Capacity");
      setExtinguisherTypeLabel(lbs.extinguisherType || "Extinguisher Type");
      setItemDescriptionLabel(lbs.itemDescription || "Item Description");
      setDeliveredDateLabel(lbs.deliveredDate || "Delivered Date");
      setAmcYearsLabel(lbs.amcYears || "No. of Years");
      setAmcDateLabel(lbs.amcDate || "Next Refilling Date (Calculated)");

      setEnquiryEnabled(config.stages.ENQUIRY.enabled !== false);
      setEnquiryName(config.stages.ENQUIRY.displayName || "Enquiry");
      setRefillingEnabled(config.stages.REFILLING.enabled !== false);
      setRefillingName(config.stages.REFILLING.displayName || "Refilling");
      setServicesEnabled(config.stages.SERVICES.enabled !== false);
      setServicesName(config.stages.SERVICES.displayName || "Services");

      // Load category lists or fallback
      const cats = config.categories || ["CCTV", "New Fire Extinguisher", "Refilling"];
      setCategoriesText(cats.join(", "));
      const srcs = config.sources || ["Existing Customers", "Social Media", "Phone Call", "Walk-in", "Email Enquiry", "Field Agent", "Website"];
      setSourcesText(srcs.join(", "));

      // Custom fields schema
      setEnquiryFields(config.stages.ENQUIRY.fields || []);
      setRefillingFields(config.stages.REFILLING.fields || []);
      setServicesFields(config.stages.SERVICES.fields || []);

      // CSV mappings mapping
      const mappings: Record<string, string> = {};
      if (config.importMappings) {
        for (const [key, val] of Object.entries(config.importMappings)) {
          mappings[key] = Array.isArray(val) ? val.join(", ") : "";
        }
      }
      setCsvMappings(mappings);
    }
  }, [config]);

  // Swatch Color Click handler
  const handleApplySwatch = (primary: string, accent: string) => {
    setPrimaryColor(primary);
    setAccentColor(accent);
  };

  // Load Industry Template handler
  const handleLoadTemplate = async (templateCode: string, templateFile: string) => {
    setLoadingTemplate(templateCode);
    try {
      const res = await fetch(templateFile);
      if (!res.ok) throw new Error("Template file not found");
      const tpl = await res.json();

      // Apply template values to all form fields
      if (tpl.brand) {
        setTitle(tpl.brand.title || "");
        setSubtitle(tpl.brand.subtitle || "");
        setLogoUrl(tpl.brand.logoUrl || "");
        if (tpl.brand.theme) {
          setPrimaryColor(tpl.brand.theme.primaryColor || "#dc2626");
          setAccentColor(tpl.brand.theme.accentColor || "#ef4444");
          setDarkTheme(tpl.brand.theme.darkTheme !== false);
        }
        if (tpl.brand.labels) {
          setSerialNumberLabel(tpl.brand.labels.serialNumber || "Serial Number");
          setCapacityLabel(tpl.brand.labels.capacity || "Capacity");
          setExtinguisherTypeLabel(tpl.brand.labels.extinguisherType || "Type");
          setItemDescriptionLabel(tpl.brand.labels.itemDescription || "Item Description");
          setDeliveredDateLabel(tpl.brand.labels.deliveredDate || "Delivered Date");
          setAmcYearsLabel(tpl.brand.labels.amcYears || "No. of Years");
          setAmcDateLabel(tpl.brand.labels.amcDate || "Next Date");
        }
      }
      if (tpl.stages) {
        if (tpl.stages.ENQUIRY) {
          setEnquiryEnabled(tpl.stages.ENQUIRY.enabled !== false);
          setEnquiryName(tpl.stages.ENQUIRY.displayName || "Enquiry");
          setEnquiryFields(tpl.stages.ENQUIRY.fields || []);
        }
        if (tpl.stages.REFILLING) {
          setRefillingEnabled(tpl.stages.REFILLING.enabled !== false);
          setRefillingName(tpl.stages.REFILLING.displayName || "Refilling");
          setRefillingFields(tpl.stages.REFILLING.fields || []);
        }
        if (tpl.stages.SERVICES) {
          setServicesEnabled(tpl.stages.SERVICES.enabled !== false);
          setServicesName(tpl.stages.SERVICES.displayName || "Services");
          setServicesFields(tpl.stages.SERVICES.fields || []);
        }
      }
      if (tpl.categories) setCategoriesText(tpl.categories.join(", "));
      if (tpl.sources) setSourcesText(tpl.sources.join(", "));
      if (tpl.importMappings) {
        const mappings: Record<string, string> = {};
        for (const [key, val] of Object.entries(tpl.importMappings)) {
          mappings[key] = Array.isArray(val) ? (val as string[]).join(", ") : "";
        }
        setCsvMappings(mappings);
      }

      setSuccessMsg(`"${INDUSTRY_TEMPLATES.find(t => t.code === templateCode)?.name}" template loaded! Review the values below and click Save Settings to apply.`);
    } catch (err) {
      setErrorMsg("Failed to load template file.");
    } finally {
      setLoadingTemplate(null);
    }
  };

  // Add Dynamic Custom Field logic
  const handleAddField = (stage: "ENQUIRY" | "REFILLING" | "SERVICES") => {
    if (!newFieldKey.trim() || !newFieldLabel.trim()) {
      setErrorMsg("Field key and label are required");
      return;
    }
    const cleanKey = newFieldKey.trim().replace(/\s+/g, "_").toLowerCase();
    
    // Check duplicates
    const fieldsToSearch = stage === "ENQUIRY" ? enquiryFields : stage === "REFILLING" ? refillingFields : servicesFields;
    if (fieldsToSearch.some(f => f.key === cleanKey)) {
      setErrorMsg("A field with this key already exists in this stage");
      return;
    }

    const newField: DynamicField = {
      key: cleanKey,
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: newFieldRequired,
      ...(newFieldOptions.trim() ? { options: newFieldOptions.split(",").map(o => o.trim()).filter(Boolean) } : {})
    };

    if (stage === "ENQUIRY") setEnquiryFields([...enquiryFields, newField]);
    else if (stage === "REFILLING") setRefillingFields([...refillingFields, newField]);
    else setServicesFields([...servicesFields, newField]);

    // Reset fields input
    setNewFieldKey("");
    setNewFieldLabel("");
    setNewFieldType("text");
    setNewFieldOptions("");
    setNewFieldRequired(false);
    setSuccessMsg("Field added to staging config!");
  };

  // Remove Dynamic Custom Field logic
  const handleRemoveField = (stage: "ENQUIRY" | "REFILLING" | "SERVICES", key: string) => {
    if (stage === "ENQUIRY") {
      setEnquiryFields(enquiryFields.filter(f => f.key !== key));
    } else if (stage === "REFILLING") {
      setRefillingFields(refillingFields.filter(f => f.key !== key));
    } else {
      setServicesFields(servicesFields.filter(f => f.key !== key));
    }
    setSuccessMsg("Field removed from staging config!");
  };

  // Handle Form Submission / Save Config
  const handleSaveSettings = async () => {
    if (!title.trim()) {
      setErrorMsg("Application title is required");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    // Format custom category strings into arrays
    const categories = categoriesText.split(",").map(c => c.trim()).filter(Boolean);
    const sources = sourcesText.split(",").map(s => s.trim()).filter(Boolean);

    // Build the EmsConfig payload
    const updatedImportMappings: Record<string, string[]> = {};
    for (const [key, val] of Object.entries(csvMappings)) {
      updatedImportMappings[key] = val.split(",").map(v => v.trim().toLowerCase()).filter(Boolean);
    }

    const updatedConfigPayload: EmsConfig = {
      brand: {
        title: title.trim(),
        subtitle: subtitle.trim(),
        logoUrl: logoUrl.trim() || undefined,
        theme: {
          primaryColor,
          accentColor,
          darkTheme
        },
        labels: {
          serialNumber: serialNumberLabel.trim(),
          capacity: capacityLabel.trim(),
          extinguisherType: extinguisherTypeLabel.trim(),
          itemDescription: itemDescriptionLabel.trim(),
          deliveredDate: deliveredDateLabel.trim(),
          amcYears: amcYearsLabel.trim(),
          amcDate: amcDateLabel.trim(),
        }
      },
      stages: {
        ENQUIRY: {
          enabled: enquiryEnabled,
          displayName: enquiryName.trim() || "Enquiry",
          fields: enquiryFields
        },
        REFILLING: {
          enabled: refillingEnabled,
          displayName: refillingName.trim() || "Refilling",
          fields: refillingFields
        },
        SERVICES: {
          enabled: servicesEnabled,
          displayName: servicesName.trim() || "Services",
          fields: servicesFields
        }
      },
      categories,
      sources,
      importMappings: updatedImportMappings as any
    };

    const success = await updateConfig(updatedConfigPayload);
    setSaving(false);
    if (success) {
      setSuccessMsg("Configuration saved successfully! Theme updated across dashboard.");
    } else {
      setErrorMsg("Failed to persist configuration to database.");
    }
  };

  if (configLoading || authLoading) {
    return (
      <div style={{ textAlign: "center", padding: "100px", color: "#94a3b8" }}>
        <div style={{ display: "inline-block", width: "40px", height: "40px", border: "3px solid rgba(255,255,255,0.05)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <div style={{ marginTop: "15px", fontSize: "15px" }}>Loading settings console...</div>
      </div>
    );
  }

  if (!user || user.role !== "SUPER_ADMIN") {
    return (
      <div style={{ padding: "80px 20px", textAlign: "center", color: "#f87171", maxWidth: "600px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "12px", letterSpacing: "-0.02em" }}>Access Restricted</h2>
        <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.5" }}>
          This settings control panel is restricted to platform developers. Client administrators do not have access permissions.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", color: "var(--text-primary)", position: "relative", minHeight: "100%" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", maxWidth: "800px", margin: "0 auto 25px auto" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "800", margin: 0, letterSpacing: "-0.03em", background: "linear-gradient(to right, var(--text-primary) 40%, var(--text-secondary) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Configuration Control Center
          </h1>
          <p style={{ fontSize: "13.5px", color: "#94a3b8", margin: "4px 0 0 0" }}>
            Customize branding, stages, labels, fields, and categories. Load an industry template for instant setup.
          </p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          style={{
            padding: "10px 18px",
            background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
            border: "none",
            borderRadius: "10px",
            color: "#fff",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: "600",
            boxShadow: "0 4px 15px rgba(var(--primary-rgb), 0.25)",
            transition: "all 0.25s"
          }}
        >
          <Save size={16} />
          {saving ? "Saving Changes..." : "Save Settings"}
        </button>
      </div>

      {/* Success/Error Banner Stack */}
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {(successMsg || errorMsg) && (
          <div style={{ marginBottom: "20px" }}>
            {successMsg && (
              <div className="alert-banner" style={{ background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#10b981", borderRadius: "10px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
                <Check size={18} />
                <span>{successMsg}</span>
                <button onClick={() => setSuccessMsg(null)} style={{ background: "none", border: "none", color: "#10b981", cursor: "pointer", marginLeft: "auto", fontWeight: "bold" }}>×</button>
              </div>
            )}
            {errorMsg && (
              <div className="alert-banner" style={{ background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#f87171", borderRadius: "10px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
                <button onClick={() => setErrorMsg(null)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", marginLeft: "auto", fontWeight: "bold" }}>×</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Settings Grid (Centered Card panel) */}
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* Industry Template Loader */}
        <div style={{ marginBottom: "25px", background: "var(--bg-card-glass)", backdropFilter: "blur(20px)", borderRadius: "16px", border: "1px solid var(--border-glass)", padding: "25px", boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
            <Zap size={18} style={{ color: "var(--accent)" }} />
            <h3 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>Industry Templates</h3>
          </div>
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: "0 0 18px 0", lineHeight: "1.5" }}>
            Select a pre-built industry template to instantly populate all configuration fields. You can further customize after loading.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" }}>
            {INDUSTRY_TEMPLATES.map((tpl) => {
              const Icon = tpl.icon;
              const isLoading = loadingTemplate === tpl.code;
              return (
                <button
                  key={tpl.code}
                  onClick={() => handleLoadTemplate(tpl.code, tpl.file)}
                  disabled={isLoading}
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-glass)",
                    borderRadius: "12px",
                    padding: "18px 14px",
                    cursor: isLoading ? "wait" : "pointer",
                    textAlign: "center",
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    opacity: isLoading ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = tpl.color; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 25px ${tpl.color}25`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-glass)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: `${tpl.color}20`, color: tpl.color, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px auto" }}>
                    <Icon size={20} />
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "4px" }}>
                    {isLoading ? "Loading..." : tpl.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: "1.3" }}>
                    {tpl.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings Tab Content Panel */}
        <main style={{ background: "var(--bg-card-glass)", backdropFilter: "blur(20px)", borderRadius: "16px", border: "1px solid var(--border-glass)", padding: "25px", boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)" }}>
          
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "15px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "10px" }}>Branding & Visual Identity</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label style={{ fontSize: "13px", color: "#a0aec0", display: "block", marginBottom: "5px" }}>Application Brand Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. SafeShield" style={{ width: "100%", padding: "10px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "var(--text-primary)", outline: "none" }} />
              </div>

              <div>
                <label style={{ fontSize: "13px", color: "#a0aec0", display: "block", marginBottom: "5px" }}>Tagline / Subtitle</label>
                <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="e.g. Intelligent Enquiry Management System" style={{ width: "100%", padding: "10px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "var(--text-primary)", outline: "none" }} />
              </div>

              <div>
                <label style={{ fontSize: "13px", color: "#a0aec0", display: "block", marginBottom: "5px" }}>Branding Logo Image URL</label>
                <input type="text" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="e.g. https://domain.com/logo.png" style={{ width: "100%", padding: "10px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "var(--text-primary)", outline: "none" }} />
                {logoUrl && (
                  <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "12px", color: "#718096" }}>Preview:</span>
                    <img src={logoUrl} alt="Logo preview" style={{ maxHeight: "30px", objectFit: "contain", borderRadius: "4px" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  </div>
                )}
              </div>

              {/* Theme Dark/Light Mode switch */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "10px", marginTop: "10px" }}>
                <div>
                  <span style={{ fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)" }}>Theme Color Mode</span>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>Switch between high-contrast dark space and clean light slate designs.</p>
                </div>
                <button id="theme-toggle-btn" type="button" onClick={() => setDarkTheme(!darkTheme)} style={{ background: "none", border: "none", color: darkTheme ? "var(--accent)" : "#718096", cursor: "pointer", display: "flex", alignItems: "center" }}>
                  {darkTheme ? <ToggleRight size={38} /> : <ToggleLeft size={38} />}
                </button>
              </div>

              {/* Themes Preset Color Swatches */}
              <div style={{ marginTop: "15px" }}>
                <label style={{ fontSize: "13px", color: "#a0aec0", display: "block", marginBottom: "8px" }}>White-Label Preset Theme Swatches</label>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {PRESET_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.name}
                      onClick={() => handleApplySwatch(swatch.primary, swatch.accent)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-glass)",
                        background: "var(--bg-input)",
                        color: "var(--text-primary)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12px",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--primary-glow)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "var(--bg-input)"}
                    >
                      <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: swatch.primary, display: "inline-block" }}></span>
                      <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: swatch.accent, display: "inline-block", marginLeft: "-4px" }}></span>
                      {swatch.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginTop: "10px" }}>
                <div>
                  <label style={{ fontSize: "13px", color: "#a0aec0", display: "block", marginBottom: "5px" }}>Primary Hex Color Code</label>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ width: "38px", height: "38px", border: "none", borderRadius: "8px", cursor: "pointer", background: "none" }} />
                    <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ flex: 1, padding: "10px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#a0aec0", display: "block", marginBottom: "5px" }}>Accent Hex Color Code</label>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ width: "38px", height: "38px", border: "none", borderRadius: "8px", cursor: "pointer", background: "none" }} />
                    <input type="text" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ flex: 1, padding: "10px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }} />
                  </div>
                </div>
              </div>

              {/* Custom Vocabulary / Labels */}
              <div style={{ marginTop: "25px", borderTop: "1px solid var(--border-glass)", paddingTop: "20px" }}>
                <h4 style={{ fontSize: "15px", fontWeight: "bold", color: "var(--text-primary)", marginBottom: "5px" }}>Domain Vocabulary & Dynamic Labels</h4>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "15px" }}>Customize text labels to fit your specific industry domain (e.g. Fire Safety vs. HVAC vs. IT Services).</p>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                    <div>
                      <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Asset Serial/Tag Label</label>
                      <input type="text" value={serialNumberLabel} onChange={e => setSerialNumberLabel(e.target.value)} style={{ width: "100%", padding: "8px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "var(--text-primary)" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Equipment Capacity Label</label>
                      <input type="text" value={capacityLabel} onChange={e => setCapacityLabel(e.target.value)} style={{ width: "100%", padding: "8px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "var(--text-primary)" }} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                    <div>
                      <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Equipment Type Label</label>
                      <input type="text" value={extinguisherTypeLabel} onChange={e => setExtinguisherTypeLabel(e.target.value)} style={{ width: "100%", padding: "8px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "var(--text-primary)" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Item Description Label</label>
                      <input type="text" value={itemDescriptionLabel} onChange={e => setItemDescriptionLabel(e.target.value)} style={{ width: "100%", padding: "8px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "var(--text-primary)" }} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                    <div>
                      <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Delivered/Setup Date Label</label>
                      <input type="text" value={deliveredDateLabel} onChange={e => setDeliveredDateLabel(e.target.value)} style={{ width: "100%", padding: "8px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "var(--text-primary)" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Coverage Years (AMC) Label</label>
                      <input type="text" value={amcYearsLabel} onChange={e => setAmcYearsLabel(e.target.value)} style={{ width: "100%", padding: "8px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "var(--text-primary)" }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", color: "#a0aec0", display: "block", marginBottom: "4px" }}>Next Renewal/Refill Date Label</label>
                    <input type="text" value={amcDateLabel} onChange={e => setAmcDateLabel(e.target.value)} style={{ width: "100%", padding: "8px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "var(--text-primary)" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
