"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Search, Award, ExternalLink, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCandidates = () => {
    setLoading(true);
    fetch(`/api/candidates?search=${encodeURIComponent(search)}`)
      .then((r) => r.json())
      .then((d) => {
        setCandidates(d.candidates || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCandidates();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Candidates Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Recipients, academic affiliations, domain tracks, and certificate issuance history.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSearch} className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate name, email, college..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Institution / Department</th>
                <th className="py-3 px-4">Enrolled Program</th>
                <th className="py-3 px-4">Domain</th>
                <th className="py-3 px-4">Certificate History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2" />
                    Loading candidates...
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No candidates found.
                  </td>
                </tr>
              ) : (
                candidates.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{c.name}</span>
                      <span className="text-[11px] text-slate-500">{c.email}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{c.college || "N/A"}</div>
                      <div className="text-[11px] text-slate-400">{c.department || "General"}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {c.program?.name || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {c.domain || "Technology"}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.certificates?.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {c.certificates.map((cert: any) => (
                            <Link
                              key={cert.id}
                              href={`/verify/${cert.certificateId}`}
                              target="_blank"
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                                cert.status === "VALID"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                  : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                              }`}
                            >
                              <Award className="w-3 h-3" />
                              <span>{cert.certificateId}</span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No certificates yet</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
