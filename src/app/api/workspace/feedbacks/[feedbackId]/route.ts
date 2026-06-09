import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";
import { z } from "zod";

const updateSchema = z.object({ name: z.string().min(1) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ feedbackId: string }> }) {
  try {
    const { workspace } = await requireWorkspace();
    const { feedbackId } = await params;
    const { name } = updateSchema.parse(await req.json());

    const fb = await prisma.callFeedback.findFirst({
      where: { id: feedbackId, workspaceId: workspace.id },
    });
    if (!fb) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.callFeedback.update({ where: { id: feedbackId }, data: { name } });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 422 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ feedbackId: string }> }) {
  try {
    const { workspace } = await requireWorkspace();
    const { feedbackId } = await params;

    const fb = await prisma.callFeedback.findFirst({
      where: { id: feedbackId, workspaceId: workspace.id },
    });
    if (!fb) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.callFeedback.delete({ where: { id: feedbackId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
