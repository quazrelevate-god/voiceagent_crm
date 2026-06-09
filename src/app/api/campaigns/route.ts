import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  deadline: z.string().datetime().optional(),
  leadAssignments: z.array(z.object({
    leadId: z.string(),
    assignedToId: z.string(),
  })),
});

export async function GET() {
  try {
    const { workspace } = await requireWorkspace();
    const campaigns = await prisma.campaign.findMany({
      where: { workspaceId: workspace.id },
      include: {
        manager: true,
        _count: { select: { campaignLeads: true } },
        campaignLeads: {
          select: { isCompleted: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(campaigns);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workspace, user } = await requireWorkspace();

    if (!["OWNER", "ADMIN", "MANAGER"].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const data = createSchema.parse(await req.json());

    const campaign = await prisma.campaign.create({
      data: {
        workspaceId: workspace.id,
        name: data.name,
        managerId: user.id,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        status: "ACTIVE",
        campaignLeads: {
          create: data.leadAssignments.map(({ leadId, assignedToId }) => ({
            leadId,
            assignedToId,
          })),
        },
      },
      include: {
        manager: true,
        campaignLeads: { include: { lead: true, assignedTo: true } },
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 422 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
