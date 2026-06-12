"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

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
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex items-center gap-3 justify-center mb-8"
      >
        <motion.div
          whileHover={{ scale: 1.1, rotate: 10 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          className="flex h-11 w-11 items-center justify-center rounded-xl cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #6366f1, #4f46e5, #3b82f6)",
            boxShadow: "0 6px 24px rgba(99,102,241,0.5), 0 1px 0 rgba(255,255,255,0.2) inset",
          }}
        >
          <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
        </motion.div>
        <div>
          <p className="font-semibold text-base text-white leading-none">VoiceAgent</p>
          <p className="text-[10px] text-white/35 tracking-[0.18em] uppercase mt-0.5">CRM</p>
        </div>
      </motion.div>

      {/* Glass card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="glass-card rounded-2xl p-8"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="space-y-1 mb-6"
        >
          <h1 className="text-xl font-semibold text-white">Sign in to your account</h1>
          <p className="text-sm text-white/40">Enter your credentials to continue</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.28, duration: 0.2 }}
            className="space-y-1.5"
          >
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.34, duration: 0.2 }}
            className="space-y-1.5"
          >
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
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-3.5 py-2.5 text-sm text-rose-300"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.2 }}
            className="mt-2"
          >
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02, y: -1 } : {}}
              whileTap={!loading ? { scale: 0.97 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: loading
                  ? "rgba(99,102,241,0.6)"
                  : "linear-gradient(135deg, #6366f1, #4f46e5)",
                boxShadow: loading ? "none" : "0 2px 16px rgba(99,102,241,0.4), 0 1px 0 rgba(255,255,255,0.15) inset",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white block"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
