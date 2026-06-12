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

const navItems = [
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/call-logs", label: "Call Logs", icon: PhoneCall },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/team", label: "Team", icon: Users },
  { href: "/filters", label: "Filters", icon: Filter },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

const settingsItems = [
  { href: "/settings/fields", label: "Lead Fields" },
  { href: "/settings/stages", label: "Lead Stages" },
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
    <aside className="flex h-full w-60 flex-col bg-white/[0.025] backdrop-blur-2xl border-r border-white/[0.07] relative z-20 shrink-0">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-white/[0.06]">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-600 shadow-lg shadow-indigo-500/30 shrink-0">
          <Zap className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-white leading-none">VoiceAgent</p>
          <p className="text-[10px] text-white/35 tracking-[0.18em] uppercase mt-0.5">CRM</p>
        </div>
      </div>

      <ScrollArea className="flex-1 py-3">
        {/* Main nav */}
        <div className="px-3 mb-1">
          <p className="text-[10px] font-semibold text-white/25 tracking-[0.15em] uppercase px-2 mb-2">Navigation</p>
          <nav className="space-y-0.5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group border",
                    isActive
                      ? "bg-indigo-500/[0.18] text-white border-indigo-500/25 shadow-[0_0_16px_rgba(99,102,241,0.12)]"
                      : "text-white/45 hover:bg-white/[0.06] hover:text-white/80 border-transparent"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-indigo-400" : "text-white/35 group-hover:text-white/60"
                    )}
                  />
                  <span>{label}</span>
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.8)]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Settings */}
        <div className="px-3 mt-3">
          <p className="text-[10px] font-semibold text-white/25 tracking-[0.15em] uppercase px-2 mb-2">Config</p>
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <CollapsibleTrigger
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group border",
                settingsOpen
                  ? "bg-white/[0.06] text-white/80 border-white/[0.08]"
                  : "text-white/45 hover:bg-white/[0.06] hover:text-white/80 border-transparent"
              )}
            >
              <Settings
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  settingsOpen ? "text-white/60" : "text-white/35 group-hover:text-white/60"
                )}
              />
              <span>Settings</span>
              <ChevronDown
                className={cn(
                  "ml-auto h-3.5 w-3.5 text-white/30 transition-transform duration-200",
                  settingsOpen && "rotate-180"
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 ml-3 pl-3 border-l border-white/[0.07] space-y-0.5">
              {settingsItems.map(({ href, label }) => (
                <Link
                  key={href}
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
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>

      {/* Workspace / logout footer */}
      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500/25 to-blue-500/25 border border-white/[0.10] flex items-center justify-center shrink-0">
            <Building2 className="h-3.5 w-3.5 text-white/45" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white/60 truncate">Workspace</p>
            <p className="text-[10px] text-white/30">Sales Team</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-lg text-white/25 hover:bg-white/[0.07] hover:text-white/60 transition-colors shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
