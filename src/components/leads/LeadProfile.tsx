"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Star, Phone, Bot, User as UserIcon,
  Loader2, PhoneCall, PlayCircle, MessageSquare, LayoutDashboard,
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
  INITIAL: "border-blue-300 text-blue-700",
  ACTIVE: "border-yellow-300 text-yellow-700",
  CLOSED_WON: "border-green-300 text-green-700",
  CLOSED_LOST: "border-red-300 text-red-700",
};

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  "in-progress": "bg-blue-100 text-blue-700",
  "call-disconnected": "bg-orange-100 text-orange-700",
  failed: "bg-red-100 text-red-700",
  error: "bg-red-100 text-red-700",
  rescheduled: "bg-yellow-100 text-yellow-700",
  scheduled: "bg-yellow-100 text-yellow-700",
  queued: "bg-yellow-100 text-yellow-700",
  "no-answer": "bg-gray-100 text-gray-700",
  busy: "bg-gray-100 text-gray-700",
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
        <SelectTrigger className="h-7 text-xs">
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
        className={cn("text-xs font-medium px-2 py-0.5 rounded border", value === "true" ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-muted")}
        onClick={() => onChange(value === "true" ? "false" : "true")}
      >
        {value === "true" ? "Yes" : "No"}
      </button>
    );
  }
  return (
    <Input
      className="h-7 text-xs"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      type={fieldDef.fieldType === "NUMBER" || fieldDef.fieldType === "MONEY" ? "number" : fieldDef.fieldType === "DATE" ? "date" : fieldDef.fieldType === "EMAIL" ? "email" : "text"}
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
    <div className="rounded-lg border p-3 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
      <div className="space-y-1.5">
        {entries.map(([key, val]) => (
          <div key={key} className="flex gap-2 text-xs">
            <span className="text-muted-foreground shrink-0 min-w-[140px] capitalize">{key.replace(/_/g, " ")}</span>
            {typeof val === "object" && val !== null ? (
              <pre className="text-xs bg-muted rounded p-1 overflow-x-auto flex-1 font-mono whitespace-pre-wrap break-all">
                {JSON.stringify(val, null, 2)}
              </pre>
            ) : (
              <span className="font-medium break-all">{renderExecutionValue(val)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BolnaCallSelector({
  callLogs,
  selectedId,
  onSelect,
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
        <SelectTrigger className="h-7 text-xs w-fit">
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
        const firstBolna = (data.callLogs as FullLead["callLogs"])
          .find((l) => l.source === "BOLNA_AI" && l.bolnaCallId);
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
      setLead(updated);
      onUpdate(updated);
      toast.success("Stage updated");
    } catch {
      toast.error("Failed to update stage");
    }
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
      setLead(updated);
      onUpdate(updated);
    } catch {
      toast.error("Failed to update rating");
    }
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
    } catch {
      toast.error("Failed to add note");
    } finally {
      setAddingNote(false);
    }
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
    } catch {
      toast.error("Failed to log call");
    } finally {
      setSaving(false);
    }
  }

  async function triggerBolnaCall() {
    setBolnaLoading(true);
    try {
      const res = await fetch("/api/bolna/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Bolna AI call triggered");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to trigger call");
    } finally {
      setBolnaLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lead) return null;

  const stage = stages.find((s) => s.id === lead.stageId);
  const hasBolnaCall = lead.callLogs.some((l) => l.source === "BOLNA_AI" && l.bolnaCallId);

  // Summary from extracted_data (handles both "lead_profile" and "lead profile" key names)
  const extractedLeadProfile = execution?.extracted_data?.lead_profile ?? execution?.extracted_data?.["lead profile"];
  const aiSubjectiveSummary: string | undefined =
    extractedLeadProfile?.summary?.subjective ?? extractedLeadProfile?.subjective;

  // Transcript — support {role, content} and {speaker, message} shapes
  const transcript: Array<{ role: string; content: string }> = (execution?.transcript ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (t: any) => ({
      role: t.role ?? (t.speaker === "agent" ? "agent" : "user"),
      content: t.content ?? t.message ?? t.text ?? "",
    })
  );

  // Dashboard fields — skip excluded keys
  const SKIP_KEYS = new Set(["id", "agent_id", "batch_id", "recording_url", "extracted_data", "transcript"]);
  const TOP_KEYS = ["status", "conversation_time", "total_cost", "answered_by_voice_mail", "created_at", "updated_at", "error_message"];
  const SECTION_KEYS = ["telephony_data", "cost_breakdown", "transfer_call_data", "batch_run_details", "context_details"];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <h2 className="text-lg font-semibold truncate">
            {[
              lead.fieldValues.find((fv) => fv.fieldDef.isPrimary1)?.value,
              lead.fieldValues.find((fv) => fv.fieldDef.isPrimary2)?.value,
            ]
              .filter(Boolean)
              .join(" — ") || "Unknown Lead"}
          </h2>
          {stage && (
            <Badge variant="outline" className={cn("w-fit text-xs", STAGE_COLORS[stage.category])}>
              {stage.name}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => updateStarRating(n)}>
                <Star
                  className={cn(
                    "h-5 w-5 transition-colors",
                    (lead.starRating ?? 0) >= n
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30 hover:text-amber-300"
                  )}
                />
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={() => setCallDialogOpen(true)}>
            <Phone className="h-3.5 w-3.5 mr-1" /> Log Call
          </Button>
          <Button size="sm" variant="outline" disabled={bolnaLoading} onClick={triggerBolnaCall}>
            {bolnaLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bot className="h-3.5 w-3.5 mr-1" />}
            Trigger Bolna Call
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
        <div className="mx-6 mt-3 overflow-x-auto">
          <TabsList className="w-max">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="notes">Notes ({lead.notes.length})</TabsTrigger>
            <TabsTrigger value="conversation">
              <MessageSquare className="h-3.5 w-3.5 mr-1" />Conversation
            </TabsTrigger>
            <TabsTrigger value="recording">
              <PlayCircle className="h-3.5 w-3.5 mr-1" />Recording
            </TabsTrigger>
            <TabsTrigger value="agent-dashboard">
              <LayoutDashboard className="h-3.5 w-3.5 mr-1" />Agent Dashboard
            </TabsTrigger>
            <TabsTrigger value="calls">Calls ({lead.callLogs.length})</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1 mt-2">

          {/* Details Tab */}
          <TabsContent value="details" className="px-6 pb-6 space-y-4 mt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Lead Stage</Label>
                <Select value={lead.stageId} onValueChange={updateStage}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Assigned To</Label>
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
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teamMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {lead.fieldValues.map(({ fieldDefId, value, fieldDef }) => {
                const currentValue = fieldEdits[fieldDefId] !== undefined ? fieldEdits[fieldDefId] : (value ?? "");
                return (
                  <div key={fieldDefId} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{fieldDef.name}</Label>
                    <div
                      onBlur={() => {
                        if (fieldEdits[fieldDefId] !== undefined) {
                          saveField(fieldDefId, fieldEdits[fieldDefId]);
                        }
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

          {/* Notes Tab */}
          <TabsContent value="notes" className="px-6 pb-6 mt-0 space-y-4">
            {/* AI Call Summary from extracted_data */}
            {aiSubjectiveSummary && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                  <Bot className="h-3.5 w-3.5" />
                  AI Call Summary
                </div>
                <p className="text-sm text-blue-900 whitespace-pre-wrap">{aiSubjectiveSummary}</p>
              </div>
            )}

            <div className="space-y-3">
              <Textarea
                placeholder="Add a note…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
              />
              <Button size="sm" onClick={addNote} disabled={addingNote || !noteText.trim()}>
                {addingNote ? "Adding…" : "Add Note"}
              </Button>
            </div>

            <div className="space-y-3">
              {lead.notes.map((note) => (
                <div key={note.id} className={cn("rounded-lg p-3 text-sm", note.isAiNote ? "bg-blue-50 border border-blue-200" : "bg-muted")}>
                  <div className="flex items-center gap-2 mb-1.5 text-xs text-muted-foreground">
                    {note.isAiNote ? <Bot className="h-3.5 w-3.5 text-blue-500" /> : <UserIcon className="h-3.5 w-3.5" />}
                    <span>{note.isAiNote ? "Bolna AI" : (note.author?.name ?? "Unknown")}</span>
                    <span>·</span>
                    <span>{new Date(note.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
              {lead.notes.length === 0 && !aiSubjectiveSummary && (
                <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
              )}
            </div>
          </TabsContent>

          {/* Conversation Tab */}
          <TabsContent value="conversation" className="px-6 pb-6 mt-0">
            {!hasBolnaCall ? (
              <p className="text-center text-sm text-muted-foreground py-8">No AI call found for this lead</p>
            ) : (
              <>
                <BolnaCallSelector
                  callLogs={lead.callLogs}
                  selectedId={selectedBolnaCallId}
                  onSelect={setSelectedBolnaCallId}
                />
                {executionLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : !transcript.length ? (
                  <p className="text-center text-sm text-muted-foreground py-8">No transcript available</p>
                ) : (
                  <div className="space-y-3">
                    {transcript.map((msg, i) => {
                      const isAgent = msg.role === "agent" || msg.role === "assistant";
                      return (
                        <div key={i} className={cn("flex gap-2 items-end", isAgent ? "justify-start" : "justify-end")}>
                          {isAgent && (
                            <div className="rounded-full bg-blue-100 p-1.5 h-7 w-7 flex items-center justify-center shrink-0">
                              <Bot className="h-4 w-4 text-blue-600" />
                            </div>
                          )}
                          <div
                            className={cn(
                              "rounded-2xl px-4 py-2.5 max-w-[78%] text-sm leading-relaxed",
                              isAgent
                                ? "bg-muted rounded-bl-sm"
                                : "bg-primary text-primary-foreground rounded-br-sm"
                            )}
                          >
                            {msg.content}
                          </div>
                          {!isAgent && (
                            <div className="rounded-full bg-muted p-1.5 h-7 w-7 flex items-center justify-center shrink-0">
                              <UserIcon className="h-4 w-4" />
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

          {/* Recording Tab */}
          <TabsContent value="recording" className="px-6 pb-6 mt-0">
            {!hasBolnaCall ? (
              <p className="text-center text-sm text-muted-foreground py-8">No AI call found for this lead</p>
            ) : (
              <>
                <BolnaCallSelector
                  callLogs={lead.callLogs}
                  selectedId={selectedBolnaCallId}
                  onSelect={setSelectedBolnaCallId}
                />
                {executionLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : !execution?.recording_url ? (
                  <p className="text-center text-sm text-muted-foreground py-8">No recording available</p>
                ) : (
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <PlayCircle className="h-4 w-4 text-blue-600" />
                      Call Recording
                      {execution?.conversation_time && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDuration(Math.round(execution.conversation_time))}
                        </span>
                      )}
                    </div>
                    <audio controls className="w-full" src={execution.recording_url}>
                      Your browser does not support the audio element.
                    </audio>
                    <a
                      href={execution.recording_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Open in new tab
                    </a>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Agent Dashboard Tab */}
          <TabsContent value="agent-dashboard" className="px-6 pb-6 mt-0 space-y-3">
            {!hasBolnaCall ? (
              <p className="text-center text-sm text-muted-foreground py-8">No AI call found for this lead</p>
            ) : (
              <>
                <BolnaCallSelector
                  callLogs={lead.callLogs}
                  selectedId={selectedBolnaCallId}
                  onSelect={setSelectedBolnaCallId}
                />
                {executionLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : !execution ? (
                  <p className="text-center text-sm text-muted-foreground py-8">No data available</p>
                ) : (
                  <>
                    {/* Overview grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {execution.status && (
                        <div className="rounded-lg border p-3 space-y-0.5">
                          <p className="text-xs text-muted-foreground">Status</p>
                          <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", STATUS_COLORS[execution.status] ?? "bg-gray-100 text-gray-700")}>
                            {execution.status}
                          </span>
                        </div>
                      )}
                      {execution.conversation_time != null && (
                        <div className="rounded-lg border p-3 space-y-0.5">
                          <p className="text-xs text-muted-foreground">Duration</p>
                          <p className="text-sm font-semibold">{formatDuration(Math.round(execution.conversation_time))}</p>
                        </div>
                      )}
                      {execution.total_cost != null && (
                        <div className="rounded-lg border p-3 space-y-0.5">
                          <p className="text-xs text-muted-foreground">Total Cost</p>
                          <p className="text-sm font-semibold">${Number(execution.total_cost).toFixed(4)}</p>
                        </div>
                      )}
                      {execution.answered_by_voice_mail != null && (
                        <div className="rounded-lg border p-3 space-y-0.5">
                          <p className="text-xs text-muted-foreground">Voicemail</p>
                          <p className="text-sm font-semibold">{execution.answered_by_voice_mail ? "Yes" : "No"}</p>
                        </div>
                      )}
                      {execution.created_at && (
                        <div className="rounded-lg border p-3 space-y-0.5">
                          <p className="text-xs text-muted-foreground">Started</p>
                          <p className="text-sm font-semibold">{new Date(execution.created_at).toLocaleString()}</p>
                        </div>
                      )}
                      {execution.updated_at && (
                        <div className="rounded-lg border p-3 space-y-0.5">
                          <p className="text-xs text-muted-foreground">Last Updated</p>
                          <p className="text-sm font-semibold">{new Date(execution.updated_at).toLocaleString()}</p>
                        </div>
                      )}
                    </div>

                    {/* Error message */}
                    {execution.error_message && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                        <p className="text-xs font-semibold text-red-600 mb-1">Error</p>
                        <p className="text-xs text-red-700">{execution.error_message}</p>
                      </div>
                    )}

                    {/* Section blocks for nested objects */}
                    {SECTION_KEYS.map((key) => {
                      const val = execution[key];
                      if (!val || typeof val !== "object") return null;
                      return (
                        <ExecutionSection
                          key={key}
                          title={key.replace(/_/g, " ")}
                          data={val as Record<string, unknown>}
                        />
                      );
                    })}

                    {/* Any remaining top-level fields not already shown */}
                    {(() => {
                      const shown = new Set([...SKIP_KEYS, ...TOP_KEYS, ...SECTION_KEYS]);
                      const remaining = Object.fromEntries(
                        Object.entries(execution).filter(([k]) => !shown.has(k))
                      );
                      if (Object.keys(remaining).length === 0) return null;
                      return <ExecutionSection title="Other" data={remaining} />;
                    })()}
                  </>
                )}
              </>
            )}
          </TabsContent>

          {/* Calls Tab */}
          <TabsContent value="calls" className="px-6 pb-6 mt-0">
            <div className="space-y-2">
              {lead.callLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className={cn(
                    "rounded-full p-1.5",
                    log.source === "BOLNA_AI" ? "bg-blue-100" : "bg-muted"
                  )}>
                    {log.source === "BOLNA_AI" ? <Bot className="h-4 w-4 text-blue-600" /> : <PhoneCall className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {log.callFeedback && (
                        <Badge variant="outline" className="text-xs">{log.callFeedback.name}</Badge>
                      )}
                      {log.duration && (
                        <span className="text-xs text-muted-foreground">{formatDuration(log.duration)}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {log.user?.name ?? "AI Agent"} · {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {lead.callLogs.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No call logs yet</p>
              )}
            </div>
          </TabsContent>

        </ScrollArea>
      </Tabs>

      {/* Log Call Dialog */}
      <Dialog open={callDialogOpen} onOpenChange={setCallDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Log Call</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Call Outcome</Label>
              <Select value={logCallForm.callFeedbackId} onValueChange={(v) => setLogCallForm((p) => ({ ...p, callFeedbackId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select outcome…" /></SelectTrigger>
                <SelectContent>
                  {feedbacks.map((fb) => <SelectItem key={fb.id} value={fb.id}>{fb.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Duration (seconds)</Label>
              <Input
                type="number"
                placeholder="e.g. 120"
                value={logCallForm.duration}
                onChange={(e) => setLogCallForm((p) => ({ ...p, duration: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCallDialogOpen(false)}>Cancel</Button>
            <Button onClick={logCall} disabled={saving}>{saving ? "Saving…" : "Log Call"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
