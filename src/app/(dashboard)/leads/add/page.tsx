import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";
import { AddLeadForm } from "@/components/leads/AddLeadForm";

export default async function AddLeadPage() {
  const { workspace } = await requireWorkspace();

  const [fieldDefs, stages] = await Promise.all([
    prisma.leadFieldDefinition.findMany({
      where: { workspaceId: workspace.id },
      include: { options: { orderBy: { displayOrder: "asc" } } },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.leadStage.findMany({
      where: { workspaceId: workspace.id },
      orderBy: [{ category: "asc" }, { displayOrder: "asc" }],
    }),
  ]);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add Lead</h1>
        <p className="text-muted-foreground mt-1">Fill in the details for the new lead.</p>
      </div>
      <AddLeadForm fieldDefs={fieldDefs} stages={stages} />
    </div>
  );
}
