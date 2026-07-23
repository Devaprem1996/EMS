"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConfig } from "@/context/ConfigContext";
import { Phone, Lock, Eye, EyeOff, ArrowRight, Flame, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { config } = useConfig();
  
  // Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 3D Tilt State
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((centerY - y) / centerY) * 8; // max 8 degrees tilt
    const rotateY = ((x - centerX) / centerX) * 8;

    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Check if already authenticated, if so, redirect immediately
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
  }, [router, config]);

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
        throw new Error(data.error || "Login failed");
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

  return (
    <div className="login-wrapper premium-fullscreen">
      {/* Cinematic Fullscreen Background Image */}
      <div className="cinematic-bg-container">
        <img
          src="/login-bg-premium.png"
          className="cinematic-bg-image"
          alt="Premium 3D background"
        />
        <div className="cinematic-bg-overlay"></div>
      </div>

      <div className="fullscreen-content-container">
        {/* Left Column: Brand Hero Text */}
        <div className="hero-pane-3d">
          <div className="brand-badge-3d">
            <Flame size={14} fill="currentColor" />
            Fire Safety Management
          </div>
          <h1 className="hero-title-3d">
            Streamlining Compliance & Maintenance.
          </h1>
          <p className="hero-desc-3d">
            A comprehensive, customizable ERP tool designed to automate cylinder tracking, pressure test validation, refilling schedules, and field inspections.
          </p>
        </div>

        {/* Right Column: Glass Login Card */}
        <div className="form-pane-3d">
          <div 
            className="login-card-3d"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(10px)`,
              transition: tilt.x === 0 && tilt.y === 0 ? "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)" : "none"
            }}
          >
            <div className="brand-header">
              <div className="brand-logo-container" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                {config?.brand?.logoUrl ? (
                  <img src={config.brand.logoUrl} alt={config.brand.title || "Safeway"} style={{ maxHeight: "48px", maxWidth: "80px", objectFit: "contain", borderRadius: "6px" }} />
                ) : (
                  <Flame size={32} fill="currentColor" />
                )}
              </div>
              <h2 className="brand-name">{config?.brand?.title || "Safeway"}</h2>
              <p className="brand-tagline">{config?.brand?.subtitle || "Enquiry Management System"}</p>
            </div>

            {error && (
              <div className="alert-banner">
                <ShieldAlert size={18} className="alert-icon" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Mobile Number Input */}
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  Mobile Number
                </label>
                <div className="input-container">
                  <input
                    type="tel"
                    id="username"
                    className="form-input"
                    placeholder="Enter registered mobile"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <Phone size={18} className="input-icon" />
                </div>
              </div>

              {/* Password Input */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <Lock size={18} className="input-icon" />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="submit-btn"
                disabled={loading || !username || !password}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Authenticating...
                  </>
                ) : (
                  <>
                    Log In
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
