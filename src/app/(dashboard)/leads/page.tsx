import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";
import { LeadsView } from "@/components/leads/LeadsView";

export default async function LeadsPage() {
  const { workspace } = await requireWorkspace();

  const [leads, stages, feedbacks, fieldDefs, teamMembers] = await Promise.all([
    prisma.lead.findMany({
      where: { workspaceId: workspace.id },
      include: {
        stage: true,
        assignedTo: true,
        fieldValues: { include: { fieldDef: true } },
        _count: { select: { callLogs: true, notes: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.leadStage.findMany({
      where: { workspaceId: workspace.id },
      orderBy: [{ category: "asc" }, { displayOrder: "asc" }],
    }),
    prisma.callFeedback.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.leadFieldDefinition.findMany({
      where: { workspaceId: workspace.id },
      include: { options: { orderBy: { displayOrder: "asc" } } },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.user.findMany({
      where: { workspaceId: workspace.id, isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <LeadsView
      initialLeads={leads}
      stages={stages}
      feedbacks={feedbacks}
      fieldDefs={fieldDefs}
      teamMembers={teamMembers}
    />
  );
}
