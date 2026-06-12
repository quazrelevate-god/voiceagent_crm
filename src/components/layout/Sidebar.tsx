"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Users, BarChart3, Filter, Megaphone, Settings,
  PhoneCall, ChevronDown, Building2, LogOut, Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/leads",     label: "Leads",     icon: Users },
  { href: "/call-logs", label: "Call Logs", icon: PhoneCall },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/team",      label: "Team",      icon: Users },
  { href: "/filters",   label: "Filters",   icon: Filter },
  { href: "/reports",   label: "Reports",   icon: BarChart3 },
];

const settingsItems = [
  { href: "/settings/fields",    label: "Lead Fields" },
  { href: "/settings/stages",    label: "Lead Stages" },
  { href: "/settings/feedbacks", label: "Call Feedbacks" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(pathname.startsWith("/settings"));

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex h-full w-60 flex-col border-r border-white/[0.07] relative z-20 shrink-0"
      style={{
        background: "rgba(12, 12, 18, 0.88)",
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
      }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-white/[0.06]">
        <motion.div
          whileHover={{ scale: 1.08, rotate: 8 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #6366f1, #4f46e5, #3b82f6)",
            boxShadow: "0 4px 16px rgba(99,102,241,0.45), 0 1px 0 rgba(255,255,255,0.2) inset",
          }}
        >
          <Zap className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
        </motion.div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-white leading-none">VoiceAgent</p>
          <p className="text-[10px] text-white/35 tracking-[0.18em] uppercase mt-0.5">CRM</p>
        </div>
      </div>

      <ScrollArea className="flex-1 py-3">
        {/* Main nav */}
        <div className="px-3 mb-1">
          <p className="text-[10px] font-semibold text-white/25 tracking-[0.15em] uppercase px-2 mb-2">
            Navigation
          </p>
          <nav className="space-y-0.5">
            {navItems.map(({ href, label, icon: Icon }, i) => {
              const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.22, ease: "easeOut" }}
                >
                  <motion.div whileTap={{ scale: 0.97 }}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 group border relative overflow-hidden",
                        isActive
                          ? "text-white border-indigo-500/20"
                          : "text-white/45 hover:text-white/85 border-transparent hover:border-white/[0.05]"
                      )}
                      style={isActive ? {
                        background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(79,70,229,0.10))",
                        boxShadow: "0 0 20px rgba(99,102,241,0.10), 0 1px 0 rgba(255,255,255,0.05) inset",
                      } : undefined}
                    >
                      {!isActive && (
                        <span
                          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{ background: "rgba(255,255,255,0.03)" }}
                        />
                      )}
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors duration-200 relative z-10",
                          isActive ? "text-indigo-400" : "text-white/30 group-hover:text-white/60"
                        )}
                      />
                      <span className="relative z-10">{label}</span>
                      {isActive && (
                        <motion.span
                          layoutId="sidebar-dot"
                          className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400"
                          style={{ boxShadow: "0 0 8px rgba(129,140,248,0.9)" }}
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                    </Link>
                  </motion.div>
                </motion.div>
              );
            })}
          </nav>
        </div>

        {/* Settings */}
        <div className="px-3 mt-3">
          <p className="text-[10px] font-semibold text-white/25 tracking-[0.15em] uppercase px-2 mb-2">Config</p>
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <motion.div whileTap={{ scale: 0.98 }}>
              <CollapsibleTrigger
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group border",
                  settingsOpen
                    ? "bg-white/[0.05] text-white/80 border-white/[0.07]"
                    : "text-white/45 hover:bg-white/[0.03] hover:text-white/80 border-transparent"
                )}
              >
                <Settings
                  className={cn(
                    "h-4 w-4 shrink-0 transition-all duration-300",
                    settingsOpen ? "text-white/60 rotate-45" : "text-white/30 group-hover:text-white/60"
                  )}
                />
                <span>Settings</span>
                <motion.span
                  animate={{ rotate: settingsOpen ? 180 : 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="ml-auto"
                >
                  <ChevronDown className="h-3.5 w-3.5 text-white/30" />
                </motion.span>
              </CollapsibleTrigger>
            </motion.div>

            <AnimatePresence initial={false}>
              {settingsOpen && (
                <CollapsibleContent forceMount asChild>
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -4 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -4 }}
                    transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="overflow-hidden mt-1 ml-3 pl-3 border-l border-white/[0.07] space-y-0.5"
                  >
                    {settingsItems.map(({ href, label }, i) => (
                      <motion.div
                        key={href}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.16 }}
                      >
                        <Link
                          href={href}
                          className={cn(
                            "flex items-center rounded-lg px-3 py-2 text-sm transition-all duration-150",
                            pathname === href
                              ? "text-indigo-300 bg-indigo-500/[0.12] font-medium"
                              : "text-white/40 hover:bg-white/[0.05] hover:text-white/70"
                          )}
                        >
                          {label}
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                </CollapsibleContent>
              )}
            </AnimatePresence>
          </Collapsible>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-2">
          <div
            className="h-8 w-8 rounded-full border border-white/[0.10] flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(59,130,246,0.2))" }}
          >
            <Building2 className="h-3.5 w-3.5 text-white/45" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white/60 truncate">Workspace</p>
            <p className="text-[10px] text-white/30">Sales Team</p>
          </div>
          <motion.button
            onClick={handleLogout}
            title="Sign out"
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.88 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="p-1.5 rounded-lg text-white/25 hover:bg-white/[0.07] hover:text-rose-400 transition-colors shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </div>
    </motion.aside>
  );
}
