"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.refresh();
    window.location.href = "/leads";
  }

  return (
    <div className="w-full max-w-sm mx-4">
      {/* Logo */}
      <div className="flex items-center gap-3 justify-center mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-600 shadow-lg shadow-indigo-500/30">
          <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <p className="font-semibold text-base text-white leading-none">VoiceAgent</p>
          <p className="text-[10px] text-white/35 tracking-[0.18em] uppercase mt-0.5">CRM</p>
        </div>
      </div>

      {/* Glass card */}
      <div className="glass-card rounded-2xl p-8">
        <div className="space-y-1 mb-6">
          <h1 className="text-xl font-semibold text-white">Sign in to your account</h1>
          <p className="text-sm text-white/40">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50 tracking-wide uppercase" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm placeholder:text-white/25 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50 tracking-wide uppercase" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm placeholder:text-white/25 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-3.5 py-2.5 text-sm text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-500/80 hover:bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0_2px_16px_rgba(99,102,241,0.35)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
