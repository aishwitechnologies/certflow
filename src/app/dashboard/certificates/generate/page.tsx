"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Sheet,
  FileDown,
  RefreshCw,
  Eye,
  Check,
  User,
  ExternalLink,
  Calendar,
  Building,
  GraduationCap,
  X,
} from "lucide-react";

export default function GenerateCertificatesPage() {
  const [generationMode, setGenerationMode] = useState<"SINGLE" | "BATCH">("SINGLE");

  // Single Certificate Manual Entry State
  const [singleForm, setSingleForm] = useState({
    candidateName: "",
    email: "",
    collegeName: "",
    department: "",
    domain: "",
    programId: "",
    templateId: "",
    startDate: "",
    endDate: "",
    issueDate: new Date().toISOString().slice(0, 10),
  });
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleError, setSingleError] = useState("");
  const [singleResult, setSingleResult] = useState<any | null>(null);
  const [singlePreviewUrl, setSinglePreviewUrl] = useState<string | null>(null);
  const [singlePreviewLoading, setSinglePreviewLoading] = useState(false);
  const [viewSinglePdfModal, setViewSinglePdfModal] = useState(false);

  // Batch Wizard State
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 & 2: Program and Template
  const [programs, setPrograms] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // Step 3: Data Source
  const [dataSourceType, setDataSourceType] = useState<"EXCEL" | "CSV" | "GOOGLE">("EXCEL");
  const [file, setFile] = useState<File | null>(null);
  const [googleUrl, setGoogleUrl] = useState("");

  // Step 4: Headers & Mapping
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({
    candidateName: "Candidate Name",
    email: "Email",
    collegeName: "College Name",
    department: "Department",
    programName: "Program Name",
    domain: "Domain",
    startDate: "Start Date",
    endDate: "End Date",
  });

  // Step 5: Validation Result
  const [validationResult, setValidationResult] = useState<any>(null);

  // Step 6: Preview PDF Blob
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  // Step 7: Bulk Generation Progress
  const [batchId, setBatchId] = useState<string | null>(null);
  const [progress, setProgress] = useState({ processed: 0, total: 0, percent: 0 });
  const [generationComplete, setGenerationComplete] = useState(false);
  const [zipResult, setZipResult] = useState<{ zipFilename: string; downloadUrl: string } | null>(null);
  const [processedCertificates, setProcessedCertificates] = useState<any[]>([]);

  // Load programs and templates on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("mode") === "batch") {
        setGenerationMode("BATCH");
      } else if (params.get("mode") === "single") {
        setGenerationMode("SINGLE");
      }
    }

    Promise.all([
      fetch("/api/programs").then((r) => r.json()),
      fetch("/api/templates").then((r) => r.json()),
    ])
      .then(([progData, tmplData]) => {
        let defaultProgId = "";
        let defaultTmplId = "";
        let defaultDomain = "";

        if (progData.programs && progData.programs.length > 0) {
          setPrograms(progData.programs);
          defaultProgId = progData.programs[0].id;
          defaultDomain = progData.programs[0].domain || "";
          setSelectedProgramId(defaultProgId);
          if (progData.programs[0].defaultTemplateId) {
            defaultTmplId = progData.programs[0].defaultTemplateId;
            setSelectedTemplateId(defaultTmplId);
          }
        }
        if (tmplData.templates && tmplData.templates.length > 0) {
          setTemplates(tmplData.templates);
          if (!defaultTmplId) {
            defaultTmplId = tmplData.templates[0].id;
            setSelectedTemplateId(defaultTmplId);
          }
        }

        setSingleForm((prev) => ({
          ...prev,
          programId: prev.programId || defaultProgId,
          domain: prev.domain || defaultDomain,
          templateId: prev.templateId || defaultTmplId,
        }));
      })
      .catch((err) => console.error("Initial load failed:", err));
  }, []);

  // Download official Excel template
  const handleDownloadTemplate = () => {
    window.location.href = "/api/excel/template";
  };

  // Upload spreadsheet and validate
  const handleValidateSpreadsheet = async () => {
    setError("");
    setLoading(true);

    try {
      let formData = new FormData();

      if (dataSourceType === "GOOGLE") {
        if (!googleUrl) throw new Error("Please enter a valid Google Sheets URL.");
        // Fetch via Google Sheets connector
        const gRes = await fetch("/api/google-sheets/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetUrl: googleUrl }),
        });
        const gData = await gRes.json();
        if (!gRes.ok) throw new Error(gData.error || "Failed to connect Google Sheet");

        const blob = new Blob([gData.csvData], { type: "text/csv" });
        formData.append("file", blob, "google_sheet_data.csv");
      } else {
        if (!file) throw new Error("Please select an Excel or CSV file to upload.");
        formData.append("file", file);
      }

      formData.append("mapping", JSON.stringify(mapping));

      const res = await fetch("/api/excel/validate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Validation failed");

      setHeaders(data.headers || []);
      setMapping(data.mapping || mapping);
      setValidationResult(data);
      setStep(4); // Move to field mapping / review
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Re-run validation after modifying mapping
  const handleRevalidateWithMapping = async () => {
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      if (dataSourceType === "GOOGLE") {
        const gRes = await fetch("/api/google-sheets/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetUrl: googleUrl }),
        });
        const gData = await gRes.json();
        const blob = new Blob([gData.csvData], { type: "text/csv" });
        formData.append("file", blob, "google_sheet_data.csv");
      } else {
        if (!file) throw new Error("No file uploaded");
        formData.append("file", file);
      }

      formData.append("mapping", JSON.stringify(mapping));

      const res = await fetch("/api/excel/validate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Validation failed");

      setValidationResult(data);
      setStep(5); // Move to validation results summary
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Download error report
  const handleDownloadErrorReport = async () => {
    if (!validationResult?.errors?.length) return;
    try {
      const res = await fetch("/api/excel/error-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ errors: validationResult.errors }),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Certificate_Validation_Errors.xlsx";
      a.click();
    } catch (err) {
      alert("Failed to download error report");
    }
  };

  // Generate Sample Certificate Preview
  const handleGeneratePreview = async () => {
    setLoading(true);
    setError("");
    try {
      const sample = validationResult?.validRecords?.[0] || {
        candidateName: "Ravi Kumar",
        programName: programs.find((p) => p.id === selectedProgramId)?.name || "AI Internship",
        collegeName: "ABC College of Engineering",
        department: "Computer Science & Engineering",
        domain: "Artificial Intelligence",
        startDate: "01-10-2026",
        endDate: "31-10-2026",
      };

      const res = await fetch("/api/certificates/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          candidateData: sample,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate preview PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
      setStep(6); // Move to preview step
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Execute Vercel-compatible Bulk Generation Loop
  const handleStartBulkGeneration = async () => {
    if (!validationResult?.validRecords?.length) {
      setError("No valid candidate records to generate.");
      return;
    }

    setStep(7);
    setLoading(true);
    setError("");
    setGenerationComplete(false);
    setProcessedCertificates([]);

    try {
      const prog = programs.find((p) => p.id === selectedProgramId);

      // 1. Register Batch
      const batchRes = await fetch("/api/certificates/create-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: selectedProgramId,
          templateId: selectedTemplateId,
          validRecords: validationResult.validRecords,
          batchName: `${prog?.name || "Program"} Bulk Generation - ${new Date().toLocaleDateString()}`,
        }),
      });

      const batchData = await batchRes.json();
      if (!batchRes.ok) throw new Error(batchData.error || "Failed to initialize batch");

      const currentBatchId = batchData.batchId;
      setBatchId(currentBatchId);

      const totalCount = validationResult.validRecords.length;
      let processedCount = 0;
      const chunkSize = 20; // 20 per chunk ensures fast execution under Vercel serverless limits
      let allProcessed: any[] = [];

      // 2. Loop through chunks
      while (processedCount < totalCount) {
        setProgress({
          processed: processedCount,
          total: totalCount,
          percent: Math.round((processedCount / totalCount) * 100),
        });

        const chunkRes = await fetch("/api/certificates/process-chunk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            batchId: currentBatchId,
            startIndex: processedCount,
            chunkSize,
          }),
        });

        const chunkData = await chunkRes.json();
        if (!chunkRes.ok) throw new Error(chunkData.error || "Chunk processing error");

        if (chunkData.processedItems) {
          allProcessed = [...allProcessed, ...chunkData.processedItems];
          setProcessedCertificates(allProcessed);
        }

        processedCount = chunkData.processedCount;

        if (chunkData.isFinished || processedCount >= totalCount) {
          break;
        }
      }

      setProgress({
        processed: totalCount,
        total: totalCount,
        percent: 100,
      });

      // 3. Finalize Batch and create ZIP
      const finalizeRes = await fetch("/api/certificates/finalize-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: currentBatchId }),
      });

      const finalizeData = await finalizeRes.json();
      if (!finalizeRes.ok) throw new Error(finalizeData.error || "Failed to package ZIP archive");

      setZipResult({
        zipFilename: finalizeData.zipFilename,
        downloadUrl: finalizeData.downloadUrl,
      });

      setGenerationComplete(true);
    } catch (err: any) {
      console.error("Bulk generation error:", err);
      setError(err.message || "Bulk certificate generation encountered an issue.");
    } finally {
      setLoading(false);
    }
  };

  // Single Certificate Generation Handlers
  const handleGenerateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleError("");
    setSingleLoading(true);

    try {
      if (!singleForm.candidateName.trim()) {
        throw new Error("Please enter the candidate's full name.");
      }
      if (!singleForm.programId) {
        throw new Error("Please select a training/internship program.");
      }
      if (!singleForm.templateId) {
        throw new Error("Please select a certificate template.");
      }

      const res = await fetch("/api/certificates/single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(singleForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate certificate.");

      setSingleResult(data);
    } catch (err: any) {
      setSingleError(err.message || "Failed to issue certificate.");
    } finally {
      setSingleLoading(false);
    }
  };

  const handlePreviewSingle = async () => {
    if (!singleForm.candidateName.trim()) {
      setSingleError("Please enter candidate name before previewing.");
      return;
    }
    setSinglePreviewLoading(true);
    setSingleError("");

    try {
      const selectedProg = programs.find((p) => p.id === singleForm.programId);
      const res = await fetch("/api/certificates/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: singleForm.templateId || selectedTemplateId,
          candidateData: {
            candidateName: singleForm.candidateName,
            programName: selectedProg?.name || "Program Name",
            collegeName: singleForm.collegeName,
            department: singleForm.department,
            domain: singleForm.domain || selectedProg?.domain,
            startDate: singleForm.startDate,
            endDate: singleForm.endDate,
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to generate preview PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setSinglePreviewUrl(url);
    } catch (err: any) {
      setSingleError(err.message);
    } finally {
      setSinglePreviewLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Generate Certificates</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Issue official credentials for Aishwi Technologies manually or in bulk.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl w-full sm:w-fit border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setGenerationMode("SINGLE")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              generationMode === "SINGLE"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <User className="w-3.5 h-3.5" /> Single Certificate
          </button>
          <button
            type="button"
            onClick={() => setGenerationMode("BATCH")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              generationMode === "BATCH"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Bulk Excel / Google Sheets
          </button>
        </div>
      </div>

      {/* MODE 1: SINGLE CERTIFICATE MANUAL ISSUANCE */}
      {generationMode === "SINGLE" && (
        <div className="space-y-6">
          {singleResult ? (
            /* Success Card After Generation */
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
                      Certificate Issued Successfully!
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      {singleResult.certificate.candidateName}
                    </h2>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-medium">Atomic Unique Certificate ID</span>
                  <span className="font-mono text-xl font-extrabold text-indigo-600 block">
                    {singleResult.certificateId}
                  </span>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setViewSinglePdfModal(true)}
                  className="p-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-left transition group"
                >
                  <Eye className="w-6 h-6 text-indigo-600 mb-2 group-hover:scale-110 transition" />
                  <span className="text-xs font-bold text-slate-900 block">View Certificate</span>
                  <span className="text-[11px] text-slate-500">Preview generated PDF in modal</span>
                </button>

                <a
                  href={singleResult.downloadUrl}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition group"
                >
                  <Download className="w-6 h-6 text-slate-700 mb-2 group-hover:scale-110 transition" />
                  <span className="text-xs font-bold text-slate-900 block">Download PDF</span>
                  <span className="text-[11px] text-slate-500">Download candidate copy</span>
                </a>

                <Link
                  href={singleResult.verificationUrl}
                  target="_blank"
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition group"
                >
                  <ExternalLink className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition" />
                  <span className="text-xs font-bold text-slate-900 block">Public Verification</span>
                  <span className="text-[11px] text-slate-500">Verify via ID without QR</span>
                </Link>
              </div>

              {/* Embedded Certificate Preview Frame */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">Official Certificate PDF:</span>
                  <a
                    href={singleResult.viewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    Open in Full Tab <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <iframe
                  src={singleResult.viewUrl}
                  title="Issued Certificate"
                  className="w-full h-[52vh] rounded-xl border border-slate-300 shadow-inner bg-white"
                />
              </div>

              {/* Issue Another Button */}
              <div className="flex justify-between items-center pt-2">
                <Link
                  href="/dashboard/certificates"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  ← Go to Certificates Registry
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSingleResult(null);
                    setSinglePreviewUrl(null);
                    setSingleForm((prev) => ({
                      ...prev,
                      candidateName: "",
                      email: "",
                      collegeName: "",
                      department: "",
                    }));
                  }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition"
                >
                  + Issue Another Certificate
                </button>
              </div>
            </div>
          ) : (
            /* Manual Details Form */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Column (7 cols) */}
              <form onSubmit={handleGenerateSingle} className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">Candidate & Certificate Details</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fill in candidate details to issue an official Aishwi Technologies certificate.
                  </p>
                </div>

                {singleError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{singleError}</span>
                  </div>
                )}

                {/* Program & Template Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Program / Internship *
                    </label>
                    <select
                      value={singleForm.programId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        const prog = programs.find((p) => p.id === pid);
                        setSingleForm((prev) => ({
                          ...prev,
                          programId: pid,
                          domain: prog?.domain || prev.domain,
                          templateId: prog?.defaultTemplateId || prev.templateId,
                        }));
                      }}
                      required
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Select Program --</option>
                      {programs.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Certificate Template *
                    </label>
                    <select
                      value={singleForm.templateId}
                      onChange={(e) => setSingleForm({ ...singleForm, templateId: e.target.value })}
                      required
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Select Template --</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Candidate Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Candidate Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={singleForm.candidateName}
                      onChange={(e) => setSingleForm({ ...singleForm, candidateName: e.target.value })}
                      placeholder="e.g. Ramesh Varma"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={singleForm.email}
                      onChange={(e) => setSingleForm({ ...singleForm, email: e.target.value })}
                      placeholder="e.g. candidate@gmail.com"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Department & Domain */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Department / Specialization (Optional)
                    </label>
                    <input
                      type="text"
                      value={singleForm.department}
                      onChange={(e) => setSingleForm({ ...singleForm, department: e.target.value })}
                      placeholder="e.g. Computer Science & Engineering"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Domain / Track (Optional)
                    </label>
                    <input
                      type="text"
                      value={singleForm.domain}
                      onChange={(e) => setSingleForm({ ...singleForm, domain: e.target.value })}
                      placeholder="e.g. Artificial Intelligence"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={singleForm.startDate}
                      onChange={(e) => setSingleForm({ ...singleForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={singleForm.endDate}
                      onChange={(e) => setSingleForm({ ...singleForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Issue Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={singleForm.issueDate}
                      onChange={(e) => setSingleForm({ ...singleForm, issueDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handlePreviewSingle}
                    disabled={singlePreviewLoading}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {singlePreviewLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Rendering...
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" /> Preview Certificate
                      </>
                    )}
                  </button>

                  <button
                    type="submit"
                    disabled={singleLoading}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {singleLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Issuing Certificate...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" /> Generate & Issue Certificate
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Preview Column (5 cols) */}
              <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-indigo-600" /> Certificate Output Preview
                    </span>
                    {singlePreviewUrl && (
                      <a
                        href={singlePreviewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-semibold text-indigo-600 hover:underline"
                      >
                        Open Full Tab ↗
                      </a>
                    )}
                  </div>

                  {singlePreviewUrl ? (
                    <div className="rounded-2xl overflow-hidden border border-slate-300 shadow-md">
                      <iframe
                        src={singlePreviewUrl}
                        title="Certificate Live Preview"
                        className="w-full h-80 rounded-2xl bg-white"
                      />
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/60 my-6">
                      <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-80" />
                      <p className="text-xs font-bold text-slate-700">Live Preview Available</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                        Type candidate details on the left and click <strong>Preview Certificate</strong> to view the exact rendered PDF before issuing.
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <p>• <strong>Atomic Sequence:</strong> Automatically reserves next sequential ID (e.g. AT-10-XX).</p>
                  <p>• <strong>Verification:</strong> Instantly verified on public portal via ID.</p>
                  <p>• <strong>Format:</strong> High-definition vector PDF with vector crest.</p>
                </div>
              </div>
            </div>
          )}

          {/* Modal to view single PDF */}
          {viewSinglePdfModal && singleResult && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
                <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                  <span className="font-bold text-sm">
                    {singleResult.certificate.candidateName} — {singleResult.certificateId}
                  </span>
                  <button
                    onClick={() => setViewSinglePdfModal(false)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 bg-slate-100 flex-1 overflow-hidden">
                  <iframe
                    src={singleResult.viewUrl}
                    className="w-full h-[65vh] rounded-2xl bg-white border border-slate-300"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: BATCH WIZARD PIPELINE */}
      {generationMode === "BATCH" && (
        <div className="space-y-6">
          {/* Step Header */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Bulk Spreadsheet Generation</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated end-to-end pipeline: Spreadsheet data → Validation → Preview → Atomic IDs → PDFs → Bulk ZIP.
            </p>
          </div>

      {/* Wizard Progress Stepper */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 overflow-x-auto gap-2">
          {[
            { n: 1, label: "Program" },
            { n: 2, label: "Template" },
            { n: 3, label: "Data Source" },
            { n: 4, label: "Field Mapping" },
            { n: 5, label: "Validation" },
            { n: 6, label: "Preview" },
            { n: 7, label: "Generation" },
          ].map((s) => (
            <div
              key={s.n}
              className={`flex items-center gap-1.5 shrink-0 ${
                step === s.n
                  ? "text-indigo-600 font-bold"
                  : step > s.n
                  ? "text-emerald-600"
                  : "text-slate-400"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s.n
                    ? "bg-indigo-600 text-white"
                    : step > s.n
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {step > s.n ? <Check className="w-3.5 h-3.5" /> : s.n}
              </div>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Select Program */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Step 1: Select Program</h2>
            <p className="text-xs text-slate-500">Choose the academic, internship, or workshop program for this batch.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {programs.map((prog) => (
              <div
                key={prog.id}
                onClick={() => {
                  setSelectedProgramId(prog.id);
                  if (prog.defaultTemplateId) setSelectedTemplateId(prog.defaultTemplateId);
                }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                  selectedProgramId === prog.id
                    ? "border-indigo-600 bg-indigo-50/40"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-indigo-600">{prog.programId}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                    {prog.duration || "Self-paced"}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 mt-2 text-sm">{prog.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{prog.description}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              disabled={!selectedProgramId}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition disabled:opacity-50"
            >
              Continue to Template <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Select Template */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Step 2: Select Certificate Template</h2>
              <p className="text-xs text-slate-500">Choose layout, typography, and field coordinates.</p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {templates.map((tmpl) => (
              <div
                key={tmpl.id}
                onClick={() => setSelectedTemplateId(tmpl.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                  selectedTemplateId === tmpl.id
                    ? "border-indigo-600 bg-indigo-50/40"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-700">{tmpl.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                    {tmpl.pageSize} • {tmpl.orientation}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">{tmpl.description}</p>
                <div className="mt-3 text-[11px] text-indigo-600 font-medium">
                  {tmpl.fields?.length || 7} configured fields
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!selectedTemplateId}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition disabled:opacity-50"
            >
              Continue to Data Source <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Data Source Selection & File Upload */}
      {step === 3 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Step 3: Select Data Source & Upload Candidates</h2>
              <p className="text-xs text-slate-500">
                Download the standard Excel template, populate candidate rows, or connect a Google Sheet.
              </p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          {/* Action Box: Download Excel Template */}
          <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Download Excel Template</h4>
                <p className="text-xs text-slate-600">
                  Includes pre-configured headers (Candidate Name, Email, College, Dates) and instructions tab.
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-semibold text-xs transition shrink-0"
            >
              <Download className="w-4 h-4" /> Download .xlsx Template
            </button>
          </div>

          {/* Source Tabs */}
          <div className="flex border-b border-slate-200 gap-4">
            <button
              onClick={() => setDataSourceType("EXCEL")}
              className={`pb-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
                dataSourceType === "EXCEL"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" /> Upload Excel (.xlsx, .xls)
            </button>
            <button
              onClick={() => setDataSourceType("CSV")}
              className={`pb-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
                dataSourceType === "CSV"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <FileDown className="w-4 h-4" /> Upload CSV (.csv)
            </button>
            <button
              onClick={() => setDataSourceType("GOOGLE")}
              className={`pb-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
                dataSourceType === "GOOGLE"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Sheet className="w-4 h-4 text-emerald-600" /> Connect Google Sheet
            </button>
          </div>

          {/* Upload Area for Excel / CSV */}
          {dataSourceType !== "GOOGLE" ? (
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 transition">
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">
                {file ? file.name : "Select your candidate spreadsheet file"}
              </p>
              <p className="text-xs text-slate-500 mt-1">Supports .xlsx, .xls, and .csv up to 20MB</p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  if (e.target.files?.[0]) setFile(e.target.files[0]);
                }}
                className="mt-4 text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Google Sheets Public Link
              </label>
              <input
                type="url"
                value={googleUrl}
                onChange={(e) => setGoogleUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-slate-500">
                Note: Ensure the sheet access is set to "Anyone with the link can view".
              </p>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
            >
              Back
            </button>
            <button
              onClick={handleValidateSpreadsheet}
              disabled={loading || (dataSourceType !== "GOOGLE" && !file) || (dataSourceType === "GOOGLE" && !googleUrl)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition disabled:opacity-50"
            >
              {loading ? "Validating Spreadsheet..." : "Validate & Map Fields"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Field Mapping */}
      {step === 4 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Step 4: Field Mapping</h2>
              <p className="text-xs text-slate-500">
                Map each certificate placeholder to the corresponding column in your spreadsheet.
              </p>
            </div>
            <button
              onClick={() => setStep(3)}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Certificate Placeholder</th>
                  <th className="py-3 px-4">Requirement</th>
                  <th className="py-3 px-4">Mapped Spreadsheet Column</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { key: "candidateName", label: "Candidate Name", placeholder: "{{NAME}}", required: true },
                  { key: "email", label: "Email Address", placeholder: "{{EMAIL}}", required: true },
                  { key: "programName", label: "Program Name", placeholder: "{{PROGRAM_NAME}}", required: false },
                  { key: "collegeName", label: "College / Institution", placeholder: "{{COLLEGE_NAME}}", required: false },
                  { key: "department", label: "Department / Branch", placeholder: "{{DEPARTMENT}}", required: false },
                  { key: "domain", label: "Domain / Track", placeholder: "{{DOMAIN}}", required: false },
                  { key: "startDate", label: "Start Date", placeholder: "{{START_DATE}}", required: true },
                  { key: "endDate", label: "End Date", placeholder: "{{END_DATE}}", required: true },
                ].map((f) => (
                  <tr key={f.key} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{f.label}</span>
                      <span className="font-mono text-indigo-600 text-[10px]">{f.placeholder}</span>
                    </td>
                    <td className="py-3 px-4">
                      {f.required ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                          REQUIRED
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500">Optional</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={mapping[f.key] || ""}
                        onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
                      >
                        <option value="">-- Select Column --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
            >
              Back
            </button>
            <button
              onClick={handleRevalidateWithMapping}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition disabled:opacity-50"
            >
              {loading ? "Re-validating..." : "Apply Mapping & View Report"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Validation Results */}
      {step === 5 && validationResult && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Step 5: Data Validation Summary</h2>
              <p className="text-xs text-slate-500">
                Detailed pre-flight validation check before certificate IDs and PDFs are issued.
              </p>
            </div>
            <button
              onClick={() => setStep(4)}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-xs text-slate-500 uppercase font-semibold">Total Records</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{validationResult.totalRecords}</p>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <span className="text-xs text-emerald-700 uppercase font-semibold">Valid Records</span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{validationResult.validRecordsCount}</p>
            </div>
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center">
              <span className="text-xs text-rose-700 uppercase font-semibold">Records With Errors</span>
              <p className="text-2xl font-bold text-rose-700 mt-1">{validationResult.errorRecordsCount}</p>
            </div>
          </div>

          {/* Validation Errors Table (if any) */}
          {validationResult.errors?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase text-rose-700 tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Detected Errors ({validationResult.errors.length})
                </h3>
                <button
                  onClick={handleDownloadErrorReport}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline inline-flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Download Error Report (.xlsx)
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto border border-rose-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-rose-50 text-rose-900 font-semibold border-b border-rose-200 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Row</th>
                      <th className="py-2 px-3">Field</th>
                      <th className="py-2 px-3">Error</th>
                      <th className="py-2 px-3">Correction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100">
                    {validationResult.errors.map((err: any, idx: number) => (
                      <tr key={idx} className="hover:bg-rose-50/50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">{err.rowNumber}</td>
                        <td className="py-2 px-3 font-semibold text-slate-700">{err.field}</td>
                        <td className="py-2 px-3 text-rose-700">{err.error}</td>
                        <td className="py-2 px-3 text-slate-600 italic">{err.suggestedCorrection}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Valid Sample Records Preview */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
              Sample Valid Records (First {Math.min(3, validationResult.validRecords.length)})
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">College</th>
                    <th className="py-2.5 px-3">Tenure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {validationResult.validRecords.slice(0, 3).map((v: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-bold text-slate-900">{v.candidateName}</td>
                      <td className="py-2 px-3 text-slate-600">{v.email}</td>
                      <td className="py-2 px-3 text-slate-600">{v.collegeName || "N/A"}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">
                        {v.startDate} → {v.endDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(4)}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
            >
              Back to Mapping
            </button>
            <button
              onClick={handleGeneratePreview}
              disabled={validationResult.validRecordsCount === 0 || loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition disabled:opacity-50"
            >
              {loading ? "Preparing Preview..." : "Preview Sample Certificate"} <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Certificate Live Preview */}
      {step === 6 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Step 6: Confirm Certificate Preview</h2>
              <p className="text-xs text-slate-500">
                Inspect sample rendered certificate. Verify Candidate name, Certificate ID format, and positioning.
              </p>
            </div>
            <button
              onClick={() => setStep(5)}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-100 p-2 flex justify-center">
            {previewPdfUrl ? (
              <iframe
                src={previewPdfUrl}
                className="w-full h-[520px] rounded-xl border border-slate-200 shadow-md"
                title="Certificate Preview"
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">Loading Preview...</div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(5)}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
            >
              Back
            </button>
            <button
              onClick={handleStartBulkGeneration}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5" /> Generate {validationResult?.validRecordsCount} Certificates
            </button>
          </div>
        </div>
      )}

      {/* STEP 7: Bulk Generation Progress & ZIP Download */}
      {step === 7 && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="text-center max-w-md mx-auto">
            {!generationComplete ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Generating Certificates...</h2>
                <p className="text-sm font-medium text-slate-600 mt-2">
                  {progress.processed} / {progress.total}
                </p>
                <p className="text-xs font-semibold text-indigo-600 font-mono mt-1">{progress.percent}% Complete</p>

                {/* Live Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-3 mt-4 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Asynchronous chunk processing in progress. Never freezes your browser.
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {progress.total} Certificates Generated Successfully
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Unique Certificate IDs allocated, candidate-named PDFs rendered, and packaged into ZIP archive.
                </p>

                {/* Primary Download ZIP Action */}
                {zipResult && (
                  <div className="mt-6">
                    <a
                      href={zipResult.downloadUrl}
                      download={zipResult.zipFilename}
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
                    >
                      <Download className="w-5 h-5" /> Download All Certificates (ZIP)
                    </a>
                    <p className="text-[11px] font-mono text-slate-500 mt-2">{zipResult.zipFilename}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* List of Generated Certificates */}
          {processedCertificates.length > 0 && (
            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider mb-3">
                Generated Certificates ({processedCertificates.length})
              </h3>
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Certificate ID</th>
                      <th className="py-2.5 px-3">Candidate Name</th>
                      <th className="py-2.5 px-3 text-right">Individual PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {processedCertificates.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-semibold text-indigo-600">
                          {item.certificateId}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{item.candidateName}</td>
                        <td className="py-2.5 px-3 text-right">
                          <a
                            href={item.pdfUrl}
                            target="_blank"
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {generationComplete && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => {
                  setStep(1);
                  setFile(null);
                  setValidationResult(null);
                  setProcessedCertificates([]);
                  setGenerationComplete(false);
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Start Another Generation
              </button>
            </div>
          )}
        </div>
      )}
        </div>
      )}
    </div>
  );
}
