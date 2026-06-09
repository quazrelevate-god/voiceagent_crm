import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";
import { z } from "zod";

const createSchema = z.object({
  callFeedbackId: z.string().optional(),
  duration: z.number().int().optional(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
  recordingUrl: z.string().url().optional(),
  source: z.enum(["MANUAL", "BOLNA_AI", "SCHEDULED"]).optional().default("MANUAL"),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ leadId: string }> }) {
  try {
    const { workspace, user } = await requireWorkspace();
    const { leadId } = await params;
    const data = createSchema.parse(await req.json());

    const lead = await prisma.lead.findFirst({ where: { id: leadId, workspaceId: workspace.id } });
    if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const callLog = await prisma.callLog.create({
      data: {
        leadId,
        userId: user.id,
        callFeedbackId: data.callFeedbackId,
        duration: data.duration,
        startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
        endedAt: data.endedAt ? new Date(data.endedAt) : undefined,
        recordingUrl: data.recordingUrl,
        source: data.source,
      },
      include: { user: true, callFeedback: true },
    });

    return NextResponse.json(callLog, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 422 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
