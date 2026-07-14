"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EMS_CONFIG } from "@/config/ems-config";
import { Phone, Lock, Eye, EyeOff, ArrowRight, Flame, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  
  // Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already authenticated, if so, redirect immediately
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            if (data.user.role === "ADMIN") {
              router.push("/admin/enquiry");
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
  }, [router]);

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
        router.push("/admin/enquiry");
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
    <div className="login-wrapper">
      {/* Background Animated Glows */}
      <div className="glow-spot glow-spot-1"></div>
      <div className="glow-spot glow-spot-2"></div>

      {/* Left Visual Pane (Tech Background & Dynamic Slogan) */}
      <div className="visual-pane">
        <img
          className="visual-image"
          src="/login-bg.png"
          alt="Technician inspecting fire extinguisher cylinder"
        />
        <div className="visual-overlay"></div>
        
        <div className="visual-content">
          <div className="brand-badge">
            <Flame size={14} fill="currentColor" />
            Fire Safety Management
          </div>
          <h1 className="visual-title">
            Streamlining Compliance & Maintenance.
          </h1>
          <p className="visual-desc">
            A comprehensive, customizable ERP tool designed to automate cylinder tracking, pressure test validation, refilling schedules, and field inspections.
          </p>
        </div>
      </div>

      {/* Right Form Pane */}
      <div className="form-pane">
        <div className="login-card">
          <div className="brand-header">
            <div className="brand-logo-container">
              <Flame size={32} fill="currentColor" />
            </div>
            <h2 className="brand-name">{EMS_CONFIG.brand.title}</h2>
            <p className="brand-tagline">{EMS_CONFIG.brand.subtitle}</p>
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
  );
}
