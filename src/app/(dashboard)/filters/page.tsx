import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function FiltersPage() {
  const { workspace } = await requireWorkspace();

  const [leads, stages, feedbacks] = await Promise.all([
    prisma.lead.findMany({
      where: { workspaceId: workspace.id },
      select: { id: true, stage: true, starRating: true },
    }),
    prisma.leadStage.findMany({
      where: { workspaceId: workspace.id },
      orderBy: [{ category: "asc" }, { displayOrder: "asc" }],
    }),
    prisma.callFeedback.findMany({ where: { workspaceId: workspace.id } }),
  ]);

  // Call feedback distribution
  const callLogsByFeedback = await prisma.callLog.groupBy({
    by: ["callFeedbackId"],
    where: { lead: { workspaceId: workspace.id } },
    _count: { id: true },
  });

  const total = leads.length;
  const stageGroups = stages.map((s) => ({
    stage: s,
    count: leads.filter((l: { stage: { id: string }; starRating: number | null }) => l.stage.id === s.id).length,
  }));

  const starGroups = [5, 4, 3, 2, 1, 0].map((n) => ({
    rating: n,
    count: n === 0
      ? leads.filter((l: { starRating: number | null }) => !l.starRating).length
      : leads.filter((l: { starRating: number | null }) => l.starRating === n).length,
  }));

  const feedbackGroups = feedbacks.map((fb) => ({
    feedback: fb,
    count: callLogsByFeedback.find((g: { callFeedbackId: string | null; _count: { id: number } }) => g.callFeedbackId === fb.id)?._count.id ?? 0,
  }));
  const totalCalls = feedbackGroups.reduce((s: number, g: { count: number }) => s + g.count, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Filters Overview</h1>
        <p className="text-muted-foreground mt-1">Lead distribution across stages, ratings, and call outcomes.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">By Stage ({total} total leads)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {stageGroups.map(({ stage, count }: { stage: { id: string; name: string }; count: number }) => (
            <div key={stage.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{stage.name}</span>
                <span className="text-muted-foreground">{count} / {total}</span>
              </div>
              <Progress value={total > 0 ? (count / total) * 100 : 0} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">By Star Rating</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {starGroups.map(({ rating, count }) => (
            <div key={rating} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{rating > 0 ? `${"★".repeat(rating)} ${rating} Star` : "Unrated"}</span>
                <span className="text-muted-foreground">{count} / {total}</span>
              </div>
              <Progress value={total > 0 ? (count / total) * 100 : 0} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Call Outcomes ({totalCalls} total calls)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {feedbackGroups.map(({ feedback, count }: { feedback: { id: string; name: string }; count: number }) => (
            <div key={feedback.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{feedback.name}</span>
                <span className="text-muted-foreground">{count}</span>
              </div>
              <Progress value={totalCalls > 0 ? (count / totalCalls) * 100 : 0} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
