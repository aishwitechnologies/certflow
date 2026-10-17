"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Search, ExternalLink, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function VerificationDashboardPage() {
  const [testId, setTestId] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTestVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testId.trim()) return;
    setLoading(true);
    setTestResult(null);

    try {
      const res = await fetch(`/api/verify?id=${encodeURIComponent(testId.trim())}`);
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ error: "Failed to connect to verification API" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Public Verification Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor public certificate queries, inspect verification logs, and test verification responses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification Simulator */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Certificate ID Verification Simulator</h2>
              <p className="text-xs text-slate-500">Test how a certificate ID resolves for external verifiers.</p>
            </div>
          </div>

          <form onSubmit={handleTestVerify} className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={testId}
                onChange={(e) => setTestId(e.target.value)}
                placeholder="Enter Certificate ID e.g. AT-10-01"
                className="w-full pl-9 pr-24 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={loading || !testId.trim()}
                className="absolute right-1.5 top-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                {loading ? "Testing..." : "Test"}
              </button>
            </div>
          </form>

          {testResult && (
            <div className="p-4 rounded-xl border text-xs space-y-2 bg-slate-50 border-slate-200">
              <div className="flex items-center justify-between font-bold">
                <span>Result Status:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    testResult.status === "VALID"
                      ? "bg-emerald-100 text-emerald-800"
                      : testResult.status === "REVOKED"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {testResult.status || "NOT_FOUND"}
                </span>
              </div>
              {testResult.candidateName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Candidate:</span>
                  <span className="font-semibold text-slate-800">{testResult.candidateName}</span>
                </div>
              )}
              {testResult.programName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Program:</span>
                  <span className="font-semibold text-slate-800">{testResult.programName}</span>
                </div>
              )}
            </div>
          )}

          <div className="pt-2">
            <Link
              href="/verify"
              target="_blank"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1.5"
            >
              Open Live Public Verification Page <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Security / QR-free Guarantee Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Security Protocol
            </span>
            <h3 className="text-lg font-bold">ID-Exclusive Anti-Tamper Verification</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              In accordance with strict operational specifications, QR codes are completely omitted from
              generated documents. All authenticity checks are executed directly against the atomic sequence
              registry via unique Certificate IDs.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
            Public verification URL structure: <code className="text-indigo-400 font-mono">/verify/[ID]</code>
          </div>
        </div>
      </div>
    </div>
  );
}
