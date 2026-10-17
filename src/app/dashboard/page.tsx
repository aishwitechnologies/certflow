"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  GraduationCap,
  FileCode,
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const m = data?.metrics || {};

  return (
    <div className="space-y-8">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time certificate operations, issuance pipeline, and verification statistics.
          </p>
        </div>
        <Link
          href="/dashboard/certificates/generate"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/20 text-sm transition"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate Certificates</span>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Certificates</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">{m.totalCertificates ?? 0}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span className="text-emerald-600 font-medium">+{m.todayCertificates ?? 0}</span>
            <span>generated today</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Candidates</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">{m.totalCandidates ?? 0}</p>
          <p className="text-xs text-slate-500 mt-2">Active recipients across all programs</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Valid Certificates</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-3">{m.validCertificates ?? 0}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Publicly verifiable</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Revoked Certificates</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-3">{m.revokedCertificates ?? 0}</p>
          <p className="text-xs text-slate-500 mt-2">Flagged / invalidated</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
          <span className="text-xs text-slate-500">Active Programs</span>
          <p className="text-lg font-bold text-slate-800 mt-1">{m.activeProgramsCount ?? 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
          <span className="text-xs text-slate-500">Active Templates</span>
          <p className="text-lg font-bold text-slate-800 mt-1">{m.activeTemplatesCount ?? 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
          <span className="text-xs text-slate-500">Public Verifications</span>
          <p className="text-lg font-bold text-slate-800 mt-1">{m.totalVerifications ?? 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
          <span className="text-xs text-slate-500">This Month</span>
          <p className="text-lg font-bold text-slate-800 mt-1">{m.monthCertificates ?? 0}</p>
        </div>
      </div>

      {/* Program Distribution & Recent Certificates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Program Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            Certificates by Program
          </h2>
          <div className="space-y-4">
            {data?.programsBreakdown?.map((prog: any) => {
              const total = m.totalCertificates || 1;
              const pct = Math.round((prog.count / total) * 100);
              return (
                <div key={prog.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span className="truncate">{prog.name}</span>
                    <span className="font-mono text-slate-500">{prog.count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Generated Certificates */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Recently Generated Certificates
            </h2>
            <Link
              href="/dashboard/certificates"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Certificate ID</th>
                  <th className="py-2.5 px-3">Candidate</th>
                  <th className="py-2.5 px-3">Program</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.recentCertificates?.length > 0 ? (
                  data.recentCertificates.map((cert: any) => (
                    <tr key={cert.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-mono font-semibold text-indigo-600">
                        {cert.certificateId}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900">
                        {cert.candidateName}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {cert.program?.name || "Program"}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            cert.status === "VALID"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {cert.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/verify/${cert.certificateId}`}
                          target="_blank"
                          className="text-slate-600 hover:text-indigo-600 font-medium inline-flex items-center gap-1"
                        >
                          Verify <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No certificates generated yet. Click "Generate Certificates" to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
