"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Search, Award, CheckCircle2, AlertTriangle, XCircle, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function PublicVerifyPage() {
  const router = useRouter();
  const [certId, setCertId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certId.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/verify?id=${encodeURIComponent(certId.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 404) {
          setResult({ notFound: true, searchedId: certId.trim() });
        } else {
          throw new Error(data.error || "Verification failed");
        }
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Aishwi Technologies"
            className="w-10 h-10 object-contain rounded-xl bg-white p-0.5 shadow-md"
          />
          <div>
            <span className="font-bold text-white text-lg tracking-tight block">Aishwi Technologies</span>
            <span className="text-xs text-blue-400 block font-medium">Public Verification Portal</span>
          </div>
        </div>
        <a
          href="/login"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition"
        >
          Admin Portal
        </a>
      </header>

      {/* Main Verification Card */}
      <main className="max-w-2xl mx-auto w-full my-8">
        <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-slate-700/60 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-3 border border-indigo-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Verify Certificate Authenticity
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              Enter the unique Certificate ID printed on the certificate to authenticate credentials.
            </p>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
                placeholder="e.g. AT-10-01"
                required
                className="block w-full pl-11 pr-32 py-3.5 bg-slate-900 border border-slate-700 rounded-2xl text-white placeholder-slate-500 font-mono text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="absolute inset-y-1.5 right-1.5 flex items-center">
                <button
                  type="submit"
                  disabled={loading || !certId.trim()}
                  className="h-full px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify"}
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
              {error}
            </div>
          )}

          {/* VERIFIED: VALID */}
          {result && result.found && result.status === "VALID" && (
            <div className="mt-8 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 text-emerald-400 mb-6">
                <CheckCircle2 className="w-8 h-8 shrink-0" />
                <div>
                  <span className="text-lg font-extrabold uppercase tracking-wide block">
                    ✓ Certificate Verified
                  </span>
                  <span className="text-xs text-emerald-300/80">
                    Official authentic document issued by {result.organizationName}
                  </span>
                </div>
              </div>

              <div className="space-y-4 text-sm divide-y divide-emerald-900/40">
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Certificate ID</span>
                  <span className="font-mono font-bold text-white text-base">{result.certificateId}</span>
                </div>
                <div className="pt-3 flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Candidate Name</span>
                  <span className="font-bold text-white text-base">{result.candidateName}</span>
                </div>
                <div className="pt-3 flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Program</span>
                  <span className="font-semibold text-indigo-300 text-right">{result.programName}</span>
                </div>
                <div className="pt-3 flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Issuing Organization</span>
                  <span className="text-slate-200">{result.organizationName}</span>
                </div>
                <div className="pt-3 flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Issue Date</span>
                  <span className="text-slate-200">{formatDate(result.issueDate)}</span>
                </div>
                <div className="pt-3 flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Status</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Valid
                  </span>
                </div>
              </div>

              {result.pdfPath && (
                <div className="mt-6 pt-4 border-t border-emerald-900/60 text-center">
                  <a
                    href={result.pdfPath}
                    target="_blank"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
                  >
                    <Download className="w-4 h-4" /> Download Certificate PDF
                  </a>
                </div>
              )}
            </div>
          )}

          {/* VERIFIED: REVOKED */}
          {result && result.found && result.status === "REVOKED" && (
            <div className="mt-8 bg-rose-950/40 border border-rose-500/40 rounded-2xl p-6 sm:p-8 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 text-rose-400 mb-6">
                <AlertTriangle className="w-8 h-8 shrink-0" />
                <div>
                  <span className="text-lg font-extrabold uppercase tracking-wide block">
                    ⚠ Certificate Revoked
                  </span>
                  <span className="text-xs text-rose-300/80">
                    This certificate has been formally revoked and is invalid.
                  </span>
                </div>
              </div>

              <div className="space-y-4 text-sm divide-y divide-rose-900/40">
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Certificate ID</span>
                  <span className="font-mono font-bold text-white text-base">{result.certificateId}</span>
                </div>
                <div className="pt-3 flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Candidate Name</span>
                  <span className="font-bold text-white">{result.candidateName}</span>
                </div>
                <div className="pt-3 flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Status</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Revoked
                  </span>
                </div>
                {result.revocation && (
                  <>
                    <div className="pt-3 flex justify-between items-center">
                      <span className="text-slate-400 text-xs">Revocation Reason</span>
                      <span className="text-rose-200 text-right">{result.revocation.reason}</span>
                    </div>
                    <div className="pt-3 flex justify-between items-center">
                      <span className="text-slate-400 text-xs">Revocation Date</span>
                      <span className="text-slate-300">{formatDate(result.revocation.revokedAt)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* NOT FOUND */}
          {result && result.notFound && (
            <div className="mt-8 bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 text-center animate-in fade-in duration-300">
              <XCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No Certificate Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No certificate record was found matching ID:{" "}
                <span className="font-mono font-bold text-indigo-400">{result.searchedId}</span>. Please verify
                the ID and try again.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center text-xs text-slate-500 py-4">
        Protected by Aishwi Technologies Anti-Tamper Verification Engine • Zero QR dependency • Powered by Atomic Sequence ID
      </footer>
    </div>
  );
}
