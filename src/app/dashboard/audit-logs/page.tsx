"use client";

import { useEffect, useState } from "react";
import { History, Filter, User } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState("ALL");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/audit-logs?action=${selectedAction}`)
      .then((r) => r.json())
      .then((d) => {
        setLogs(d.logs || []);
        setLoading(false);
      });
  }, [selectedAction]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit Trail</h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable log of all user authentications, batch issuances, revocations, and configuration modifications.
          </p>
        </div>

        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 self-start"
        >
          <option value="ALL">All Recorded Actions</option>
          <option value="LOGIN">Login</option>
          <option value="LOGOUT">Logout</option>
          <option value="GENERATION_STARTED">Generation Started</option>
          <option value="GENERATION_COMPLETED">Generation Completed</option>
          <option value="CERTIFICATE_REVOKED">Certificate Revoked</option>
          <option value="CERTIFICATE_REGENERATED">Certificate Regenerated</option>
          <option value="SETTINGS_UPDATED">Settings Updated</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {log.user ? `${log.user.name} (${log.user.role})` : "System / Automated"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[10px] border border-indigo-100">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {log.entity} {log.entityId ? `(#${log.entityId.slice(-6)})` : ""}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] truncate max-w-xs">
                      {log.details || "-"}
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
