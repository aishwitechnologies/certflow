"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileCode, Plus, Eye, Edit2, Layers, CheckCircle2 } from "lucide-react";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Certificate Templates</h1>
          <p className="text-sm text-slate-500 mt-1">
            Design, preview, and configure field coordinates and dynamic placeholders.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tmpl) => (
          <div
            key={tmpl.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                  {tmpl.pageSize} • {tmpl.orientation}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Version {tmpl.version}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">{tmpl.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{tmpl.description || "Official certificate template"}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Configured Dynamic Fields:</span>
                <span className="font-bold text-indigo-600">{tmpl.fields?.length || 0} fields</span>
              </div>

              <div className="flex gap-2 pt-2">
                <Link
                  href="/dashboard/certificates/generate"
                  className="flex-1 text-center py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition"
                >
                  Generate with this
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
