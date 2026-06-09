import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";
import { z } from "zod";

const updateSchema = z.object({
  stageId: z.string().optional(),
  assignedToId: z.string().nullable().optional(),
  starRating: z.number().int().min(1).max(5).nullable().optional(),
  fieldValues: z.record(z.string(), z.string().nullable()).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ leadId: string }> }) {
  try {
    const { workspace } = await requireWorkspace();
    const { leadId } = await params;

    const lead = await prisma.lead.findFirst({
      where: { id: leadId, workspaceId: workspace.id },
      include: {
        stage: true,
        assignedTo: true,
        fieldValues: { include: { fieldDef: { include: { options: true } } } },
        notes: { include: { author: true }, orderBy: { createdAt: "desc" } },
        callLogs: {
          include: { user: true, callFeedback: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        scheduledCalls: { where: { isCompleted: false }, orderBy: { scheduledAt: "asc" } },
      },
    });

    if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(lead);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ leadId: string }> }) {
  try {
    const { workspace } = await requireWorkspace();
    const { leadId } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const existing = await prisma.lead.findFirst({
      where: { id: leadId, workspaceId: workspace.id },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let uniqueIdentifierValue = existing.uniqueIdentifierValue;

    if (data.fieldValues) {
      const leadIdField = await prisma.leadFieldDefinition.findFirst({
        where: { workspaceId: workspace.id, isLeadId: true },
      });

      if (leadIdField && data.fieldValues[leadIdField.id] !== undefined) {
        uniqueIdentifierValue = data.fieldValues[leadIdField.id] || null;
      }

      // Upsert each field value
      for (const [fieldDefId, value] of Object.entries(data.fieldValues)) {
        if (value === null || value === "") {
          await prisma.leadFieldValue.deleteMany({ where: { leadId, fieldDefId } });
        } else {
          await prisma.leadFieldValue.upsert({
            where: { leadId_fieldDefId: { leadId, fieldDefId } },
            update: { value },
            create: { leadId, fieldDefId, value },
          });
        }
      }
    }

    const { fieldValues: _fv, ...rest } = data;
    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: { ...rest, uniqueIdentifierValue },
      include: {
        stage: true,
        assignedTo: true,
        fieldValues: { include: { fieldDef: { include: { options: true } } } },
        notes: { include: { author: true }, orderBy: { createdAt: "desc" } },
        callLogs: {
          include: { user: true, callFeedback: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    return NextResponse.json(lead);
  } catch (err) {
    console.error("[PATCH /api/leads/:id]", err);
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 422 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ leadId: string }> }) {
  try {
    const { workspace } = await requireWorkspace();
    const { leadId } = await params;

    const lead = await prisma.lead.findFirst({ where: { id: leadId, workspaceId: workspace.id } });
    if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.lead.delete({ where: { id: leadId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
