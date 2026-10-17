"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Download,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Edit3,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Modals state
  const [revokeModalCert, setRevokeModalCert] = useState<any | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [regenerateModalCert, setRegenerateModalCert] = useState<any | null>(null);
  const [regenData, setRegenData] = useState({ candidateName: "", collegeName: "", department: "" });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCertificates = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(pagination.page),
      limit: "15",
      search,
      programId: selectedProgram,
      status: selectedStatus,
    });

    fetch(`/api/certificates?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setCertificates(data.certificates || []);
        if (data.pagination) setPagination(data.pagination);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetch("/api/programs")
      .then((r) => r.json())
      .then((d) => setPrograms(d.programs || []));
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [pagination.page, selectedProgram, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchCertificates();
  };

  const handleRevoke = async () => {
    if (!revokeModalCert) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/certificates/${revokeModalCert.id}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: revokeReason }),
      });
      if (!res.ok) throw new Error("Revocation failed");
      setRevokeModalCert(null);
      setRevokeReason("");
      fetchCertificates();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!regenerateModalCert) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/certificates/${regenerateModalCert.id}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regenData),
      });
      if (!res.ok) throw new Error("Regeneration failed");
      setRegenerateModalCert(null);
      fetchCertificates();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Certificates Registry</h1>
          <p className="text-sm text-slate-500 mt-1">
            Search, download, regenerate, and manage all issued credentials.
          </p>
        </div>
        <Link
          href="/dashboard/certificates/generate"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-md shadow-indigo-600/20 transition self-start"
        >
          + Generate New Batch
        </Link>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, name, college..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
          >
            <option value="ALL">All Programs</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="VALID">Valid</option>
            <option value="REVOKED">Revoked</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Certificate ID</th>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Program</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Verifications</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2" />
                    Loading certificates...
                  </td>
                </tr>
              ) : certificates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No certificates found matching criteria.
                  </td>
                </tr>
              ) : (
                certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                      {cert.certificateId}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">{cert.candidateName}</span>
                      <span className="text-[11px] text-slate-500">{cert.collegeName || "N/A"}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {cert.program?.name || "Program"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {formatDate(cert.issueDate)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          cert.status === "VALID"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {cert.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                      {cert.verificationCount}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {cert.pdfPath && (
                          <a
                            href={cert.pdfPath}
                            target="_blank"
                            title="Download PDF"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-indigo-600"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <Link
                          href={`/verify/${cert.certificateId}`}
                          target="_blank"
                          title="Public Verification"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-indigo-600"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          onClick={() => {
                            setRegenerateModalCert(cert);
                            setRegenData({
                              candidateName: cert.candidateName,
                              collegeName: cert.collegeName || "",
                              department: cert.department || "",
                            });
                          }}
                          title="Regenerate Certificate"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-amber-600"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        {cert.status === "VALID" && (
                          <button
                            onClick={() => setRevokeModalCert(cert)}
                            title="Revoke Certificate"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
            </span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Revocation Modal */}
      {revokeModalCert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 font-bold">
                <AlertTriangle className="w-5 h-5" />
                <span>Revoke Certificate</span>
              </div>
              <button onClick={() => setRevokeModalCert(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              You are about to formally invalidate Certificate{" "}
              <strong className="font-mono text-slate-900">{revokeModalCert.certificateId}</strong> issued to{" "}
              <strong>{revokeModalCert.candidateName}</strong>. The public verification page will mark this
              certificate as revoked.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Reason for Revocation
              </label>
              <textarea
                rows={3}
                required
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="e.g. Incomplete internship requirements, administrative error, or disciplinary action."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRevokeModalCert(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                disabled={actionLoading || !revokeReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {actionLoading ? "Revoking..." : "Confirm Revocation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regeneration Modal */}
      {regenerateModalCert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600 font-bold">
                <RefreshCw className="w-5 h-5" />
                <span>Regenerate Certificate</span>
              </div>
              <button onClick={() => setRegenerateModalCert(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Correct typographical mistakes or update details for Certificate{" "}
              <strong className="font-mono text-slate-900">{regenerateModalCert.certificateId}</strong>. A new
              PDF will be generated and historical audit trails will be preserved.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Candidate Full Name</label>
                <input
                  type="text"
                  value={regenData.candidateName}
                  onChange={(e) => setRegenData({ ...regenData, candidateName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">College / Institution</label>
                <input
                  type="text"
                  value={regenData.collegeName}
                  onChange={(e) => setRegenData({ ...regenData, collegeName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={regenData.department}
                  onChange={(e) => setRegenData({ ...regenData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRegenerateModalCert(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerate}
                disabled={actionLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {actionLoading ? "Regenerating..." : "Regenerate PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
