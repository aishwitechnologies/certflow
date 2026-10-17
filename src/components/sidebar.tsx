"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Award,
  Sparkles,
  FileCode,
  GraduationCap,
  Users,
  Database,
  Sheet,
  ShieldCheck,
  BarChart3,
  UserCheck,
  History,
  Settings,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Certificates", href: "/dashboard/certificates", icon: Award },
  { label: "Generate Certificates", href: "/dashboard/certificates/generate", icon: Sparkles, highlight: true },
  { label: "Certificate Templates", href: "/dashboard/templates", icon: FileCode },
  { label: "Programs", href: "/dashboard/programs", icon: GraduationCap },
  { label: "Candidates", href: "/dashboard/candidates", icon: Users },
  { label: "Data Sources", href: "/dashboard/data-sources", icon: Database },
  { label: "Google Sheets", href: "/dashboard/data-sources?tab=google", icon: Sheet },
  { label: "Verification", href: "/dashboard/verification", icon: ShieldCheck },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Users", href: "/dashboard/users", icon: UserCheck },
  { label: "Audit Logs", href: "/dashboard/audit-logs", icon: History },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-screen">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white text-base tracking-tight block">CertFlow</span>
            <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider block">Enterprise Automation</span>
          </div>
        </Link>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                item.highlight
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30"
                  : isActive
                  ? "bg-slate-800 text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${item.highlight ? "text-indigo-400" : isActive ? "text-indigo-400" : "text-slate-400"}`} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
