"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const SUPABASE_URL = "https://hkuaavitsubnzkfcrqpr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_6_2M4HyHMJ567ki4PEwwXQ_Hd56or6l";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function HazardCapturePage() {
  const [description, setDescription] = useState("");
  const [riskLevel, setRiskLevel] = useState("Medium");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return alert("Please enter a hazard description.");

    try {
      setUploading(true);
      setSuccessMsg("");
      let photoUrl = "";

      // 1. Upload photo if selected
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("hazards")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("hazards")
          .getPublicUrl(filePath);

        photoUrl = publicUrlData.publicUrl;
      }

      // 2. Insert record into database table
      const { error: dbError } = await supabase.from("audit_reports").insert([
        {
          hazard_description: description,
          risk_level: riskLevel,
          photo_url: photoUrl,
          status: "Open",
        },
      ]);

      if (dbError) throw dbError;

      setSuccessMsg("Hazard successfully logged & synced to Supabase!");
      setDescription("");
      setFile(null);
    } catch (error: any) {
      alert("Error logging hazard: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto p-6 bg-slate-900 text-slate-100 min-h-screen">
      <h1 className="text-xl font-bold mb-4 text-emerald-400">Plant EHS Hazard Logger</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Snap / Select Photo</label>
          <input
            type="file"
            accept="image/*"
            capture="environment" // Opens phone camera directly on mobile devices!
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-500 file:text-slate-950 hover:file:bg-emerald-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Hazard Description / Voice Note</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Boxes blocking fire exit near Bay 4..."
            className="w-full p-3 rounded bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Risk Severity</label>
          <select
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value)}
            className="w-full p-3 rounded bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
          >
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk (Critical)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full py-3 bg-emerald-500 text-slate-950 font-bold rounded hover:bg-emerald-400 transition disabled:opacity-50"
        >
          {uploading ? "Saving to Cloud..." : "Submit Hazard Report"}
        </button>

        {successMsg && (
          <p className="text-emerald-400 text-sm font-medium text-center mt-2">{successMsg}</p>
        )}
      </form>
    </main>
  );
}