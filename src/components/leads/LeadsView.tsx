"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Star, Phone, Clock, StickyNote } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { LeadProfile } from "@/components/leads/LeadProfile";
import Link from "next/link";
import type {
  LeadStage, CallFeedback, User,
  LeadFieldDefinitionWithOptions,
} from "@/types";

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
  return [h1, h2].filter(Boolean).join(" — ") || "Unknown Lead";
}

const STAGE_COLORS: Record<string, string> = {
  INITIAL: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-yellow-100 text-yellow-700",
  CLOSED_WON: "bg-green-100 text-green-700",
  CLOSED_LOST: "bg-red-100 text-red-700",
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
      {/* Left pane */}
      <div className="flex flex-col w-80 border-r shrink-0">
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8 h-8 text-sm"
                placeholder="Search leads…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button size="icon" className="h-8 w-8 shrink-0" asChild>
              <Link href="/leads/add"><Plus className="h-4 w-4" /></Link>
            </Button>
          </div>

          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setStageFilter("all")}
              className={cn("text-xs px-2 py-0.5 rounded-full border transition-colors",
                stageFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
              )}
            >
              All ({leads.length})
            </button>
            {stages.map((s) => (
              <button
                key={s.id}
                onClick={() => setStageFilter(s.id)}
                className={cn("text-xs px-2 py-0.5 rounded-full border transition-colors",
                  stageFilter === s.id ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">No leads found</p>
          ) : (
            <div className="divide-y">
              {filtered.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => setSelectedId(lead.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors",
                    selectedId === lead.id && "bg-muted"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{getLeadDisplayName(lead)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", STAGE_COLORS[lead.stage.category])}>
                          {lead.stage.name}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {lead.starRating && (
                        <div className="flex">
                          {Array.from({ length: lead.starRating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {lead._count.callLogs > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Phone className="h-3 w-3" />{lead._count.callLogs}
                          </span>
                        )}
                        {lead._count.notes > 0 && (
                          <span className="flex items-center gap-0.5">
                            <StickyNote className="h-3 w-3" />{lead._count.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right pane */}
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
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Phone className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a lead to view details</p>
              <Button className="mt-4" size="sm" asChild>
                <Link href="/leads/add">Add Lead</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
