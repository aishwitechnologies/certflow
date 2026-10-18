"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  Building,
  GraduationCap,
  Calendar,
  X,
  ExternalLink,
  Sparkles,
  Award,
  Layers,
  Filter,
} from "lucide-react";

export default function HrDocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [viewPdfUrl, setViewPdfUrl] = useState<string | null>(null);
  const [activeDocName, setActiveDocName] = useState<string>("");

  const fetchDocuments = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (selectedType !== "ALL") params.set("type", selectedType);

    fetch(`/api/hr-documents?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setDocuments(d.documents || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocuments();
  };

  const countByType = (t: string) => {
    return documents.filter((d) => d.documentType === t).length;
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "OFFER_LETTER":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Offer Letter
          </span>
        );
      case "COMPLETION_LETTER":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Completion Letter
          </span>
        );
      case "EXPERIENCE_LETTER":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            Experience Letter
          </span>
        );
      case "RELIEVING_LETTER":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Relieving Letter
          </span>
        );
      case "LOR":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            Letter of Recommendation
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {type}
          </span>
        );
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-indigo-600" />
            HR Letters & Official Documentation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate and manage official Aishwi Technologies Offer Letters, Internship Completion Letters, and Experience Certificates.
          </p>
        </div>

        <Link
          href="/dashboard/hr-documents/generate"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Issue New HR Document
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total HR Documents
          </span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
            {documents.length}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block">
            Offer Letters
          </span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
            {countByType("OFFER_LETTER")}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">
            Completion Letters
          </span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
            {countByType("COMPLETION_LETTER")}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider block">
            Experience Letters
          </span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
            {countByType("EXPERIENCE_LETTER")}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Document Type Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "ALL", label: "All Documents" },
              { id: "OFFER_LETTER", label: "Offer Letters" },
              { id: "COMPLETION_LETTER", label: "Completion Letters" },
              { id: "EXPERIENCE_LETTER", label: "Experience Letters" },
              { id: "RELIEVING_LETTER", label: "Relieving Letters" },
              { id: "LOR", label: "LOR" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  selectedType === tab.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidate, role, ref ID..."
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium w-64 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading official HR records...
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-base">No HR Documents Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No letters match your selected filter. Generate your first official Offer Letter, Completion Letter, or Experience Certificate now.
            </p>
            <Link
              href="/dashboard/hr-documents/generate"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow transition"
            >
              <Plus className="w-3.5 h-3.5" /> Issue HR Document
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Candidate & College</th>
                  <th className="py-3 px-4">Document Type</th>
                  <th className="py-3 px-4">Role / Department</th>
                  <th className="py-3 px-4">Reference ID</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block text-sm">
                        {doc.candidateName}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate max-w-xs">
                        {doc.collegeName || doc.candidateEmail || "Aishwi Technologies"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{getTypeBadge(doc.documentType)}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">{doc.roleTitle}</span>
                      <span className="text-[11px] text-slate-400 block">{doc.departmentName || "Engineering"}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-[11px]">
                        {doc.documentId}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{formatDate(doc.issueDate)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setViewPdfUrl(`/api/hr-documents/${doc.documentId}/pdf`);
                            setActiveDocName(`${doc.candidateName} - ${doc.documentType}`);
                          }}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                          title="View Official Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a
                          href={`/api/hr-documents/${doc.documentId}/pdf?download=true`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold text-[11px] transition"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* In-App Document Viewer Modal */}
      {viewPdfUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span className="font-bold text-sm tracking-tight">{activeDocName}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={viewPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-400 hover:text-white flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-700"
                >
                  Full Screen <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => setViewPdfUrl(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <iframe
              src={viewPdfUrl}
              title="Official HR Document"
              className="w-full h-[75vh] bg-slate-100"
            />
          </div>
        </div>
      )}
    </div>
  );
}
