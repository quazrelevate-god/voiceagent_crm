import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";
import { StagesManager } from "@/components/workspace/StagesManager";

export default async function StagesPage() {
  const { workspace } = await requireWorkspace();

  const stages = await prisma.leadStage.findMany({
    where: { workspaceId: workspace.id },
    orderBy: [{ category: "asc" }, { displayOrder: "asc" }],
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Lead Stages</h1>
        <p className="text-muted-foreground mt-1">
          Configure the stages a lead moves through. Default stages (New, Converted) can be renamed but not deleted.
        </p>
      </div>
      <StagesManager initialStages={stages} />
    </div>
  );
}
