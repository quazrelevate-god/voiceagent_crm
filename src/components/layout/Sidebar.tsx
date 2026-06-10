"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Users, Phone, BarChart3, Filter, Megaphone, Settings,
  PhoneCall, ChevronDown, Building2, LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  const [settingsOpen, setSettingsOpen] = useState(
    pathname.startsWith("/settings")
  );

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="flex h-full w-60 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 px-4 border-b border-sidebar-border">
        <Phone className="h-5 w-5 text-primary" />
        <span className="font-semibold tracking-tight">VoiceAgent CRM</span>
      </div>

      <ScrollArea className="flex-1 py-2">
        <nav className="space-y-0.5 px-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}

          <Separator className="my-2 bg-sidebar-border" />

          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
              <ChevronDown
                className={cn("ml-auto h-4 w-4 transition-transform", settingsOpen && "rotate-180")}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
              {settingsItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center rounded-md px-3 py-1.5 text-sm transition-colors",
                    pathname === href
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  {label}
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </nav>
      </ScrollArea>

      {/* Workspace badge + logout */}
      <div className="border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-sidebar-foreground/50">
            <Building2 className="h-3.5 w-3.5" />
            <span>Acme Corp</span>
          </div>
          <button
            onClick={handleLogout}
            className="rounded p-1 text-sidebar-foreground/40 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
