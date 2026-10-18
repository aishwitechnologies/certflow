"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Award, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (roleEmail: string, pass: string) => {
    setEmail(roleEmail);
    setPassword(pass);
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-white shadow-xl mb-4">
          <img
            src="/logo.png"
            alt="Aishwi Technologies"
            className="w-16 h-16 object-contain"
          />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Aishwi Technologies</h2>
        <p className="mt-1 text-xs uppercase tracking-widest font-semibold text-blue-400">
          Empowering Tomorrow, Innovating Today
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Certificate Automation & Public Verification Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-700/60">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="mahesh.perla@aishwitech.in"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/30 transition-all text-sm disabled:opacity-50"
            >
              {loading ? (
                "Signing In..."
              ) : (
                <>
                  Sign In to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick-fill Super Admin Accounts */}
          <div className="mt-8 pt-6 border-t border-slate-700">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider text-center mb-3">
              Authorized Super Admins (One-Click)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials("mahesh.perla@aishwitech.in", "Aishwi@2021")}
                className="py-2 px-2 bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-600 font-medium transition text-center"
              >
                Mahesh Perla
              </button>
              <button
                type="button"
                onClick={() => fillCredentials("ganesh@aishwitech.in", "Aishwi@2021")}
                className="py-2 px-2 bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-600 font-medium transition text-center"
              >
                Ganesh
              </button>
              <button
                type="button"
                onClick={() => fillCredentials("ruthvik.sonti@aishwitech.in", "Aishwi@2021")}
                className="py-2 px-2 bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-600 font-medium transition text-center"
              >
                Ruthvik Sonti
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" /> Go to Verification & Download Portal
          </a>
        </div>
      </div>
    </div>
  );
}
