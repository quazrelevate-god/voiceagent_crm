import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";
import { FeedbacksManager } from "@/components/workspace/FeedbacksManager";

export default async function FeedbacksPage() {
  const { workspace } = await requireWorkspace();

  const feedbacks = await prisma.callFeedback.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Call Feedbacks</h1>
        <p className="text-muted-foreground mt-1">
          Define the call outcome labels your team uses when logging a call.
        </p>
      </div>
      <FeedbacksManager initialFeedbacks={feedbacks} />
    </div>
  );
}
