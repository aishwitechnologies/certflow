"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ShieldCheck, Award, CheckCircle2, AlertTriangle, XCircle, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function DirectVerifyPage() {
  const params = useParams();
  const certId = (params?.id as string) || "";
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!certId) return;

    fetch(`/api/verify?id=${encodeURIComponent(certId)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 404) {
            setResult({ notFound: true, searchedId: certId });
          } else {
            throw new Error(data.error || "Verification lookup failed");
          }
        } else {
          setResult(data);
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [certId]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-800">
        <Link href="/verify" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-white text-lg tracking-tight block">CertFlow</span>
            <span className="text-xs text-indigo-400 block font-medium">Public Verification Portal</span>
          </div>
        </Link>
        <Link
          href="/verify"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Search Another ID
        </Link>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto w-full my-8">
        <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-slate-700/60 shadow-2xl">
          {loading ? (
            <div className="py-16 text-center space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto" />
              <p className="text-sm text-slate-400">Verifying Certificate ID: {certId}...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm text-center">
              {error}
            </div>
          ) : result && result.found && result.status === "VALID" ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-emerald-400 border-b border-emerald-900/40 pb-6">
                <CheckCircle2 className="w-10 h-10 shrink-0 text-emerald-400" />
                <div>
                  <h1 className="text-2xl font-extrabold uppercase tracking-wide text-white">
                    ✓ Certificate Verified
                  </h1>
                  <p className="text-xs text-emerald-300/80">
                    Official authentic document issued by {result.organizationName}
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm divide-y divide-slate-700/60">
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Certificate ID</span>
                  <span className="font-mono font-bold text-indigo-400 text-base">{result.certificateId}</span>
                </div>
                <div className="pt-3 flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Candidate</span>
                  <span className="font-bold text-white text-base">{result.candidateName}</span>
                </div>
                <div className="pt-3 flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Program</span>
                  <span className="font-semibold text-slate-200 text-right">{result.programName}</span>
                </div>
                <div className="pt-3 flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Organization</span>
                  <span className="text-slate-200">{result.organizationName}</span>
                </div>
                <div className="pt-3 flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Issue Date</span>
                  <span className="text-slate-200">{formatDate(result.issueDate)}</span>
                </div>
                <div className="pt-3 flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Status</span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Valid
                  </span>
                </div>
              </div>

              {result.pdfPath && (
                <div className="mt-8 pt-6 border-t border-slate-700/60 text-center">
                  <a
                    href={result.pdfPath}
                    target="_blank"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition"
                  >
                    <Download className="w-4 h-4" /> Download Certificate PDF
                  </a>
                </div>
              )}
            </div>
          ) : result && result.found && result.status === "REVOKED" ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-rose-400 border-b border-rose-900/40 pb-6">
                <AlertTriangle className="w-10 h-10 shrink-0 text-rose-400" />
                <div>
                  <h1 className="text-2xl font-extrabold uppercase tracking-wide text-white">
                    ⚠ Certificate Revoked
                  </h1>
                  <p className="text-xs text-rose-300/80">
                    This certificate was formally invalidated by the issuing organization.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm divide-y divide-slate-700/60">
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Certificate ID</span>
                  <span className="font-mono font-bold text-rose-400 text-base">{result.certificateId}</span>
                </div>
                <div className="pt-3 flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Candidate Name</span>
                  <span className="font-bold text-white">{result.candidateName}</span>
                </div>
                <div className="pt-3 flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Status</span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
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
          ) : (
            <div className="py-12 text-center space-y-3">
              <XCircle className="w-12 h-12 text-rose-400 mx-auto" />
              <h2 className="text-lg font-bold text-white">No Certificate Found</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No certificate record was found for ID <span className="font-mono text-indigo-400 font-bold">{certId}</span>.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center text-xs text-slate-500 py-4">
        Protected by CertFlow Anti-Tamper Verification Engine • Zero QR dependency • Powered by Atomic Sequence ID
      </footer>
    </div>
  );
}
