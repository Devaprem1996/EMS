"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  CornerDownLeft, 
  Terminal, 
  FileText, 
  RotateCcw, 
  Wrench, 
  Users, 
  LayoutDashboard, 
  Settings, 
  LogOut,
  Play
} from "lucide-react";

interface SearchResult {
  id: string;
  type: "nav" | "action" | "ticket";
  title: string;
  subtitle?: string;
  path?: string;
  actionKey?: string;
  stageName?: string;
  jobNumber?: string;
}

export default function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Static items: navigation and actions
  const staticItems: SearchResult[] = [
    { id: "nav-overview", type: "nav", title: "Go to Overview Center", subtitle: "Dashboard statistics and graphs", path: "/admin" },
    { id: "nav-enquiry", type: "nav", title: "Go to Enquiry Dashboard", subtitle: "Lead registration and updates", path: "/admin/enquiry" },
    { id: "nav-refilling", type: "nav", title: "Go to Refilling Dashboard", subtitle: "Cylinder gas log management", path: "/admin/refilling" },
    { id: "nav-services", type: "nav", title: "Go to Service Dashboard", subtitle: "AMC and inspection schedule records", path: "/admin/services" },
    { id: "nav-employees", type: "nav", title: "Go to Employee Master", subtitle: "Manage technicians and staff roles", path: "/admin/employees" },
    { id: "nav-tasks", type: "nav", title: "Go to Technician View", subtitle: "Live operations monitoring log", path: "/admin/tasks" },
    { id: "nav-settings", type: "nav", title: "Go to Configuration Center", subtitle: "Branding settings and active form fields", path: "/admin/settings" },
    { id: "action-add-enquiry", type: "action", title: "Action: Register New Enquiry", subtitle: "Open lead registration modal form", actionKey: "trigger-add-enquiry" },
    { id: "action-logout", type: "action", title: "Action: Log Out System", subtitle: "Sign out of your active session", actionKey: "logout" }
  ];

  // Global event keydown handlers (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleCustomTrigger = () => {
      setIsOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleCustomTrigger);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleCustomTrigger);
    };
  }, []);

  // Autofocus input when overlay opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Debounced search logic for tickets
  useEffect(() => {
    if (!isOpen) return;

    if (!query.trim()) {
      setResults(staticItems);
      setLoading(false);
      return;
    }

    setLoading(true);
    setActiveIndex(0);

    const delayDebounce = setTimeout(async () => {
      try {
        const queryLower = query.toLowerCase();
        
        // Match static items locally
        const matchedStatic = staticItems.filter(
          (item) =>
            item.title.toLowerCase().includes(queryLower) ||
            item.subtitle?.toLowerCase().includes(queryLower)
        );

        // Concurrent fetch calls to get matches from ENQUIRY, REFILLING, and SERVICES stages
        const stages = ["ENQUIRY", "REFILLING", "SERVICES"];
        const fetchPromises = stages.map(async (stage) => {
          try {
            const res = await fetch(
              `/api/jobs?stage=${stage}&search=${encodeURIComponent(query)}`
            );
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data)) {
                return data.map((job: any) => ({
                  id: `ticket-${job.id}`,
                  type: "ticket" as const,
                  title: `${job.jobNumber || "TICKET"} - ${job.customer?.companyName || job.customer?.contactPerson || "N/A"}`,
                  subtitle: `Stage: ${stage} | Status: ${job.currentStatus || "N/A"} | Category: ${job.requirementCategory || "SELECT"}`,
                  stageName: stage,
                  jobNumber: job.jobNumber
                }));
              }
            }
          } catch (err) {
            console.error(`Command palette search error for stage ${stage}:`, err);
          }
          return [];
        });

        const fetchedArrays = await Promise.all(fetchPromises);
        const ticketResults = fetchedArrays.flat();

        setResults([...matchedStatic, ...ticketResults]);
      } catch (err) {
        console.error("Command palette local/remote query failed:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [query, isOpen]);

  // Keyboard navigation inside command popover
  const handleKeyDownNavigation = async (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      await executeItemAction(results[activeIndex]);
    }
  };

  // Execution dispatcher for selected item
  const executeItemAction = async (item: SearchResult) => {
    setIsOpen(false);

    if (item.type === "nav" && item.path) {
      router.push(item.path);
    } else if (item.type === "action" && item.actionKey) {
      if (item.actionKey === "logout") {
        try {
          const res = await fetch("/api/auth/logout", { method: "POST" });
          if (res.ok) router.push("/");
        } catch (err) {
          console.error("Logout failed:", err);
        }
      } else if (item.actionKey === "trigger-add-enquiry") {
        // Dispatch custom global event to trigger the registration modal on the enquiry page
        window.dispatchEvent(new CustomEvent("trigger-add-enquiry-modal"));
        router.push("/admin/enquiry");
      }
    } else if (item.type === "ticket" && item.stageName && item.jobNumber) {
      const baseRoutes: Record<string, string> = {
        ENQUIRY: "/admin/enquiry",
        REFILLING: "/admin/refilling",
        SERVICES: "/admin/services"
      };
      const path = baseRoutes[item.stageName];
      if (path) {
        router.push(`${path}?search=${encodeURIComponent(item.jobNumber)}`);
      }
    }
  };

  const getIcon = (item: SearchResult) => {
    if (item.type === "ticket") {
      if (item.stageName === "ENQUIRY") return <FileText size={16} style={{ color: "#fbbf24" }} />;
      if (item.stageName === "REFILLING") return <RotateCcw size={16} style={{ color: "#60a5fa" }} />;
      return <Wrench size={16} style={{ color: "#10b981" }} />;
    }
    if (item.type === "action") {
      if (item.actionKey === "logout") return <LogOut size={16} style={{ color: "#f87171" }} />;
      return <Play size={16} style={{ color: "var(--accent)" }} />;
    }
    if (item.id.includes("overview")) return <LayoutDashboard size={16} style={{ color: "var(--text-secondary)" }} />;
    if (item.id.includes("employees")) return <Users size={16} style={{ color: "var(--text-secondary)" }} />;
    if (item.id.includes("settings")) return <Settings size={16} style={{ color: "var(--text-secondary)" }} />;
    return <Terminal size={16} style={{ color: "var(--text-secondary)" }} />;
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(8, 8, 12, 0.75)",
        backdropFilter: "blur(12px)",
        zIndex: 99999,
        display: "flex",
        justifyContent: "center",
        paddingTop: "12vh",
        paddingLeft: "16px",
        paddingRight: "16px",
        fontFamily: "inherit"
      }}
    >
      <div 
        ref={containerRef}
        style={{
          background: "rgba(18, 18, 26, 0.95)",
          border: "1px solid var(--border-glass)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "600px",
          height: "fit-content",
          maxHeight: "68vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
          overflow: "hidden"
        }}
      >
        {/* Input area */}
        <div 
          style={{
            padding: "16px",
            borderBottom: "1px solid var(--border-glass)",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}
        >
          <Search size={18} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages, actions, client tickets... (Type 'ENQ' or 'CYL')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownNavigation}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#fff",
              fontSize: "14.5px"
            }}
          />
          <kbd 
            style={{
              fontSize: "10px",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "var(--text-muted)",
              padding: "2px 6px",
              borderRadius: "5px",
              flexShrink: 0,
              fontFamily: "monospace"
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results area */}
        <div 
          style={{
            overflowY: "auto",
            padding: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            maxHeight: "calc(68vh - 70px)"
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)", fontSize: "13px" }}>
              <div style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite", marginRight: "8px", verticalAlign: "middle" }} />
              Querying database registries...
            </div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)", fontSize: "13px" }}>
              No matches found for <span style={{ color: "var(--accent)" }}>"{query}"</span>
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => executeItemAction(item)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    background: isSelected ? "var(--accent)" : "transparent",
                    transition: "all 0.15s ease",
                    border: isSelected ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                    <div 
                      style={{
                        padding: "8px",
                        borderRadius: "8px",
                        background: isSelected ? "rgba(15, 23, 42, 0.15)" : "rgba(255, 255, 255, 0.04)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      {getIcon(item)}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <span 
                        style={{
                          fontSize: "13.5px",
                          fontWeight: "600",
                          color: isSelected ? "#0f172a" : "#fff",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                      >
                        {item.title}
                      </span>
                      <span 
                        style={{
                          fontSize: "11px",
                          color: isSelected ? "rgba(15, 23, 42, 0.75)" : "var(--text-muted)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          marginTop: "2px"
                        }}
                      >
                        {item.subtitle}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#0f172a", fontSize: "10px", fontWeight: "700" }}>
                      <span>Run</span>
                      <CornerDownLeft size={10} strokeWidth={3} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
