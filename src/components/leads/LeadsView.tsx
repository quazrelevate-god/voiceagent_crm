"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Star, Phone, StickyNote } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { LeadProfile } from "@/components/leads/LeadProfile";
import Link from "next/link";
import type { LeadStage, CallFeedback, User, LeadFieldDefinitionWithOptions } from "@/types";

type LeadSummary = {
  id: string;
  starRating: number | null;
  stage: LeadStage;
  assignedTo: User | null;
  fieldValues: { value: string | null; fieldDef: { name: string; isPrimary1: boolean; isPrimary2: boolean } }[];
  _count: { callLogs: number; notes: number };
  updatedAt: string | Date;
};

interface Props {
  initialLeads: LeadSummary[];
  stages: LeadStage[];
  feedbacks: CallFeedback[];
  fieldDefs: LeadFieldDefinitionWithOptions[];
  teamMembers: User[];
}

function getLeadDisplayName(lead: LeadSummary): string {
  const h1 = lead.fieldValues.find((fv) => fv.fieldDef.isPrimary1)?.value ?? "";
  const h2 = lead.fieldValues.find((fv) => fv.fieldDef.isPrimary2)?.value ?? "";
  return [h1, h2].filter(Boolean).join(" · ") || "Unknown Lead";
}

const STAGE_PILL: Record<string, string> = {
  INITIAL: "bg-blue-500/15 text-blue-300 border border-blue-500/20",
  ACTIVE: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
  CLOSED_WON: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
  CLOSED_LOST: "bg-rose-500/15 text-rose-300 border border-rose-500/20",
};

const STAGE_FILTER_ACTIVE: Record<string, string> = {
  INITIAL: "bg-blue-500/20 text-blue-200 border-blue-500/30",
  ACTIVE: "bg-amber-500/20 text-amber-200 border-amber-500/30",
  CLOSED_WON: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
  CLOSED_LOST: "bg-rose-500/20 text-rose-200 border-rose-500/30",
};

export function LeadsView({ initialLeads, stages, feedbacks, fieldDefs, teamMembers }: Props) {
  const [leads, setLeads] = useState(initialLeads);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const matchesStage = stageFilter === "all" || l.stage.id === stageFilter;
      const matchesQuery =
        !query ||
        getLeadDisplayName(l).toLowerCase().includes(query.toLowerCase()) ||
        l.fieldValues.some((fv) => fv.value?.toLowerCase().includes(query.toLowerCase()));
      return matchesStage && matchesQuery;
    });
  }, [leads, query, stageFilter]);

  const selectedLead = leads.find((l) => l.id === selectedId) ?? null;

  function onLeadUpdated(updatedLead: LeadSummary) {
    setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)));
  }

  return (
    <div className="flex h-full">
      {/* ── Left panel ── */}
      <div className="flex flex-col w-80 border-r border-white/[0.07] bg-white/[0.02] backdrop-blur-xl shrink-0">

        {/* Search + Add */}
        <div className="p-3 border-b border-white/[0.06] space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
              <Input
                className="pl-8 h-8 text-sm bg-white/[0.05] border-white/[0.10] text-white placeholder:text-white/30 focus-visible:ring-indigo-500/40 focus-visible:ring-1 focus-visible:ring-offset-0"
                placeholder="Search leads…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button
              size="icon"
              className="h-8 w-8 shrink-0 bg-indigo-500/80 hover:bg-indigo-500 text-white shadow-[0_2px_12px_rgba(99,102,241,0.3)] border-0"
              asChild
            >
              <Link href="/leads/add"><Plus className="h-4 w-4" /></Link>
            </Button>
          </div>

          {/* Stage filter pills */}
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setStageFilter("all")}
              className={cn(
                "text-[11px] px-2.5 py-0.5 rounded-full border transition-all duration-150 font-medium",
                stageFilter === "all"
                  ? "bg-indigo-500/20 text-indigo-200 border-indigo-500/30"
                  : "text-white/35 border-white/[0.10] hover:bg-white/[0.07] hover:text-white/60"
              )}
            >
              All ({leads.length})
            </button>
            {stages.map((s) => (
              <button
                key={s.id}
                onClick={() => setStageFilter(s.id)}
                className={cn(
                  "text-[11px] px-2.5 py-0.5 rounded-full border transition-all duration-150 font-medium",
                  stageFilter === s.id
                    ? STAGE_FILTER_ACTIVE[s.category] ?? "bg-indigo-500/20 text-indigo-200 border-indigo-500/30"
                    : "text-white/35 border-white/[0.10] hover:bg-white/[0.07] hover:text-white/60"
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Lead list */}
        <ScrollArea className="flex-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="h-12 w-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-3">
                <Phone className="h-5 w-5 text-white/20" />
              </div>
              <p className="text-sm text-white/35">No leads found</p>
            </div>
          ) : (
            <div className="py-1">
              {filtered.map((lead) => {
                const isSelected = selectedId === lead.id;
                return (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedId(lead.id)}
                    className={cn(
                      "w-full text-left px-4 py-3.5 transition-all duration-150 group border-l-2",
                      isSelected
                        ? "bg-white/[0.07] border-l-indigo-400"
                        : "hover:bg-white/[0.04] border-l-transparent"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={cn(
                          "text-sm font-medium truncate transition-colors",
                          isSelected ? "text-white" : "text-white/75 group-hover:text-white/90"
                        )}>
                          {getLeadDisplayName(lead)}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className={cn(
                            "text-[11px] px-2 py-0.5 rounded-full font-medium",
                            STAGE_PILL[lead.stage.category] ?? "bg-white/10 text-white/60"
                          )}>
                            {lead.stage.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {lead.starRating && (
                          <div className="flex gap-0.5">
                            {Array.from({ length: lead.starRating }).map((_, i) => (
                              <Star key={i} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-white/30">
                          {lead._count.callLogs > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Phone className="h-2.5 w-2.5" />
                              {lead._count.callLogs}
                            </span>
                          )}
                          {lead._count.notes > 0 && (
                            <span className="flex items-center gap-0.5">
                              <StickyNote className="h-2.5 w-2.5" />
                              {lead._count.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer count */}
        <div className="border-t border-white/[0.06] px-4 py-2.5">
          <p className="text-[11px] text-white/25">
            {filtered.length} of {leads.length} leads
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 overflow-auto">
        {selectedLead ? (
          <LeadProfile
            leadId={selectedLead.id}
            stages={stages}
            feedbacks={feedbacks}
            fieldDefs={fieldDefs}
            teamMembers={teamMembers}
            onUpdate={onLeadUpdated}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-4 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
                <Phone className="h-7 w-7 text-white/20" />
              </div>
              <p className="text-sm text-white/40 mb-1">No lead selected</p>
              <p className="text-xs text-white/25 mb-5">Pick one from the list or add a new lead</p>
              <Button
                size="sm"
                className="bg-indigo-500/80 hover:bg-indigo-500 text-white border-0 shadow-[0_2px_12px_rgba(99,102,241,0.3)]"
                asChild
              >
                <Link href="/leads/add">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Lead
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
