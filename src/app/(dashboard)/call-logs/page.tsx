import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";
import { CallLogsView } from "@/components/calls/CallLogsView";

export default async function CallLogsPage() {
  const { workspace } = await requireWorkspace();

  const [callLogs, stages, feedbacks, fieldDefs, teamMembers] = await Promise.all([
    prisma.callLog.findMany({
      where: { lead: { workspaceId: workspace.id } },
      include: {
        lead: {
          include: {
            stage: true,
            fieldValues: { include: { fieldDef: true } },
          },
        },
        user: true,
        callFeedback: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
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
    <CallLogsView
      callLogs={callLogs}
      stages={stages}
      feedbacks={feedbacks}
      fieldDefs={fieldDefs}
      teamMembers={teamMembers}
    />
  );
}
