import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";
import { z } from "zod";

const createSchema = z.object({
  stageId: z.string(),
  assignedToId: z.string().optional(),
  fieldValues: z.record(z.string(), z.string().nullable()),
});

export async function GET(req: NextRequest) {
  try {
    const { workspace } = await requireWorkspace();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    const stageId = searchParams.get("stageId") ?? undefined;
    const assignedToId = searchParams.get("assignedToId") ?? undefined;

    const leads = await prisma.lead.findMany({
      where: {
        workspaceId: workspace.id,
        ...(stageId && { stageId }),
        ...(assignedToId && { assignedToId }),
        ...(q && {
          fieldValues: {
            some: { value: { contains: q, mode: "insensitive" } },
          },
        }),
      },
      include: {
        stage: true,
        assignedTo: true,
        fieldValues: { include: { fieldDef: true } },
        _count: { select: { callLogs: true, notes: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    return NextResponse.json(leads);
  } catch (err) {
    console.error("[GET /api/leads]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workspace } = await requireWorkspace();
    const body = await req.json();
    const data = createSchema.parse(body);

    // Validate stageId belongs to workspace
    const stage = await prisma.leadStage.findFirst({
      where: { id: data.stageId, workspaceId: workspace.id },
    });
    if (!stage) return NextResponse.json({ error: "Invalid stage" }, { status: 422 });

    // Find the Lead ID field to set uniqueIdentifierValue
    const leadIdField = await prisma.leadFieldDefinition.findFirst({
      where: { workspaceId: workspace.id, isLeadId: true },
    });

    const uniqueIdentifierValue =
      leadIdField && data.fieldValues[leadIdField.id]
        ? data.fieldValues[leadIdField.id]
        : undefined;

    const lead = await prisma.lead.create({
      data: {
        workspaceId: workspace.id,
        stageId: data.stageId,
        assignedToId: data.assignedToId,
        uniqueIdentifierValue,
        fieldValues: {
          create: Object.entries(data.fieldValues)
            .filter(([, v]) => v !== null && v !== "")
            .map(([fieldDefId, value]) => ({ fieldDefId, value: value! })),
        },
      },
      include: {
        stage: true,
        assignedTo: true,
        fieldValues: { include: { fieldDef: true } },
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (err) {
    console.error("[POST /api/leads]", err);
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 422 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
