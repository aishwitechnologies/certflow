"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, User } from "lucide-react";

export function Header() {
  const [user, setUser] = useState<{ name: string; email: string; role: string; organization?: { name: string } } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
          {user?.organization?.name || "Acme Tech Innovations"}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/verify"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 transition"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Public Verification Page</span>
        </Link>

        {user && (
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-xs font-semibold text-slate-800 leading-tight">
                {user.name}
              </span>
              <span className="block text-[10px] text-slate-500 font-mono">
                {user.role}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
