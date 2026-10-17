"use client";

import { useEffect, useState } from "react";
import { Settings, Save, CheckCircle2, Shield, Key } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [orgName, setOrgName] = useState("");
  const [website, setWebsite] = useState("");
  const [idConfig, setIdConfig] = useState({
    prefix: "AT",
    separator: "-",
    includeYear: false,
    includeMonth: true,
    padding: 2,
    monthlyReset: true,
  });
  const [previewSampleId, setPreviewSampleId] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.organization) {
          setOrgName(d.organization.name || "");
          setWebsite(d.organization.website || "");
        }
        if (d.idConfig) {
          setIdConfig(d.idConfig);
        }
        if (d.previewSampleId) {
          setPreviewSampleId(d.previewSampleId);
        }
        setLoading(false);
      });
  }, []);

  // Compute live preview
  useEffect(() => {
    const parts = [idConfig.prefix];
    const now = new Date();
    if (idConfig.includeYear) {
      parts.push(String(now.getFullYear()));
    }
    if (idConfig.includeMonth) {
      parts.push(String(now.getMonth() + 1).padStart(2, "0"));
    }
    parts.push(String(1).padStart(idConfig.padding, "0"));
    setPreviewSampleId(parts.join(idConfig.separator));
  }, [idConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError("");

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName,
          website,
          idConfig,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settings");

      setSuccess(true);
      if (data.previewSampleId) setPreviewSampleId(data.previewSampleId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System & ID Configuration</h1>
        <p className="text-sm text-slate-500 mt-1">
          Customize organization credentials and the atomic Certificate ID sequence formula.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Settings successfully updated and applied to next certificate generation batch.</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Certificate ID Format Engine */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Certificate ID Format Engine</h2>
              <p className="text-xs text-slate-500">
                Concurrency-safe sequence configuration guaranteeing unique certificate identification.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Live ID Preview</span>
              <span className="font-mono text-base font-extrabold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 block mt-0.5">
                {previewSampleId}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Prefix</label>
              <input
                type="text"
                required
                value={idConfig.prefix}
                onChange={(e) => setIdConfig({ ...idConfig, prefix: e.target.value.toUpperCase() })}
                placeholder="AT"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">e.g. AT, AISHWI, CERT</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Separator</label>
              <input
                type="text"
                required
                value={idConfig.separator}
                onChange={(e) => setIdConfig({ ...idConfig, separator: e.target.value })}
                placeholder="-"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">e.g. - or /</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Sequence Zero-Padding</label>
              <select
                value={idConfig.padding}
                onChange={(e) => setIdConfig({ ...idConfig, padding: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              >
                <option value={2}>2 digits (01, 02... 99)</option>
                <option value={3}>3 digits (001, 002... 999)</option>
                <option value={4}>4 digits (0001...)</option>
                <option value={5}>5 digits (00001...)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Monthly Reset Mode</label>
              <select
                value={String(idConfig.monthlyReset)}
                onChange={(e) => setIdConfig({ ...idConfig, monthlyReset: e.target.value === "true" })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              >
                <option value="true">Reset sequence to 01 each month</option>
                <option value="false">Global incremental sequence (never resets)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-6 pt-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={idConfig.includeMonth}
                onChange={(e) => setIdConfig({ ...idConfig, includeMonth: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium text-slate-700">Include 2-Digit Generation Month (MM)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={idConfig.includeYear}
                onChange={(e) => setIdConfig({ ...idConfig, includeYear: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium text-slate-700">Include 4-Digit Year (YYYY)</span>
            </label>
          </div>
        </div>

        {/* Organization Information */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Organization Profile
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Company / Organization Name</label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Official Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving Configuration..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
