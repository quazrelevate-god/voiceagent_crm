"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LeadStage, StageCategory } from "@/types";
import { STAGE_CATEGORY_LABELS } from "@/types";

const ADDABLE_CATEGORIES: { label: string; value: StageCategory }[] = [
  { label: "Active Stage", value: "ACTIVE" },
  { label: "Closed — Lost", value: "CLOSED_LOST" },
];

const CATEGORY_ORDER: StageCategory[] = ["INITIAL", "ACTIVE", "CLOSED_WON", "CLOSED_LOST"];

const CATEGORY_COLORS: Record<StageCategory, string> = {
  INITIAL: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-yellow-100 text-yellow-800",
  CLOSED_WON: "bg-green-100 text-green-800",
  CLOSED_LOST: "bg-red-100 text-red-800",
};

interface Props { initialStages: LeadStage[] }

export function StagesManager({ initialStages }: Props) {
  const [stages, setStages] = useState(initialStages);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [adding, setAdding] = useState<StageCategory | null>(null);
  const [newName, setNewName] = useState("");

  const grouped = CATEGORY_ORDER.reduce<Record<StageCategory, LeadStage[]>>(
    (acc, cat) => {
      acc[cat] = stages.filter((s) => s.category === cat);
      return acc;
    },
    { INITIAL: [], ACTIVE: [], CLOSED_WON: [], CLOSED_LOST: [] }
  );

  async function saveRename(id: string) {
    if (!editName.trim()) return;
    try {
      const res = await fetch(`/api/workspace/stages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const updated = await res.json();
      setStages((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setEditingId(null);
      toast.success("Stage renamed");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function addStage(category: StageCategory) {
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/workspace/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, category }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const created = await res.json();
      setStages((prev) => [...prev, created]);
      setAdding(null);
      setNewName("");
      toast.success("Stage added");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function deleteStage(id: string) {
    if (!confirm("Delete this stage?")) return;
    try {
      const res = await fetch(`/api/workspace/stages/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      setStages((prev) => prev.filter((s) => s.id !== id));
      toast.success("Stage deleted");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="space-y-4">
      {CATEGORY_ORDER.map((cat) => {
        const canAdd = ADDABLE_CATEGORIES.some((a) => a.value === cat);
        const stagesInCat = grouped[cat];

        return (
          <Card key={cat}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[cat]}`}>
                    {STAGE_CATEGORY_LABELS[cat]}
                  </span>
                </CardTitle>
                {canAdd && (
                  <Button size="sm" variant="outline" onClick={() => { setAdding(cat); setNewName(""); }}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {stagesInCat.map((stage) => (
                <div key={stage.id} className="flex items-center gap-2 group rounded-md px-3 py-2 hover:bg-muted/50">
                  {editingId === stage.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveRename(stage.id); if (e.key === "Escape") setEditingId(null); }}
                        className="h-7 text-sm"
                        autoFocus
                      />
                      <Button size="sm" className="h-7" onClick={() => saveRename(stage.id)}>Save</Button>
                      <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium">{stage.name}</span>
                      {stage.isDefault && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => { setEditingId(stage.id); setEditName(stage.name); }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {!stage.isDefault && (
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => deleteStage(stage.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}

              {adding === cat && (
                <div className="flex items-center gap-2 px-3 py-1">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addStage(cat); if (e.key === "Escape") setAdding(null); }}
                    placeholder="Stage name..."
                    className="h-7 text-sm"
                    autoFocus
                  />
                  <Button size="sm" className="h-7" onClick={() => addStage(cat)}>Add</Button>
                  <Button size="sm" variant="ghost" className="h-7" onClick={() => setAdding(null)}>Cancel</Button>
                </div>
              )}

              {stagesInCat.length === 0 && adding !== cat && (
                <p className="text-xs text-muted-foreground px-3 py-1">No substages. Click Add to create one.</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
