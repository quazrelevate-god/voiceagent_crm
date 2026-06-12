"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Star, Phone, Bot, User as UserIcon,
  Loader2, PhoneCall, PlayCircle, MessageSquare, LayoutDashboard, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatDuration } from "@/lib/utils";
import type { LeadStage, CallFeedback, User, LeadFieldDefinitionWithOptions } from "@/types";

type FullLead = {
  id: string;
  stageId: string;
  stage: LeadStage;
  assignedTo: User | null;
  starRating: number | null;
  fieldValues: {
    fieldDefId: string;
    value: string | null;
    fieldDef: LeadFieldDefinitionWithOptions;
  }[];
  notes: {
    id: string;
    content: string;
    isAiNote: boolean;
    createdAt: string;
    author: User | null;
  }[];
  callLogs: {
    id: string;
    duration: number | null;
    createdAt: string;
    source: string;
    bolnaCallId: string | null;
    callFeedback: CallFeedback | null;
    user: User | null;
  }[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BolnaExecution = Record<string, any>;

interface Props {
  leadId: string;
  stages: LeadStage[];
  feedbacks: CallFeedback[];
  fieldDefs: LeadFieldDefinitionWithOptions[];
  teamMembers: User[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (lead: any) => void;
}

const STAGE_COLORS: Record<string, string> = {
  INITIAL: "border-blue-500/30 text-blue-300 bg-blue-500/10",
  ACTIVE: "border-amber-500/30 text-amber-300 bg-amber-500/10",
  CLOSED_WON: "border-emerald-500/30 text-emerald-300 bg-emerald-500/10",
  CLOSED_LOST: "border-rose-500/30 text-rose-300 bg-rose-500/10",
};

const STATUS_BADGE: Record<string, string> = {
  completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  "in-progress": "bg-blue-500/15 text-blue-300 border-blue-500/25",
  "call-disconnected": "bg-orange-500/15 text-orange-300 border-orange-500/25",
  failed: "bg-rose-500/15 text-rose-300 border-rose-500/25",
  error: "bg-rose-500/15 text-rose-300 border-rose-500/25",
  rescheduled: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  scheduled: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  queued: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  "no-answer": "bg-white/10 text-white/50 border-white/15",
  busy: "bg-white/10 text-white/50 border-white/15",
};

function FieldValue({
  fieldDef, value, onChange,
}: {
  fieldDef: LeadFieldDefinitionWithOptions;
  value: string | null;
  onChange: (v: string) => void;
}) {
  if (fieldDef.fieldType === "DROPDOWN") {
    return (
      <Select value={value ?? ""} onValueChange={onChange}>
        <SelectTrigger className="h-7 text-xs bg-white/[0.05] border-white/[0.10] text-white/80">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {fieldDef.options.map((o: { value: string; label: string }) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (fieldDef.fieldType === "CHECKBOX") {
    return (
      <button
        className={cn(
          "text-xs font-medium px-2.5 py-0.5 rounded-lg border transition-all",
          value === "true"
            ? "bg-indigo-500/25 text-indigo-200 border-indigo-500/35"
            : "border-white/[0.10] text-white/40 hover:bg-white/[0.05] hover:text-white/60"
        )}
        onClick={() => onChange(value === "true" ? "false" : "true")}
      >
        {value === "true" ? "Yes" : "No"}
      </button>
    );
  }
  return (
    <Input
      className="h-7 text-xs bg-white/[0.05] border-white/[0.10] text-white/80 placeholder:text-white/25"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      type={
        fieldDef.fieldType === "NUMBER" || fieldDef.fieldType === "MONEY" ? "number"
        : fieldDef.fieldType === "DATE" ? "date"
        : fieldDef.fieldType === "EMAIL" ? "email"
        : "text"
      }
    />
  );
}

function renderExecutionValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value || "—";
  return JSON.stringify(value, null, 2);
}

function ExecutionSection({ title, data }: { title: string; data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined);
  if (entries.length === 0) return null;
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 space-y-2.5">
      <p className="text-[10px] font-semibold text-white/35 uppercase tracking-[0.12em]">{title}</p>
      <div className="space-y-2">
        {entries.map(([key, val]) => (
          <div key={key} className="flex gap-2 text-xs">
            <span className="text-white/35 shrink-0 min-w-[130px] capitalize">{key.replace(/_/g, " ")}</span>
            {typeof val === "object" && val !== null ? (
              <pre className="text-[11px] bg-white/[0.04] rounded-lg p-1.5 overflow-x-auto flex-1 font-mono text-white/60 whitespace-pre-wrap break-all">
                {JSON.stringify(val, null, 2)}
              </pre>
            ) : (
              <span className="font-medium text-white/75 break-all">{renderExecutionValue(val)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BolnaCallSelector({
  callLogs, selectedId, onSelect,
}: {
  callLogs: FullLead["callLogs"];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const bolnaLogs = callLogs.filter((l) => l.source === "BOLNA_AI" && l.bolnaCallId);
  if (bolnaLogs.length <= 1) return null;
  return (
    <div className="mb-3">
      <Select value={selectedId ?? ""} onValueChange={onSelect}>
        <SelectTrigger className="h-7 text-xs w-fit bg-white/[0.05] border-white/[0.10] text-white/70">
          <SelectValue placeholder="Select call…" />
        </SelectTrigger>
        <SelectContent>
          {bolnaLogs.map((l) => (
            <SelectItem key={l.bolnaCallId!} value={l.bolnaCallId!}>
              {new Date(l.createdAt).toLocaleString()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function LeadProfile({ leadId, stages, feedbacks, teamMembers, onUpdate }: Props) {
  const [lead, setLead] = useState<FullLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [logCallForm, setLogCallForm] = useState({ callFeedbackId: "", duration: "" });
  const [bolnaLoading, setBolnaLoading] = useState(false);
  const [fieldEdits, setFieldEdits] = useState<Record<string, string>>({});
  const [selectedBolnaCallId, setSelectedBolnaCallId] = useState<string | null>(null);
  const [execution, setExecution] = useState<BolnaExecution | null>(null);
  const [executionLoading, setExecutionLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setExecution(null);
    setSelectedBolnaCallId(null);
    fetch(`/api/leads/${leadId}`)
      .then((r) => r.json())
      .then((data) => {
        setLead(data);
        setFieldEdits({});
        const firstBolna = (data.callLogs as FullLead["callLogs"]).find(
          (l) => l.source === "BOLNA_AI" && l.bolnaCallId
        );
        if (firstBolna?.bolnaCallId) setSelectedBolnaCallId(firstBolna.bolnaCallId);
      })
      .catch(() => toast.error("Failed to load lead"))
      .finally(() => setLoading(false));
  }, [leadId]);

  useEffect(() => {
    if (!selectedBolnaCallId) return;
    setExecutionLoading(true);
    fetch(`/api/bolna/execution/${selectedBolnaCallId}`)
      .then((r) => r.json())
      .then(setExecution)
      .catch(() => toast.error("Failed to load call data"))
      .finally(() => setExecutionLoading(false));
  }, [selectedBolnaCallId]);

  async function saveField(fieldDefId: string, value: string) {
    if (!lead) return;
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldValues: { [fieldDefId]: value } }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setLead(updated);
      onUpdate(updated);
      setFieldEdits((p) => { const n = { ...p }; delete n[fieldDefId]; return n; });
    } catch {
      toast.error("Failed to save");
    }
  }

  async function updateStage(stageId: string) {
    if (!lead) return;
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setLead(updated); onUpdate(updated);
      toast.success("Stage updated");
    } catch { toast.error("Failed to update stage"); }
  }

  async function updateStarRating(rating: number) {
    if (!lead) return;
    const newRating = lead.starRating === rating ? null : rating;
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starRating: newRating }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setLead(updated); onUpdate(updated);
    } catch { toast.error("Failed to update rating"); }
  }

  async function addNote() {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteText }),
      });
      if (!res.ok) throw new Error();
      const newNote = await res.json();
      setLead((p) => p ? { ...p, notes: [newNote, ...p.notes] } : p);
      setNoteText("");
      toast.success("Note added");
    } catch { toast.error("Failed to add note"); }
    finally { setAddingNote(false); }
  }

  async function logCall() {
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/calls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callFeedbackId: logCallForm.callFeedbackId || undefined,
          duration: logCallForm.duration ? parseInt(logCallForm.duration) : undefined,
        }),
      });
      if (!res.ok) throw new Error();
      const newLog = await res.json();
      setLead((p) => p ? { ...p, callLogs: [newLog, ...p.callLogs] } : p);
      setCallDialogOpen(false);
      setLogCallForm({ callFeedbackId: "", duration: "" });
      toast.success("Call logged");
    } catch { toast.error("Failed to log call"); }
    finally { setSaving(false); }
  }

  async function triggerBolnaCall() {
    setBolnaLoading(true);
    try {
      const res = await fetch("/api/bolna/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success("AI call triggered successfully");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to trigger call");
    } finally { setBolnaLoading(false); }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-white/25" />
      </div>
    );
  }

  if (!lead) return null;

  const stage = stages.find((s) => s.id === lead.stageId);
  const hasBolnaCall = lead.callLogs.some((l) => l.source === "BOLNA_AI" && l.bolnaCallId);

  const extractedLeadProfile =
    execution?.extracted_data?.lead_profile ?? execution?.extracted_data?.["lead profile"];
  const aiSubjectiveSummary: string | undefined =
    extractedLeadProfile?.summary?.subjective ?? extractedLeadProfile?.subjective;

  const rawTranscript = execution?.transcript;
  const transcriptIsString = typeof rawTranscript === "string";
  const transcript: Array<{ role: string; content: string }> = Array.isArray(rawTranscript)
    ? rawTranscript.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (t: any) => ({
          role: t.role ?? (t.speaker === "agent" ? "agent" : "user"),
          content: t.content ?? t.message ?? t.text ?? "",
        })
      )
    : [];

  const SKIP_KEYS = new Set(["id", "agent_id", "batch_id", "recording_url", "extracted_data", "transcript"]);
  const TOP_KEYS = ["status", "conversation_time", "total_cost", "answered_by_voice_mail", "created_at", "updated_at", "error_message"];
  const SECTION_KEYS = ["telephony_data", "cost_breakdown", "transfer_call_data", "batch_run_details", "context_details"];

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div className="px-6 py-4 border-b border-white/[0.07] bg-white/[0.03] backdrop-blur-xl flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5 min-w-0">
          <h2 className="text-base font-semibold text-white truncate">
            {[
              lead.fieldValues.find((fv) => fv.fieldDef.isPrimary1)?.value,
              lead.fieldValues.find((fv) => fv.fieldDef.isPrimary2)?.value,
            ].filter(Boolean).join(" · ") || "Unknown Lead"}
          </h2>
          {stage && (
            <Badge
              variant="outline"
              className={cn("w-fit text-[11px] font-medium rounded-full", STAGE_COLORS[stage.category])}
            >
              {stage.name}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Stars */}
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => updateStarRating(n)}>
                <Star
                  className={cn(
                    "h-4.5 w-4.5 transition-all",
                    (lead.starRating ?? 0) >= n
                      ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]"
                      : "text-white/15 hover:text-amber-300"
                  )}
                />
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCallDialogOpen(true)}
            className="h-8 px-3 text-xs text-white/60 hover:bg-white/[0.07] hover:text-white/90 border border-white/[0.10]"
          >
            <Phone className="h-3.5 w-3.5 mr-1.5" /> Log Call
          </Button>

          <Button
            size="sm"
            disabled={bolnaLoading}
            onClick={triggerBolnaCall}
            className="h-8 px-3 text-xs bg-indigo-500/75 hover:bg-indigo-500 text-white border-0 shadow-[0_2px_12px_rgba(99,102,241,0.3)] transition-all"
          >
            {bolnaLoading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Bot className="h-3.5 w-3.5 mr-1.5" />}
            {bolnaLoading ? "Calling…" : "Trigger AI Call"}
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
        <div className="mx-6 mt-4 overflow-x-auto">
          <TabsList className="w-max bg-white/[0.04] border border-white/[0.08] p-1 gap-0.5 h-auto">
            {[
              { value: "details", label: "Details" },
              { value: "notes", label: `Notes (${lead.notes.length})` },
              { value: "conversation", label: "Conversation", icon: MessageSquare },
              { value: "recording", label: "Recording", icon: PlayCircle },
              { value: "agent-dashboard", label: "Agent Dashboard", icon: LayoutDashboard },
              { value: "calls", label: `Calls (${lead.callLogs.length})` },
            ].map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="text-xs px-3 py-1.5 rounded-lg text-white/40 data-[state=active]:bg-white/[0.10] data-[state=active]:text-white data-[state=active]:shadow-none transition-all flex items-center gap-1.5"
              >
                {Icon && <Icon className="h-3 w-3" />}
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <ScrollArea className="flex-1 mt-2">

          {/* ── Details ── */}
          <TabsContent value="details" className="px-6 pb-6 space-y-5 mt-0">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-white/40 uppercase tracking-wide">Stage</Label>
                <Select value={lead.stageId} onValueChange={updateStage}>
                  <SelectTrigger className="h-8 text-sm bg-white/[0.05] border-white/[0.10] text-white/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-white/40 uppercase tracking-wide">Assigned To</Label>
                <Select
                  value={lead.assignedTo?.id ?? "unassigned"}
                  onValueChange={(v) => {
                    fetch(`/api/leads/${leadId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ assignedToId: v === "unassigned" ? null : v }),
                    }).then((r) => r.json()).then((u) => { setLead(u); onUpdate(u); });
                  }}
                >
                  <SelectTrigger className="h-8 text-sm bg-white/[0.05] border-white/[0.10] text-white/80">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teamMembers.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="bg-white/[0.07]" />

            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              {lead.fieldValues.map(({ fieldDefId, value, fieldDef }) => {
                const currentValue = fieldEdits[fieldDefId] !== undefined ? fieldEdits[fieldDefId] : (value ?? "");
                return (
                  <div key={fieldDefId} className="space-y-1.5">
                    <Label className="text-[11px] text-white/40 uppercase tracking-wide">{fieldDef.name}</Label>
                    <div
                      onBlur={() => {
                        if (fieldEdits[fieldDefId] !== undefined) saveField(fieldDefId, fieldEdits[fieldDefId]);
                      }}
                    >
                      <FieldValue
                        fieldDef={fieldDef}
                        value={currentValue}
                        onChange={(v) => {
                          setFieldEdits((p) => ({ ...p, [fieldDefId]: v }));
                          if (fieldDef.fieldType === "DROPDOWN" || fieldDef.fieldType === "CHECKBOX") {
                            saveField(fieldDefId, v);
                          }
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ── Notes ── */}
          <TabsContent value="notes" className="px-6 pb-6 mt-0 space-y-4">
            {aiSubjectiveSummary && (
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.07] p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                  <Bot className="h-3.5 w-3.5" />
                  AI Call Summary
                </div>
                <p className="text-sm text-white/75 whitespace-pre-wrap leading-relaxed">{aiSubjectiveSummary}</p>
              </div>
            )}

            <div className="space-y-2.5">
              <Textarea
                placeholder="Add a note…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
                className="bg-white/[0.04] border-white/[0.08] text-white/80 placeholder:text-white/25 resize-none focus-visible:ring-indigo-500/30"
              />
              <Button
                size="sm"
                onClick={addNote}
                disabled={addingNote || !noteText.trim()}
                className="bg-white/[0.08] hover:bg-white/[0.12] text-white/80 border border-white/[0.10] shadow-none"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                {addingNote ? "Adding…" : "Add Note"}
              </Button>
            </div>

            <div className="space-y-2.5">
              {lead.notes.map((note) => (
                <div
                  key={note.id}
                  className={cn(
                    "rounded-xl p-3.5 text-sm",
                    note.isAiNote
                      ? "bg-indigo-500/[0.07] border border-indigo-500/20"
                      : "bg-white/[0.04] border border-white/[0.07]"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2 text-xs text-white/35">
                    {note.isAiNote
                      ? <Bot className="h-3.5 w-3.5 text-indigo-400" />
                      : <UserIcon className="h-3.5 w-3.5" />}
                    <span className={note.isAiNote ? "text-indigo-300/70" : ""}>
                      {note.isAiNote ? "Bolna AI" : (note.author?.name ?? "Unknown")}
                    </span>
                    <span>·</span>
                    <span>{new Date(note.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-white/65 leading-relaxed">{note.content}</p>
                </div>
              ))}
              {lead.notes.length === 0 && !aiSubjectiveSummary && (
                <p className="text-sm text-white/25 text-center py-6">No notes yet</p>
              )}
            </div>
          </TabsContent>

          {/* ── Conversation ── */}
          <TabsContent value="conversation" className="px-6 pb-6 mt-0">
            {!hasBolnaCall ? (
              <p className="text-center text-sm text-white/30 py-10">No AI call found for this lead</p>
            ) : (
              <>
                <BolnaCallSelector callLogs={lead.callLogs} selectedId={selectedBolnaCallId} onSelect={setSelectedBolnaCallId} />
                {executionLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-white/30" /></div>
                ) : transcriptIsString ? (
                  <pre className="text-sm text-white/65 whitespace-pre-wrap bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 leading-relaxed font-sans">
                    {rawTranscript as string}
                  </pre>
                ) : !transcript.length ? (
                  <p className="text-center text-sm text-white/30 py-10">No transcript available</p>
                ) : (
                  <div className="space-y-3">
                    {transcript.map((msg, i) => {
                      const isAgent = msg.role === "agent" || msg.role === "assistant";
                      return (
                        <div key={i} className={cn("flex gap-2 items-end", isAgent ? "justify-start" : "justify-end")}>
                          {isAgent && (
                            <div className="h-7 w-7 rounded-full bg-indigo-500/20 border border-indigo-500/25 flex items-center justify-center shrink-0">
                              <Bot className="h-3.5 w-3.5 text-indigo-400" />
                            </div>
                          )}
                          <div className={cn(
                            "rounded-2xl px-4 py-2.5 max-w-[78%] text-sm leading-relaxed",
                            isAgent
                              ? "bg-white/[0.07] border border-white/[0.08] text-white/75 rounded-bl-sm"
                              : "bg-indigo-500/[0.25] border border-indigo-500/25 text-white/85 rounded-br-sm"
                          )}>
                            {msg.content}
                          </div>
                          {!isAgent && (
                            <div className="h-7 w-7 rounded-full bg-white/[0.06] border border-white/[0.10] flex items-center justify-center shrink-0">
                              <UserIcon className="h-3.5 w-3.5 text-white/40" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ── Recording ── */}
          <TabsContent value="recording" className="px-6 pb-6 mt-0">
            {!hasBolnaCall ? (
              <p className="text-center text-sm text-white/30 py-10">No AI call found for this lead</p>
            ) : (
              <>
                <BolnaCallSelector callLogs={lead.callLogs} selectedId={selectedBolnaCallId} onSelect={setSelectedBolnaCallId} />
                {executionLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-white/30" /></div>
                ) : !execution?.recording_url ? (
                  <p className="text-center text-sm text-white/30 py-10">No recording available</p>
                ) : (
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-white/70">
                      <PlayCircle className="h-4 w-4 text-indigo-400" />
                      Call Recording
                      {execution?.conversation_time && (
                        <span className="ml-auto text-xs text-white/35">
                          {formatDuration(Math.round(execution.conversation_time))}
                        </span>
                      )}
                    </div>
                    <audio controls className="w-full" src={execution.recording_url} style={{ filter: "invert(1) hue-rotate(180deg)" }}>
                      Your browser does not support audio.
                    </audio>
                    <a
                      href={execution.recording_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400/70 hover:text-indigo-300 transition-colors"
                    >
                      Open in new tab ↗
                    </a>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ── Agent Dashboard ── */}
          <TabsContent value="agent-dashboard" className="px-6 pb-6 mt-0 space-y-3">
            {!hasBolnaCall ? (
              <p className="text-center text-sm text-white/30 py-10">No AI call found for this lead</p>
            ) : (
              <>
                <BolnaCallSelector callLogs={lead.callLogs} selectedId={selectedBolnaCallId} onSelect={setSelectedBolnaCallId} />
                {executionLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-white/30" /></div>
                ) : !execution ? (
                  <p className="text-center text-sm text-white/30 py-10">No data available</p>
                ) : (
                  <>
                    {/* Stat grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {execution.status && (
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 space-y-1">
                          <p className="text-[10px] text-white/35 uppercase tracking-wide">Status</p>
                          <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", STATUS_BADGE[execution.status] ?? "bg-white/10 text-white/50 border-white/15")}>
                            {execution.status}
                          </span>
                        </div>
                      )}
                      {execution.conversation_time != null && (
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 space-y-0.5">
                          <p className="text-[10px] text-white/35 uppercase tracking-wide">Duration</p>
                          <p className="text-sm font-semibold text-white/80">{formatDuration(Math.round(execution.conversation_time))}</p>
                        </div>
                      )}
                      {execution.total_cost != null && (
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 space-y-0.5">
                          <p className="text-[10px] text-white/35 uppercase tracking-wide">Total Cost</p>
                          <p className="text-sm font-semibold text-white/80">${Number(execution.total_cost).toFixed(4)}</p>
                        </div>
                      )}
                      {execution.answered_by_voice_mail != null && (
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 space-y-0.5">
                          <p className="text-[10px] text-white/35 uppercase tracking-wide">Voicemail</p>
                          <p className="text-sm font-semibold text-white/80">{execution.answered_by_voice_mail ? "Yes" : "No"}</p>
                        </div>
                      )}
                      {execution.created_at && (
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 space-y-0.5">
                          <p className="text-[10px] text-white/35 uppercase tracking-wide">Started</p>
                          <p className="text-sm font-semibold text-white/80">{new Date(execution.created_at).toLocaleString()}</p>
                        </div>
                      )}
                      {execution.updated_at && (
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 space-y-0.5">
                          <p className="text-[10px] text-white/35 uppercase tracking-wide">Last Updated</p>
                          <p className="text-sm font-semibold text-white/80">{new Date(execution.updated_at).toLocaleString()}</p>
                        </div>
                      )}
                    </div>

                    {execution.error_message && (
                      <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.07] p-3.5">
                        <p className="text-xs font-semibold text-rose-400 mb-1">Error</p>
                        <p className="text-xs text-rose-300/70">{execution.error_message}</p>
                      </div>
                    )}

                    {SECTION_KEYS.map((key) => {
                      const val = execution[key];
                      if (!val || typeof val !== "object") return null;
                      return <ExecutionSection key={key} title={key.replace(/_/g, " ")} data={val as Record<string, unknown>} />;
                    })}

                    {(() => {
                      const shown = new Set([...SKIP_KEYS, ...TOP_KEYS, ...SECTION_KEYS]);
                      const remaining = Object.fromEntries(Object.entries(execution).filter(([k]) => !shown.has(k)));
                      if (!Object.keys(remaining).length) return null;
                      return <ExecutionSection title="Other" data={remaining} />;
                    })()}
                  </>
                )}
              </>
            )}
          </TabsContent>

          {/* ── Calls ── */}
          <TabsContent value="calls" className="px-6 pb-6 mt-0">
            <div className="space-y-2">
              {lead.callLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3.5">
                  <div className={cn(
                    "rounded-xl p-2 shrink-0",
                    log.source === "BOLNA_AI" ? "bg-indigo-500/15 border border-indigo-500/20" : "bg-white/[0.06] border border-white/[0.08]"
                  )}>
                    {log.source === "BOLNA_AI"
                      ? <Bot className="h-4 w-4 text-indigo-400" />
                      : <PhoneCall className="h-4 w-4 text-white/40" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {log.callFeedback && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.08] border border-white/[0.10] text-white/60 font-medium">
                          {log.callFeedback.name}
                        </span>
                      )}
                      {log.duration && (
                        <span className="text-xs text-white/35">{formatDuration(log.duration)}</span>
                      )}
                    </div>
                    <p className="text-xs text-white/30 mt-0.5">
                      {log.user?.name ?? "AI Agent"} · {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {lead.callLogs.length === 0 && (
                <p className="text-sm text-white/25 text-center py-8">No call logs yet</p>
              )}
            </div>
          </TabsContent>

        </ScrollArea>
      </Tabs>

      {/* ── Log Call Dialog ── */}
      <Dialog open={callDialogOpen} onOpenChange={setCallDialogOpen}>
        <DialogContent className="max-w-sm bg-[hsl(238,32%,8%)] border-white/[0.10]">
          <DialogHeader>
            <DialogTitle className="text-white/90">Log Call</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-white/50">Call Outcome</Label>
              <Select value={logCallForm.callFeedbackId} onValueChange={(v) => setLogCallForm((p) => ({ ...p, callFeedbackId: v }))}>
                <SelectTrigger className="bg-white/[0.05] border-white/[0.10] text-white/70">
                  <SelectValue placeholder="Select outcome…" />
                </SelectTrigger>
                <SelectContent>
                  {feedbacks.map((fb) => <SelectItem key={fb.id} value={fb.id}>{fb.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-white/50">Duration (seconds)</Label>
              <Input
                type="number"
                placeholder="e.g. 120"
                value={logCallForm.duration}
                onChange={(e) => setLogCallForm((p) => ({ ...p, duration: e.target.value }))}
                className="bg-white/[0.05] border-white/[0.10] text-white/80"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCallDialogOpen(false)}
              className="text-white/50 hover:bg-white/[0.07] hover:text-white/80"
            >
              Cancel
            </Button>
            <Button
              onClick={logCall}
              disabled={saving}
              className="bg-indigo-500/75 hover:bg-indigo-500 text-white border-0"
            >
              {saving ? "Saving…" : "Log Call"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
