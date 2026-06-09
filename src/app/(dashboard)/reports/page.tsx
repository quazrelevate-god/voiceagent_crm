import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default async function ReportsPage() {
  const { workspace } = await requireWorkspace();

  const teamMembers = await prisma.user.findMany({
    where: { workspaceId: workspace.id, isActive: true },
  });

  const callsByUser = await prisma.callLog.groupBy({
    by: ["userId"],
    where: { lead: { workspaceId: workspace.id } },
    _count: { id: true },
  });

  const wonLeadsByUser = await prisma.lead.groupBy({
    by: ["assignedToId"],
    where: {
      workspaceId: workspace.id,
      stage: { category: "CLOSED_WON" },
      assignedToId: { not: null },
    },
    _count: { id: true },
  });

  type CallGroup = { userId: string | null; _count: { id: number } };
  type WonGroup = { assignedToId: string | null; _count: { id: number } };

  const leaderboard = teamMembers
    .map((member) => {
      const calls = (callsByUser as CallGroup[]).find((c) => c.userId === member.id)?._count.id ?? 0;
      const won = (wonLeadsByUser as WonGroup[]).find((w) => w.assignedToId === member.id)?._count.id ?? 0;
      return { member, calls, won };
    })
    .sort((a, b) => b.calls - a.calls);

  const totalCalls = (callsByUser as CallGroup[]).reduce((s, r) => s + r._count.id, 0);
  const totalWon = (wonLeadsByUser as WonGroup[]).reduce((s, r) => s + r._count.id, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground mt-1">Team performance leaderboard.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-3xl font-bold">{leaderboard.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Active Agents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-3xl font-bold">{totalCalls}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Calls</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-3xl font-bold">{totalWon}</p>
            <p className="text-sm text-muted-foreground mt-1">Leads Won</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Call Volume Leaderboard</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.map(({ member, calls, won }: { member: { id: string; name: string; email: string }; calls: number; won: number }, index: number) => {
              const initials = member.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
              return (
                <div key={member.id} className="flex items-center gap-4 rounded-lg border p-3">
                  <span className="w-6 text-center font-bold text-muted-foreground text-sm">#{index + 1}</span>
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-lg font-bold">{calls}</p>
                      <p className="text-xs text-muted-foreground">Calls</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">{won}</p>
                      <p className="text-xs text-muted-foreground">Won</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {calls > 0 ? `${Math.round((won / calls) * 100)}% CVR` : "—"}
                    </Badge>
                  </div>
                </div>
              );
            })}
            {leaderboard.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No data yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
