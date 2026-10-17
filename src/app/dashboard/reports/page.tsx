"use client";

import { useEffect, useState } from "react";
import { BarChart3, Download, Award, ShieldCheck, AlertTriangle } from "lucide-react";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  const exportCSV = () => {
    if (!data?.programsBreakdown) return;
    const rows = [
      ["Program Name", "Certificates Generated"],
      ...data.programsBreakdown.map((p: any) => [p.name, p.count]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Aishwi_Technologies_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading reports data...</div>;
  }

  const m = data?.metrics || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics & Reports</h1>
          <p className="text-sm text-slate-500 mt-1">
            Audit-grade reporting on certificate issuance, program distribution, and verification volumes.
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-md shadow-indigo-600/20 transition self-start"
        >
          <Download className="w-4 h-4" /> Export Summary CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Issuance</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{m.totalCertificates}</p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <span>This Month</span>
            <span className="font-bold text-slate-800">{m.monthCertificates}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Verification Volume</span>
          <p className="text-3xl font-extrabold text-indigo-600 mt-2">{m.totalVerifications}</p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <span>Valid Records</span>
            <span className="font-bold text-emerald-600">{m.validCertificates}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Revocation Rate</span>
          <p className="text-3xl font-extrabold text-rose-600 mt-2">{m.revokedCertificates}</p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <span>Failed Batches</span>
            <span className="font-bold text-slate-800">{m.failedBatchesCount}</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4">Program Breakdown Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Program Name</th>
                <th className="py-2.5 px-4 text-right">Certificates Issued</th>
                <th className="py-2.5 px-4 text-right">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.programsBreakdown?.map((p: any) => {
                const total = m.totalCertificates || 1;
                const pct = ((p.count / total) * 100).toFixed(1);
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-800">{p.name}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{p.count}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
