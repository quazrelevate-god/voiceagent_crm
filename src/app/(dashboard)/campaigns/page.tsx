import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";
import { CampaignsView } from "@/components/CampaignsView";

export default async function CampaignsPage() {
  const { workspace } = await requireWorkspace();

  const [campaigns, leads, teamMembers, fieldDefs] = await Promise.all([
    prisma.campaign.findMany({
      where: { workspaceId: workspace.id },
      include: {
        manager: true,
        campaignLeads: {
          include: {
            lead: {
              include: { fieldValues: { include: { fieldDef: true } } },
            },
            assignedTo: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.lead.findMany({
      where: { workspaceId: workspace.id },
      include: { fieldValues: { include: { fieldDef: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.user.findMany({
      where: { workspaceId: workspace.id, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.leadFieldDefinition.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { displayOrder: "asc" },
    }),
  ]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <p className="text-muted-foreground mt-1">Assign leads to team members with deadlines.</p>
      </div>
      <CampaignsView
        initialCampaigns={campaigns}
        availableLeads={leads}
        teamMembers={teamMembers}
        fieldDefs={fieldDefs}
      />
    </div>
  );
}
