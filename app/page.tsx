"use client";

import { useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hkuaavitsubnzkfcrqpr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_6_2M4HyHMJ567ki4PEwwXQ_Hd56or6l";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function HazardCapturePage() {
  const [description, setDescription] = useState("");
  const [riskLevel, setRiskLevel] = useState("High");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    setSuccessMsg("");

    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const res = await fetch("/api/analyze-hazard", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Local plant gateway communication failed");

      const data = await res.json();
      if (data.analysis) {
        setDescription(data.analysis);
        const lower = data.analysis.toLowerCase();
        if (lower.includes("high")) setRiskLevel("High");
        else if (lower.includes("low")) setRiskLevel("Low");
        else setRiskLevel("Medium");
      }
    } catch (err) {
      console.error("Local plant AI analysis error:", err);
      setDescription("Failed to generate local AI summary. Please fill in manually.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return alert("Please enter or generate a hazard description.");

    try {
      setUploading(true);
      setSuccessMsg("");
      let photoUrl = "";

      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("hazards")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("hazards")
          .getPublicUrl(fileName);

        photoUrl = publicUrlData.publicUrl;
      }

      const { error: dbError } = await supabase.from("audit_reports").insert([
        {
          hazard_description: description,
          risk_level: riskLevel,
          photo_url: photoUrl,
          status: "Open",
        },
      ]);

      if (dbError) throw dbError;

      setSuccessMsg("⚡ EHS Incident Report Logged via Local Plant Gateway!");
      setDescription("");
      setFile(null);
      setPreviewUrl(null);
    } catch (error: any) {
      alert("Error logging hazard: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#020617", color: "#f8fafc", padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      
      {/* Header */}
      <div style={{ width: "100%", maxWidth: "500px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "between", borderBottom: "1px solid #1e293b", paddingBottom: "16px" }}>
        <div>
          <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#34d399", backgroundColor: "#064e3b", padding: "4px 8px", borderRadius: "6px", border: "1px solid #065f46" }}>
            Plant EHS • Air-Gapped Gateway
          </span>
          <h1 style={{ fontSize: "24px", fontWeight: "900", color: "#ffffff", margin: "8px 0 0 0", letterSpacing: "-0.025em" }}>
            Edge Intelligence
          </h1>
        </div>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(52, 211, 153, 0.1)", border: "1px solid rgba(52, 211, 153, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#34d399", fontWeight: "bold", fontSize: "14px" }}>
          RK
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: "500px", display: "flex", flexDirection: "column", gap: "20px", backgroundColor: "#0f172a", border: "1px solid #1e293b", padding: "24px", borderRadius: "16px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)" }}>
        
        {/* Step 1 */}
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", marginBottom: "8px" }}>
            1. Secure Local Capture
          </label>
          
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          {previewUrl ? (
            <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid #334155", backgroundColor: "#020617" }}>
              <img src={previewUrl} alt="Hazard Preview" style={{ width: "100%", height: "220px", objectFit: "cover", opacity: 0.9 }} />
              {analyzing && (
                <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(2, 6, 23, 0.85)", backdropFilter: "blur(4px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <div style={{ width: "24px", height: "24px", border: "2px solid #34d399", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                  <p style={{ fontSize: "12px", fontWeight: "600", color: "#34d399", margin: 0 }}>Analyzing via Local Plant Server...</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ position: "absolute", bottom: "12px", right: "12px", backgroundColor: "#0f172a", color: "#f1f5f9", fontSize: "11px", fontWeight: "500", padding: "6px 12px", borderRadius: "8px", border: "1px solid #334155", cursor: "pointer" }}
              >
                Retake Photo
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ width: "100%", height: "140px", border: "2px dashed #334155", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", backgroundColor: "rgba(2, 6, 23, 0.5)", cursor: "pointer", transition: "border-color 0.2s" }}
            >
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#020617", border: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                🔒
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "13px", fontWeight: "500", color: "#f1f5f9", margin: 0 }}>Tap to Scan Incident</p>
                <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>Processed 100% on local plant network</p>
              </div>
            </button>
          )}
        </div>

        {/* Step 2 */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <label style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8" }}>
              2. Local AI Incident Report
            </label>
            {analyzing && <span style={{ fontSize: "10px", color: "#34d399" }}>Generating report...</span>}
          </div>
          <textarea
            rows={7}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed incident analysis will populate here..."
            style={{ width: "100%", padding: "12px", borderRadius: "10px", backgroundColor: "#020617", border: "1px solid #1e293b", color: "#f8fafc", fontSize: "12px", fontFamily: "monospace", outline: "none", lineHeight: "1.5", boxSizing: "border-box" }}
          />
        </div>

        {/* Step 3 */}
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", marginBottom: "8px" }}>
            3. Risk Classification Level
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            {["Low", "Medium", "High"].map((level) => {
              const isSelected = riskLevel === level;
              let bg = "#020617";
              let border = "#1e293b";
              let color = "#94a3b8";

              if (isSelected) {
                if (level === "High") { bg = "rgba(244, 63, 94, 0.15)"; border = "#f43f5e"; color = "#fb7185"; }
                else if (level === "Medium") { bg = "rgba(245, 158, 11, 0.15)"; border = "#f59e0b"; color = "#fbbf24"; }
                else { bg = "rgba(16, 185, 129, 0.15)"; border = "#10b981"; color = "#34d399"; }
              }

              return (
                <button
                  type="button"
                  key={level}
                  onClick={() => setRiskLevel(level)}
                  style={{ padding: "10px", borderRadius: "10px", fontSize: "12px", fontWeight: "700", backgroundColor: bg, border: `1px solid ${border}`, color: color, cursor: "pointer", transition: "all 0.2s" }}
                >
                  {level} Risk
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={uploading || analyzing}
          style={{ width: "100%", padding: "14px", backgroundColor: "#10b981", color: "#020617", fontWeight: "800", fontSize: "14px", borderRadius: "10px", border: "none", cursor: "pointer", boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.3)", opacity: (uploading || analyzing) ? 0.5 : 1 }}
        >
          {uploading ? "Syncing Report..." : "Submit Incident Report →"}
        </button>

        {successMsg && (
          <div style={{ padding: "12px", backgroundColor: "rgba(6, 78, 59, 0.6)", border: "1px solid #065f46", borderRadius: "10px", textAlign: "center" }}>
            <p style={{ color: "#34d399", fontSize: "12px", fontWeight: "600", margin: 0 }}>{successMsg}</p>
          </div>
        )}
      </form>
    </main>
  );
}