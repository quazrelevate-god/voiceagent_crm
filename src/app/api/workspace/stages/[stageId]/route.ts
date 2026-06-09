import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";
import { z } from "zod";

const updateSchema = z.object({ name: z.string().min(1) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ stageId: string }> }) {
  try {
    const { workspace } = await requireWorkspace();
    const { stageId } = await params;
    const { name } = updateSchema.parse(await req.json());

    const stage = await prisma.leadStage.findFirst({
      where: { id: stageId, workspaceId: workspace.id },
    });
    if (!stage) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.leadStage.update({ where: { id: stageId }, data: { name } });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 422 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ stageId: string }> }) {
  try {
    const { workspace } = await requireWorkspace();
    const { stageId } = await params;

    const stage = await prisma.leadStage.findFirst({
      where: { id: stageId, workspaceId: workspace.id },
    });
    if (!stage) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (stage.isDefault) return NextResponse.json({ error: "Cannot delete default stages" }, { status: 403 });

    const leadCount = await prisma.lead.count({ where: { stageId } });
    if (leadCount > 0) {
      return NextResponse.json({ error: "Stage has leads. Reassign leads first." }, { status: 409 });
    }

    await prisma.leadStage.delete({ where: { id: stageId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
