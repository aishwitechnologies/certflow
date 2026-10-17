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
  Eye,
  Plus,
  Sparkles,
  Printer,
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
  const [viewModalCert, setViewModalCert] = useState<any | null>(null);
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
            Search, view, download, regenerate, and manage all issued credentials.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/certificates/generate?mode=single"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-indigo-600 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Issue Single Certificate
          </Link>
          <Link
            href="/dashboard/certificates/generate"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition"
          >
            <Sparkles className="w-4 h-4" /> Generate Batch
          </Link>
        </div>
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
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewModalCert(cert)}
                          title="View Certificate (Admin Preview)"
                          className="p-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={`/api/certificates/${cert.id}/pdf?download=true`}
                          title="Download PDF"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>

                        <Link
                          href={`/verify/${cert.certificateId}`}
                          target="_blank"
                          title="Public Verification"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition"
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

      {/* Admin Certificate Viewer Modal */}
      {viewModalCert && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-indigo-400">
                      {viewModalCert.certificateId}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        viewModalCert.status === "VALID"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {viewModalCert.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white truncate max-w-md">
                    {viewModalCert.candidateName} — {viewModalCert.program?.name || "Program"}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/api/certificates/${viewModalCert.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  title="Open in new window"
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs font-medium flex items-center gap-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">New Tab</span>
                </a>

                <a
                  href={`/api/certificates/${viewModalCert.id}/pdf?download=true`}
                  title="Download PDF"
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs font-medium flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </a>

                <button
                  onClick={() => setViewModalCert(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Embedded PDF Iframe & Info */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-100">
              {/* PDF Viewer Frame */}
              <div className="bg-white rounded-2xl border border-slate-300 shadow-md overflow-hidden">
                <iframe
                  src={`/api/certificates/${viewModalCert.id}/pdf`}
                  title="Certificate PDF Preview"
                  className="w-full h-[58vh] rounded-2xl"
                />
              </div>

              {/* Certificate Metadata Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Candidate Name</span>
                  <span className="font-bold text-slate-800">{viewModalCert.candidateName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">College / Institution</span>
                  <span className="font-semibold text-slate-700">{viewModalCert.collegeName || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Department</span>
                  <span className="font-semibold text-slate-700">{viewModalCert.department || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Domain / Specialization</span>
                  <span className="font-semibold text-slate-700">{viewModalCert.domain || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Program</span>
                  <span className="font-semibold text-slate-700">{viewModalCert.program?.name || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Issue Date</span>
                  <span className="font-semibold text-slate-700">{formatDate(viewModalCert.issueDate)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Public Verifications</span>
                  <span className="font-bold text-indigo-600 font-mono">{viewModalCert.verificationCount} times</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Verification Link</span>
                  <Link
                    href={`/verify/${viewModalCert.certificateId}`}
                    target="_blank"
                    className="text-indigo-600 hover:underline font-semibold font-mono"
                  >
                    /verify/{viewModalCert.certificateId} ↗
                  </Link>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Official issued certificate by <strong>Aishwi Technologies</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewModalCert(null)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition"
                >
                  Close Viewer
                </button>
                <a
                  href={`/api/certificates/${viewModalCert.id}/pdf?download=true`}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download Certificate
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
