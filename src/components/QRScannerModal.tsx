"use client";

import React, { useState, useEffect, useRef } from "react";
import { Camera, X, Check, RefreshCw, AlertCircle, Scan } from "lucide-react";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedText: string) => void;
}

export default function QRScannerModal({ isOpen, onClose, onScan }: QRScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setError(null);
    setIsScanning(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      } else {
        setError("Camera access is not supported by this browser. Use manual input below.");
      }
    } catch (err: any) {
      console.warn("Camera access warning:", err);
      setError("Unable to access live camera stream. You can simulate scan or enter tag manually below.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const handleSimulateScan = () => {
    const sampleSerials = ["CYL-2026-8941", "FE-9921-X4", "SAFE-5582-CO2", "CYL-7740-ABC"];
    const randomCode = sampleSerials[Math.floor(Math.random() * sampleSerials.length)];
    onScan(randomCode);
    stopCamera();
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      stopCamera();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.85)",
      backdropFilter: "blur(12px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem"
    }}>
      <div style={{
        background: "#111116",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: "24px",
        width: "100%",
        maxWidth: "460px",
        padding: "1.5rem",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
        color: "#ffffff"
      }}>
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ background: "rgba(163, 230, 53, 0.15)", color: "#a3e635", padding: "8px", borderRadius: "12px" }}>
              <Scan size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", margin: 0 }}>Equipment Tag Scanner</h3>
              <p style={{ fontSize: "0.75rem", color: "#a1a1aa", margin: 0 }}>Scan Barcode / QR Tag on Cylinder or Extinguisher</p>
            </div>
          </div>
          <button 
            onClick={() => { stopCamera(); onClose(); }}
            style={{ background: "none", border: "none", color: "#a1a1aa", cursor: "pointer", padding: "4px" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Viewfinder Window */}
        <div style={{
          position: "relative",
          width: "100%",
          height: "230px",
          background: "#000000",
          borderRadius: "16px",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px dashed rgba(163, 230, 53, 0.4)",
          marginBottom: "1.25rem"
        }}>
          {stream ? (
            <video 
              ref={videoRef} 
              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
              playsInline 
              muted 
            />
          ) : (
            <div style={{ textAlign: "center", padding: "1rem" }}>
              <Camera size={40} style={{ color: "#a3e635", margin: "0 auto 8px auto", display: "block", opacity: 0.8 }} />
              <p style={{ fontSize: "0.8rem", color: "#a1a1aa", margin: 0 }}>
                {error || "Position barcode or QR tag within viewfinder frame"}
              </p>
            </div>
          )}

          {/* Animated Target Reticle Box */}
          <div style={{
            position: "absolute",
            width: "180px",
            height: "140px",
            border: "2px solid #a3e635",
            borderRadius: "12px",
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.4)",
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "6px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ width: "12px", height: "12px", borderTop: "3px solid #a3e635", borderLeft: "3px solid #a3e635" }}></div>
              <div style={{ width: "12px", height: "12px", borderTop: "3px solid #a3e635", borderRight: "3px solid #a3e635" }}></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ width: "12px", height: "12px", borderBottom: "3px solid #a3e635", borderLeft: "3px solid #a3e635" }}></div>
              <div style={{ width: "12px", height: "12px", borderBottom: "3px solid #a3e635", borderRight: "3px solid #a3e635" }}></div>
            </div>
          </div>
        </div>

        {/* Quick Demo Scan Button */}
        <button
          onClick={handleSimulateScan}
          className="btn-primary"
          style={{ width: "100%", marginBottom: "1rem", justifyContent: "center", fontSize: "0.85rem" }}
        >
          <Scan size={16} /> Auto-Detect Tag (Demo Scan)
        </button>

        {/* Manual Input Form */}
        <form onSubmit={handleManualSubmit} style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            placeholder="Or enter serial manually (e.g. CYL-2026-8941)"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "9999px",
              padding: "0.6rem 1rem",
              color: "#ffffff",
              fontSize: "0.85rem",
              outline: "none"
            }}
          />
          <button
            type="submit"
            className="btn-secondary"
            style={{ fontSize: "0.85rem", borderRadius: "9999px", padding: "0.6rem 1.1rem" }}
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
