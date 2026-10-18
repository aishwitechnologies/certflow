"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  Upload,
  Eye,
  CheckCircle2,
  AlertCircle,
  Download,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ArrowRight,
  PenTool,
  Building,
  GraduationCap,
  Calendar,
  Layers,
  Check,
} from "lucide-react";

export default function GenerateHrDocumentPage() {
  const [form, setForm] = useState({
    documentType: "OFFER_LETTER",
    candidateName: "",
    candidateEmail: "",
    candidatePhone: "",
    collegeName: "",
    department: "",
    roleTitle: "Artificial Intelligence Research Intern",
    departmentName: "Software Engineering & AI Solutions Division",
    stipend: "Performance & Milestone Based",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    issueDate: new Date().toISOString().slice(0, 10),
    signatoryName: "Mahesh Perla",
    signatoryTitle: "Director & Authorized Signatory",
    signatureUrl: "",
    contentOverride: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any | null>(null);

  // Live PDF Preview
  const [previewBlob, setPreviewBlob] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Handle signature upload
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG or JPG) for the signature.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setForm((prev) => ({ ...prev, signatureUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  // Preview Live PDF on Letterhead
  const handlePreview = async () => {
    if (!form.candidateName.trim()) {
      setError("Please enter candidate name before previewing.");
      return;
    }
    setError("");
    setPreviewLoading(true);

    try {
      const res = await fetch("/api/hr-documents/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to render preview PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPreviewBlob(url);
    } catch (err: any) {
      setError(err.message || "Preview failed");
    } finally {
      setPreviewLoading(false);
    }
  };

  // Submit and issue official document
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.candidateName.trim()) {
      setError("Please enter candidate name.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/hr-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to issue document.");

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to generate HR document.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Issue Official HR Letter & Document
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate customized Offer Letters, Internship Completion Letters, and Experience Certificates on official Aishwi Technologies letterhead.
          </p>
        </div>

        <Link
          href="/dashboard/hr-documents"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 self-start sm:self-auto"
        >
          ← Back to HR Documents Registry
        </Link>
      </div>

      {result ? (
        /* Success Screen */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
                  Document Issued Successfully!
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {result.document.candidateName} — {result.document.documentType}
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={result.downloadUrl}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition"
              >
                <Download className="w-4 h-4" /> Download Official PDF
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 text-xs">
            <div>
              <span className="text-slate-400 block">Reference ID</span>
              <span className="font-mono font-bold text-indigo-600">{result.document.documentId}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Candidate</span>
              <span className="font-semibold text-slate-800">{result.document.candidateName}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Role Title</span>
              <span className="font-semibold text-slate-800">{result.document.roleTitle}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Status</span>
              <span className="font-semibold text-emerald-600">Active & Verifiable</span>
            </div>
          </div>

          {/* Embedded PDF Viewer */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">Official Letterhead PDF Output:</span>
              <a
                href={result.viewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                Open Full Window <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <iframe
              src={result.viewUrl}
              title="Issued HR Document"
              className="w-full h-[60vh] rounded-xl border border-slate-300 shadow-inner bg-white"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <Link
              href="/dashboard/hr-documents"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              ← Go to Documents List
            </Link>
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setPreviewBlob(null);
                setForm((prev) => ({
                  ...prev,
                  candidateName: "",
                  candidateEmail: "",
                  candidatePhone: "",
                  collegeName: "",
                  department: "",
                }));
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition"
            >
              + Issue Another HR Letter
            </button>
          </div>
        </div>
      ) : (
        /* Form & Preview Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Column (7 Cols) */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5"
          >
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Document Configuration</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Fill in candidate details and select letterhead document type.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Document Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Document Type *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "OFFER_LETTER", label: "Offer Letter", desc: "Internship / Job" },
                  { id: "COMPLETION_LETTER", label: "Completion Letter", desc: "Internship" },
                  { id: "EXPERIENCE_LETTER", label: "Experience Letter", desc: "Work Service" },
                  { id: "RELIEVING_LETTER", label: "Relieving Letter", desc: "Separation" },
                  { id: "LOR", label: "Recommendation", desc: "LOR" },
                ].map((typeOption) => (
                  <button
                    key={typeOption.id}
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        documentType: typeOption.id,
                      }));
                    }}
                    className={`p-3 rounded-2xl border text-left transition ${
                      form.documentType === typeOption.id
                        ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50"
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 block">{typeOption.label}</span>
                    <span className="text-[10px] text-slate-500 block">{typeOption.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Candidate Details */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Candidate Information
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Candidate Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.candidateName}
                    onChange={(e) => setForm({ ...form, candidateName: e.target.value })}
                    placeholder="e.g. Ramesh Varma"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Candidate Email
                  </label>
                  <input
                    type="email"
                    value={form.candidateEmail}
                    onChange={(e) => setForm({ ...form, candidateEmail: e.target.value })}
                    placeholder="candidate@example.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    College / University (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.collegeName}
                    onChange={(e) => setForm({ ...form, collegeName: e.target.value })}
                    placeholder="e.g. Indian Institute of Technology"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department / Branch (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="e.g. Computer Science & Engineering"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Role & Dates */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Role & Tenure Details
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role / Position Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.roleTitle}
                    onChange={(e) => setForm({ ...form, roleTitle: e.target.value })}
                    placeholder="e.g. Artificial Intelligence Research Intern"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Division / Department
                  </label>
                  <input
                    type="text"
                    value={form.departmentName}
                    onChange={(e) => setForm({ ...form, departmentName: e.target.value })}
                    placeholder="e.g. Software & AI Solutions Division"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {form.documentType === "OFFER_LETTER" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Stipend / Compensation Terms
                  </label>
                  <input
                    type="text"
                    value={form.stipend}
                    onChange={(e) => setForm({ ...form, stipend: e.target.value })}
                    placeholder="e.g. ₹15,000 / Month (Performance Based)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Commencement Date
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Completion Date
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date of Issue *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.issueDate}
                    onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Authorized Signatory & Signature */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Authorized Signatory
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Signatory Name
                  </label>
                  <input
                    type="text"
                    value={form.signatoryName}
                    onChange={(e) => setForm({ ...form, signatoryName: e.target.value })}
                    placeholder="e.g. Mahesh Perla"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Signatory Designation
                  </label>
                  <input
                    type="text"
                    value={form.signatoryTitle}
                    onChange={(e) => setForm({ ...form, signatoryTitle: e.target.value })}
                    placeholder="e.g. Director & Authorized Signatory"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Signature Upload Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-indigo-600" /> Authorized Sign Image
                  </label>
                  {form.signatureUrl && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, signatureUrl: "" }))}
                      className="text-[11px] text-rose-600 hover:underline font-semibold"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={signatureInputRef}
                  onChange={handleSignatureUpload}
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                />

                {form.signatureUrl ? (
                  <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-300">
                    <img
                      src={form.signatureUrl}
                      alt="Signature Preview"
                      className="h-10 max-w-[120px] object-contain"
                    />
                    <div className="flex-1 text-[11px] text-slate-500">
                      <span className="font-semibold text-emerald-600 block">Signature Attached</span>
                      Will be placed above the Signatory line on the official letterhead.
                    </div>
                    <button
                      type="button"
                      onClick={() => signatureInputRef.current?.click()}
                      className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => signatureInputRef.current?.click()}
                    className="border border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-3 text-center cursor-pointer bg-white transition hover:bg-indigo-50/20 flex items-center justify-center gap-2"
                  >
                    <PenTool className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-600">
                      Upload Authorized Signature (PNG / JPG)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      • Optional: Transparent background recommended
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Notes / Body Override */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700">
                Custom Body Paragraphs (Optional Override)
              </label>
              <textarea
                rows={3}
                value={form.contentOverride}
                onChange={(e) => setForm({ ...form, contentOverride: e.target.value })}
                placeholder="Leave blank to use our legally formulated standard company text for this letter type..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handlePreview}
                disabled={previewLoading}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {previewLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Rendering...
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-indigo-600" /> Preview on Letterhead
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating Document...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Issue & Download Letter
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Letterhead Preview Column (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-lg border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold tracking-tight flex items-center gap-1.5 text-indigo-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Letterhead Live Simulation
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {form.documentType.replace("_", " ")}
                </span>
              </div>

              {previewBlob ? (
                <iframe
                  src={previewBlob}
                  title="Live Letterhead Preview"
                  className="w-full h-[70vh] rounded-2xl bg-white shadow-inner border border-slate-700"
                />
              ) : (
                <div className="bg-white text-slate-900 p-6 rounded-2xl border border-slate-200 shadow-md space-y-4 select-none min-h-[500px] flex flex-col justify-between">
                  {/* Letterhead Top */}
                  <div className="border-b pb-3 flex items-center gap-3">
                    <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
                    <div>
                      <h4 className="font-extrabold text-sm text-[#131f47]">AISHWI TECHNOLOGIES</h4>
                      <p className="text-[9px] text-[#b38a2e] font-bold">EMPOWERING TOMORROW, INNOVATING TODAY</p>
                      <p className="text-[8px] text-slate-400">Hyderabad, Telangana - 500081, India</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-[10px] text-slate-700 flex-1">
                    <div className="flex justify-between font-mono text-[9px] text-slate-500">
                      <span>Ref: AT-HR-PREVIEW</span>
                      <span>Date: {form.issueDate || "Today"}</span>
                    </div>

                    <div className="pt-2">
                      <p className="font-bold">To,</p>
                      <p className="font-bold text-indigo-900 text-xs">{form.candidateName || "[Candidate Full Name]"}</p>
                      {form.collegeName && <p className="text-slate-600">{form.collegeName}</p>}
                    </div>

                    <div className="pt-2 font-bold text-indigo-950 uppercase text-[10px] border-b pb-1">
                      Subject: {form.documentType.replace("_", " ")} - {form.roleTitle}
                    </div>

                    <p className="leading-relaxed text-slate-600 text-[10px] pt-1">
                      Dear {form.candidateName || "Candidate"},
                    </p>
                    <p className="leading-relaxed text-slate-600 text-[9.5px]">
                      {form.documentType === "OFFER_LETTER"
                        ? `We are pleased to offer you the internship role of ${form.roleTitle} with Aishwi Technologies commencing on ${form.startDate}.`
                        : form.documentType === "COMPLETION_LETTER"
                        ? `This certifies that ${form.candidateName || "Candidate"} has successfully completed the internship tenure for ${form.roleTitle} with exemplary performance.`
                        : `This confirms that ${form.candidateName || "Candidate"} was associated with Aishwi Technologies as ${form.roleTitle}.`}
                    </p>
                  </div>

                  {/* Signatory simulation */}
                  <div className="pt-3 border-t text-[9px]">
                    <p className="text-slate-500">For Aishwi Technologies,</p>
                    {form.signatureUrl && (
                      <img src={form.signatureUrl} alt="Signature" className="h-8 object-contain my-1" />
                    )}
                    <p className="font-bold text-slate-900">{form.signatoryName || "Mahesh Perla"}</p>
                    <p className="text-slate-500">{form.signatoryTitle || "Authorized Signatory"}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
