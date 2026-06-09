import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";
import { z } from "zod";

const createSchema = z.object({ name: z.string().min(1) });

export async function GET() {
  try {
    const { workspace } = await requireWorkspace();
    const feedbacks = await prisma.callFeedback.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { displayOrder: "asc" },
    });
    return NextResponse.json(feedbacks);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workspace } = await requireWorkspace();
    const { name } = createSchema.parse(await req.json());

    const maxOrder = await prisma.callFeedback.aggregate({
      where: { workspaceId: workspace.id },
      _max: { displayOrder: true },
    });

    const feedback = await prisma.callFeedback.create({
      data: {
        workspaceId: workspace.id,
        name,
        displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
      },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 422 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
