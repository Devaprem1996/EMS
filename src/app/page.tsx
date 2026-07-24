"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConfig } from "@/context/ConfigContext";
import { Phone, Lock, Eye, EyeOff, Flame, ShieldAlert } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const { config, themeMode } = useConfig();
  
  // Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already authenticated
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            if (data.user.role === "SUPER_ADMIN") {
              router.push("/admin/settings");
            } else if (data.user.role === "ADMIN") {
              let targetPath = "/admin/employees";
              if (!config || config.stages?.ENQUIRY?.enabled !== false) {
                targetPath = "/admin/enquiry";
              } else if (config.stages?.REFILLING?.enabled !== false) {
                targetPath = "/admin/refilling";
              } else if (config.stages?.SERVICES?.enabled !== false) {
                targetPath = "/admin/services";
              }
              router.push(targetPath);
            } else if (data.user.role === "CUSTOMER") {
              router.push("/portal");
            } else {
              router.push("/technician/tasks");
            }
          }
        }
      } catch (err) {
        console.error("Session check failed", err);
      }
    }
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber: username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid mobile number or password");
      }

      // Successful login
      if (data.user.role === "SUPER_ADMIN") {
        router.push("/admin/settings");
      } else if (data.user.role === "ADMIN") {
        let targetPath = "/admin/employees";
        if (!config || config.stages?.ENQUIRY?.enabled !== false) {
          targetPath = "/admin/enquiry";
        } else if (config.stages?.REFILLING?.enabled !== false) {
          targetPath = "/admin/refilling";
        } else if (config.stages?.SERVICES?.enabled !== false) {
          targetPath = "/admin/services";
        }
        router.push(targetPath);
      } else if (data.user.role === "CUSTOMER") {
        router.push("/portal");
      } else {
        router.push("/technician/tasks");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const brandTitle = config?.brand?.title || "Safeway";
  const brandSubtitle = config?.brand?.subtitle || "Enquiry Management System";

  const isDark = themeMode === "dark";

  return (
    <div className="login-wrapper framer-entry" style={{
      minHeight: "100vh",
      width: "100vw",
      backgroundImage: isDark ? "url('/login-bg-outer-dark.png')" : "url('/login-bg-outer-light.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundColor: "var(--bg-dark)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "var(--font-sans)",
      boxSizing: "border-box",
      transition: "background-image 0.5s ease-in-out, background-color 0.5s ease-in-out",
      position: "relative",
      overflowX: "hidden"
    }}>
      

      {/* Outer Responsive Card Container */}
      <div className="login-card-container framer-scale" style={{
        width: "100%",
        maxWidth: "1060px",
        minHeight: "620px",
        backgroundColor: isDark ? "rgba(13, 13, 21, 0.45)" : "rgba(255, 255, 255, 0.8)",
        borderRadius: "28px",
        backdropFilter: "blur(20px)",
        boxShadow: isDark 
          ? "0 30px 70px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)" 
          : "0 30px 70px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
        padding: "16px",
        display: "flex",
        flexDirection: "row",
        boxSizing: "border-box",
        overflow: "hidden",
        border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(15, 23, 42, 0.08)",
        transition: "all 0.3s ease"
      }}>
        
        {/* Left Hero Pane */}
        <div className="login-hero-pane" style={{
          flex: "1 1 45%",
          minWidth: "320px",
          borderRadius: "20px",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "40px",
          color: "#ffffff",
          backgroundImage: isDark ? "url('/login-bg-hero-dark.png')" : "url('/login-bg-hero-light.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          transition: "background-image 0.5s ease"
        }}>
          {/* Dark Overlay gradient for legible typography */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%)",
            zIndex: 1
          }} />

          {/* Top-left Brand Logo Badge */}
          <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255, 255, 255, 0.2)"
            }}>
              {config?.brand?.logoUrl ? (
                <Image src={config.brand.logoUrl} alt={brandTitle} width={22} height={22} style={{ objectFit: "contain" }} unoptimized />
              ) : (
                <Flame size={20} color="#ffffff" fill="#ffffff" />
              )}
            </div>
            <span style={{ fontSize: "19px", fontWeight: "800", letterSpacing: "-0.02em", color: "#ffffff", textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
              {brandTitle}
            </span>
          </div>

          {/* Bottom Hero Text */}
          <div style={{ position: "relative", zIndex: 2, marginTop: "auto" }}>
            <h1 className="hero-headline" style={{
              fontSize: "36px",
              fontWeight: "800",
              lineHeight: "1.2",
              letterSpacing: "-0.03em",
              marginBottom: "12px",
              color: "#ffffff",
              textShadow: "0 2px 8px rgba(0, 0, 0, 0.4)"
            }}>
              YOUR SYSTEM AWAITS!
            </h1>
            <p className="hero-desc" style={{
              fontSize: "14.5px",
              lineHeight: "1.6",
              color: "rgba(255, 255, 255, 0.85)",
              margin: 0,
              maxWidth: "360px",
              textShadow: "0 1px 4px rgba(0, 0, 0, 0.3)"
            }}>
              {brandSubtitle}. Intelligent operations, cylinder refilling schedules, and dispatches.
            </p>
          </div>
        </div>

        {/* Right Sign-In Form Pane */}
        <div className="login-form-pane" style={{
          flex: "1 1 55%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px"
        }}>
          <div style={{ width: "100%", maxWidth: "380px" }}>
            
            {/* Heading Header */}
            <div style={{ marginBottom: "32px" }}>
              <h2 style={{
                fontSize: "30px",
                fontWeight: "800",
                color: isDark ? "#ffffff" : "#0f172a",
                margin: "0 0 8px 0",
                letterSpacing: "-0.03em",
                transition: "color 0.3s"
              }}>
                WELCOME BACK !
              </h2>
              <p style={{
                fontSize: "14.5px",
                color: isDark ? "rgba(255, 255, 255, 0.6)" : "#64748b",
                margin: 0,
                transition: "color 0.3s"
              }}>
                Welcome back! Please enter your details below.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div style={{
                padding: "12px 14px",
                borderRadius: "10px",
                backgroundColor: isDark ? "rgba(239, 68, 68, 0.1)" : "#fef2f2",
                border: isDark ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid #fecaca",
                color: "#ef4444",
                fontSize: "13.5px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "24px",
                transition: "all 0.3s"
              }}>
                <ShieldAlert size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
              
              {/* Mobile Number Field */}
              <div>
                <label htmlFor="username" style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: isDark ? "rgba(255, 255, 255, 0.75)" : "#475569",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em"
                }}>
                  Mobile Number
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="tel"
                    id="username"
                    placeholder="Your mobile number"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "13px 14px 13px 40px",
                      fontSize: "14.5px",
                      borderRadius: "10px",
                      border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid #cbd5e1",
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
                      color: isDark ? "#ffffff" : "#0f172a",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "all 0.2s"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--primary)";
                      e.target.style.boxShadow = isDark ? "0 0 10px rgba(255, 255, 255, 0.05)" : "0 0 10px rgba(0, 0, 0, 0.05)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = isDark ? "rgba(255, 255, 255, 0.12)" : "#cbd5e1";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  <Phone size={16} style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: isDark ? "rgba(255, 255, 255, 0.4)" : "#94a3b8"
                  }} />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label htmlFor="password" style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: isDark ? "rgba(255, 255, 255, 0.75)" : "#475569",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em"
                  }}>
                    Password
                  </label>
                  <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Please contact your system administrator to reset password."); }} style={{
                    fontSize: "12.5px",
                    fontWeight: "600",
                    color: isDark ? "rgba(255, 255, 255, 0.55)" : "#64748b",
                    textDecoration: "none",
                    transition: "color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "var(--primary)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = isDark ? "rgba(255, 255, 255, 0.55)" : "#64748b"}
                  >
                    Forgot password?
                  </a>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "13px 40px 13px 40px",
                      fontSize: "14.5px",
                      borderRadius: "10px",
                      border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid #cbd5e1",
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
                      color: isDark ? "#ffffff" : "#0f172a",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "all 0.2s"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--primary)";
                      e.target.style.boxShadow = isDark ? "0 0 10px rgba(255, 255, 255, 0.05)" : "0 0 10px rgba(0, 0, 0, 0.05)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = isDark ? "rgba(255, 255, 255, 0.12)" : "#cbd5e1";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  <Lock size={16} style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: isDark ? "rgba(255, 255, 255, 0.4)" : "#94a3b8"
                  }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: isDark ? "rgba(255, 255, 255, 0.4)" : "#94a3b8",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Keep me logged in checkbox */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="checkbox"
                  id="keepLoggedIn"
                  checked={keepLoggedIn}
                  onChange={(e) => setKeepLoggedIn(e.target.checked)}
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "4px",
                    accentColor: "var(--primary)",
                    cursor: "pointer"
                  }}
                />
                <label htmlFor="keepLoggedIn" style={{
                  fontSize: "13.5px",
                  color: isDark ? "rgba(255, 255, 255, 0.65)" : "#64748b",
                  cursor: "pointer",
                  userSelect: "none"
                }}>
                  Keep me logged in
                </label>
              </div>

              {/* Primary Sign in Button */}
              <button
                type="submit"
                disabled={loading || !username || !password}
                style={{
                  width: "100%",
                  padding: "13px",
                  fontSize: "15px",
                  fontWeight: "700",
                  borderRadius: "10px",
                  border: "none",
                  background: loading || !username || !password 
                    ? (isDark ? "rgba(255, 255, 255, 0.1)" : "#94a3b8") 
                    : "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
                  color: loading || !username || !password
                    ? (isDark ? "rgba(255, 255, 255, 0.3)" : "#e2e8f0")
                    : "#ffffff",
                  cursor: loading || !username || !password ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  boxShadow: loading || !username || !password 
                    ? "none" 
                    : "0 6px 20px rgba(0, 0, 0, 0.15)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  marginTop: "8px"
                }}
                onMouseEnter={(e) => {
                  if (!loading && username && password) {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.2)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && username && password) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.15)";
                  }
                }}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

            </form>
          </div>
        </div>

      </div>

      {/* Mobile Responsive Login Styles */}
      <style jsx global>{`
        @media (max-width: 868px) {
          .login-card-container {
            flex-direction: column !important;
            min-height: auto !important;
            max-width: 480px !important;
            padding: 10px !important;
            border-radius: 20px !important;
          }
          .login-hero-pane {
            min-height: 140px !important;
            flex: 0 0 auto !important;
            width: 100% !important;
            padding: 24px !important;
            border-radius: 14px !important;
          }
          .hero-headline {
            font-size: 24px !important;
            margin-bottom: 4px !important;
          }
          .hero-desc {
            display: none !important;
          }
          .login-form-pane {
            padding: 24px 12px 12px 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
