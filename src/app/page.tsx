"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Search,
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Eye,
  ArrowRight,
  Lock,
  Mail,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Building,
  GraduationCap,
  Calendar,
  Layers,
  FileText,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  // Verification Search State
  const [certId, setCertId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Admin Login Section State (at the bottom)
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [currentSessionUser, setCurrentSessionUser] = useState<any>(null);

  // Check if already logged in
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setCurrentSessionUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  // Handle Certificate Verification Search
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
          throw new Error(data.error || "Verification failed. Please try again.");
        }
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify certificate.");
    } finally {
      setLoading(false);
    }
  };

  // Copy Verification Link
  const handleCopyLink = () => {
    if (!result?.certificateId) return;
    const url = `${window.location.origin}/verify/${result.certificateId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Quick Search Sample
  const handleQuickSearch = (sampleId: string) => {
    setCertId(sampleId);
    setLoading(true);
    setError("");
    setResult(null);

    fetch(`/api/verify?id=${encodeURIComponent(sampleId)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 404) {
            setResult({ notFound: true, searchedId: sampleId });
          } else {
            throw new Error(data.error || "Verification failed");
          }
        } else {
          setResult(data);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  // Handle Super Admin Login Form
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed. Access restricted to authorized Super Admins.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setLoginError(err.message || "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const fillSuperAdmin = (email: string, pass: string) => {
    setAdminEmail(email);
    setAdminPassword(pass);
    setLoginError("");
  };

  const formatDateStr = (dateVal: string | Date | null) => {
    if (!dateVal) return "N/A";
    return new Date(dateVal).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Glow Effects */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-600/15 via-blue-600/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Navbar */}
      <nav className="w-full border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-40 bg-slate-950/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white p-1 shadow-lg shadow-indigo-500/10 flex items-center justify-center shrink-0">
              <img
                src="/logo.png"
                alt="Aishwi Technologies Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-extrabold text-white text-base sm:text-lg tracking-tight block">
                Aishwi Technologies
              </span>
              <span className="text-[10px] sm:text-xs text-indigo-400 font-semibold tracking-wider uppercase block">
                Empowering Tomorrow, Innovating Today
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentSessionUser ? (
              <a
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition"
              >
                Dashboard ({currentSessionUser.name}) <ArrowRight className="w-3.5 h-3.5" />
              </a>
            ) : (
              <a
                href="#admin-login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold transition"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-400" /> Admin Portal
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Main Hero & Certificate Verification Section */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16 space-y-12">
        {/* Hero Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold animate-in fade-in">
            <ShieldCheck className="w-4 h-4" />
            <span>Official Credential Verification & Download Engine</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight sm:leading-none">
            Verify & Download <br />
            <span className="bg-gradient-to-r from-indigo-400 via-blue-300 to-indigo-200 bg-clip-text text-transparent">
              Authentic Certificates
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Instant, cryptographic verification for credentials issued by{" "}
            <span className="text-white font-semibold">Aishwi Technologies</span>. Enter your Certificate ID below to view verification details and download your authentic PDF.
          </p>
        </div>

        {/* Verification Search Bar */}
        <div className="max-w-2xl mx-auto w-full">
          <form
            onSubmit={handleSearch}
            className="bg-slate-900/90 backdrop-blur-xl p-2 sm:p-2.5 rounded-3xl border border-slate-700/80 shadow-2xl shadow-indigo-950/40 relative flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1 flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
                placeholder="Enter Certificate or HR Document ID (e.g. AT-10-01 or AT-HR-OL-26-001)"
                required
                className="w-full pl-12 pr-4 py-3.5 bg-transparent text-white placeholder-slate-500 font-mono text-sm sm:text-base focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !certId.trim()}
              className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Credential</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Pill */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span>Try sample credentials:</span>
            <button
              type="button"
              onClick={() => handleQuickSearch("AT-10-01")}
              className="font-mono text-indigo-400 hover:text-indigo-300 underline font-semibold transition"
            >
              AT-10-01 (Certificate)
            </button>
            <span className="text-slate-600">•</span>
            <button
              type="button"
              onClick={() => handleQuickSearch("AT-HR-OL-26-001")}
              className="font-mono text-indigo-400 hover:text-indigo-300 underline font-semibold transition"
            >
              AT-HR-OL-26-001 (Offer Letter)
            </button>
          </div>
        </div>

        {/* Search Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* VERIFICATION RESULT: VALID & AUTHENTIC */}
        {result && result.found && result.status === "VALID" && (
          <div className="max-w-3xl mx-auto bg-slate-900/90 backdrop-blur-xl border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-emerald-950/30 animate-in fade-in zoom-in-95 duration-300 space-y-6">
            {/* Header Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wide">
                      Authentic & Verified
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Checks: {result.verificationCount} times
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                    {result.candidateName}
                  </h2>
                </div>
              </div>

              {/* Status Pill */}
              {/* Status Pill */}
              <div className="text-right sm:text-right">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  {result.isHrDocument ? (result.documentTypeLabel || "HR Document ID") : "Certificate ID"}
                </span>
                <span className="font-mono font-extrabold text-indigo-400 text-lg sm:text-xl block">
                  {result.certificateId}
                </span>
              </div>
            </div>

            {/* Credential Data Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-1">
                <span className="text-slate-400 text-xs block flex items-center gap-1.5">
                  {result.isHrDocument ? (
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                  {result.isHrDocument ? "Role & Department" : "Program / Course"}
                </span>
                <span className="font-bold text-white text-base block">{result.programName}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-1">
                <span className="text-slate-400 text-xs block flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-400" /> Issuing Organization
                </span>
                <span className="font-bold text-white text-base block">
                  {result.organizationName || "Aishwi Technologies"}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-1">
                <span className="text-slate-400 text-xs block flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Issue Date
                </span>
                <span className="font-bold text-white text-sm block">
                  {formatDateStr(result.issueDate)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-1">
                <span className="text-slate-400 text-xs block flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Security Status
                </span>
                <span className="font-bold text-emerald-400 text-sm block">
                  Valid • Cryptographically Protected
                </span>
              </div>
            </div>

            {/* DOWNLOAD & VIEW ACTION BUTTONS */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                {/* Instant Download Button */}
                <a
                  href={result.pdfDownloadUrl || `/api/certificates/${result.certificateId}/pdf?download=true`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition"
                >
                  <Download className="w-4 h-4" /> Download {result.isHrDocument ? "Official Letter" : "Certificate"} (PDF)
                </a>

                {/* View Official Document */}
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(!showPreviewModal)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs sm:text-sm border border-slate-700 transition"
                >
                  <Eye className="w-4 h-4 text-indigo-400" />
                  {showPreviewModal ? "Hide Document" : `View ${result.isHrDocument ? "Letter" : "Certificate"}`}
                </button>
              </div>

              {/* Share / Copy Verification Link */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700/80 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Link!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Share Verification Link
                  </>
                )}
              </button>
            </div>

            {/* Embedded Live Certificate Preview Drawer */}
            {showPreviewModal && (
              <div className="pt-4 border-t border-slate-800 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                  <span>Official Vector {result.isHrDocument ? "Letterhead Document" : "Certificate"}:</span>
                  <a
                    href={result.pdfViewUrl || `/api/certificates/${result.certificateId}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    Open in Full Tab <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <iframe
                  src={result.pdfViewUrl || `/api/certificates/${result.certificateId}/pdf`}
                  title="Official Document Preview"
                  className="w-full h-[55vh] rounded-2xl border border-slate-700 bg-white shadow-inner"
                />
              </div>
            )}
          </div>
        )}

        {/* VERIFICATION RESULT: REVOKED */}
        {result && result.found && result.status === "REVOKED" && (
          <div className="max-w-3xl mx-auto bg-slate-900/90 backdrop-blur-xl border-2 border-rose-500/50 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-rose-950/30 animate-in fade-in zoom-in-95 duration-300 space-y-6">
            <div className="flex items-center gap-4 text-rose-400">
              <AlertTriangle className="w-10 h-10 shrink-0 text-rose-400" />
              <div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-wide">
                  Certificate Revoked
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                  {result.candidateName}
                </h2>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-rose-300/90">
              This certificate has been formally revoked by Aishwi Technologies and is invalid for any verification or professional claims.
            </p>

            <div className="space-y-3 text-xs sm:text-sm divide-y divide-rose-950/60 pt-2">
              <div className="pt-2 flex justify-between items-center">
                <span className="text-slate-400">Certificate ID:</span>
                <span className="font-mono font-bold text-white">{result.certificateId}</span>
              </div>
              {result.revocation && (
                <>
                  <div className="pt-3 flex justify-between items-center">
                    <span className="text-slate-400">Revocation Reason:</span>
                    <span className="font-semibold text-rose-300">{result.revocation.reason}</span>
                  </div>
                  <div className="pt-3 flex justify-between items-center">
                    <span className="text-slate-400">Revocation Date:</span>
                    <span className="text-slate-300">{formatDateStr(result.revocation.revokedAt)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* VERIFICATION RESULT: NOT FOUND */}
        {result && result.notFound && (
          <div className="max-w-2xl mx-auto bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 sm:p-10 text-center animate-in fade-in duration-300 space-y-3">
            <XCircle className="w-12 h-12 text-rose-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Certificate Found</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              We couldn't find any authentic certificate matching ID:{" "}
              <span className="font-mono font-bold text-indigo-400">{result.searchedId}</span>.
              Please verify the ID printed on your document and try again.
            </p>
          </div>
        )}

        {/* Three Pillars Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800/80 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Anti-Tamper Protection</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every certificate issued is linked to our cryptographic registry, preventing falsification or unauthorized alterations.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800/80 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Instant PDF Download</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Candidates, employers, and academic institutions can directly verify and download authentic high-resolution vector PDF certificates.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800/80 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Authorized Signature</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verified certificates carry official executive signatures and atomic sequence numbers for seamless offline and online validity.
            </p>
          </div>
        </div>

        {/* SUPER ADMIN LOGIN SECTION AT THE BOTTOM */}
        <section id="admin-login" className="pt-16 border-t border-slate-800/80 scroll-mt-20">
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-400">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Restricted Access • Super Admins Only</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Super Admin Portal</h2>
              <p className="text-xs text-slate-400">
                Sign in to manage certificates, design custom templates, and monitor issuing metrics.
              </p>
            </div>

            <div className="bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-5">
              {loginError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Super Admin Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="mahesh.perla@aishwitech.in"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loginLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Admin Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* One-Click Authorized Super Admins Selector */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block text-center">
                  Select Super Admin Account (One-Click)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => fillSuperAdmin("mahesh.perla@aishwitech.in", "Aishwi@2021")}
                    className="p-2 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/80 text-center transition group"
                  >
                    <span className="text-xs font-bold text-white block group-hover:text-indigo-400">
                      Mahesh Perla
                    </span>
                    <span className="text-[9px] text-slate-400 block truncate">
                      mahesh.perla@...
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillSuperAdmin("ganesh@aishwitech.in", "Aishwi@2021")}
                    className="p-2 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/80 text-center transition group"
                  >
                    <span className="text-xs font-bold text-white block group-hover:text-indigo-400">
                      Ganesh
                    </span>
                    <span className="text-[9px] text-slate-400 block truncate">
                      ganesh@...
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillSuperAdmin("ruthvik.sonti@aishwitech.in", "Aishwi@2021")}
                    className="p-2 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/80 text-center transition group"
                  >
                    <span className="text-xs font-bold text-white block group-hover:text-indigo-400">
                      Ruthvik Sonti
                    </span>
                    <span className="text-[9px] text-slate-400 block truncate">
                      ruthvik.sonti@...
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-8 px-4 text-center text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <img
            src="/logo.png"
            alt="Aishwi Technologies"
            className="w-5 h-5 object-contain opacity-70"
          />
          <span className="font-semibold text-slate-400">Aishwi Technologies</span>
        </div>
        <p>© 2026 Aishwi Technologies. All Rights Reserved. Empowering Tomorrow, Innovating Today.</p>
        <p className="text-[11px] text-slate-600">
          Protected by Anti-Tamper Verification Engine • Zero QR Requirement • Atomic Sequential Security
        </p>
      </footer>
    </div>
  );
}
