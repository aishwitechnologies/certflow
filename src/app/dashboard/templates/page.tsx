"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  FileCode,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Upload,
  Save,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Move,
  Check,
  X,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Type,
  Palette,
  Image as ImageIcon,
  PenTool,
} from "lucide-react";

interface FieldConfig {
  id?: string;
  fieldKey: string;
  label: string;
  x: number;
  y: number; // PDF points from bottom: 0 to 595.28 (landscape) or 841.89 (portrait)
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  alignment: "left" | "center" | "right";
  staticValue?: string | null;
}

const DEFAULT_FIELDS: FieldConfig[] = [
  {
    fieldKey: "NAME",
    label: "Candidate Full Name",
    x: 420,
    y: 330,
    fontSize: 26,
    fontFamily: "Times-Roman",
    fontWeight: "bold",
    color: "#0f172a",
    alignment: "center",
  },
  {
    fieldKey: "PROGRAM_NAME",
    label: "Program / Course Name",
    x: 420,
    y: 275,
    fontSize: 16,
    fontFamily: "Helvetica",
    fontWeight: "bold",
    color: "#2563eb",
    alignment: "center",
  },
  {
    fieldKey: "DOMAIN",
    label: "Domain / Specialization",
    x: 420,
    y: 235,
    fontSize: 13,
    fontFamily: "Helvetica",
    fontWeight: "normal",
    color: "#64748b",
    alignment: "center",
  },
  {
    fieldKey: "CERTIFICATE_ID",
    label: "Certificate ID Number",
    x: 70,
    y: 50,
    fontSize: 11,
    fontFamily: "Helvetica",
    fontWeight: "bold",
    color: "#1e293b",
    alignment: "left",
  },
  {
    fieldKey: "ISSUE_DATE",
    label: "Issue Date",
    x: 770,
    y: 50,
    fontSize: 11,
    fontFamily: "Helvetica",
    fontWeight: "normal",
    color: "#475569",
    alignment: "right",
  },
];

