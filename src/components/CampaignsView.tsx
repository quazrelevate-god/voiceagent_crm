"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Calendar, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { User, LeadFieldDefinition } from "@/types";

type LeadSummary = {
  id: string;
  fieldValues: { value: string | null; fieldDef: { isPrimary1: boolean; isPrimary2: boolean; name: string } }[];
};

type CampaignLeadRow = {
  id: string;
  leadId: string;
  isCompleted: boolean;
  lead: LeadSummary;
  assignedTo: User;
};

type Campaign = {
  id: string;
  name: string;
  status: string;
  deadline: string | Date | null;
  manager: User;
  campaignLeads: CampaignLeadRow[];
};

function getLeadName(lead: LeadSummary) {
  const h1 = lead.fieldValues.find((fv) => fv.fieldDef.isPrimary1)?.value ?? "";
  const h2 = lead.fieldValues.find((fv) => fv.fieldDef.isPrimary2)?.value ?? "";
  return [h1, h2].filter(Boolean).join(" — ") || "Unknown Lead";
}

interface Props {
  initialCampaigns: Campaign[];
  availableLeads: LeadSummary[];
  teamMembers: User[];
  fieldDefs: LeadFieldDefinition[];
}

export function CampaignsView({ initialCampaigns, availableLeads, teamMembers }: Props) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [assignments, setAssignments] = useState<{ leadId: string; assignedToId: string }[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [defaultAssignee, setDefaultAssignee] = useState("");
  const [saving, setSaving] = useState(false);

  function toggleLeadSelection(leadId: string) {
    setSelectedLeads((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) {
        next.delete(leadId);
        setAssignments((a) => a.filter((x) => x.leadId !== leadId));
      } else {
        next.add(leadId);
        if (defaultAssignee) {
          setAssignments((a) => [...a, { leadId, assignedToId: defaultAssignee }]);
        }
      }
      return next;
    });
  }

  async function createCampaign() {
    if (!newName.trim() || assignments.length === 0) {
      toast.error("Campaign name and at least one lead assignment required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          deadline: newDeadline ? new Date(newDeadline).toISOString() : undefined,
          leadAssignments: assignments,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const campaign = await res.json();
      setCampaigns((p) => [campaign, ...p]);
      setCreateOpen(false);
      setNewName("");
      setNewDeadline("");
      setAssignments([]);
      setSelectedLeads(new Set());
      toast.success("Campaign created");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleLeadComplete(campaignId: string, leadId: string, isCompleted: boolean) {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/leads`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, isCompleted }),
      });
      if (!res.ok) throw new Error();
      setCampaigns((prev) =>
        prev.map((c) => {
          if (c.id !== campaignId) return c;
          return {
            ...c,
            campaignLeads: c.campaignLeads.map((cl) =>
              cl.leadId === leadId ? { ...cl, isCompleted } : cl
            ),
          };
        })
      );
    } catch {
      toast.error("Failed to update");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Campaign
        </Button>
      </div>

      {campaigns.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <p className="text-muted-foreground text-sm">No campaigns yet. Create one to start assigning leads.</p>
          </CardContent>
        </Card>
      )}

      {campaigns.map((campaign) => {
        const total = campaign.campaignLeads.length;
        const done = campaign.campaignLeads.filter((cl) => cl.isCompleted).length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;

        return (
          <Card key={campaign.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{campaign.name}</CardTitle>
                <div className="flex items-center gap-3">
                  {campaign.deadline && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(campaign.deadline).toLocaleDateString()}
                    </span>
                  )}
                  <Badge variant="outline" className="text-xs">{pct}% complete</Badge>
                </div>
              </div>
              <Progress value={pct} className="h-1.5 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {campaign.campaignLeads.map((cl) => (
                  <div
                    key={cl.id}
                    className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/40 transition-colors"
                  >
                    <button onClick={() => toggleLeadComplete(campaign.id, cl.leadId, !cl.isCompleted)}>
                      {cl.isCompleted
                        ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                        : <Circle className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    <span className={`flex-1 text-sm ${cl.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                      {getLeadName(cl.lead)}
                    </span>
                    <span className="text-xs text-muted-foreground">{cl.assignedTo.name}</span>
                  </div>
                ))}
                {total === 0 && <p className="text-xs text-muted-foreground px-3">No leads assigned</p>}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>New Campaign</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Campaign Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Q4 Outreach" />
              </div>
              <div className="space-y-1.5">
                <Label>Deadline</Label>
                <Input type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Default Assignee</Label>
              <Select value={defaultAssignee} onValueChange={setDefaultAssignee}>
                <SelectTrigger><SelectValue placeholder="Assign selected leads to…" /></SelectTrigger>
                <SelectContent>
                  {teamMembers.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Select Leads ({selectedLeads.size} selected)</Label>
              <ScrollArea className="h-48 rounded-md border">
                <div className="divide-y">
                  {availableLeads.map((lead) => (
                    <label key={lead.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/40">
                      <Checkbox
                        checked={selectedLeads.has(lead.id)}
                        onCheckedChange={() => toggleLeadSelection(lead.id)}
                      />
                      <span className="text-sm">{getLeadName(lead)}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createCampaign} disabled={saving}>{saving ? "Creating…" : "Create Campaign"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
