import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";
import { z } from "zod";

const toggleSchema = z.object({ leadId: z.string(), isCompleted: z.boolean() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  try {
    const { workspace } = await requireWorkspace();
    const { campaignId } = await params;
    const { leadId, isCompleted } = toggleSchema.parse(await req.json());

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId: workspace.id },
    });
    if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.campaignLead.update({
      where: { campaignId_leadId: { campaignId, leadId } },
      data: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 422 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
