"use client";

import { useState, useMemo } from "react";
import {
  Search, Plus, Star, Phone, StickyNote,
  ChevronUp, ChevronDown, SlidersHorizontal, X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { LeadProfile } from "@/components/leads/LeadProfile";
import Link from "next/link";
import type { LeadStage, CallFeedback, User, LeadFieldDefinitionWithOptions } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

type LeadSummary = {
  id: string;
  starRating: number | null;
  stage: LeadStage;
  assignedTo: User | null;
  fieldValues: {
    value: string | null;
    fieldDef: { name: string; isPrimary1: boolean; isPrimary2: boolean };
  }[];
  _count: { callLogs: number; notes: number };
  updatedAt: string | Date;
  callLogs: { callFeedback: { name: string } | null }[];
};

interface Props {
  initialLeads: LeadSummary[];
  stages: LeadStage[];
  feedbacks: CallFeedback[];
  fieldDefs: LeadFieldDefinitionWithOptions[];
  teamMembers: User[];
}

type SortConfig = { col: string; dir: "asc" | "desc" };
type FieldFilter = { fieldName: string; value: string };

const STAGE_PILL: Record<string, string> = {
  INITIAL:     "bg-blue-500/15 text-blue-300 border border-blue-500/20",
  ACTIVE:      "bg-amber-500/15 text-amber-300 border border-amber-500/20",
  CLOSED_WON:  "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
  CLOSED_LOST: "bg-rose-500/15 text-rose-300 border border-rose-500/20",
};

const STAGE_FILTER_ACTIVE: Record<string, string> = {
  INITIAL:     "bg-blue-500/20 text-blue-200 border-blue-500/30",
  ACTIVE:      "bg-amber-500/20 text-amber-200 border-amber-500/30",
  CLOSED_WON:  "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
  CLOSED_LOST: "bg-rose-500/20 text-rose-200 border-rose-500/30",
};

function getLeadDisplayName(lead: LeadSummary): string {
  const h1 = lead.fieldValues.find((fv) => fv.fieldDef.isPrimary1)?.value ?? "";
  const h2 = lead.fieldValues.find((fv) => fv.fieldDef.isPrimary2)?.value ?? "";
  return [h1, h2].filter(Boolean).join(" · ") || "Unknown Lead";
}

function getFieldVal(lead: LeadSummary, fieldName: string): string | null {
  return lead.fieldValues.find((fv) => fv.fieldDef.name === fieldName)?.value ?? null;
}

function SortIcon({ col, sort }: { col: string; sort: SortConfig }) {
  if (sort.col !== col)
    return <ChevronUp className="h-3 w-3 text-white/15 opacity-0 group-hover:opacity-100 transition-opacity" />;
  return sort.dir === "asc"
    ? <ChevronUp className="h-3 w-3 text-indigo-400" />
    : <ChevronDown className="h-3 w-3 text-indigo-400" />;
}

export function LeadsView({ initialLeads, stages, feedbacks, fieldDefs, teamMembers }: Props) {
  const [leads, setLeads] = useState(initialLeads);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortConfig>({ col: "updatedAt", dir: "desc" });
  const [fieldFilters, setFieldFilters] = useState<FieldFilter[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingFieldName, setPendingFieldName] = useState("");
  const [pendingValue, setPendingValue] = useState("");

  /* Dynamic table columns: non-primary fields, up to 4 */
  const dynamicCols = useMemo(
    () => fieldDefs.filter((fd) => !fd.isPrimary1 && !fd.isPrimary2).slice(0, 4),
    [fieldDefs]
  );

  const filtered = useMemo(() => {
    let rows = leads.filter((l) => {
      if (stageFilter !== "all" && l.stage.id !== stageFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        const matchName = getLeadDisplayName(l).toLowerCase().includes(q);
        const matchField = l.fieldValues.some((fv) => fv.value?.toLowerCase().includes(q));
        if (!matchName && !matchField) return false;
      }
      for (const ff of fieldFilters) {
        const v = getFieldVal(l, ff.fieldName) ?? "";
        if (!v.toLowerCase().includes(ff.value.toLowerCase())) return false;
      }
      return true;
    });

    rows = [...rows].sort((a, b) => {
      let av: string | number = 0;
      let bv: string | number = 0;
      if (sort.col === "updatedAt") {
        av = new Date(a.updatedAt).getTime();
        bv = new Date(b.updatedAt).getTime();
      } else if (sort.col === "name") {
        av = getLeadDisplayName(a).toLowerCase();
        bv = getLeadDisplayName(b).toLowerCase();
      } else if (sort.col === "stage") {
        av = a.stage.name;
        bv = b.stage.name;
      } else if (sort.col === "stars") {
        av = a.starRating ?? 0;
        bv = b.starRating ?? 0;
      } else if (sort.col === "calls") {
        av = a._count.callLogs;
        bv = b._count.callLogs;
      }
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });

    return rows;
  }, [leads, query, stageFilter, sort, fieldFilters]);

  function toggleSort(col: string) {
    setSort((prev) => ({ col, dir: prev.col === col && prev.dir === "asc" ? "desc" : "asc" }));
  }

  function applyFilter() {
    if (!pendingFieldName || !pendingValue) return;
    setFieldFilters((prev) => [
      ...prev.filter((f) => f.fieldName !== pendingFieldName),
      { fieldName: pendingFieldName, value: pendingValue },
    ]);
    setPendingFieldName("");
    setPendingValue("");
    setFilterOpen(false);
  }

  function onLeadUpdated(updated: LeadSummary) {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  }

  const selectedLead = leads.find((l) => l.id === selectedId) ?? null;
  const pendingFieldDef = fieldDefs.find((fd) => fd.name === pendingFieldName);

  const colCount = 5 + dynamicCols.length; // name + dynamic + stage + stars + outcome + calls + assigned + updated

  return (
    <div className="flex flex-col h-full">

      {/* ── Top bar ── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-center flex-wrap gap-2.5 px-5 py-3 border-b border-white/[0.07] shrink-0"
        style={{ background: "rgba(12,12,18,0.72)", backdropFilter: "blur(20px)" }}
      >
        {/* Add Lead */}
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          <Button
            asChild size="sm"
            className="border-0 text-white h-8 px-3.5 text-xs rounded-xl gap-1.5 font-medium"
            style={{
              background: "linear-gradient(135deg,#6366f1,#4f46e5)",
              boxShadow: "0 2px 12px rgba(99,102,241,0.4),0 1px 0 rgba(255,255,255,0.12) inset",
            }}
          >
            <Link href="/leads/add"><Plus className="h-3.5 w-3.5" />Add Lead</Link>
          </Button>
        </motion.div>

        {/* Divider */}
        <div className="w-px h-5 bg-white/[0.08]" />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25 pointer-events-none" />
          <Input
            className="pl-8 h-8 w-52 text-xs bg-white/[0.05] border-white/[0.10] text-white placeholder:text-white/25 focus-visible:ring-indigo-500/30 focus-visible:ring-1 focus-visible:ring-offset-0 rounded-xl"
            placeholder="Search leads…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Stage filter pills */}
        <div className="flex gap-1 flex-wrap items-center">
          {[{ id: "all", name: "All", category: "" }, ...stages].map((s) => (
            <motion.button
              key={s.id}
              whileTap={{ scale: 0.94 }}
              onClick={() => setStageFilter(s.id)}
              className={cn(
                "text-[11px] px-2.5 py-0.5 rounded-full border transition-all duration-150 font-medium",
                stageFilter === s.id
                  ? s.id === "all"
                    ? "bg-indigo-500/20 text-indigo-200 border-indigo-500/30"
                    : STAGE_FILTER_ACTIVE[s.category] ?? "bg-indigo-500/20 text-indigo-200 border-indigo-500/30"
                  : "text-white/35 border-white/[0.10] hover:bg-white/[0.06] hover:text-white/60"
              )}
            >
              {s.name}{s.id === "all" ? ` (${leads.length})` : ""}
            </motion.button>
          ))}
        </div>

        {/* Field filter popover */}
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <motion.button
              whileTap={{ scale: 0.96 }}
              className={cn(
                "h-8 px-3 text-xs flex items-center gap-1.5 rounded-xl border transition-all font-medium",
                filterOpen || fieldFilters.length > 0
                  ? "bg-white/[0.07] border-white/[0.15] text-white/80"
                  : "border-white/[0.10] text-white/40 hover:bg-white/[0.05] hover:text-white/65"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {fieldFilters.length > 0 && (
                <span className="h-4 w-4 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-semibold">
                  {fieldFilters.length}
                </span>
              )}
            </motion.button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-72 p-4 space-y-3 border-white/[0.10]"
            style={{ background: "rgba(18,18,26,0.97)", backdropFilter: "blur(24px)" }}
          >
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Filter by field</p>
            <Select value={pendingFieldName} onValueChange={(v) => { setPendingFieldName(v); setPendingValue(""); }}>
              <SelectTrigger className="h-8 text-xs bg-white/[0.05] border-white/[0.10] text-white/70 rounded-lg">
                <SelectValue placeholder="Select field…" />
              </SelectTrigger>
              <SelectContent>
                {fieldDefs.map((fd) => (
                  <SelectItem key={fd.id} value={fd.name}>{fd.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {pendingFieldDef && (
              pendingFieldDef.fieldType === "DROPDOWN" ? (
                <Select value={pendingValue} onValueChange={setPendingValue}>
                  <SelectTrigger className="h-8 text-xs bg-white/[0.05] border-white/[0.10] text-white/70 rounded-lg">
                    <SelectValue placeholder="Select value…" />
                  </SelectTrigger>
                  <SelectContent>
                    {pendingFieldDef.options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="h-8 text-xs bg-white/[0.05] border-white/[0.10] text-white/80 rounded-lg"
                  placeholder="Filter value…"
                  value={pendingValue}
                  onChange={(e) => setPendingValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyFilter()}
                />
              )
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={applyFilter}
              disabled={!pendingFieldName || !pendingValue}
              className="w-full h-8 rounded-lg text-xs font-medium text-white transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}
            >
              Apply Filter
            </motion.button>

            {fieldFilters.length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-white/[0.07]">
                <p className="text-[11px] text-white/30 font-medium">Active filters</p>
                {fieldFilters.map((ff) => (
                  <div key={ff.fieldName} className="flex items-center justify-between text-xs">
                    <span className="text-white/50"><span className="text-white/70">{ff.fieldName}</span> = {ff.value}</span>
                    <button onClick={() => setFieldFilters((p) => p.filter((f) => f.fieldName !== ff.fieldName))} className="text-white/25 hover:text-rose-400 transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Active filter chips */}
        <AnimatePresence>
          {fieldFilters.map((ff) => (
            <motion.span
              key={ff.fieldName}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-300"
            >
              {ff.fieldName}: {ff.value}
              <button onClick={() => setFieldFilters((p) => p.filter((f) => f.fieldName !== ff.fieldName))} className="hover:text-white transition-colors ml-0.5">
                <X className="h-3 w-3" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>

        {/* Count */}
        <span className="ml-auto text-[11px] text-white/20 tabular-nums">
          {filtered.length} / {leads.length}
        </span>
      </motion.div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse table-auto">
          <thead>
            <tr
              style={{
                position: "sticky",
                top: 0,
                zIndex: 10,
                background: "rgba(10,10,16,0.92)",
                backdropFilter: "blur(16px)",
              }}
            >
              {/* Name — sortable */}
              <Th col="name" sort={sort} onClick={toggleSort}>Name</Th>
              {/* Dynamic field columns */}
              {dynamicCols.map((fd) => (
                <th key={fd.id} className="text-left px-4 py-3 text-[11px] font-semibold text-white/30 uppercase tracking-[0.09em] border-b border-white/[0.07] whitespace-nowrap">
                  {fd.name}
                </th>
              ))}
              <Th col="stage"    sort={sort} onClick={toggleSort}>Stage</Th>
              <Th col="stars"    sort={sort} onClick={toggleSort}>Rating</Th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/30 uppercase tracking-[0.09em] border-b border-white/[0.07] whitespace-nowrap">
                Last Outcome
              </th>
              <Th col="calls"    sort={sort} onClick={toggleSort}>Calls</Th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/30 uppercase tracking-[0.09em] border-b border-white/[0.07] whitespace-nowrap">
                Assigned
              </th>
              <Th col="updatedAt" sort={sort} onClick={toggleSort}>Updated</Th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {filtered.map((lead, i) => {
                const isSelected = selectedId === lead.id;
                const lastOutcome = lead.callLogs[0]?.callFeedback?.name;

                return (
                  <motion.tr
                    key={lead.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: Math.min(i * 0.028, 0.3), duration: 0.18 }}
                    onClick={() => setSelectedId(lead.id)}
                    className="group cursor-pointer border-b border-white/[0.04] transition-colors duration-100"
                    style={
                      isSelected
                        ? { background: "rgba(99,102,241,0.08)", boxShadow: "inset 3px 0 0 #818cf8" }
                        : undefined
                    }
                    whileHover={!isSelected ? { backgroundColor: "rgba(255,255,255,0.025)" } : {}}
                  >
                    {/* Name */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className={cn("text-sm font-medium transition-colors", isSelected ? "text-white" : "text-white/80 group-hover:text-white/95")}>
                          {getLeadDisplayName(lead)}
                        </span>
                      </div>
                    </td>

                    {/* Dynamic field values */}
                    {dynamicCols.map((fd) => (
                      <td key={fd.id} className="px-4 py-3 text-sm text-white/45 whitespace-nowrap max-w-[180px]">
                        <span className="block truncate">{getFieldVal(lead, fd.name) ?? "—"}</span>
                      </td>
                    ))}

                    {/* Stage */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn("text-[11px] px-2.5 py-0.5 rounded-full font-medium", STAGE_PILL[lead.stage.category] ?? "bg-white/10 text-white/50")}>
                        {lead.stage.name}
                      </span>
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} className={cn("h-3 w-3", (lead.starRating ?? 0) >= n ? "fill-amber-400 text-amber-400" : "text-white/[0.08]")} />
                        ))}
                      </div>
                    </td>

                    {/* Last outcome */}
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {lastOutcome
                        ? <span className="px-2 py-0.5 rounded-full bg-white/[0.07] border border-white/[0.10] text-white/55 font-medium">{lastOutcome}</span>
                        : <span className="text-white/20">—</span>
                      }
                    </td>

                    {/* Calls */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-[11px] text-white/35">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead._count.callLogs}</span>
                        {lead._count.notes > 0 && <span className="flex items-center gap-1"><StickyNote className="h-3 w-3" />{lead._count.notes}</span>}
                      </div>
                    </td>

                    {/* Assigned */}
                    <td className="px-4 py-3 text-xs text-white/40 whitespace-nowrap">
                      {lead.assignedTo?.name ?? <span className="text-white/20">—</span>}
                    </td>

                    {/* Updated */}
                    <td className="px-4 py-3 text-xs text-white/25 whitespace-nowrap">
                      {new Date(lead.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>

            {filtered.length === 0 && (
              <tr>
                <td colSpan={colCount} className="py-24 text-center text-sm text-white/25">
                  No leads match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Detail Sheet ── */}
      <Sheet open={!!selectedId} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        <SheetContent
          side="right"
          className="w-[660px] max-w-full p-0 border-l border-white/[0.09] overflow-hidden [&>button]:text-white/40 [&>button]:hover:text-white/80"
          style={{ background: "rgba(10,10,17,0.97)", backdropFilter: "blur(32px) saturate(160%)" }}
        >
          <VisuallyHidden><SheetTitle>Lead Profile</SheetTitle></VisuallyHidden>
          {selectedLead && (
            <LeadProfile
              leadId={selectedLead.id}
              stages={stages}
              feedbacks={feedbacks}
              fieldDefs={fieldDefs}
              teamMembers={teamMembers}
              onUpdate={onLeadUpdated}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ── Sortable column header helper ── */
function Th({
  col, sort, onClick, children,
}: {
  col: string;
  sort: SortConfig;
  onClick: (col: string) => void;
  children: React.ReactNode;
}) {
  return (
    <th
      onClick={() => onClick(col)}
      className="group text-left px-4 py-3 text-[11px] font-semibold text-white/30 uppercase tracking-[0.09em] border-b border-white/[0.07] cursor-pointer select-none hover:text-white/55 transition-colors whitespace-nowrap"
    >
      <div className="flex items-center gap-1.5">
        {children}
        <SortIcon col={col} sort={sort} />
      </div>
    </th>
  );
}
