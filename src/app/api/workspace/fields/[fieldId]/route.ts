import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  isLeadId: z.boolean().optional(),
  isPrimary1: z.boolean().optional(),
  isPrimary2: z.boolean().optional(),
  isRequired: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ fieldId: string }> }) {
  try {
    const { workspace } = await requireWorkspace();
    const { fieldId } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const existing = await prisma.leadFieldDefinition.findFirst({
      where: { id: fieldId, workspaceId: workspace.id },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // If setting a new isLeadId, unset any previous one
    if (data.isLeadId) {
      await prisma.leadFieldDefinition.updateMany({
        where: { workspaceId: workspace.id, isLeadId: true, id: { not: fieldId } },
        data: { isLeadId: false },
      });
    }
    if (data.isPrimary1) {
      await prisma.leadFieldDefinition.updateMany({
        where: { workspaceId: workspace.id, isPrimary1: true, id: { not: fieldId } },
        data: { isPrimary1: false },
      });
    }
    if (data.isPrimary2) {
      await prisma.leadFieldDefinition.updateMany({
        where: { workspaceId: workspace.id, isPrimary2: true, id: { not: fieldId } },
        data: { isPrimary2: false },
      });
    }

    const { options, ...rest } = data;

    const field = await prisma.leadFieldDefinition.update({
      where: { id: fieldId },
      data: {
        ...rest,
        ...(options !== undefined && {
          options: {
            deleteMany: {},
            create: options.map((o, i) => ({ label: o.label, value: o.value, displayOrder: i })),
          },
        }),
      },
      include: { options: { orderBy: { displayOrder: "asc" } } },
    });

    return NextResponse.json(field);
  } catch (err) {
    console.error("[PATCH /api/workspace/fields/:id]", err);
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 422 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ fieldId: string }> }) {
  try {
    const { workspace } = await requireWorkspace();
    const { fieldId } = await params;

    const field = await prisma.leadFieldDefinition.findFirst({
      where: { id: fieldId, workspaceId: workspace.id },
    });
    if (!field) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (field.isSystem) return NextResponse.json({ error: "Cannot delete system fields" }, { status: 403 });

    await prisma.leadFieldDefinition.delete({ where: { id: fieldId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
