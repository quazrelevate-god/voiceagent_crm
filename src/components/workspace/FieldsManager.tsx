"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Key, Star, Hash, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { FIELD_TYPE_LABELS, type FieldType, type LeadFieldDefinitionWithOptions } from "@/types";

const FIELD_TYPES = Object.entries(FIELD_TYPE_LABELS) as [FieldType, string][];

interface Props {
  initialFields: LeadFieldDefinitionWithOptions[];
}

export function FieldsManager({ initialFields }: Props) {
  const [fields, setFields] = useState(initialFields);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<LeadFieldDefinitionWithOptions | null>(null);
  const [form, setForm] = useState({ name: "", fieldType: "TEXT" as FieldType, isRequired: false });
  const [optionInput, setOptionInput] = useState("");
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditingField(null);
    setForm({ name: "", fieldType: "TEXT", isRequired: false });
    setOptions([]);
    setOptionInput("");
    setDialogOpen(true);
  }

  function openEdit(field: LeadFieldDefinitionWithOptions) {
    setEditingField(field);
    setForm({ name: field.name, fieldType: field.fieldType, isRequired: field.isRequired });
    setOptions(field.options.map((o: { label: string; value: string }) => ({ label: o.label, value: o.value })));
    setOptionInput("");
    setDialogOpen(true);
  }

  function addOption() {
    const trimmed = optionInput.trim();
    if (!trimmed) return;
    setOptions((prev) => [...prev, { label: trimmed, value: trimmed.toLowerCase().replace(/\s+/g, "_") }]);
    setOptionInput("");
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        fieldType: form.fieldType,
        isRequired: form.isRequired,
        ...(["DROPDOWN", "TAGS"].includes(form.fieldType) && { options }),
      };

      const res = editingField
        ? await fetch(`/api/workspace/fields/${editingField.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/workspace/fields", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();

      setFields((prev) =>
        editingField
          ? prev.map((f) => (f.id === editingField.id ? updated : f))
          : [...prev, updated]
      );
      setDialogOpen(false);
      toast.success(editingField ? "Field updated" : "Field created");
    } catch (e) {
      toast.error("Failed to save field");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function toggleFlag(field: LeadFieldDefinitionWithOptions, flag: "isLeadId" | "isPrimary1" | "isPrimary2") {
    const newValue = !field[flag];
    try {
      const res = await fetch(`/api/workspace/fields/${field.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [flag]: newValue }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      // Reset same flag on all others
      setFields((prev) =>
        prev.map((f) => {
          if (f.id === updated.id) return updated;
          if (newValue) return { ...f, [flag]: false };
          return f;
        })
      );
      toast.success("Updated");
    } catch {
      toast.error("Failed to update");
    }
  }

  async function deleteField(id: string) {
    if (!confirm("Delete this field? All lead data for this field will be lost.")) return;
    try {
      const res = await fetch(`/api/workspace/fields/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      setFields((prev) => prev.filter((f) => f.id !== id));
      toast.success("Field deleted");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Field
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Field Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">Lead ID</TableHead>
              <TableHead className="text-center">Header 1</TableHead>
              <TableHead className="text-center">Header 2</TableHead>
              <TableHead className="text-center">Required</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field) => (
              <TableRow key={field.id}>
                <TableCell className="font-medium">
                  {field.name}
                  {field.isSystem && <Lock className="inline ml-1.5 h-3 w-3 text-muted-foreground" />}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{FIELD_TYPE_LABELS[field.fieldType]}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <button
                    onClick={() => toggleFlag(field, "isLeadId")}
                    className={field.isLeadId ? "text-primary" : "text-muted-foreground/30 hover:text-muted-foreground"}
                  >
                    <Key className="h-4 w-4" />
                  </button>
                </TableCell>
                <TableCell className="text-center">
                  <button
                    onClick={() => toggleFlag(field, "isPrimary1")}
                    className={field.isPrimary1 ? "text-amber-500" : "text-muted-foreground/30 hover:text-muted-foreground"}
                  >
                    <Hash className="h-4 w-4" />
                  </button>
                </TableCell>
                <TableCell className="text-center">
                  <button
                    onClick={() => toggleFlag(field, "isPrimary2")}
                    className={field.isPrimary2 ? "text-amber-500" : "text-muted-foreground/30 hover:text-muted-foreground"}
                  >
                    <Hash className="h-4 w-4" />
                  </button>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={field.isRequired ? "default" : "outline"}>
                    {field.isRequired ? "Yes" : "No"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(field)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {!field.isSystem && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => deleteField(field.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {fields.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No fields yet. Add your first field above.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingField ? "Edit Field" : "Add Field"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Field Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g., Company Name"
              />
            </div>

            {!editingField && (
              <div className="space-y-1.5">
                <Label>Field Type</Label>
                <Select
                  value={form.fieldType}
                  onValueChange={(v) => setForm((p) => ({ ...p, fieldType: v as FieldType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="required"
                checked={form.isRequired}
                onCheckedChange={(v) => setForm((p) => ({ ...p, isRequired: Boolean(v) }))}
              />
              <Label htmlFor="required" className="font-normal">Required field</Label>
            </div>

            {["DROPDOWN", "TAGS"].includes(form.fieldType) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label>Options</Label>
                  <div className="flex gap-2">
                    <Input
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
                      placeholder="Option label..."
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addOption}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {options.map((o, i) => (
                      <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => setOptions((p) => p.filter((_, j) => j !== i))}>
                        {o.label} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
