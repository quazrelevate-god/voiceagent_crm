import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";
import { TeamManager } from "@/components/TeamManager";

export default async function TeamPage() {
  const { workspace, user } = await requireWorkspace();

  const members = await prisma.user.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Team Members</h1>
        <p className="text-muted-foreground mt-1">Manage your team and their roles.</p>
      </div>
      <TeamManager initialMembers={members} currentUserId={user.id} />
    </div>
  );
}
