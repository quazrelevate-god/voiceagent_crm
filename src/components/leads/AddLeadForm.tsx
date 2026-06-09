"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import type { LeadFieldDefinitionWithOptions, LeadStage } from "@/types";

interface Props {
  fieldDefs: LeadFieldDefinitionWithOptions[];
  stages: LeadStage[];
}

export function AddLeadForm({ fieldDefs, stages }: Props) {
  const router = useRouter();
  const [stageId, setStageId] = useState(() => stages.find((s) => s.category === "INITIAL")?.id ?? stages[0]?.id ?? "");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function setField(id: string, value: string) {
    setFieldValues((p) => ({ ...p, [id]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    // Validate required fields
    const missing = fieldDefs.filter((f) => f.isRequired && !fieldValues[f.id]?.trim());
    if (missing.length > 0) {
      toast.error(`Required fields missing: ${missing.map((f) => f.name).join(", ")}`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId, fieldValues }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create lead");
      }

      toast.success("Lead created");
      router.push("/leads");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Initial Stage</Label>
            <Select value={stageId} onValueChange={setStageId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {fieldDefs.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <Label>
                  {field.name}
                  {field.isRequired && <span className="text-destructive ml-0.5">*</span>}
                </Label>

                {field.fieldType === "DROPDOWN" ? (
                  <Select
                    value={fieldValues[field.id] ?? ""}
                    onValueChange={(v) => setField(field.id, v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((o: { value: string; label: string }) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.fieldType === "CHECKBOX" ? (
                  <div className="flex items-center gap-2 h-9">
                    <Checkbox
                      checked={fieldValues[field.id] === "true"}
                      onCheckedChange={(v) => setField(field.id, v ? "true" : "false")}
                    />
                    <span className="text-sm">Yes</span>
                  </div>
                ) : (
                  <Input
                    type={
                      field.fieldType === "EMAIL" ? "email"
                      : field.fieldType === "NUMBER" || field.fieldType === "MONEY" ? "number"
                      : field.fieldType === "DATE" ? "date"
                      : "text"
                    }
                    value={fieldValues[field.id] ?? ""}
                    onChange={(e) => setField(field.id, e.target.value)}
                    placeholder={field.name}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Creating…" : "Create Lead"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
