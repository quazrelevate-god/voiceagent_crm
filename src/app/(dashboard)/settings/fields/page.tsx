import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";
import { FieldsManager } from "@/components/workspace/FieldsManager";

export default async function FieldsPage() {
  const { workspace } = await requireWorkspace();

  const fields = await prisma.leadFieldDefinition.findMany({
    where: { workspaceId: workspace.id },
    include: { options: { orderBy: { displayOrder: "asc" } } },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Lead Fields</h1>
        <p className="text-muted-foreground mt-1">
          Define custom fields for your leads. Designate one as the unique Lead ID and two as primary display fields.
        </p>
      </div>
      <FieldsManager initialFields={fields} />
    </div>
  );
}