const PRESET_COLORS = [
  "#0f172a", // Deep Slate
  "#1e3a8a", // Navy Blue
  "#2563eb", // Royal Blue
  "#047857", // Emerald Green
  "#b45309", // Warm Amber / Gold
  "#be123c", // Ruby Red
  "#475569", // Muted Gray
  "#000000", // Pure Black
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Editor Modal State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("Aishwi Custom Certificate");
  const [certificateType, setCertificateType] = useState("INTERNSHIP");
  const [description, setDescription] = useState("Official verified completion certificate");
  const [orientation, setOrientation] = useState<"LANDSCAPE" | "PORTRAIT">("LANDSCAPE");
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldConfig[]>(DEFAULT_FIELDS);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const canvasWidth = orientation === "PORTRAIT" ? 595.28 : 841.89;
  const canvasHeight = orientation === "PORTRAIT" ? 841.89 : 595.28;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const fetchTemplates = () => {
    setLoading(true);
    fetch("/api/templates")
      .then((r) => r.json())
      .then((d) => {
        setTemplates(d.templates || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openNewTemplateModal = () => {
    setEditingTemplateId(null);
    setTemplateName("Aishwi Custom Certificate Template");
    setCertificateType("INTERNSHIP");
    setDescription("Official certificate template designed for Aishwi Technologies");
    setOrientation("LANDSCAPE");
    setBackgroundUrl(null);
    setSignatureUrl(null);
    setFields(JSON.parse(JSON.stringify(DEFAULT_FIELDS)));
    setSelectedFieldIndex(0);
    setPdfPreviewBlob(null);
    setSaveSuccess(false);
    setEditorOpen(true);
  };

  const openEditTemplateModal = (tmpl: any) => {
    setEditingTemplateId(tmpl.id);
    setTemplateName(tmpl.name);
    setCertificateType(tmpl.certificateType || "INTERNSHIP");
    setDescription(tmpl.description || "");
    setOrientation(tmpl.orientation || "LANDSCAPE");
    setBackgroundUrl(tmpl.backgroundUrl || null);
    setSignatureUrl(tmpl.signatureUrl || null);
    if (tmpl.fields && tmpl.fields.length > 0) {
      setFields(
        tmpl.fields.map((f: any) => ({
          id: f.id,
          fieldKey: f.fieldKey,
          label: f.label || f.fieldKey,
          x: f.x,
          y: f.y,
          fontSize: f.fontSize,
          fontFamily: f.fontFamily || "Helvetica",
          fontWeight: f.fontWeight || "normal",
          color: f.color || "#0f172a",
          alignment: (f.alignment as any) || "center",
          staticValue: f.staticValue,
        }))
      );
    } else {
      setFields(JSON.parse(JSON.stringify(DEFAULT_FIELDS)));
    }
    setSelectedFieldIndex(0);
    setPdfPreviewBlob(null);
    setSaveSuccess(false);
    setEditorOpen(true);
  };

  // Upload own template image (background)
  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, JPEG, or SVG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setBackgroundUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Upload authorized signature image
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
      setSignatureUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const updateCurrentField = (updates: Partial<FieldConfig>) => {
    setFields((prev) => {
      const copy = [...prev];
      copy[selectedFieldIndex] = { ...copy[selectedFieldIndex], ...updates };
      return copy;
    });
  };

  const handleAddField = () => {
    const newField: FieldConfig = {
      fieldKey: `CUSTOM_FIELD_${fields.length + 1}`,
      label: `Custom Field ${fields.length + 1}`,
      x: Math.round(canvasWidth / 2),
      y: 160,
      fontSize: 14,
      fontFamily: "Helvetica",
      fontWeight: "normal",
      color: "#0f172a",
      alignment: "center",
      staticValue: "Custom Text",
    };
    setFields([...fields, newField]);
    setSelectedFieldIndex(fields.length);
  };

  const handleRemoveField = (indexToRemove: number) => {
    if (fields.length <= 1) {
      alert("Template must have at least one field.");
      return;
    }
    const filtered = fields.filter((_, idx) => idx !== indexToRemove);
    setFields(filtered);
    setSelectedFieldIndex(Math.max(0, indexToRemove - 1));
  };

  // Live PDF preview render
  const generateLivePdfPreview = async () => {
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/certificates/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customTemplate: {
            width: canvasWidth,
            height: canvasHeight,
            orientation,
            backgroundUrl,
            signatureUrl,
            fields,
          },
          candidateData: {
            candidateName: "Ravi Kumar",
            programName: "Artificial Intelligence Internship",
            collegeName: "Indian Institute of Technology",
            department: "Computer Science & Engineering",
            domain: "Machine Learning & Deep Learning",
            startDate: "01/10/2026",
            endDate: "31/10/2026",
            signatureUrl,
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to generate preview PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfPreviewBlob(url);
    } catch (err: any) {
      alert(err.message || "Failed to render PDF preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  // Save template to database
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert("Please provide a template name.");
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        name: templateName.trim(),
        certificateType,
        description,
        orientation,
        backgroundUrl,
        signatureUrl,
        fields,
      };

      const url = editingTemplateId ? `/api/templates/${editingTemplateId}` : `/api/templates`;
      const method = editingTemplateId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save template");

      setSaveSuccess(true);
      fetchTemplates();
      setTimeout(() => {
        setEditorOpen(false);
      }, 1200);
    } catch (err: any) {
      alert(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const currentField = fields[selectedFieldIndex] || fields[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Certificate Templates</h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload custom background designs, adjust text alignment, and customize field positioning with live preview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openNewTemplateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-md shadow-indigo-600/20 transition"
          >
            <Upload className="w-4 h-4" /> Upload / Design New Template
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tmpl) => (
          <div
            key={tmpl.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                  {tmpl.pageSize || "A4"} • {tmpl.orientation || "LANDSCAPE"}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  v{tmpl.version || 1}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition">
                {tmpl.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {tmpl.description || "Official certificate template with configurable coordinates."}
              </p>

              {/* Background & Signature badges */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {tmpl.backgroundUrl ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <ImageIcon className="w-3 h-3" /> Custom Background
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                    <Layers className="w-3 h-3" /> Vector Frame
                  </span>
                )}
                {tmpl.signatureUrl && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                    <PenTool className="w-3 h-3" /> Authorized Sign
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Configured Fields:</span>
                <span className="font-bold text-indigo-600">{tmpl.fields?.length || 0} fields</span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => openEditTemplateModal(tmpl)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Adjust & Align
                </button>
                <Link
                  href="/dashboard/certificates/generate"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Issue With This
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FULL-FEATURED TEMPLATE STUDIO & ALIGNMENT MODAL */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl border border-slate-200 flex flex-col max-h-[96vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight">
                    {editingTemplateId ? "Customize Template & Adjust Alignments" : "Upload & Design New Certificate Template"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Aishwi Technologies Certificate Studio • Visual Text Aligner & Layout Designer
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditorOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Template Meta & Upload Background (4 Cols) */}
              <div className="lg:col-span-4 space-y-5">
                {/* 1. Template General Settings */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-indigo-600" /> Template Details
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g. Aishwi Annual Excellence 2026"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Certificate Type
                      </label>
                      <select
                        value={certificateType}
                        onChange={(e) => setCertificateType(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                      >
                        <option value="INTERNSHIP">Internship</option>
                        <option value="COURSE">Course Completion</option>
                        <option value="MERIT">Merit & Honor</option>
                        <option value="WORKSHOP">Workshop</option>
                        <option value="APPRECIATION">Appreciation</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Orientation
                      </label>
                      <select
                        value={orientation}
                        onChange={(e) => setOrientation(e.target.value as any)}
                        className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                      >
                        <option value="LANDSCAPE">Landscape (A4)</option>
                        <option value="PORTRAIT">Portrait (A4)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Upload Own Background Template */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-indigo-600" /> Upload Background
                    </h3>
                    {backgroundUrl && (
                      <button
                        onClick={() => setBackgroundUrl(null)}
                        className="text-[11px] text-rose-600 hover:underline font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleTemplateUpload}
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                  />

                  {backgroundUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-300 group">
                      <img
                        src={backgroundUrl}
                        alt="Uploaded Template Background"
                        className="w-full h-32 object-contain bg-slate-900"
                      />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white text-slate-800 rounded-lg text-xs font-semibold shadow"
                        >
                          Change Background
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-4 text-center cursor-pointer bg-white transition hover:bg-indigo-50/20"
                    >
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-slate-700">Upload Certificate Template Design</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        PNG or JPG (e.g. 1920x1080 or A4 ratio). Leave blank to use our built-in royal navy & gold border.
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. Upload Authorized Signature */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-indigo-600" /> Authorized Sign
                    </h3>
                    {signatureUrl && (
                      <button
                        type="button"
                        onClick={() => setSignatureUrl(null)}
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

                  {signatureUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-white p-3 flex flex-col items-center justify-center group">
                      <img
                        src={signatureUrl}
                        alt="Authorized Signature"
                        className="h-14 max-w-full object-contain"
                      />
                      <div className="w-28 border-t border-slate-400 mt-2" />
                      <span className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">
                        Authorized Signatory
                      </span>
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition rounded-xl">
                        <button
                          type="button"
                          onClick={() => signatureInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white text-slate-800 rounded-lg text-xs font-semibold shadow"
                        >
                          Change Signature
                        </button>
                        <button
                          type="button"
                          onClick={() => setSignatureUrl(null)}
                          className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold shadow"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => signatureInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-4 text-center cursor-pointer bg-white transition hover:bg-indigo-50/20"
                    >
                      <PenTool className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-slate-700">Upload Authorized Signature</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        PNG or JPG (transparent background recommended). Will render on certificate.
                      </p>
                    </div>
                  )}
                </div>

                {/* 4. Fields List */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" /> Certificate Fields ({fields.length})
                    </h3>
                    <button
                      onClick={handleAddField}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Field
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {fields.map((f, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedFieldIndex(idx)}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium cursor-pointer transition ${
                          selectedFieldIndex === idx
                            ? "bg-indigo-600 text-white shadow-sm font-semibold"
                            : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        <span className="truncate pr-2">{f.label || f.fieldKey}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                              selectedFieldIndex === idx
                                ? "bg-white/20 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {f.alignment}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveField(idx);
                            }}
                            className={`p-1 rounded hover:bg-rose-500 hover:text-white transition ${
                              selectedFieldIndex === idx ? "text-white/80" : "text-slate-400"
                            }`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Visual Text Aligner Controls + Live Canvas (8 Cols) */}
              <div className="lg:col-span-8 space-y-5">
                {/* TEXT ALIGNER & ATTRIBUTE CONTROLS */}
                {currentField && (
                  <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-lg border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold block">
                          Field Adjustments
                        </span>
                        <h4 className="text-sm font-bold text-white">{currentField.label || currentField.fieldKey}</h4>
                      </div>

                      {/* TEXT ALIGNER BUTTONS */}
                      <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                        <span className="text-[10px] text-slate-400 px-2 font-medium">Text Aligner:</span>
                        <button
                          type="button"
                          onClick={() => updateCurrentField({ alignment: "left" })}
                          title="Align Left"
                          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                            currentField.alignment === "left"
                              ? "bg-indigo-600 text-white shadow"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          <AlignLeft className="w-4 h-4" /> Left
                        </button>
                        <button
                          type="button"
                          onClick={() => updateCurrentField({ alignment: "center" })}
                          title="Align Center"
                          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                            currentField.alignment === "center"
                              ? "bg-indigo-600 text-white shadow"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          <AlignCenter className="w-4 h-4" /> Center
                        </button>
                        <button
                          type="button"
                          onClick={() => updateCurrentField({ alignment: "right" })}
                          title="Align Right"
                          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                            currentField.alignment === "right"
                              ? "bg-indigo-600 text-white shadow"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          <AlignRight className="w-4 h-4" /> Right
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      {/* Horizontal X Coordinate */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-slate-300">
                          <span>Horizontal (X)</span>
                          <span className="font-mono text-indigo-400 font-bold">{Math.round(currentField.x)} pt</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max={Math.round(canvasWidth - 20)}
                          value={currentField.x}
                          onChange={(e) => updateCurrentField({ x: parseFloat(e.target.value) })}
                          className="w-full accent-indigo-500"
                        />
                        <div className="flex gap-1 justify-between">
                          <button
                            type="button"
                            onClick={() => updateCurrentField({ x: Math.max(20, currentField.x - 5) })}
                            className="px-2 py-0.5 bg-slate-800 rounded hover:bg-slate-700 text-[10px]"
                          >
                            -5 pt
                          </button>
                          <button
                            type="button"
                            onClick={() => updateCurrentField({ x: Math.round(canvasWidth / 2) })}
                            className="px-2 py-0.5 bg-slate-800 rounded hover:bg-slate-700 text-[10px]"
                          >
                            Center
                          </button>
                          <button
                            type="button"
                            onClick={() => updateCurrentField({ x: Math.min(canvasWidth - 20, currentField.x + 5) })}
                            className="px-2 py-0.5 bg-slate-800 rounded hover:bg-slate-700 text-[10px]"
                          >
                            +5 pt
                          </button>
                        </div>
                      </div>

                      {/* Vertical Y Coordinate (PDF bottom-origin) */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-slate-300">
                          <span>Vertical (Y)</span>
                          <span className="font-mono text-indigo-400 font-bold">{Math.round(currentField.y)} pt</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max={Math.round(canvasHeight - 20)}
                          value={currentField.y}
                          onChange={(e) => updateCurrentField({ y: parseFloat(e.target.value) })}
                          className="w-full accent-indigo-500"
                        />
                        <div className="flex gap-1 justify-between">
                          <button
                            type="button"
                            onClick={() => updateCurrentField({ y: Math.max(20, currentField.y - 5) })}
                            className="px-2 py-0.5 bg-slate-800 rounded hover:bg-slate-700 text-[10px]"
                          >
                            -5 pt
                          </button>
                          <button
                            type="button"
                            onClick={() => updateCurrentField({ y: Math.round(canvasHeight / 2) })}
                            className="px-2 py-0.5 bg-slate-800 rounded hover:bg-slate-700 text-[10px]"
                          >
                            Middle
                          </button>
                          <button
                            type="button"
                            onClick={() => updateCurrentField({ y: Math.min(canvasHeight - 20, currentField.y + 5) })}
                            className="px-2 py-0.5 bg-slate-800 rounded hover:bg-slate-700 text-[10px]"
                          >
                            +5 pt
                          </button>
                        </div>
                      </div>

                      {/* Font Size & Weight */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-slate-300">
                          <span>Font Size</span>
                          <span className="font-mono text-indigo-400 font-bold">{currentField.fontSize} px</span>
                        </div>
                        <input
                          type="range"
                          min="9"
                          max="44"
                          value={currentField.fontSize}
                          onChange={(e) => updateCurrentField({ fontSize: parseInt(e.target.value, 10) })}
                          className="w-full accent-indigo-500"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => updateCurrentField({ fontWeight: "normal" })}
                            className={`flex-1 py-1 rounded text-[10px] font-medium border ${
                              currentField.fontWeight === "normal"
                                ? "bg-indigo-600 border-indigo-500 text-white"
                                : "bg-slate-800 border-slate-700 text-slate-300"
                            }`}
                          >
                            Regular
                          </button>
                          <button
                            type="button"
                            onClick={() => updateCurrentField({ fontWeight: "bold" })}
                            className={`flex-1 py-1 rounded text-[10px] font-bold border ${
                              currentField.fontWeight === "bold"
                                ? "bg-indigo-600 border-indigo-500 text-white"
                                : "bg-slate-800 border-slate-700 text-slate-300"
                            }`}
                          >
                            Bold
                          </button>
                        </div>
                      </div>

                      {/* Color Palette */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-slate-300">
                          <span>Text Color</span>
                          <span className="font-mono text-indigo-400 font-bold">{currentField.color}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_COLORS.map((col) => (
                            <button
                              key={col}
                              type="button"
                              onClick={() => updateCurrentField({ color: col })}
                              className={`w-6 h-6 rounded-full border transition ${
                                currentField.color === col
                                  ? "ring-2 ring-indigo-400 scale-110 border-white"
                                  : "border-slate-700 hover:scale-105"
                              }`}
                              style={{ backgroundColor: col }}
                            />
                          ))}
                        </div>
                        <input
                          type="text"
                          value={currentField.color}
                          onChange={(e) => updateCurrentField({ color: e.target.value })}
                          placeholder="#000000"
                          className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-white mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* LIVE VISUAL PREVIEW CANVAS */}
                <div className="bg-slate-100 p-4 rounded-3xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-indigo-600" /> Live Interactive Certificate Canvas
                    </span>
                    <button
                      type="button"
                      onClick={generateLivePdfPreview}
                      disabled={previewLoading}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      {previewLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Rendering PDF...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Render Exact PDF Preview
                        </>
                      )}
                    </button>
                  </div>

                  {/* Canvas Container with scaled aspect ratio */}
                  <div
                    className="relative w-full rounded-2xl overflow-hidden shadow-md border-2 border-slate-300 select-none bg-white"
                    style={{
                      aspectRatio: `${canvasWidth} / ${canvasHeight}`,
                    }}
                  >
                    {/* Background: Either Uploaded Image or Built-in Royal Navy frame */}
                    {backgroundUrl ? (
                      <img
                        src={backgroundUrl}
                        alt="Background Template"
                        className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full bg-[#fdfdfd] border-8 border-[#131f47] p-2 pointer-events-none">
                        <div className="w-full h-full border border-[#d4af37] flex flex-col items-center pt-8">
                          <img
                            src="/logo.png"
                            alt="Aishwi Technologies"
                            className="w-12 h-12 object-contain mb-1"
                          />
                          <span className="text-[13px] font-bold text-[#131f47] uppercase tracking-wider">
                            Aishwi Technologies
                          </span>
                          <span className="text-[17px] font-serif font-bold text-[#0f172a] mt-1">
                            CERTIFICATE OF COMPLETION
                          </span>
                          <span className="text-[9px] uppercase tracking-widest text-slate-500 mt-1">
                            THIS IS PROUDLY PRESENTED TO
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Render Each Field visually according to its coordinates and text aligner */}
                    {fields.map((field, idx) => {
                      // Convert PDF bottom-left origin to CSS top-left percentage
                      const topPercent = ((canvasHeight - field.y) / canvasHeight) * 100;
                      const leftPercent = (field.x / canvasWidth) * 100;
                      const isSelected = selectedFieldIndex === idx;

                      let textAlignClass = "text-center";
                      let transformOrigin = "translate(-50%, -50%)";
                      if (field.alignment === "left") {
                        textAlignClass = "text-left";
                        transformOrigin = "translate(0%, -50%)";
                      } else if (field.alignment === "right") {
                        textAlignClass = "text-right";
                        transformOrigin = "translate(-100%, -50%)";
                      }

                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedFieldIndex(idx)}
                          className={`absolute cursor-pointer transition-all ${
                            isSelected
                              ? "ring-2 ring-indigo-600 bg-indigo-50/70 shadow-lg rounded px-1.5 py-0.5 z-20"
                              : "hover:ring-1 hover:ring-slate-400 rounded px-1 z-10"
                          }`}
                          style={{
                            top: `${topPercent}%`,
                            left: `${leftPercent}%`,
                            transform: transformOrigin,
                            color: field.color,
                            fontSize: `calc(${field.fontSize}px * 0.75)`,
                            fontWeight: field.fontWeight === "bold" ? 700 : 400,
                            fontFamily: field.fontFamily.includes("Times") ? "serif" : "sans-serif",
                            textAlign: field.alignment,
                          }}
                        >
                          {field.staticValue || `[${field.label || field.fieldKey}]`}
                        </div>
                      );
                    })}

                    {/* Render Signature if uploaded */}
                    {signatureUrl && (
                      <div
                        className="absolute z-20 pointer-events-none flex flex-col items-center"
                        style={{
                          bottom: "12%",
                          right: "8%",
                          width: "120px",
                        }}
                      >
                        <img
                          src={signatureUrl}
                          alt="Authorized Signature"
                          className="max-h-12 max-w-[120px] object-contain drop-shadow"
                        />
                        <div className="w-24 border-t border-slate-700 mt-1" />
                        <span className="text-[8px] font-bold text-slate-700 tracking-wider uppercase mt-0.5">
                          Authorized Signatory
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Rendered PDF Modal Viewer if generated */}
                  {pdfPreviewBlob && (
                    <div className="mt-4 p-4 bg-white rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800">
                          Exact Generated Vector PDF Output:
                        </span>
                        <a
                          href={pdfPreviewBlob}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-indigo-600 hover:underline font-semibold"
                        >
                          Open in Full Tab ↗
                        </a>
                      </div>
                      <iframe
                        src={pdfPreviewBlob}
                        className="w-full h-96 rounded-xl border border-slate-200 shadow-inner"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {saveSuccess && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" /> Template & Alignments Saved Successfully!
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Saving Template...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Template
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
