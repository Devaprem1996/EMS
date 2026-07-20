"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConfig } from "@/context/ConfigContext";
import { Phone, Lock, Eye, EyeOff, Flame, ShieldAlert, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { config } = useConfig();
  
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
            if (data.user.role === "ADMIN") {
              let targetPath = "/admin/employees";
              if (!config || config.stages?.ENQUIRY?.enabled !== false) {
                targetPath = "/admin/enquiry";
              } else if (config.stages?.REFILLING?.enabled !== false) {
                targetPath = "/admin/refilling";
              } else if (config.stages?.SERVICES?.enabled !== false) {
                targetPath = "/admin/services";
              }
              router.push(targetPath);
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
      if (data.user.role === "ADMIN") {
        let targetPath = "/admin/employees";
        if (!config || config.stages?.ENQUIRY?.enabled !== false) {
          targetPath = "/admin/enquiry";
        } else if (config.stages?.REFILLING?.enabled !== false) {
          targetPath = "/admin/refilling";
        } else if (config.stages?.SERVICES?.enabled !== false) {
          targetPath = "/admin/services";
        }
        router.push(targetPath);
      } else {
        router.push("/technician/tasks");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const brandTitle = config?.brand?.title || "Safeway";
  const brandSubtitle = config?.brand?.subtitle || "Enquiry Management System";

  return (
    <div className="login-wrapper framer-entry" style={{
      minHeight: "100vh",
      width: "100vw",
      backgroundColor: "var(--bg-dark, #050508)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      fontFamily: "var(--font-sans)",
      boxSizing: "border-box"
    }}>
      {/* Outer Responsive Card Container */}
      <div className="login-card-container framer-scale" style={{
        width: "100%",
        maxWidth: "1060px",
        minHeight: "600px",
        backgroundColor: "var(--bg-card, #ffffff)",
        borderRadius: "24px",
        boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.2), 0 0 1px rgba(0, 0, 0, 0.1)",
        padding: "16px",
        display: "flex",
        flexDirection: "row",
        boxSizing: "border-box",
        overflow: "hidden",
        border: "1px solid var(--border-glass, rgba(255,255,255,0.1))"
      }}>
        
        {/* Left Hero Pane */}
        <div style={{
          flex: "1 1 45%",
          minWidth: "320px",
          borderRadius: "18px",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "36px",
          background: "linear-gradient(180deg, #181825 0%, #0d0d15 100%)",
          color: "#ffffff"
        }}>
          {/* Dark Atmospheric Background Artwork */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: "radial-gradient(circle at 50% 30%, rgba(163, 230, 53, 0.25) 0%, rgba(0,0,0,0) 70%), url('/login-hero-flux.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.9,
            filter: "contrast(1.1) brightness(0.95)"
          }} />

          {/* Dark Overlay gradient */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 100%)",
            zIndex: 1
          }} />

          {/* Top-left Brand Logo Badge */}
          <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255, 255, 255, 0.2)"
            }}>
              {config?.brand?.logoUrl ? (
                <img src={config.brand.logoUrl} alt={brandTitle} style={{ maxHeight: "20px", objectFit: "contain" }} />
              ) : (
                <Flame size={20} color="#ffffff" fill="#ffffff" />
              )}
            </div>
            <span style={{ fontSize: "18px", fontWeight: "700", letterSpacing: "-0.02em", color: "#ffffff" }}>
              {brandTitle}
            </span>
          </div>

          {/* Bottom Hero Text */}
          <div style={{ position: "relative", zIndex: 2, marginTop: "auto" }}>
            <h1 style={{
              fontSize: "32px",
              fontWeight: "700",
              lineHeight: "1.2",
              letterSpacing: "-0.03em",
              marginBottom: "12px",
              color: "#ffffff"
            }}>
              Build something amazing today.
            </h1>
            <p style={{
              fontSize: "14px",
              lineHeight: "1.5",
              color: "rgba(255, 255, 255, 0.75)",
              margin: 0,
              maxWidth: "340px"
            }}>
              Intelligent lead management, cylinder refilling schedules, and field technician dispatches.
            </p>
          </div>
        </div>

        {/* Right Sign-In Form Pane */}
        <div style={{
          flex: "1 1 55%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px"
        }}>
          <div style={{ width: "100%", maxWidth: "380px" }}>
            
            {/* Heading Header */}
            <div style={{ marginBottom: "28px" }}>
              <h2 style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#0f172a",
                margin: "0 0 6px 0",
                letterSpacing: "-0.02em"
              }}>
                Sign in
              </h2>
              <p style={{
                fontSize: "14px",
                color: "#64748b",
                margin: 0
              }}>
                Welcome back! Enter your details below.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div style={{
                padding: "12px 14px",
                borderRadius: "8px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "20px"
              }}>
                <ShieldAlert size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Mobile Number Field */}
              <div>
                <label htmlFor="username" style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "#334155",
                  marginBottom: "6px"
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
                      padding: "12px 14px 12px 38px",
                      fontSize: "14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      color: "#0f172a",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "all 0.2s"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#0f172a"}
                    onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
                  />
                  <Phone size={16} style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8"
                  }} />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label htmlFor="password" style={{
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#334155"
                  }}>
                    Password
                  </label>
                  <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Please contact your system administrator to reset password."); }} style={{
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#64748b",
                    textDecoration: "none"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#0f172a"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#64748b"}
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
                      padding: "12px 38px 12px 38px",
                      fontSize: "14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      color: "#0f172a",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "all 0.2s"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#0f172a"}
                    onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
                  />
                  <Lock size={16} style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8"
                  }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#94a3b8",
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
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  id="keepLoggedIn"
                  checked={keepLoggedIn}
                  onChange={(e) => setKeepLoggedIn(e.target.checked)}
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "4px",
                    accentColor: "#0f172a",
                    cursor: "pointer"
                  }}
                />
                <label htmlFor="keepLoggedIn" style={{
                  fontSize: "13px",
                  color: "#64748b",
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
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: "600",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: loading || !username || !password ? "#94a3b8" : "#0f172a",
                  color: "#ffffff",
                  cursor: loading || !username || !password ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)",
                  transition: "all 0.2s"
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
        @media (max-width: 768px) {
          .login-card-container {
            flex-direction: column !important;
            min-height: auto !important;
            padding: 8px !important;
          }
          .login-hero-pane {
            min-height: 200px !important;
            padding: 20px !important;
          }
        }
      `}</style>
    </div>
  );
}
