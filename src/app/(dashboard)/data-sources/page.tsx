"use client";

import { useState } from "react";
import Link from "next/link";
import { Database, Sheet, FileSpreadsheet, Plus, ExternalLink, ArrowRight } from "lucide-react";

export default function DataSourcesPage() {
  const [googleUrl, setGoogleUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleConnectSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/google-sheets/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetUrl: googleUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Connection failed");
      setMessage(data.message || "Google Sheet verified and connected successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Sources & Connectors</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage reusable spreadsheet inputs, Google Sheets connections, and historical sync configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google Sheets Connector Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Connect Google Sheet</h2>
              <p className="text-xs text-slate-500">Live link to automatically pull spreadsheet rows.</p>
            </div>
          </div>

          <form onSubmit={handleConnectSheet} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Google Sheet URL
              </label>
              <input
                type="url"
                required
                value={googleUrl}
                onChange={(e) => setGoogleUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {message && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs">
                {message}
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
            >
              {loading ? "Testing Connection..." : "Verify & Connect Sheet"}
            </button>
          </form>
        </div>

        {/* Excel / CSV Direct Pipeline Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Direct File Upload</h2>
                <p className="text-xs text-slate-500">Instant batch generation from .xlsx, .xls, and .csv files.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Download the official template, populate candidate information, and initiate generation wizard.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex gap-3">
            <a
              href="/api/excel/template"
              className="flex-1 text-center py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Download Template
            </a>
            <Link
              href="/dashboard/certificates/generate"
              className="flex-1 text-center py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
            >
              Go to Generator
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
