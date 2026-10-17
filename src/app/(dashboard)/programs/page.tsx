"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Plus, CheckCircle2, Clock, X, FileCode } from "lucide-react";

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    programId: "",
    name: "",
    description: "",
    duration: "4 Weeks",
    certificateType: "INTERNSHIP",
    defaultTemplateId: "",
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/programs").then((r) => r.json()),
      fetch("/api/templates").then((r) => r.json()),
    ])
      .then(([progData, tmplData]) => {
        setPrograms(progData.programs || []);
        setTemplates(tmplData.templates || []);
        if (tmplData.templates?.length > 0 && !formData.defaultTemplateId) {
          setFormData((prev) => ({ ...prev, defaultTemplateId: tmplData.templates[0].id }));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to create program");
      setModalOpen(false);
      setFormData({
        programId: "",
        name: "",
        description: "",
        duration: "4 Weeks",
        certificateType: "INTERNSHIP",
        defaultTemplateId: templates[0]?.id || "",
      });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Program Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure programs, internship tracks, workshop cohorts, and their associated certificate templates.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-md shadow-indigo-600/20 transition self-start"
        >
          <Plus className="w-4 h-4" /> Add Program
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((prog) => (
          <div
            key={prog.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                  {prog.programId}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {prog.status}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">{prog.name}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{prog.description}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Duration</span>
                <span className="font-semibold text-slate-800">{prog.duration || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span>Certificate Type</span>
                <span className="font-semibold text-slate-800">{prog.certificateType}</span>
              </div>
              <div className="flex justify-between">
                <span>Default Template</span>
                <span className="font-semibold text-indigo-600 truncate max-w-[150px]">
                  {prog.defaultTemplate?.name || "Standard"}
                </span>
              </div>
              <div className="flex justify-between pt-1 font-mono text-[11px] text-slate-500">
                <span>Issued Certificates:</span>
                <span className="font-bold text-slate-900">{prog._count?.certificates || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Create New Program</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Program Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Cloud Computing Internship"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Program ID / Code</label>
                  <input
                    type="text"
                    required
                    value={formData.programId}
                    onChange={(e) => setFormData({ ...formData, programId: e.target.value.toUpperCase() })}
                    placeholder="PROG-CC-01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Duration</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g. 6 Weeks"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Certificate Type</label>
                <select
                  value={formData.certificateType}
                  onChange={(e) => setFormData({ ...formData, certificateType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="INTERNSHIP">Internship Certificate</option>
                  <option value="WORKSHOP">Workshop Certificate</option>
                  <option value="COURSE">Course Completion Certificate</option>
                  <option value="PARTICIPATION">Participation Certificate</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Default Template</label>
                <select
                  value={formData.defaultTemplateId}
                  onChange={(e) => setFormData({ ...formData, defaultTemplateId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.orientation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Program overview and objectives..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition"
                >
                  Save Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
