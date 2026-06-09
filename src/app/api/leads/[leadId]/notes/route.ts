import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";
import { z } from "zod";

const createSchema = z.object({ content: z.string().min(1) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ leadId: string }> }) {
  try {
    const { workspace, user } = await requireWorkspace();
    const { leadId } = await params;
    const { content } = createSchema.parse(await req.json());

    const lead = await prisma.lead.findFirst({ where: { id: leadId, workspaceId: workspace.id } });
    if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const note = await prisma.leadNote.create({
      data: { leadId, authorId: user.id, content },
      include: { author: true },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 422 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
