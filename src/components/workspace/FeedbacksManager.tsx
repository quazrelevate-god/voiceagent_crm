"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { CallFeedback } from "@/types";

interface Props { initialFeedbacks: CallFeedback[] }

export function FeedbacksManager({ initialFeedbacks }: Props) {
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  async function saveRename(id: string) {
    if (!editName.trim()) return;
    try {
      const res = await fetch(`/api/workspace/feedbacks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setFeedbacks((prev) => prev.map((f) => (f.id === id ? updated : f)));
      setEditingId(null);
      toast.success("Updated");
    } catch {
      toast.error("Failed to update");
    }
  }

  async function addFeedback() {
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/workspace/feedbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setFeedbacks((prev) => [...prev, created]);
      setNewName("");
      setAdding(false);
      toast.success("Feedback added");
    } catch {
      toast.error("Failed to add");
    }
  }

  async function deleteFeedback(id: string) {
    if (!confirm("Delete this feedback type?")) return;
    try {
      const res = await fetch(`/api/workspace/feedbacks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border divide-y">
        {feedbacks.map((fb) => (
          <div key={fb.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/30">
            {editingId === fb.id ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveRename(fb.id); if (e.key === "Escape") setEditingId(null); }}
                  className="h-7 text-sm"
                  autoFocus
                />
                <Button size="sm" className="h-7" onClick={() => saveRename(fb.id)}>Save</Button>
                <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditingId(null)}>Cancel</Button>
              </div>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium">{fb.name}</span>
                {fb.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => { setEditingId(fb.id); setEditName(fb.name); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => deleteFeedback(fb.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}

        {feedbacks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No call feedbacks yet.</p>
        )}
      </div>

      {adding ? (
        <div className="flex items-center gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addFeedback(); if (e.key === "Escape") setAdding(false); }}
            placeholder="e.g., Call Back Later"
            className="h-8"
            autoFocus
          />
          <Button size="sm" onClick={addFeedback}>Add</Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Feedback Type
        </Button>
      )}
    </div>
  );
}
