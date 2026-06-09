"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Star, Phone, Calendar, StickyNote, Bot, User as UserIcon,
  ChevronDown, Loader2, PhoneCall,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    callFeedback: CallFeedback | null;
    user: User | null;
  }[];
};

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

function FieldValue({
  fieldDef,
  value,
  onChange,
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

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leads/${leadId}`)
      .then((r) => r.json())
      .then((data) => {
        setLead(data);
        setFieldEdits({});
      })
      .catch(() => toast.error("Failed to load lead"))
      .finally(() => setLoading(false));
  }, [leadId]);

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
          {/* Star Rating */}
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
        <TabsList className="mx-6 mt-3 w-fit">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="notes">Notes ({lead.notes.length})</TabsTrigger>
          <TabsTrigger value="calls">Calls ({lead.callLogs.length})</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 mt-2">
          {/* Details Tab */}
          <TabsContent value="details" className="px-6 pb-6 space-y-4 mt-0">
            {/* Stage & Assignment */}
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

            {/* Dynamic Fields */}
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
          <TabsContent value="notes" className="px-6 pb-6 mt-0">
            <div className="space-y-3 mb-4">
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
              {lead.notes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
              )}
            </div>
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
